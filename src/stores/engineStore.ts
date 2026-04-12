import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useEngineStore = defineStore('engine', () => {
  const isReady = ref(false)
  const isAnalyzing = ref(false)
  
  // Evaluation values
  const evalScoreCp = ref(0) // Centipawns. Positive = white advantage
  const evalMate = ref<number | null>(null) // Moves to mate. Multiplier determines color.
  
  const bestMove = ref('')
  const currentDepth = ref(0)
  const pv = ref<string[]>([]) // Principal variation
  
  let worker: Worker | null = null

  function init() {
    if (worker) return
    worker = new Worker('/engine/stockfish.js')
    worker.onmessage = (e) => {
      const msg = e.data
      if (typeof msg !== 'string') return
      
      if (msg === 'uciok') {
        isReady.value = true
      } else if (msg.startsWith('info depth')) {
        parseInfo(msg)
      } else if (msg.startsWith('bestmove')) {
        const parts = msg.split(' ')
        if (parts[1]) bestMove.value = parts[1]
        isAnalyzing.value = false
      }
    }
    // Set multi-threading or hash size if we wanted, but defaults are fine for now.
    worker.postMessage('uci')
  }
  
  function parseInfo(msg: string) {
    // We only care about multipv 1
    if (msg.includes('multipv') && !msg.includes('multipv 1')) return

    const depthMatch = msg.match(/depth (\d+)/)
    if (depthMatch) currentDepth.value = parseInt(depthMatch[1], 10)
    
    const cpMatch = msg.match(/score cp (-?\d+)/)
    if (cpMatch) {
      evalScoreCp.value = parseInt(cpMatch[1], 10)
      evalMate.value = null
    }
    
    const mateMatch = msg.match(/score mate (-?\d+)/)
    if (mateMatch) {
      evalMate.value = parseInt(mateMatch[1], 10)
    }

    const pvMatch = msg.match(/ pv (.+)/)
    if (pvMatch) {
      pv.value = pvMatch[1].split(' ')
    }
  }

  function stop() {
    if (isAnalyzing.value && worker) {
      worker.postMessage('stop')
    }
  }

  // Trigger analysis for a given position
  function analyze(fen: string, depth = 15) {
    if (!worker) init()
    stop() // Stop any ongoing analysis
    isAnalyzing.value = true
    currentDepth.value = 0
    bestMove.value = ''
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

  return {
    isReady, isAnalyzing, evalScoreCp, evalMate, bestMove, currentDepth, pv,
    evalNumber, evalPercent,
    init, analyze, stop
  }
})
