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
      engineStore.analyze(store.fen, 14)
      if (selectedColor === 'b') {
        flipped.value = true
        store.computerMove()
      } else {
        flipped.value = false
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
    const isWhite = store.playerColor === 'w'
    const pName = userStore.profile?.username || 'Guest'
    const oName = selectedMode === 'vs-computer' ? store.activeBot.name : 'Player 2'
    
    const headers: Record<string, string> = {
      'Event': selectedMode === 'vs-computer' ? `Match vs ${oName}` : 'Local Match',
      'Site': 'Knightfall',
      'Date': new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      'White': (selectedMode === 'local' || isWhite) ? pName : oName,
      'Black': (selectedMode === 'local' || isWhite) ? oName : pName,
      'Result': store.gameResult || '*',
      'WhiteElo': String((selectedMode === 'local' || isWhite) ? (userStore.profile?.rating || 1200) : store.activeBot.rating),
      'BlackElo': String((selectedMode === 'local' || isWhite) ? store.activeBot.rating : (userStore.profile?.rating || 1200)),
    }
    
    Object.entries(headers).forEach(([k, v]) => store.chess.setHeader(k, v))
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
