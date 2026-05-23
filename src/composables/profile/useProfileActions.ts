import { ref } from 'vue'

/**
 * Pillar Composable: useProfileActions
 * 
 * Orchestrates high-level actions within the Profile view,
 * such as modal visibility and initialization synchronization state.
 */
export function useProfileActions() {
  const isInitialSync = ref(true)
  const showLabModal = ref(false)
  const showBadgeModal = ref(false)

  /**
   * Completes the initial data handshake.
   */
  function finishInitialSync() {
    isInitialSync.value = false
  }

  return {
    isInitialSync,
    showLabModal,
    showBadgeModal,
    finishInitialSync
  }
}
