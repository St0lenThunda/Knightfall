import { ref, type Ref } from 'vue'
import { Chess } from 'chess.js'
import type { LibraryGame } from '../types'
import { useAnalysisWorker } from './worker'
import { applyEvaluationDNA } from './postProcessor'
import type { EngineInstance } from './types'
import { logger } from '../../../utils/logger'
import { useUiStore } from '../../../stores/uiStore'

export function useAnalysisQueue(
  games: Ref<LibraryGame[]>,
  telemetry: any,
  insights: any,
  persistGameUpdate: (game: LibraryGame) => Promise<void>
) {
  const uiStore = useUiStore()
  
  const isBulkAnalyzing = ref(false)
  const currentAnalyzingId = ref<string | null>(null)
  
  const activeGameStats = ref({
    blunders: 0,
    mistakes: 0,
    inaccuracies: 0,
    brilliants: 0,
    movesProcessed: 0,
    totalMoves: 0
  })

  let startTime = 0
  let queue: LibraryGame[] = []
  let nextQueueIndex = 0

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

  function createMessageHandler(inst: EngineInstance) {
    return async function(msg: string) {
      if (msg.includes('Stockfish')) {
        setTimeout(() => {
          if (!inst.engine.isEngineReady.value) inst.engine.sendToWorker('uci')
        }, 500)
        return
      }

      if (msg === 'uciok') {
        const threads = 1
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
        const pvMatch = msg.match(/ pv (\w+)/)
        
        if (npsMatch) {
          telemetry.engineNodesPerSecond.value = pool.reduce((sum, p) => sum + (p.engine.worker.value ? parseInt(npsMatch[1], 10) / pool.length : 0), 0)
        }

        if (cpMatch || mateMatch) {
          const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0
          const score = cpMatch ? parseInt(cpMatch[1], 10) : (mateMatch ? parseInt(mateMatch[1], 10) * 10000 : 0)
          
          if (depth >= 12 && !inst.isProcessing) {
            const bestMove = pvMatch ? pvMatch[1] : 'N/A'
            await applyEvaluationDNA(inst, score, !!mateMatch, bestMove, telemetry, insights, currentAnalyzingId.value || '', activeGameStats)
          }
        }
      } else if (msg.startsWith('bestmove')) {
        advancePly(inst)
      }
    }
  }

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

  async function processNextGame(inst: EngineInstance) {
    if (!isBulkAnalyzing.value || nextQueueIndex >= queue.length) {
      inst.currentIndex = -1

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
    currentAnalyzingId.value = game.id
    
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

    inst.engine.sendToWorker(`position fen ${fen}`)
    inst.engine.isWaitingForBestMove.value = true
    inst.isProcessing = false
    
    const lastScore = inst.currentMoveIndex > 0 ? Math.abs(inst.currentEvals[inst.currentMoveIndex - 1]?.score || 0) : 0
    let depth = 12
    if (lastScore > 50 && lastScore < 300) depth = 14 
    if (lastScore > 800) depth = 10 
    
    inst.engine.sendToWorker(`go depth ${depth}`)
  }

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

    game.isSynthesized = true 
    await persistGameUpdate(game)
    
    inst.currentEvals = []
    inst.currentTags = []
    inst.currentPositions = []
    inst.currentMoveIndex = 0
    
    processNextGame(inst)
  }

  function updateETA() {
    const elapsedMs = Date.now() - startTime
    if (telemetry.totalMovesProcessed.value === 0) return

    const msPerPly = elapsedMs / telemetry.totalMovesProcessed.value
    
    let remainingPlies = 0
    for (let i = nextQueueIndex; i < queue.length; i++) {
      remainingPlies += queue[i].movesCount
    }
    
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

  function startBulkAnalysis(forceRestart = false) {
    if (isBulkAnalyzing.value) return
    
    const totalCount = games.value.length
    const alreadyAnalyzedCount = games.value.filter(g => g.evals && g.evals.length > 0).length
    const isCompleted = totalCount > 0 && (alreadyAnalyzedCount / totalCount) >= 0.95

    if (forceRestart || isCompleted) {
      logger.info(`[Intel Hub] ${isCompleted ? 'Auto-Restarting' : 'Force Restarting'} synthesis for ${totalCount} games.`)
      games.value = games.value.map(g => ({
        ...g,
        evals: [],
        isSynthesized: false,
        analysisCache: {} 
      }))
    }

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

    pool.forEach(inst => {
      inst.engine.initWorker(createMessageHandler(inst))
      processNextGame(inst)
    })
  }

  function stopBulkAnalysis() {
    isBulkAnalyzing.value = false
    currentAnalyzingId.value = null
    insights.clearInsights()
    pool.forEach(inst => inst.engine.cleanupWorker())
  }
  
  async function analyzeGame(gameId: string) {
    const game = games.value.find(g => g.id === gameId)
    if (!game) return

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

      const inst = pool[0]
      inst.engine.initWorker(createMessageHandler(inst))
      processNextGame(inst)
    } else {
      uiStore.addToast('Engine Busy: The Intelligence Engine is currently processing another task.', 'warning')
    }
  }

  return {
    isBulkAnalyzing,
    currentAnalyzingId,
    activeGameStats,
    startBulkAnalysis,
    stopBulkAnalysis,
    analyzeGame
  }
}
