import { onMounted, onUnmounted, type Ref } from 'vue'
import type { LibraryGame } from '../types'

// Import Sub-Modules
import { useAnalysisTelemetry } from './telemetry'
import { useAnalysisInsights } from './insights'
import { useAnalysisQueue } from './queue'

// Re-export types
export * from './types'

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
  // Module Initialization
  const telemetry = useAnalysisTelemetry()
  const insights = useAnalysisInsights()
  
  const queue = useAnalysisQueue(games, telemetry, insights, persistGameUpdate)

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

  onMounted(() => {
    window.addEventListener('knightfall-insight-complete', handleInsightComplete)
  })

  onUnmounted(() => {
    window.removeEventListener('knightfall-insight-complete', handleInsightComplete)
    queue.stopBulkAnalysis()
  })

  return {
    ...telemetry,
    ...queue,
    updateGameAnalysis,
  }
}
