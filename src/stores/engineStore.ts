import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettingsStore } from './settingsStore'
import { logger } from '../utils/logger'

export const useEngineStore = defineStore('engine', () => {
  const isReady = ref(false)
  const isAnalyzing = ref(false)
  
  // Evaluation values
  const evalScoreCp = ref(0) // Centipawns. Positive = white advantage
  const evalMate = ref<number | null>(null) // Moves to mate. Multiplier determines color.
  
  const bestMove = ref('')
  const currentDepth = ref(0)
  const pv = ref<string[]>([]) // Principal variation
  const multiPvs = ref<any[]>([])
  
  let worker: Worker | null = null
  let pendingInfo: any = null
  let infoThrottleTimeout: any = null
  let rebootCount = 0
  let rebootResetTimer: any = null

  function init() {
    if (worker) return
    worker = new Worker('/engine/stockfish.js')
    
    worker.onerror = (err) => {
        logger.error('[Engine] Worker error caught:', err)
        reboot()
    }

    worker.onmessage = (e) => {
      const msg = e.data
      if (typeof msg !== 'string') return
      
      if (msg === 'uciok') {
        isReady.value = true
        worker?.postMessage('isready')
        
        const settings = useSettingsStore()
        worker?.postMessage(`setoption name MultiPV value ${settings.engineMultiPv}`)
      } else if (msg === 'readyok') {
        // Ready to receive position/go
      } else if (msg.startsWith('info depth')) {
        throttledParseInfo(msg)
      } else if (msg.startsWith('bestmove')) {
        const parts = msg.split(' ')
        if (parts[1]) bestMove.value = parts[1]
        isAnalyzing.value = false
        if (pendingInfo) {
          applyInfo(pendingInfo)
          pendingInfo = null
        }
      }
    }
    worker.postMessage('uci')
  }

  function reboot() {
    if (rebootCount > 5) {
        logger.error('[Engine] Critical: Too many reboots. Engine disabled to prevent browser freeze.')
        isAnalyzing.value = false
        return
    }
    
    rebootCount++
    if (rebootResetTimer) clearTimeout(rebootResetTimer)
    rebootResetTimer = setTimeout(() => { rebootCount = 0 }, 10000)

    logger.warn(`[Engine] Rebooting worker (Attempt ${rebootCount})...`)
    if (worker) {
        worker.terminate()
        worker = null
    }
    if (infoThrottleTimeout) {
      clearTimeout(infoThrottleTimeout)
      infoThrottleTimeout = null
    }
    pendingInfo = null
    isReady.value = false
    isAnalyzing.value = false
    init()
  }
  
  function throttledParseInfo(msg: string) {
    const data = extractInfoData(msg)
    if (!data) return

    if (!pendingInfo) {
      pendingInfo = data
    } else {
      // For multi-PV, we need to merge based on the PV index
      if (data.multiPvs) {
         if (!pendingInfo.multiPvs) pendingInfo.multiPvs = []
         data.multiPvs.forEach((newPv: any) => {
            const existingIdx = pendingInfo.multiPvs.findIndex((p: any) => p.id === newPv.id)
            if (existingIdx > -1) pendingInfo.multiPvs[existingIdx] = newPv
            else pendingInfo.multiPvs.push(newPv)
         })
      } else {
         Object.assign(pendingInfo, data)
      }
    }

    if (!infoThrottleTimeout) {
      infoThrottleTimeout = setTimeout(() => {
        if (pendingInfo) {
          applyInfo(pendingInfo)
          pendingInfo = null
        }
        infoThrottleTimeout = null
      }, 100)
    }
  }

  function extractInfoData(msg: string) {
    const data: any = {}
    const depthMatch = msg.match(/depth (\d+)/)
    if (depthMatch) data.depth = parseInt(depthMatch[1], 10)
    
    const cpMatch = msg.match(/score cp (-?\d+)/)
    const mateMatch = msg.match(/score mate (-?\d+)/)
    const pvMatch = msg.match(/ pv (.+)/)
    const multiIdxMatch = msg.match(/multipv (\d+)/)

    if (multiIdxMatch && pvMatch) {
      const id = parseInt(multiIdxMatch[1], 10)
      const scoreNum = cpMatch ? parseInt(cpMatch[1], 10) / 100 : (mateMatch ? parseInt(mateMatch[1], 10) : 0)
      const isMate = !!mateMatch
      
      data.multiPvs = [{
        id,
        score: isMate ? `M${scoreNum}` : (scoreNum > 0 ? `+${scoreNum.toFixed(2)}` : scoreNum.toFixed(2)),
        moves: pvMatch[1].split(' ').slice(0, 5) // Top 5 moves of this variation
      }]
      
      // If this is the primary line, also update main eval
      if (id === 1) {
        if (cpMatch) {
          data.evalScoreCp = parseInt(cpMatch[1], 10)
          data.evalMate = null
        }
        if (mateMatch) data.evalMate = parseInt(mateMatch[1], 10)
        data.pv = pvMatch[1].split(' ')
      }
    } else {
      if (cpMatch) {
        data.evalScoreCp = parseInt(cpMatch[1], 10)
        data.evalMate = null
      }
      if (mateMatch) data.evalMate = parseInt(mateMatch[1], 10)
      if (pvMatch) data.pv = pvMatch[1].split(' ')
    }

    return Object.keys(data).length > 0 ? data : null
  }

  function applyInfo(data: any) {
    if (data.depth !== undefined && data.depth > currentDepth.value) {
      currentDepth.value = data.depth
    }
    if (data.evalScoreCp !== undefined) {
      evalScoreCp.value = data.evalScoreCp
      evalMate.value = null
    }
    if (data.evalMate !== undefined) {
      evalMate.value = data.evalMate
    }
    if (data.pv !== undefined) {
      pv.value = data.pv
    }
    if (data.multiPvs) {
      data.multiPvs.forEach((newPv: any) => {
        const idx = multiPvs.value.findIndex(p => p.id === newPv.id)
        if (idx > -1) multiPvs.value[idx] = newPv
        else multiPvs.value.push(newPv)
      })
      multiPvs.value.sort((a, b) => a.id - b.id)
    }
  }

  function stop() {
    if (isAnalyzing.value && worker) {
      worker.postMessage('stop')
    }
    if (infoThrottleTimeout) {
      clearTimeout(infoThrottleTimeout)
      infoThrottleTimeout = null
    }
    pendingInfo = null
  }

  // Trigger analysis for a given position
  function analyze(fen: string, depth = 15) {
    if (!worker) init()
    
    logger.info(`[Engine] Analyzing FEN: ${fen.substring(0, 20)}... at Depth: ${depth}`)
    
    // Basic FEN validation: check for 6 fields and move turn
    const parts = fen.split(' ')
    if (parts.length < 4) {
        logger.warn('[Engine] Invalid FEN passed to analyze:', fen)
        return
    }

    stop() // Stop any ongoing analysis
    isAnalyzing.value = true
    currentDepth.value = 0
    bestMove.value = ''
    
    worker!.postMessage('isready') // Optional: wait for readyok before go
    worker!.postMessage(`position fen ${fen}`)
    worker!.postMessage(`go depth ${depth}`)
  }

  // Derived eval values for UI
  // Centipawns divided by 100 to get standard pawn scale
  const evalNumber = computed(() => {
    if (evalMate.value !== null) {
      // Very high absolute value to clamp the bar in case of MATE
      return evalMate.value > 0 ? 100 : -100 
    }
    return evalScoreCp.value / 100
  })

  // Returns 0-100% formatted for CSS width 
  // -5 to +5 pawn swing maps to 5% to 95%
  const evalPercent = computed(() => {
    if (evalMate.value !== null) {
      return evalMate.value > 0 ? 100 : 0
    }
    const clamped = Math.max(-5, Math.min(5, evalNumber.value))
    return 50 + (clamped / 5) * 45
  })

  // Returns the best move found so far. Finalized if bestMove is set, 
  // otherwise the first move of the current principal variation.
  const suggestedMove = computed(() => {
    if (bestMove.value) return bestMove.value
    if (pv.value.length > 0) return pv.value[0]
    return ''
  })

  return {
    isReady, isAnalyzing, evalScoreCp, evalMate, bestMove, suggestedMove, currentDepth, pv, multiPvs,
    evalNumber, evalPercent,
    init, analyze, stop
  }
})
