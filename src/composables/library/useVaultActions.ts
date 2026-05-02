import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore, type LibraryGame } from '../../stores/libraryStore'

/**
 * Pillar Composable for Vault Actions.
 * Handles navigation to analysis and game deletion logic.
 */
export function useVaultActions() {
  const router = useRouter()
  const libraryStore = useLibraryStore()
  
  const selectedGame = ref<LibraryGame | null>(null)
  const gameToDelete = ref<LibraryGame | null>(null)

  /**
   * Routes the user to the Analysis Lab for the specific game
   */
  function handleAnalyze(game: LibraryGame) {
    router.push(`/analysis?id=${game.id}`)
  }

  /**
   * Sets the game to be deleted, triggering the confirmation modal
   */
  function handleDelete(game: LibraryGame) {
    gameToDelete.value = game
  }

  /**
   * Performs the actual deletion via the library store and clears the selection
   */
  async function confirmDelete() {
    if (gameToDelete.value) {
      await libraryStore.deleteGame(gameToDelete.value.id)
      selectedGame.value = null
      gameToDelete.value = null
    }
  }

  return {
    selectedGame,
    gameToDelete,
    handleAnalyze,
    handleDelete,
    confirmDelete
  }
}
