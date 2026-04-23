import { ref, type Ref } from 'vue'
import { Chess } from 'chess.js'
import type { LibraryGame } from '../libraryStore'
import { logger } from '../../utils/logger'

/**
 * Composable for bulk library analysis (Option 1: Sequential).
 * Orchestrates a background worker to analyze games move-by-move.
 */
export function useLibraryAnalysis(
  games: Ref<LibraryGame[]>,
  persistGameUpdate: (game: LibraryGame) => Promise<void>
) {
  const isBulkAnalyzing = ref(false)
  const analysisProgress = ref(0) // Total games processed
  const currentAnalyzingId = ref<string | null>(null)
  let isEngineReady = false
  
  // Analytics Metrics
  const totalMovesProcessed = ref(0)
  const brilliantMovesFound = ref(0)
  const engineNodesPerSecond = ref(0)
  const estimatedTimeRemaining = ref<string | null>(null)
  
  let startTime = 0
  
  let worker: Worker | null = null
  let queue: LibraryGame[] = []
  let currentIndex = 0
  let currentMoveIndex = 0
  let currentPositions: string[] = []
  let currentEvals: any[] = []
  let isWaitingForBestMove = false

  /**
   * Initializes the background worker
   */
  function initWorker() {
    if (worker) return
    
    // Load Stockfish directly as the worker to ensure correct WASM resolution
    worker = new Worker('/engine/stockfish.js')
    
    worker.onmessage = async (e) => {
      const msg = e.data
      if (typeof msg !== 'string') return

      if (msg === 'uciok') {
        worker?.postMessage('setoption name Threads value 1')
        worker?.postMessage('setoption name Hash value 16')
        worker?.postMessage('ucinewgame')
        worker?.postMessage('isready')
      } else if (msg === 'readyok') {
        isEngineReady = true
        setTimeout(() => processNextMove(), 100)
      } else if (msg.startsWith('info depth')) {
        if (!isWaitingForBestMove) return // Ignore delayed info from previous moves
        
        // Extract evaluation
        const cpMatch = msg.match(/score cp (-?\d+)/)
        const mateMatch = msg.match(/score mate (-?\d+)/)
        const depthMatch = msg.match(/depth (\d+)/)
        const npsMatch = msg.match(/nps (\d+)/)

        if (npsMatch) engineNodesPerSecond.value = parseInt(npsMatch[1], 10)

        if (cpMatch || mateMatch) {
          const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0
          const score = cpMatch ? parseInt(cpMatch[1], 10) : (mateMatch ? parseInt(mateMatch[1], 10) * 10000 : 0)
          
          // Always keep the latest evaluation for this move
          currentEvals[currentMoveIndex] = { score, isMate: !!mateMatch }
          
          if (depth >= 12) {
             const prevEval = currentMoveIndex > 0 ? currentEvals[currentMoveIndex - 1]?.score : 0
             if (score - prevEval > 200) brilliantMovesFound.value++
             
             totalMovesProcessed.value++
             updateETA()
          }
        }
      } else if (msg.startsWith('bestmove')) {
        isWaitingForBestMove = false
        currentMoveIndex++
        // Small delay to ensure engine event loop is clear
        setTimeout(() => {
          processNextMove()
        }, 100)
      }
    }

    worker.postMessage('uci')
  }

  /**
   * Starts or resumes the bulk analysis process
   */
  function startBulkAnalysis() {
    if (isBulkAnalyzing.value) return
    
    // Filter games that haven't been fully analyzed yet
    queue = games.value.filter(g => !g.evals || g.evals.length < g.movesCount)
    if (queue.length === 0) {
      logger.info('[Bulk Analysis] All games already analyzed.')
      return
    }

    isBulkAnalyzing.value = true
    currentIndex = 0
    totalMovesProcessed.value = 0
    brilliantMovesFound.value = 0
    startTime = Date.now()
    initWorker()
    processNextGame()
  }

  /**
   * Pauses the analysis process
   */
  function stopBulkAnalysis() {
    isBulkAnalyzing.value = false
    currentAnalyzingId.value = null
    worker?.postMessage('stop')
    cleanupWorker()
  }

  /**
   * Prepares the next game for analysis
   */
  async function processNextGame() {
    if (!isBulkAnalyzing.value || currentIndex >= queue.length) {
      isBulkAnalyzing.value = false
      analysisProgress.value = 100
      return
    }

    const game = queue[currentIndex]
    currentAnalyzingId.value = game.id
    analysisProgress.value = Math.round((currentIndex / queue.length) * 100)

    // Reset engine for new game
    isEngineReady = false
    worker?.postMessage('ucinewgame')
    worker?.postMessage('isready')

    // Generate positions
    const chess = new Chess()
    try {
      chess.loadPgn(game.pgn)
      const history = chess.history()
      currentPositions = []
      
      const tempChess = new Chess()
      currentPositions.push(tempChess.fen()) // Starting position
      
      for (const move of history) {
        tempChess.move(move)
        currentPositions.push(tempChess.fen())
      }

      currentMoveIndex = 0
      currentEvals = new Array(currentPositions.length).fill(null)
      processNextMove()
    } catch (e) {
      logger.error('[Bulk Analysis] Failed to parse game', game.id, e)
      currentIndex++
      processNextGame()
    }
  }

  /**
   * Triggers analysis for the next move in the current game
   */
  async function processNextMove() {
    if (!isBulkAnalyzing.value || !isEngineReady) return

    if (currentMoveIndex >= currentPositions.length) {
      // Game finished
      await finalizeGame()
      return
    }

    const fen = currentPositions[currentMoveIndex]
    if (!fen || typeof fen !== 'string' || fen.length < 10) {
      currentMoveIndex++
      processNextMove()
      return
    }

    worker?.postMessage(`position fen ${fen}`)
    isWaitingForBestMove = true
    worker?.postMessage(`go depth 12`)
  }

  /**
   * Terminates and clears the current worker
   */
  function cleanupWorker() {
    if (worker) {
      worker.terminate()
      worker = null
    }
  }

  /**
   * Saves the analyzed game and moves to the next one
   */
  async function finalizeGame() {
    const game = queue[currentIndex]
    game.evals = currentEvals
    
    await persistGameUpdate(game)
    
    currentIndex++
    
    // Recycle worker every 5 games to prevent WASM memory bloat/instability
    if (currentIndex % 5 === 0) {
      cleanupWorker()
    }
    
    processNextGame()
  }

  /**
   * Calculates Estimated Time Remaining based on speed
   */
  function updateETA() {
    if (currentIndex === 0 && currentMoveIndex === 0) return
    
    const elapsed = Date.now() - startTime
    const totalRemainingGames = queue.length - currentIndex
    const msPerGame = elapsed / (currentIndex + 1)
    
    const remainingMs = totalRemainingGames * msPerGame
    if (remainingMs < 60000) {
      estimatedTimeRemaining.value = '< 1m'
    } else {
      const mins = Math.round(remainingMs / 60000)
      estimatedTimeRemaining.value = `${mins}m`
    }
  }

  return {
    isBulkAnalyzing,
    analysisProgress,
    currentAnalyzingId,
    totalMovesProcessed,
    brilliantMovesFound,
    engineNodesPerSecond,
    estimatedTimeRemaining,
    startBulkAnalysis,
    stopBulkAnalysis
  }
}
