import { computed, type Ref } from 'vue'
import { useGameStore, type GameMode } from '../../stores/gameStore'
import { useUserStore } from '../../stores/userStore'

/**
 * Pillar Composable: usePlayOpponent
 * 
 * Manages the computation of player and opponent profiles based on the selected mode.
 */
export function usePlayOpponent(selectedMode: Ref<GameMode>) {
  const store = useGameStore()
  const userStore = useUserStore()

  const playerName = computed(() => userStore.profile?.username || 'Guest')
  const playerRating = computed(() => userStore.profile?.rating || 1200)
  const playerAvatar = computed(() => userStore.profile?.username?.charAt(0).toUpperCase() || '?')

  const opponentName = computed(() => 
    selectedMode.value === 'vs-computer' ? store.activeBot.name : 'Player 2'
  )
  const opponentRating = computed(() => 
    selectedMode.value === 'vs-computer' ? store.activeBot.rating : 1500
  )
  const opponentAvatar = computed(() => 
    selectedMode.value === 'vs-computer' ? store.activeBot.avatar : '👤'
  )

  const modeLabel = computed(() => {
    // Note: selectedTc access would need to be passed in if we wanted to include it here,
    // but for now we focus on the identity part of the logic.
    return selectedMode.value === 'vs-computer' ? 'You vs Computer' : 'Local · Pass & Play'
  })

  return {
    playerName,
    playerRating,
    playerAvatar,
    opponentName,
    opponentRating,
    opponentAvatar,
    modeLabel
  }
}
