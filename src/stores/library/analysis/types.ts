import { useAnalysisWorker } from './worker'
import type { MoveEvaluation } from '../types'

export type Evaluation = MoveEvaluation

export interface EngineInstance {
  engine: ReturnType<typeof useAnalysisWorker>
  currentIndex: number
  currentMoveIndex: number
  currentPositions: string[]
  currentMoves: string[]
  currentEvals: Evaluation[]
  currentTotalCpl: number
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
