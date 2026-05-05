import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore, type GameMode, type TimeControl } from '../../stores/gameStore'
import { useEngineStore } from '../../stores/engineStore'
import { useUserStore } from '../../stores/userStore'
import type { Color } from 'chess.js'

/**
 * Pillar Composable: usePlayOrchestration
 * 
 * Manages the high-level game lifecycle, including starting, resigning, 
 * and transitioning to analysis.
 */
export function usePlayOrchestration(
  showSetup: Ref<boolean>,
  flipped: Ref<boolean>
) {
  const store = useGameStore()
  const engineStore = useEngineStore()
  const userStore = useUserStore()
  const router = useRouter()
  const isReviewing = ref(false)

  /**
   * Resets the UI and state for a fresh setup.
   */
  function triggerNewGame(selectedMode: GameMode, selectedColor: Color, selectedTc: TimeControl) {
    store.newGame(selectedMode, selectedColor, selectedTc)
    showSetup.value = true
  }

  /**
   * Starts the actual match.
   */
  function startGame(selectedMode: GameMode, selectedColor: Color, selectedTc: TimeControl) {
    store.newGame(selectedMode, selectedColor, selectedTc)
    store.gameStarted = true
    showSetup.value = false
    store.startClock()
    
    if (selectedMode === 'vs-computer') {
      if (selectedColor === 'b') {
        flipped.value = true
        store.computerMove()
      } else {
        flipped.value = false
        engineStore.analyze(store.fen, 14)
      }
    } else {
      flipped.value = false
    }
  }

  /**
   * Ends the current match via resignation.
   */
  function resign() {
    store.resign(flipped.value ? 'b' : 'w')
    store.stopClock()
  }

  /**
   * populates PGN headers and navigates to the Analysis view.
   */
  async function reviewGame(selectedMode: GameMode) {
    isReviewing.value = true
    // A. Hard Save to Library (Essential for Vault visibility)
    // This now internally handles header injection and standard result formatting.
    try {
      await store.saveGame()
    } catch (saveErr) {
      logger.error('[Orchestration] Failed to save game before review', saveErr)
    }

    // C. Transition to Analysis
    store.mode = 'analysis'
    store.viewIndex = -1
    router.push('/analysis')
  }

  return {
    isReviewing,
    triggerNewGame,
    startGame,
    resign,
    reviewGame
  }
}
