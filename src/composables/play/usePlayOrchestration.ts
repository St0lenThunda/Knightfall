import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore, type GameMode, type TimeControl } from '../../stores/gameStore'
import { useEngineStore } from '../../stores/engineStore'
import { logger } from '../../utils/logger'
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
    // 1. Initialize the match state
    store.newGame(selectedMode, selectedColor, selectedTc)
    
    // 2. Update UI and global flags
    store.gameStarted = true
    showSetup.value = false
    
    // 3. Start the temporal engine
    store.startClock()
    
    // 4. Handle perspective and background analysis
    if (selectedMode === 'vs-computer') {
      flipped.value = selectedColor === 'b'
      
      // If we are playing as white, we start background analysis for the eval bar
      if (selectedColor === 'w') {
        engineStore.analyze(store.fen, 14)
      }
      // Note: If playing as black, triggerBotMove() was already called by store.newGame -> startMatch
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
  async function reviewGame() {
    isReviewing.value = true
    // A. Hard Save to Library (Essential for Vault visibility)
    // We pass forceSave=true to bypass the "unfinished" check if the user is reviewing early.
    let savedId = null
    try {
      savedId = await store.saveGame(true)
    } catch (saveErr) {
      logger.error('[Orchestration] Failed to save game before review', saveErr)
    }

    // B. Auto-Synthesize
    if (savedId) {
      try {
        const libraryStore = (await import('../../stores/libraryStore')).useLibraryStore()
        libraryStore.analyzeGame(savedId)
      } catch (err) {
        logger.error('[Orchestration] Failed to auto-synthesize game', err)
      }
    }

    // C. Transition to Analysis
    store.mode = 'analysis'
    store.viewIndex = -1
    
    if (savedId) {
      router.push(`/analysis?id=${savedId}`)
    } else {
      router.push('/analysis')
    }
  }

  return {
    isReviewing,
    triggerNewGame,
    startGame,
    resign,
    reviewGame
  }
}
