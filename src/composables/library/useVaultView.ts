import { ref, watch } from 'vue'
import { Storage, StorageKey } from '../../utils/storage'

/**
 * Pillar Composable for Vault View State.
 * Manages the toggle between 'grid' and 'list' modes with persistence.
 */
export function useVaultView() {
  const viewMode = ref<'grid' | 'list'>(Storage.get(StorageKey.VAULT_VIEW_MODE, 'grid'))

  // Sync view mode with local storage
  watch(viewMode, (mode) => {
    Storage.set(StorageKey.VAULT_VIEW_MODE, mode)
  })

  return {
    viewMode
  }
}
