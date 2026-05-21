import { LichessCurator } from '../../../services/curatorService'
import type { EngineInstance } from './types'

export async function applyEvaluationDNA(
  inst: EngineInstance,
  score: number,
  isMate: boolean,
  bestMove: string,
  telemetry: any,
  insights: any,
  currentAnalyzingId: string,
  activeGameStats: any
) {
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

  const isCurrentlyViewed = inst.gameId === currentAnalyzingId

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
