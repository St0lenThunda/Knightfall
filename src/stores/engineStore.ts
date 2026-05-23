import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import { useSettingsStore } from './settingsStore'
import { useAdminStore } from './adminStore'
import { logger } from '../utils/logger'
import { useMortalLogic } from './engine/useMortalLogic'
import type { Bot } from './game/useBotEngine'

export interface MultiPV {
  id: number
  score: string
  cp: number
  isMate: boolean
  moves: string[]
}

export interface EngineInfo {
  depth?: number
  evalScoreCp?: number
  evalMate?: number | null
  pv?: string[]
  multiPvs?: MultiPV[]
  nps?: number
}

export const useEngineStore = defineStore('engine', () => {
  // Core reactive state
  const isReady = ref(false)
  const isAnalyzing = ref(false)
  const isRebooting = ref(false)
  const isThrottled = ref(false) // Indicates engine has been auto-throttled due to inactivity

  // Evaluation values
  const evalScoreCp = ref(0) // Centipawns. Positive = white advantage
  const evalMate = ref<number | null>(null) // Moves to mate. Multiplier determines color.
  
  const bestMove = ref('')
  const currentDepth = ref(0)
  const pv = ref<string[]>([]) // Principal variation
  
  /**
   * List of multi-PV lines evaluated by Stockfish.
   * We use a shallowRef here because the engine reports updates at extremely
   * high frequencies. A deep ref causes Vue to recursively proxy-wrap
   * every single nested move list and evaluation score, adding massive CPU
   * overhead. Using shallowRef ensures that UI updates are atomic and efficient.
   */
  const multiPvs = shallowRef<MultiPV[]>([])
  
  // Internal worker handling
  let worker: Worker | null = null
  let pendingInfo: EngineInfo | null = null
  let infoThrottleTimeout: ReturnType<typeof setTimeout> | null = null
  let rebootCount = 0
  let rebootResetTimer: ReturnType<typeof setTimeout> | null = null
  let activeTurn: 'w' | 'b' = 'w'

  // Persistence for seamless reboot recovery
  let lastAnalyzedFen = ''
  let lastAnalyzedDepth = 0
  let lastAnalyzedBot: Bot | null = null

  // Command queue to ensure ordered communication with the worker
  let messageQueue: string[] = []
  let isReadyForCommand = true

  // ---------------------------------------------------------------------
  // Inactivity auto-throttling (priority #1)
  // ---------------------------------------------------------------------
  /**
   * The duration of inactivity (in milliseconds) before the engine is throttled.
   * Set to 3 minutes (180,000 ms) to balance user analysis reading time with
   * saving CPU and battery when the user has stepped away.
   */
  const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000

  /**
   * The interval (in milliseconds) within which user activity resets are ignored.
   * Set to 2 seconds (2000 ms) to avoid thrashing the CPU with constant timer
   * clear/set cycles on high-frequency events like mousemove.
   */
  const ACTIVITY_THROTTLE_MS = 2000

  let inactivityTimer: ReturnType<typeof setTimeout> | null = null
  let lastActivityTime = 0
  let wasAnalyzingBeforeThrottle = false

  /**
   * User interaction events that demonstrate activity and should reset
   * the inactivity timer.
   */
  const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']

  /**
   * Stops Stockfish calculations and sets the throttled state.
   * Remembers whether the engine was actively analyzing before throttling occurred.
   */
  function throttleEngine() {
    if (isThrottled.value) return
    logger.warn('[Engine] Auto-throttling due to 3 min inactivity or hidden tab')
    wasAnalyzingBeforeThrottle = isAnalyzing.value
    stop()
    isThrottled.value = true
  }

  /**
   * Restores the engine from throttled state.
   * If the engine was actively analyzing when throttled, automatically restarts
   * the analysis on the last evaluated position.
   */
  function resumeEngine() {
    if (!isThrottled.value) return
    logger.info('[Engine] Resuming engine from throttle')
    isThrottled.value = false
    resetInactivityTimer()
    if (wasAnalyzingBeforeThrottle && lastAnalyzedFen) {
      analyze(lastAnalyzedFen, lastAnalyzedDepth, lastAnalyzedBot || undefined)
    }
    wasAnalyzingBeforeThrottle = false
  }

  /**
   * Reset the inactivity timeout. Called whenever the user or the app
   * triggers a new engine analysis request.
   */
  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer)
    inactivityTimer = setTimeout(() => {
      throttleEngine()
    }, INACTIVITY_TIMEOUT_MS)
    isThrottled.value = false
  }

  /**
   * Throttled callback for handling user activity events.
   * Resets the inactivity timer or resumes the engine if it was throttled.
   */
  function handleUserActivity() {
    const now = Date.now()
    if (now - lastActivityTime < ACTIVITY_THROTTLE_MS) return
    lastActivityTime = now

    if (isThrottled.value) {
      resumeEngine()
    } else {
      resetInactivityTimer()
    }
  }

  /**
   * Handle page visibility changes. When the tab becomes hidden we immediately
   * stop/throttle the engine to avoid unnecessary CPU work. When the tab
   * becomes visible, we automatically resume calculations.
   */
  function onVisibilityChange() {
    if (document.hidden) {
      logger.info('[Engine] Tab hidden – stopping engine')
      throttleEngine()
    } else {
      logger.info('[Engine] Tab visible – resuming engine')
      resumeEngine()
    }
  }

  // Register listeners immediately when the store is instantiated
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('visibilitychange', onVisibilityChange)
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })
  }

  /**
   * Cleans up event listeners and timers.
   * Useful for testing and manual store disposal.
   */
  function cleanup() {
    if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
    }
    if (inactivityTimer) clearTimeout(inactivityTimer)
  }

  // ---------------------------------------------------------------------
  // Command dispatcher
  // ---------------------------------------------------------------------
  /**
   * Safe command dispatcher that waits for Stockfish's 'readyok' 
   * before sending the next command in the queue.
   */
  function sendCommand(cmd: string) {
    if (!worker) init()
    
    // Optimization: Don't queue multiple 'isready' commands
    if (cmd === 'isready' && messageQueue.includes('isready')) return

    if (isReadyForCommand) {
      // logger.debug(`[Engine] > ${cmd}`) // Excessive for NPS
      worker?.postMessage(cmd)
      // If we ask 'isready', we must wait for 'readyok' before next move
      if (cmd === 'isready') {
        isReadyForCommand = false
        // Safety timeout to prevent permanent lock if readyok never arrives
        setTimeout(() => {
          if (!isReadyForCommand) {
            logger.warn('[Engine] readyok timeout! Force-unlocking command queue.')
            isReadyForCommand = true
            flushQueue()
          }
        }, 2000)
      }
    } else {
      messageQueue.push(cmd)
    }
  }

  function flushQueue() {
    while (messageQueue.length > 0 && isReadyForCommand) {
      const next = messageQueue.shift()
      if (next) sendCommand(next)
    }
  }

  // Mortal Pillar
  const mortal = useMortalLogic()
  const activeArchetype = ref<string | null>(null)
  const activeBot = ref<Bot | null>(null)
  const isMortalThinking = ref(false)

  function init() {
    if (worker) return
    
    // Safety check for environments without Worker support (e.g. some CI setups)
    if (typeof Worker === 'undefined') {
        logger.warn('[Engine] Web Workers are not supported in this environment. Engine features disabled.')
        return
    }

    try {
        worker = new Worker('/engine/stockfish.js')
    } catch (e) {
        logger.error('[Engine] Failed to initialize Worker:', e)
        return
    }
    
    worker.onerror = (err) => {
        logger.error('[Engine] Worker error caught:', err)
        reboot()
    }

    worker.onmessage = (e) => {
      const msg = e.data
      if (typeof msg !== 'string') return
      
      if (msg === 'uciok') {
        isReady.value = true
        
        // Apply initial configuration
        const settings = useSettingsStore()
        sendCommand(`setoption name MultiPV value ${settings.engineMultiPv}`)
        sendCommand('setoption name Hash value 8')
        sendCommand('setoption name Threads value 1')
        
        // Signal that initialization is complete
        sendCommand('isready')
      } else if (msg === 'readyok') {
        isReadyForCommand = true
        flushQueue()
      } else if (msg.startsWith('info ')) {
        throttledParseInfo(msg)
      } else if (msg.startsWith('bestmove')) {
        const parts = msg.split(' ')
        if (parts[1]) {
          // Handle "Mortal" play styles (deliberate blunders)
          if (activeBot.value) {
            // Only apply Mortal logic if we have multiple moves to choose from
            // and the archetype decides to blunder.
            if (activeArchetype.value && multiPvs.value.length > 1 && mortal.shouldBlunder(activeArchetype.value)) {
              isMortalThinking.value = true
              
              // Simulate "thinking time" for realism
              setTimeout(() => {
                const practicalMove = mortal.getPracticalMove(parts[1], multiPvs.value)
                bestMove.value = practicalMove
                isMortalThinking.value = false
                isAnalyzing.value = false
              }, Math.random() * 2000 + 500)
              
              return // Exit early, the timeout will handle the rest
            }
          }
          
          // Default: Perfect play or single move available
          bestMove.value = parts[1]
        }
        isAnalyzing.value = false
      }
      if (pendingInfo) {
          applyInfo(pendingInfo)
          pendingInfo = null
      }
    }
    sendCommand('uci')
  }

  function reboot(force: boolean = false) {
    if (!force && rebootCount > 3) {
        logger.error('[Engine] Critical: Too many reboots. Engine disabled to prevent browser freeze.');
        isAnalyzing.value = false;
        return;
    }
    
    // Capture current analysis state to resume after reboot
    const wasAnalyzing = isAnalyzing.value;
    const lastFen = lastAnalyzedFen;
    const lastDepth = lastAnalyzedDepth;

    rebootCount++;
    if (rebootResetTimer) clearTimeout(rebootResetTimer);
    rebootResetTimer = setTimeout(() => { rebootCount = 0 }, 30000); // 30s reset window

    logger.warn(`[Engine] Rebooting worker (Attempt ${rebootCount})...`);
    if (worker) {
        worker.onmessage = null;
        worker.onerror = null;
        worker.terminate();
        worker = null;
    }
    if (infoThrottleTimeout) {
      clearTimeout(infoThrottleTimeout);
      infoThrottleTimeout = null;
    }
    pendingInfo = null;
    isReady.value = false;
    isAnalyzing.value = false;
    isReadyForCommand = true;
    messageQueue = [];
    isRebooting.value = true;
    
    // Track reboot in admin store
    try {
      const admin = useAdminStore();
      admin.recordEngineReboot();
    } catch (e) {
      logger.warn('[Engine] Could not record reboot in adminStore (Store not ready)');
    }

    init();

    // If we were analyzing, resume after a short delay to allow init to finish
    // We reduce depth significantly to avoid hitting the same memory/stack limit
    if (wasAnalyzing && lastFen) {
      setTimeout(() => {
        isRebooting.value = false;
        analyze(lastFen, Math.max(10, lastDepth - 4), lastAnalyzedBot || undefined);
      }, 3000); // 3s breathing room for recovery
    } else {
      setTimeout(() => {
        isRebooting.value = false;
      }, 3000);
    }
  }

  function resetRebootCount() {
    rebootCount = 0
    if (rebootResetTimer) clearTimeout(rebootResetTimer)
    logger.info('[Engine] Reboot count reset.')
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
         data.multiPvs.forEach((newPv: MultiPV) => {
            const existingIdx = pendingInfo!.multiPvs!.findIndex((p: MultiPV) => p.id === newPv.id)
            if (existingIdx > -1) pendingInfo!.multiPvs![existingIdx] = newPv
            else pendingInfo!.multiPvs!.push(newPv)
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

  function extractInfoData(msg: string): EngineInfo | null {
    const data: EngineInfo = {}
    const depthMatch = msg.match(/depth (\d+)/)
    if (depthMatch) data.depth = parseInt(depthMatch[1], 10)
    
    const cpMatch = msg.match(/score cp (-?\d+)/)
    const mateMatch = msg.match(/score mate (-?\d+)/)
    const pvMatch = msg.match(/ pv (.+)/)
    const multiIdxMatch = msg.match(/multipv (\d+)/)
    const npsMatch = msg.match(/nps (\d+)/)

    if (npsMatch) {
      useAdminStore().updateEngineMetrics(parseInt(npsMatch[1], 10))
    }

    if (multiIdxMatch && pvMatch) {
      const id = parseInt(multiIdxMatch[1], 10)
      const scoreNum = cpMatch ? parseInt(cpMatch[1], 10) / 100 : (mateMatch ? parseInt(mateMatch[1], 10) : 0)
      const isMate = !!mateMatch
      
      data.multiPvs = [{
        id,
        score: isMate ? `M${scoreNum}` : (scoreNum > 0 ? `+${scoreNum.toFixed(2)}` : scoreNum.toFixed(2)),
        cp: cpMatch ? parseInt(cpMatch[1], 10) : (mateMatch ? parseInt(mateMatch[1], 10) * 1000 : 0),
        isMate,
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
      if (pvMatch) {
        data.pv = pvMatch[1].split(' ')
        // Ensure multiPvs has at least the best line for UI consistency
        const scoreNum = cpMatch ? parseInt(cpMatch[1], 10) / 100 : (mateMatch ? parseInt(mateMatch[1], 10) : 0)
        data.multiPvs = [{
          id: 1,
          score: mateMatch ? `M${scoreNum}` : (scoreNum > 0 ? `+${scoreNum.toFixed(2)}` : scoreNum.toFixed(2)),
          cp: cpMatch ? parseInt(cpMatch[1], 10) : (mateMatch ? parseInt(mateMatch[1], 10) * 1000 : 0),
          isMate: !!mateMatch,
          moves: data.pv.slice(0, 5)
        }]
      }
    }

    return Object.keys(data).length > 0 ? data : null
  }

  let analysisStartTime = 0

  function applyInfo(data: EngineInfo) {
    const adminStore = useAdminStore()
    
    if (data.depth !== undefined) {
      if (data.depth > currentDepth.value) {
        // First meaningful depth (e.g. depth 1) is a good TTFR proxy
        if (currentDepth.value === 0 && data.depth >= 1 && analysisStartTime > 0) {
          const ttfr = Date.now() - analysisStartTime
          adminStore.updateEngineMetrics(data.nps || 0, 0, data.depth, ttfr)
        } else {
          adminStore.updateEngineMetrics(data.nps || 0, 0, data.depth)
        }
        currentDepth.value = data.depth
      }
    }
    if (data.evalScoreCp !== undefined) {
      // Normalize to White's perspective: If it's Black's turn, negate the score
      evalScoreCp.value = activeTurn === 'b' ? -data.evalScoreCp : data.evalScoreCp
      evalMate.value = null
    }
    if (data.evalMate !== undefined && data.evalMate !== null) {
      // Normalize to White's perspective: If it's Black's turn, negate the mate
      evalMate.value = activeTurn === 'b' ? -data.evalMate : data.evalMate
    } else if (data.evalMate === null) {
      evalMate.value = null
    }
    if (data.pv !== undefined) {
      pv.value = data.pv
    }
    if (data.multiPvs) {
      // Create a shallow copy of the existing array to trigger reactive reference assignment.
      // We must re-assign the reference itself because multiPvs is a shallowRef.
      const nextMultiPvs = [...multiPvs.value]

      data.multiPvs.forEach((newPv: MultiPV) => {
        // Normalize centipawn evaluation to White's perspective.
        // Positive cp indicates White advantage, negative indicates Black advantage.
        if (activeTurn === 'b') {
          newPv.cp = -newPv.cp
        }
        
        const idx = nextMultiPvs.findIndex(p => p.id === newPv.id)
        if (idx > -1) {
          nextMultiPvs[idx] = newPv
        } else {
          nextMultiPvs.push(newPv)
        }
      })

      // Sort the variations by PV index to maintain correct order in UI lists
      nextMultiPvs.sort((a, b) => a.id - b.id)
      multiPvs.value = nextMultiPvs
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
    isAnalyzing.value = false
  }



  /**
   * Configures the engine to use a specific Mortal personality.
   */
  function setMortalArchetype(archetypeId: string | null) {
    activeArchetype.value = archetypeId
    if (archetypeId) {
      const commands = mortal.getUciCommands(archetypeId)
      commands.forEach(cmd => sendCommand(cmd))
      // Always use MultiPV 3 for Mortal mode to allow for blunder selection
      sendCommand('setoption name MultiPV value 3')
    }
  }

  // Trigger analysis for a given position
  /**
   * Start analysis of a position.
   * This function also resets the inactivity timer so that the engine will be
   * automatically throttled if no further analysis requests occur within three
   * minutes.
   */
  function analyze(fen: string, depth = 15, bot?: Bot) {
    if (!worker) init()
    
    activeBot.value = bot || null

    logger.info(`[Engine] Analyzing FEN: ${fen.substring(0, 20)}... at Depth: ${depth}`)

    // Reset inactivity timer – a new analysis request means the user is active.
    resetInactivityTimer()
    isThrottled.value = false
    wasAnalyzingBeforeThrottle = false
    
    // 1. Idempotency Check: Don't re-analyze exactly the same state if already analyzing
    if (isAnalyzing.value && lastAnalyzedFen === fen && lastAnalyzedDepth === depth && !isRebooting.value) {
      return
    }

    // 2. Stop ongoing analysis and clear state
    if (isAnalyzing.value) {
      stop()
    }
    
    // Reset bestMove and ensure reactivity by clearing it
    bestMove.value = ''
    lastAnalyzedFen = fen
    lastAnalyzedDepth = depth
    multiPvs.value = []
    
    // 3. Set standard UCI options
    sendCommand('setoption name UCI_AnalyseMode value true')
    sendCommand(`setoption name Skill Level value ${bot?.skillLevel ?? 20}`)
    
    // Apply ELO if specified
    if (bot?.elo) {
      sendCommand('setoption name UCI_LimitStrength value true')
      sendCommand(`setoption name UCI_Elo value ${bot.elo}`)
    } else {
      sendCommand('setoption name UCI_LimitStrength value false')
    }

    if (bot?.contempt !== undefined) {
      sendCommand(`setoption name Contempt value ${bot.contempt}`)
    }

    // 4. Start analysis
    isAnalyzing.value = true
    sendCommand('isready') 
    sendCommand(`position fen ${fen}`)
    
    const safeDepth = Math.min(depth, 24)
    sendCommand(`go depth ${safeDepth}`)
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
    isReady, isAnalyzing, isThrottled, evalScoreCp, evalMate, bestMove, suggestedMove, currentDepth, pv, multiPvs,
    evalNumber, evalPercent,
    init, analyze, stop, reboot, resetRebootCount,
    setMortalArchetype,
    activeArchetype,
    activeBot,
    isMortalThinking,
    isRebooting,
    cleanup
  }
})
