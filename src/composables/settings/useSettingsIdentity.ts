import { ref, watch } from 'vue'
import { useUserStore } from '../../stores/userStore'
import { useLibraryStore } from '../../stores/libraryStore'
import { useUiStore } from '../../stores/uiStore'
import { fetchRecentChesscomGames } from '../../api/chesscomApi'
import { fetchRecentLichessGames } from '../../api/lichessApi'

/**
 * Pillar Composable: useSettingsIdentity
 * 
 * Manages the state and operations for the user's Knightfall identity, 
 * including profile updates and external DNA synchronization.
 */
export function useSettingsIdentity() {
  const userStore = useUserStore()
  const libraryStore = useLibraryStore()
  const uiStore = useUiStore()

  const editUsername = ref('')
  const editLocation = ref('')
  const editChessComUser = ref('')
  const editLichessUser = ref('')
  
  const isSaving = ref(false)
  const isSyncing = ref(false)
  const saveError = ref('')
  const saveSuccess = ref(false)

  // Reactively populate form when profile loads
  watch(() => userStore.profile, (p) => {
    if (p) {
      editUsername.value = p.username || ''
      editLocation.value = p.location || ''
      editChessComUser.value = p.chesscom_handle || ''
      editLichessUser.value = p.lichess_handle || ''
    }
  }, { immediate: true })

  /**
   * Persists profile changes to the database via UserStore.
   */
  async function saveIdentity() {
    isSaving.value = true
    saveError.value = ''
    saveSuccess.value = false
    
    try {
      const result = await userStore.updateProfile({
        username: editUsername.value,
        location: editLocation.value,
        chesscom_handle: editChessComUser.value,
        lichess_handle: editLichessUser.value
      })
      
      if (result?.error) {
        saveError.value = result.error.message || 'Failed to save identity.'
      } else {
        saveSuccess.value = true
        setTimeout(() => { saveSuccess.value = false }, 3000)
      }
    } catch (err: any) {
      saveError.value = err.message || 'An unexpected error occurred.'
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Fetches and imports recent games from Chess.com and Lichess.
   */
  async function syncAllIntelligence() {
    isSyncing.value = true
    let chessComCount = 0
    let lichessCount = 0

    try {
      if (editChessComUser.value.trim()) {
        const games = await fetchRecentChesscomGames(editChessComUser.value.trim())
        for (const game of games) {
          const res = await libraryStore.saveGameToLibrary(game.pgn, ['Chess.com'])
          if (res) chessComCount++
        }
      }
      
      if (editLichessUser.value.trim()) {
        const games = await fetchRecentLichessGames(editLichessUser.value.trim())
        for (const game of games) {
          const res = await libraryStore.saveGameToLibrary(game.pgn, ['Lichess'])
          if (res) lichessCount++
        }
      }

      if (chessComCount === 0 && lichessCount === 0) {
        uiStore.addToast('Vault is already up to date. No new games found.', 'info')
      } else {
        const parts = []
        if (chessComCount > 0) parts.push(`${chessComCount} from Chess.com`)
        if (lichessCount > 0) parts.push(`${lichessCount} from Lichess`)
        uiStore.addToast(`DNA Synchronized! Added ${parts.join(' and ')}.`, 'success')
      }
    } catch (e) {
      uiStore.addToast('Failed to synchronize DNA from external sources.', 'error')
    } finally {
      isSyncing.value = false
    }
  }

  return {
    editUsername,
    editLocation,
    editChessComUser,
    editLichessUser,
    isSaving,
    isSyncing,
    saveError,
    saveSuccess,
    saveIdentity,
    syncAllIntelligence
  }
}
