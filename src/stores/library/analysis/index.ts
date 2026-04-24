import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { Chess } from 'chess.js'
import type { LibraryGame } from '../../libraryStore'
import { useUserStore } from '../../userStore'
import { logger } from '../../../utils/logger'

// Import Sub-Modules
import { useAnalysisTelemetry } from './telemetry'
import { useAnalysisInsights } from './insights'
import { useAnalysisWorker } from './worker'

export interface Evaluation {
  score: number
  isMate: boolean
}

/**
 * Knightfall Bulk Intelligence Engine (Modular V2)
 * 
 * Orchestrates Stockfish and Gemini to enlighten a user's library.
 * Now featuring Worker Recycling, Insight Retries, and Discovery Snapshots.
 */
export function useLibraryAnalysis(
  games: Ref<LibraryGame[]>,
  persistGameUpdate: (game: LibraryGame) => Promise<void>
) {
  const isBulkAnalyzing = ref(false)
  const currentAnalyzingId = ref<string | null>(null)
  let startTime = 0
  
  // Global Queue Pointer
  let queue: LibraryGame[] = []
  let nextQueueIndex = 0
 
  // Module Initialization
  const telemetry = useAnalysisTelemetry()
  const insights = useAnalysisInsights()
  
  /**
   * Worker Instance State
   */
  interface EngineInstance {
    engine: ReturnType<typeof useAnalysisWorker>
    currentIndex: number
    currentMoveIndex: number
    currentPositions: string[]
    currentEvals: Evaluation[]
    isProcessing: boolean
    gameId: string
    id: number
  }

  const NUM_WORKERS = Math.min(2, Math.max(1, Math.floor((navigator.hardwareConcurrency || 2) / 2)))
  const pool: EngineInstance[] = []

  for (let i = 0; i < NUM_WORKERS; i++) {
    pool.push({
      engine: useAnalysisWorker(),
      currentIndex: -1,
      currentMoveIndex: 0,
      currentPositions: [],
      currentEvals: [],
      isProcessing: false,
      gameId: '',
      id: i
    })
  }

  /**
   * Main Worker Message Handler Factory
   */
  function createMessageHandler(inst: EngineInstance) {
    return (msg: string) => {
      if (msg.includes('Stockfish')) {
        setTimeout(() => {
          if (!inst.engine.isEngineReady.value) inst.engine.sendToWorker('uci')
        }, 500)
        return
      }

      if (msg === 'uciok') {
        const threads = 1 // Single thread per worker in parallel mode is often faster
        inst.engine.sendToWorker(`setoption name Threads value ${threads}`)
        inst.engine.sendToWorker('setoption name Hash value 16')
        inst.engine.sendToWorker('setoption name UCI_AnalyseMode value true')
        inst.engine.sendToWorker('isready')
      } else if (msg === 'readyok') {
        inst.engine.isEngineReady.value = true
        processNextMove(inst)
      } else if (msg.startsWith('info depth')) {
        if (!inst.engine.isWaitingForBestMove.value) return
        
        const cpMatch = msg.match(/score cp (-?\d+)/)
        const mateMatch = msg.match(/score mate (-?\d+)/)
        const depthMatch = msg.match(/depth (\d+)/)
        const npsMatch = msg.match(/nps (\d+)/)
        
        // Sum NPS across all workers for the UI
        if (npsMatch) {
          // We update the shared telemetry NPS
          telemetry.engineNodesPerSecond.value = pool.reduce((sum, p) => sum + (p.engine.worker.value ? parseInt(npsMatch[1], 10) / pool.length : 0), 0)
        }

        if (cpMatch || mateMatch) {
          const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0
          const score = cpMatch ? parseInt(cpMatch[1], 10) : (mateMatch ? parseInt(mateMatch[1], 10) * 10000 : 0)
          inst.currentEvals[inst.currentMoveIndex] = { score, isMate: !!mateMatch }
          
          if (depth >= 12 && !inst.isProcessing) {
            inst.isProcessing = true 
            const prevEval = inst.currentMoveIndex > 0 ? inst.currentEvals[inst.currentMoveIndex - 1]?.score : 0
            const swing = score - prevEval
            
            // WEAKNESS DNA ISOLATION: 
            // We only increment blunders/brilliants for the user's personal games
            // to keep the dashboard stats clean from master collection noise.
            const game = queue[inst.currentIndex]
            // For modularity, we'll use a direct name check since we have the game object
            const tags = (game?.tags || []).map(t => t.toLowerCase())
            const userStore = useUserStore()
            const isPersonal = tags.includes('my games') || 
                               (game && (userStore.isMe(game.white) || userStore.isMe(game.black)))

            if (swing > 200) {
              if (isPersonal) {
                telemetry.brilliantMovesFound.value++
                insights.queueInsight({
                  fen: inst.currentPositions[inst.currentMoveIndex],
                  theme: 'Brilliant Discovery',
                  severity: 'brilliant',
                  gameId: inst.gameId
                })
              }
            } else if (swing < -200) {
              if (isPersonal) {
                telemetry.blundersFound.value++
                insights.queueInsight({
                  fen: inst.currentPositions[inst.currentMoveIndex],
                  theme: 'Critical Blunder',
                  severity: 'blunder',
                  gameId: inst.gameId
                })
              }
            }
          }
        }
      } else if (msg.startsWith('bestmove')) {
        inst.engine.isWaitingForBestMove.value = false
        inst.isProcessing = false
        inst.currentMoveIndex++
        telemetry.totalMovesProcessed.value++
        
        updateETA()
        
        setTimeout(() => {
          if (isBulkAnalyzing.value) processNextMove(inst)
        }, 50) 
      }
    }
  }

  /**
   * Starts the bulk engine
   */
  function startBulkAnalysis() {
    if (isBulkAnalyzing.value) return
    
    queue = games.value.filter(g => !g.evals || g.evals.length < g.movesCount)
    if (queue.length === 0) {
      logger.info('[Bulk Analysis] All games already analyzed.')
      return
    }

    isBulkAnalyzing.value = true
    nextQueueIndex = 0
    startTime = Date.now()
    telemetry.resetTelemetry()

    const totalCount = games.value.length
    if (totalCount > 0) {
      const analyzedCount = totalCount - queue.length
      telemetry.analysisProgress.value = Math.round((analyzedCount / totalCount) * 100)
    }
    
    // Spawn all workers in the pool
    pool.forEach(inst => {
      inst.engine.initWorker(createMessageHandler(inst))
      processNextGame(inst)
    })
  }

  /**
   * Pauses the bulk engine
   */
  function stopBulkAnalysis() {
    isBulkAnalyzing.value = false
    currentAnalyzingId.value = null
    insights.clearInsights()
    pool.forEach(inst => inst.engine.cleanupWorker())
  }

  /**
   * Game Transition Logic
   */
  async function processNextGame(inst: EngineInstance) {
    if (!isBulkAnalyzing.value || nextQueueIndex >= queue.length) {
      // Check if all workers are done
      if (pool.every(p => p.currentIndex >= queue.length || p.currentIndex === -1)) {
        isBulkAnalyzing.value = false
        telemetry.analysisProgress.value = 100
      }
      return
    }

    const gameIndex = nextQueueIndex++
    inst.currentIndex = gameIndex
    const game = queue[gameIndex]
    inst.gameId = game.id
    currentAnalyzingId.value = game.id // Keep for legacy UI compat
    
    // Calculate global progress
    const totalCount = games.value.length
    if (totalCount > 0) {
      const preAnalyzedCount = totalCount - queue.length
      telemetry.analysisProgress.value = Math.round(((preAnalyzedCount + nextQueueIndex) / totalCount) * 100)
    }

    const chess = new Chess()
    try {
      chess.loadPgn(game.pgn)
      const history = chess.history()
      inst.currentPositions = []
      inst.currentMoveIndex = 0
      inst.currentEvals = []
      
      const tempChess = new Chess()
      inst.currentPositions.push(tempChess.fen())
      
      for (const move of history) {
        if (!tempChess.move(move)) break
        inst.currentPositions.push(tempChess.fen())
      }

      // Handle Engine Lifecycle (Recycling check)
      if (inst.engine.incrementGameCount()) {
        inst.engine.initWorker(createMessageHandler(inst))
      } else if (!inst.engine.worker.value) {
        inst.engine.initWorker(createMessageHandler(inst))
      } else if (inst.engine.isEngineReady.value) {
        processNextMove(inst)
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'PGN Parse Error'
      logger.error(`[Intel Hub] Quarantine game ${game.id}: ${reason}`)
      telemetry.failedGames.value.push({ id: game.id, reason })
      processNextGame(inst)
    }
  }

  /**
   * Move Analysis Logic
   */
  async function processNextMove(inst: EngineInstance) {
    if (!isBulkAnalyzing.value || !inst.engine.isEngineReady.value) return

    if (inst.currentMoveIndex >= inst.currentPositions.length) {
      await finalizeGame(inst)
      return
    }

    // BOOK-SMART SKIP: Bypass the first 8 plies (standard opening theory)
    if (inst.currentMoveIndex < 8) {
      inst.currentMoveIndex++
      processNextMove(inst)
      return
    }

    const fen = inst.currentPositions[inst.currentMoveIndex]
    if (!fen || fen.length < 10) {
      inst.currentMoveIndex++
      processNextMove(inst)
      return
    }

    inst.engine.sendToWorker(`position fen ${fen}`)
    inst.engine.isWaitingForBestMove.value = true
    inst.isProcessing = false
    
    // CONTEXTUAL DEPTH: Focus more on tense positions
    const lastScore = inst.currentMoveIndex > 0 ? Math.abs(inst.currentEvals[inst.currentMoveIndex - 1]?.score || 0) : 0
    let depth = 12
    if (lastScore > 50 && lastScore < 300) depth = 14 
    if (lastScore > 800) depth = 10 
    
    inst.engine.sendToWorker(`go depth ${depth}`)
  }

  /**
   * Saves game results and advances
   */
  async function finalizeGame(inst: EngineInstance) {
    const game = queue[inst.currentIndex]
    game.evals = [...inst.currentEvals]
    await persistGameUpdate(game)
    
    inst.currentEvals = []
    inst.currentPositions = []
    inst.currentMoveIndex = 0
    
    processNextGame(inst)
  }

  /**
   * Precise ETA Calculation
   */
  function updateETA() {
    const elapsedMs = Date.now() - startTime
    if (telemetry.totalMovesProcessed.value === 0) return

    const msPerPly = elapsedMs / telemetry.totalMovesProcessed.value
    
    // Sum remaining plies across all un-analyzed games
    let remainingPlies = 0
    for (let i = nextQueueIndex; i < queue.length; i++) {
      remainingPlies += queue[i].movesCount
    }
    
    // Add remaining plies in active workers
    pool.forEach(inst => {
      if (inst.currentIndex !== -1 && inst.currentIndex < queue.length) {
        remainingPlies += (inst.currentPositions.length - 1) - inst.currentMoveIndex
      }
    })
    
    const remainingMs = (remainingPlies * msPerPly) / NUM_WORKERS
    
    if (remainingMs < 5000) telemetry.estimatedTimeRemaining.value = 'Finishing...'
    else {
      const mins = Math.floor(remainingMs / 60000)
      const secs = Math.floor((remainingMs % 60000) / 1000)
      telemetry.estimatedTimeRemaining.value = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
    }
  }

  // Handle Insight Completion from Global Event
  function handleInsightComplete(e: Event) {
    const detail = (e as CustomEvent).detail
    if (!detail) return
    
    const { gameId, fen, explanation } = detail
    const targetGame = games.value.find(g => g.id === gameId)
    if (targetGame) {
      if (!targetGame.analysisCache) targetGame.analysisCache = {}
      targetGame.analysisCache[fen] = explanation
      persistGameUpdate(targetGame)
    }
  }

  onMounted(() => {
    window.addEventListener('knightfall-insight-complete', handleInsightComplete)
  })

  onUnmounted(() => {
    window.removeEventListener('knightfall-insight-complete', handleInsightComplete)
    stopBulkAnalysis()
  })

  return {
    ...telemetry,
    startBulkAnalysis,
    stopBulkAnalysis,
    isBulkAnalyzing,
    currentAnalyzingId
  }
}
