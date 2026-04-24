import { ref } from 'vue'

/**
 * Analysis Telemetry Module
 * Manages stats and progress tracking.
 */
export function useAnalysisTelemetry() {
  const totalMovesProcessed = ref(0)
  const brilliantMovesFound = ref(0)
  const blundersFound = ref(0)
  const mistakesFound = ref(0)
  const inaccuraciesFound = ref(0)
  const engineNodesPerSecond = ref(0)
  const estimatedTimeRemaining = ref<string | null>(null)
  const analysisProgress = ref(0)
  const failedGames = ref<{ id: string, reason: string }[]>([])

  /**
   * Resets session-specific telemetry
   */
  function resetTelemetry() {
    totalMovesProcessed.value = 0
    brilliantMovesFound.value = 0
    blundersFound.value = 0
    mistakesFound.value = 0
    inaccuraciesFound.value = 0
    engineNodesPerSecond.value = 0
    estimatedTimeRemaining.value = 'Calculating...'
    analysisProgress.value = 0
    failedGames.value = []
  }

  return {
    totalMovesProcessed,
    brilliantMovesFound,
    blundersFound,
    mistakesFound,
    inaccuraciesFound,
    engineNodesPerSecond,
    estimatedTimeRemaining,
    analysisProgress,
    failedGames,
    resetTelemetry
  }
}
