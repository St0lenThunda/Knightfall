import { useAnalysisWorker } from './worker'

export interface Evaluation {
  score: number
  isMate: boolean
  bestMove?: string
}

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
