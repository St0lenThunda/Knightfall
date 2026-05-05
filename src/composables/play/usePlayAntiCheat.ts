import { onMounted, onUnmounted, watch } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { useEngineStore } from '../../stores/engineStore'

/**
 * Pillar Composable: usePlayAntiCheat
 * 
 * Handles monitoring for suspicious behavior, such as window blurring 
 * or engine-like consistency during active gameplay.
 */
export function usePlayAntiCheat() {
  const store = useGameStore()
  const engine = useEngineStore()

  /**
   * Registers a visibility violation, which contributes to the suspicion score.
   * Only fires if a game is currently active and the tab is actually hidden.
   * This avoids false positives when interacting with the browser console.
   */
  function handleVisibilityChange() {
    // SECURITY: Only track blurs if a game is active and NOT in analysis mode.
    // Analysis mode allows tab-switching for study (databases, theory, etc).
    if (document.hidden && store.gameActive && store.mode !== 'analysis' && !engine.isRebooting) {
      store.registerBlur()
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Playwright exposure for automated testing
    if (!!(window as any).Playwright || navigator.userAgent.includes('Playwright')) {
      (window as any).gameStore = store
    }
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  /**
   * Automatically ends the game if the cheater is "busted".
   */
  watch(() => store.isCheaterBusted, (busted) => {
    if (busted && !store.isGameOver) {
      store.resign(store.playerColor)
    }
  })

  return {
    suspicionScore: () => store.suspicionScore,
    isBusted: () => store.isCheaterBusted
  }
}
