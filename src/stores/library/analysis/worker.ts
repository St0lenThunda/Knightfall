import { ref } from 'vue'
import { logger } from '../../../utils/logger'

/**
 * Analysis Worker Module
 * Manages the Stockfish lifecycle, UCI handshakes, and periodic recycling.
 */
export function useAnalysisWorker() {
  const worker = ref<Worker | null>(null)
  const isEngineReady = ref(false)
  const isWaitingForBestMove = ref(false)
  
  // Recycling counters
  const gamesSinceLastReset = ref(0)
  const RECYCLE_THRESHOLD = 100

  /**
   * Spawns or Respawns the engine worker
   */
  function initWorker(onMessage: (msg: string) => void) {
    if (worker.value) return
    
    logger.info('[Intel Hub] Spawning engine worker...')
    worker.value = new Worker('/engine/stockfish.js')
    
    isEngineReady.value = false
    isWaitingForBestMove.value = false

    worker.value.onmessage = (e) => {
      const msg = e.data
      if (typeof msg === 'string') onMessage(msg)
    }

    // Handshake fallback
    setTimeout(() => {
      if (worker.value && !isEngineReady.value && !isWaitingForBestMove.value) {
        sendToWorker('uci')
      }
    }, 2000)
  }

  /**
   * Terminate and nullify
   */
  function cleanupWorker() {
    if (worker.value) {
      worker.value.terminate()
      worker.value = null
      isEngineReady.value = false
    }
  }

  /**
   * Soft Reset: Recycles the worker to prevent WASM heap fragmentation
   */
  function incrementGameCount() {
    gamesSinceLastReset.value++
    
    if (gamesSinceLastReset.value >= RECYCLE_THRESHOLD) {
      logger.warn(`[Intel Hub] Recycling worker after ${RECYCLE_THRESHOLD} games for stability.`)
      cleanupWorker()
      gamesSinceLastReset.value = 0
      // The orchestrator will re-init on the next game cycle
      return true // Signifies recycling happened
    }
    return false
  }

  /**
   * Communicates with worker
   */
  function sendToWorker(cmd: string) {
    if (worker.value) {
      worker.value.postMessage(cmd)
    }
  }

  return {
    worker,
    isEngineReady,
    isWaitingForBestMove,
    initWorker,
    cleanupWorker,
    sendToWorker,
    incrementGameCount
  }
}
