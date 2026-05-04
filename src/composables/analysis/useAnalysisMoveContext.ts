import { computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { getMoveQuality } from '../../utils/analysisUtils'

/**
 * Pillar Composable: useAnalysisMoveContext
 * 
 * Provides reactive metadata about the currently viewed move in 
 * the analysis session, such as quality and SAN labels.
 */
export function useAnalysisMoveContext() {
  const store = useGameStore()

  /**
   * Returns the move object currently displayed on the board.
   */
  const currentViewedMove = computed(() => {
    const idx = store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex
    return store.moveHistory[idx] || null
  })

  /**
   * Calculates the move quality (Blunder, Mistake, etc.) for the current move.
   */
  const currentMoveQuality = computed(() => {
    const idx = store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex
    const move = store.moveHistory[idx]
    if (!move) return null
    return getMoveQuality(move, idx, store.moveHistory)
  })

  /**
   * Provides a human-readable label for the selected move (e.g., "1. e4").
   */
  const selectedMoveLabel = computed(() => {
    const idx = store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex
    const m = store.moveHistory[idx]
    if (!m) return 'Start Position'
    return `${m.moveNumber}${m.color === 'w' ? '.' : '...'} ${m.san}`
  })

  return {
    currentViewedMove,
    currentMoveQuality,
    selectedMoveLabel
  }
}
