import { ref } from 'vue'
import { useLibraryStore } from '../../stores/libraryStore'

/**
 * Pillar Composable: useProfileActions
 * 
 * Orchestrates high-level administrative actions within the Profile view,
 * such as vault maintenance and synchronization state.
 */
export function useProfileActions() {
  const libraryStore = useLibraryStore()
  
  const isWiping = ref(false)
  const isInitialSync = ref(true)
  const showWipeConfirm = ref(false)
  const showLabModal = ref(false)
  const showBadgeModal = ref(false)

  /**
   * Resets the entire library, optionally purging cloud backups.
   * This is a "Nuclear" action that requires confirmation.
   * 
   * @param wipeCloud - Whether to also delete the user's data from Supabase
   */
  async function handleNuclearReset(wipeCloud: boolean) {
    isWiping.value = true
    try {
      await libraryStore.nukeVault(wipeCloud)
      showWipeConfirm.value = false
    } finally {
      isWiping.value = false
    }
  }

  /**
   * Completes the initial data handshake.
   */
  function finishInitialSync() {
    isInitialSync.value = false
  }

  return {
    isWiping,
    isInitialSync,
    showWipeConfirm,
    showLabModal,
    showBadgeModal,
    handleNuclearReset,
    finishInitialSync
  }
}
