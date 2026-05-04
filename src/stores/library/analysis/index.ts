import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { Chess } from 'chess.js'
import type { LibraryGame } from '../types'
import { useUiStore } from '../../../stores/uiStore'
import { logger } from '../../../utils/logger'

// Import Sub-Modules
import { useAnalysisTelemetry } from './telemetry'
import { useAnalysisInsights } from './insights'
import { useAnalysisWorker } from './worker'
import { LichessCurator } from '../../../services/curatorService'
// Cloud Eval removed to prevent 429 Rate Limits

export interface Evaluation {
  score: number
  isMate: boolean
  bestMove?: string // The engine's preferred move for this position
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
  
  // LIVE STATS (for the game currently being processed)
  const activeGameStats = ref({
    blunders: 0,
    mistakes: 0,
    inaccuracies: 0,
    brilliants: 0,
    movesProcessed: 0,
    totalMoves: 0
  })

  let startTime = 0
  
  // Global Queue Pointer
  let queue: LibraryGame[] = []
  let nextQueueIndex = 0
 
  // Module Initialization
  const telemetry = useAnalysisTelemetry()
  const insights = useAnalysisInsights()
  const uiStore = useUiStore()
  
  /**
   * Worker Instance State
   */
  interface EngineInstance {
    engine: ReturnType<typeof useAnalysisWorker>
    currentIndex: number
    currentMoveIndex: number
    currentPositions: string[]
    currentMoves: string[] // Added for move context
    currentEvals: Evaluation[]
    currentTotalCpl: number // Tracking ACPL
    currentMissedWins: number
    currentTheoryMoves: number
    currentBlunders: number
    currentMistakes: number
    currentInaccuracies: number
    currentBrilliants: number
    currentMaxEvalChange: number
    currentTags: string[]
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
      currentMoves: [],
      currentEvals: [],
      currentTotalCpl: 0,
      currentMissedWins: 0,
      currentTheoryMoves: 0,
      currentBlunders: 0,
      currentMistakes: 0,
      currentInaccuracies: 0,
      currentBrilliants: 0,
      currentMaxEvalChange: 0,
      currentTags: [],
      isProcessing: false,
      gameId: '',
      id: i
    })
  }

  /**
   * Main Worker Message Handler Factory
   */
  function createMessageHandler(inst: EngineInstance) {
    return async function(msg: string) {
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
        const pvMatch = msg.match(/ pv (\w+)/) // Extract best move from PV
        
        // Sum NPS across all workers for the UI
        if (npsMatch) {
          // We update the shared telemetry NPS
          telemetry.engineNodesPerSecond.value = pool.reduce((sum, p) => sum + (p.engine.worker.value ? parseInt(npsMatch[1], 10) / pool.length : 0), 0)
        }

        if (cpMatch || mateMatch) {
          const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0
          const score = cpMatch ? parseInt(cpMatch[1], 10) : (mateMatch ? parseInt(mateMatch[1], 10) * 10000 : 0)
          
          if (depth >= 12 && !inst.isProcessing) {
            const bestMove = pvMatch ? pvMatch[1] : 'N/A'
            applyEvaluationDNA(inst, score, !!mateMatch, bestMove)
          }
        }
      } else if (msg.startsWith('bestmove')) {
        advancePly(inst)
      }
    }
  }

  /**
   * Advances the engine to the next move in the game
   */
  function advancePly(inst: EngineInstance) {
    inst.engine.isWaitingForBestMove.value = false
    inst.isProcessing = false
    inst.currentMoveIndex++
    telemetry.totalMovesProcessed.value++
    
    updateETA()
    
    setTimeout(() => {
      if (isBulkAnalyzing.value) processNextMove(inst)
    }, 50) 
  }

  /**
   * Universal Evaluation Post-Processor
   * Handles ACPL, Insights, and Theory for any evaluation source.
   */
  async function applyEvaluationDNA(inst: EngineInstance, score: number, isMate: boolean, bestMove: string) {
    inst.isProcessing = true 
    inst.currentEvals[inst.currentMoveIndex] = { score, isMate, bestMove }
    
    const prevEval = inst.currentMoveIndex > 0 ? inst.currentEvals[inst.currentMoveIndex - 1]?.score : 0
    
    // SIDE-TO-MOVE ADJUSTMENT:
    // Evaluations are relative to the side whose turn it is.
    const swing = score - prevEval
    const absSwing = Math.abs(swing)
    if (absSwing > inst.currentMaxEvalChange) inst.currentMaxEvalChange = absSwing

    const cpl = Math.max(0, -swing) 
    inst.currentTotalCpl += cpl
    
    const playedMove = inst.currentMoves[inst.currentMoveIndex] || 'N/A'

    // --- THEORY ALIGNMENT (First 12 moves) ---
    if (inst.currentMoveIndex < 12) {
      try {
        const report = await LichessCurator.getTheoryReport(inst.currentPositions[inst.currentMoveIndex], playedMove)
        if (report && report.isTheory) {
          inst.currentTheoryMoves++
          inst.currentTags[inst.currentMoveIndex] = 'book'
        }
      } catch (e) { /* silent fail */ }
    }

    const isCurrentlyViewed = inst.gameId === currentAnalyzingId.value

    if (swing > 200) {
      telemetry.brilliantMovesFound.value++
      inst.currentBrilliants++
      inst.currentTags[inst.currentMoveIndex] = 'brilliant'
      if (isCurrentlyViewed) activeGameStats.value.brilliants = inst.currentBrilliants
      if (inst.currentPositions[inst.currentMoveIndex]) {
        insights.queueInsight({
          fen: inst.currentPositions[inst.currentMoveIndex],
          theme: 'Brilliant Discovery',
          severity: 'brilliant',
          gameId: inst.gameId,
          bestMove,
          playedMove
        })
      }
    } else if (swing < -150 && prevEval > 200) {
      inst.currentMissedWins++
      inst.currentTags[inst.currentMoveIndex] = 'missed-win'
      if (inst.currentPositions[inst.currentMoveIndex]) {
        insights.queueInsight({
          fen: inst.currentPositions[inst.currentMoveIndex],
          theme: 'Missed Opportunity',
          severity: 'missed-win',
          gameId: inst.gameId,
          bestMove,
          playedMove
        })
      }
    } else if (swing < -200) {
      telemetry.blundersFound.value++
      inst.currentBlunders++
      inst.currentTags[inst.currentMoveIndex] = 'blunder'
      if (isCurrentlyViewed) activeGameStats.value.blunders = inst.currentBlunders
      if (playedMove && bestMove && playedMove !== bestMove && inst.currentPositions[inst.currentMoveIndex]) {
        insights.queueInsight({
          fen: inst.currentPositions[inst.currentMoveIndex],
          theme: 'Critical Blunder',
          severity: 'blunder',
          gameId: inst.gameId,
          playedMove,
          bestMove
        })
      }
    } else if (swing < -100) {
      telemetry.mistakesFound.value++
      inst.currentMistakes++
      inst.currentTags[inst.currentMoveIndex] = 'mistake'
      if (isCurrentlyViewed) activeGameStats.value.mistakes = inst.currentMistakes
      if (inst.currentPositions[inst.currentMoveIndex]) {
        insights.queueInsight({
          fen: inst.currentPositions[inst.currentMoveIndex],
          theme: 'Strategic Mistake',
          severity: 'mistake',
          gameId: inst.gameId,
          bestMove,
          playedMove
        })
      }
    } else if (swing < -50) {
      telemetry.inaccuraciesFound.value++
      inst.currentInaccuracies++
      inst.currentTags[inst.currentMoveIndex] = 'inaccuracy'
      if (isCurrentlyViewed) activeGameStats.value.inaccuracies = inst.currentInaccuracies
      if (inst.currentPositions[inst.currentMoveIndex]) {
        insights.queueInsight({
          fen: inst.currentPositions[inst.currentMoveIndex],
          theme: 'Inaccuracy',
          severity: 'inaccuracy',
          gameId: inst.gameId,
          bestMove,
          playedMove
        })
      }
    } else {
      // Good/Best/Excellent fallbacks
      if (absSwing < 15) inst.currentTags[inst.currentMoveIndex] = 'best'
      else if (absSwing < 40) inst.currentTags[inst.currentMoveIndex] = 'excellent'
      else if (absSwing < 75) inst.currentTags[inst.currentMoveIndex] = 'good'
    }
  }

  /**
   * Starts the bulk engine
   * @param forceRestart - If true, re-analyzes all games even if they have evals
   */
  function startBulkAnalysis(forceRestart = false) {
    if (isBulkAnalyzing.value) return
    
    const totalCount = games.value.length
    const alreadyAnalyzedCount = games.value.filter(g => g.evals && g.evals.length > 0).length
    const isCompleted = totalCount > 0 && (alreadyAnalyzedCount / totalCount) >= 0.95

    // AUTO-FORCE: If the user clicks start on a finished/near-finished vault,
    // we assume they want to re-run for new metrics/theory.
    if (forceRestart || isCompleted) {
      logger.info(`[Intel Hub] ${isCompleted ? 'Auto-Restarting' : 'Force Restarting'} synthesis for ${totalCount} games.`)
      
      // DEEP MUTATION: Ensure reactivity triggers across all components
      games.value = games.value.map(g => ({
        ...g,
        evals: [],
        isSynthesized: false,
        analysisCache: {} 
      }))
    }

    // Refresh counts after possible mutation
    const currentAnalyzedCount = totalCount - games.value.filter(g => !g.isSynthesized).length
    
    if (totalCount > 0) {
      telemetry.analysisProgress.value = Math.round((currentAnalyzedCount / totalCount) * 100)
    }

    queue = games.value.filter(g => !g.isSynthesized)
    
    if (queue.length === 0) {
      logger.info('[Intel Hub] Vault is already fully synthesized.')
      isBulkAnalyzing.value = false
      return
    }

    logger.info(`[Intel Hub] Starting synthesis for ${queue.length} games...`)
    isBulkAnalyzing.value = true
    nextQueueIndex = 0
    startTime = Date.now()
    telemetry.resetTelemetry()

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
      // Mark this worker as idle since it has no more games to fetch
      inst.currentIndex = -1

      // Check if all workers are done
      if (pool.every(p => p.currentIndex === -1)) {
        isBulkAnalyzing.value = false
        telemetry.analysisProgress.value = 100
        
        uiStore.addToast(`Synthesis Complete: Intelligence pass finished. ${queue.length} game(s) enlightened.`, 'success')
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
      telemetry.liveAnalyzedCount.value = preAnalyzedCount + nextQueueIndex
      telemetry.analysisProgress.value = Math.round(((preAnalyzedCount + nextQueueIndex) / totalCount) * 100)
    }

    const chess = new Chess()
    try {
      chess.loadPgn(game.pgn)
      const history = chess.history()
      inst.currentPositions = []
      inst.currentMoves = []
      inst.currentMoveIndex = 0
      inst.currentEvals = []
      inst.currentTotalCpl = 0
      inst.currentMissedWins = 0
      inst.currentTheoryMoves = 0
      inst.currentBlunders = 0
      inst.currentMistakes = 0
      inst.currentInaccuracies = 0
      inst.currentBrilliants = 0
      inst.currentMaxEvalChange = 0
      
      // Reset live stats for this specific game
      activeGameStats.value = {
        blunders: 0,
        mistakes: 0,
        inaccuracies: 0,
        brilliants: 0,
        movesProcessed: 0,
        totalMoves: history.length
      }
      
      const tempChess = new Chess()
      inst.currentPositions.push(tempChess.fen())
      
      for (const move of history) {
        inst.currentMoves.push(move)
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

    if (inst.gameId === currentAnalyzingId.value) {
       activeGameStats.value.movesProcessed = inst.currentMoveIndex
    }

    const fen = inst.currentPositions[inst.currentMoveIndex]
    if (!fen || fen.length < 10) {
      advancePly(inst)
      return
    }

    // We are no longer using the Cloud-First Strategy due to Lichess API 429 Rate Limits.
    // The local Stockfish worker will evaluate 100% of the positions.

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
    game.moveTags = [...inst.currentTags]
    game.acpl = Math.round(inst.currentTotalCpl / Math.max(1, inst.currentMoves.length))
    game.missedWins = inst.currentMissedWins
    
    const theoryGames = Math.min(inst.currentMoves.length, 12)
    game.theoreticalAccuracy = theoryGames > 0 
      ? Math.round((inst.currentTheoryMoves / theoryGames) * 100) 
      : 0

    game.blunderCount = inst.currentBlunders
    game.mistakeCount = inst.currentMistakes
    game.inaccuracyCount = inst.currentInaccuracies
    game.brilliantCount = inst.currentBrilliants
    game.maxEvalChange = inst.currentMaxEvalChange

    // Derive Terminal State
    const lastMove = inst.currentMoves[inst.currentMoves.length - 1] || ''
    if (lastMove.includes('#')) {
      game.terminalState = 'Checkmate'
    } else if (game.result === '1-0' || game.result === '0-1') {
      game.terminalState = 'Resignation'
    } else if (game.result === '1/2-1/2') {
      game.terminalState = 'Draw'
    } else {
      game.terminalState = 'Unknown'
    }

    game.isSynthesized = true // EXPLICIT CONFIRMATION: Analysis is complete
    await persistGameUpdate(game)
    
    inst.currentEvals = []
    inst.currentTags = []
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
    
    const remainingMs = remainingPlies * msPerPly
    
    if (remainingMs < 5000) {
      telemetry.estimatedTimeRemaining.value = '00:00'
      return
    }

    const hours = Math.floor(remainingMs / 3600000)
    const mins = Math.floor((remainingMs % 3600000) / 60000)
    const secs = Math.floor((remainingMs % 60000) / 1000)
    
    if (hours > 0) {
      telemetry.estimatedTimeRemaining.value = `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    } else {
      telemetry.estimatedTimeRemaining.value = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
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

  /**
   * Manual update for a single position's analysis cache.
   * Used by the CoachPanel when an LLM insight is generated on-the-fly.
   */
  async function updateGameAnalysis(gameId: string, fen: string, explanation: string) {
    const targetGame = games.value.find(g => g.id === gameId)
    if (targetGame) {
      if (!targetGame.analysisCache) targetGame.analysisCache = {}
      targetGame.analysisCache[fen] = explanation
      await persistGameUpdate(targetGame)
    }
  }

  /**
   * Targeted analysis for a single game.
   * If the engine is idle, it starts a single-game queue.
   */
  async function analyzeGame(gameId: string) {
    const game = games.value.find(g => g.id === gameId)
    if (!game) return

    // Clear existing evals to ensure fresh data
    game.evals = []
    game.analysisCache = {}
    game.isSynthesized = false

    if (!isBulkAnalyzing.value) {
      queue = [game]
      nextQueueIndex = 0
      isBulkAnalyzing.value = true
      currentAnalyzingId.value = gameId
      startTime = Date.now()
      telemetry.resetTelemetry()
      
      activeGameStats.value = {
        blunders: 0,
        mistakes: 0,
        inaccuracies: 0,
        brilliants: 0,
        movesProcessed: 0,
        totalMoves: 0
      }

      // Use first available worker
      const inst = pool[0]
      inst.engine.initWorker(createMessageHandler(inst))
      processNextGame(inst)
    } else {
      uiStore.addToast('Engine Busy: The Intelligence Engine is currently processing another task.', 'warning')
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
    analyzeGame,
    updateGameAnalysis,
    isBulkAnalyzing,
    currentAnalyzingId,
    activeGameStats
  }
}
