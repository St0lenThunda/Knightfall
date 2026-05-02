import { onMounted, onUnmounted, watch } from 'vue'
import { useGameStore } from '../../stores/gameStore'

/**
 * Pillar Composable: usePlayAntiCheat
 * 
 * Handles monitoring for suspicious behavior, such as window blurring 
 * or engine-like consistency during active gameplay.
 */
export function usePlayAntiCheat() {
  const store = useGameStore()

  /**
   * Registers a window blur event, which contributes to the suspicion score.
   */
  function handleWindowBlur() {
    store.registerBlur()
  }

  onMounted(() => {
    window.addEventListener('blur', handleWindowBlur)
    
    // Playwright exposure for automated testing
    if (!!(window as any).Playwright || navigator.userAgent.includes('Playwright')) {
      (window as any).gameStore = store
    }
  })

  onUnmounted(() => {
    window.removeEventListener('blur', handleWindowBlur)
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
