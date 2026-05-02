import { ref, watch } from 'vue'
import { useLibraryStore } from '../../stores/libraryStore'
import { Storage, StorageKey } from '../../utils/storage'

/**
 * Pillar Composable: useVaultFilters
 * 
 * Manages the search, filtering, and sorting state for the game library.
 * Syncs view mode and limit with localStorage.
 */
export function useVaultFilters() {
  const libraryStore = useLibraryStore()

  const viewMode = ref<'grid' | 'list'>(Storage.get(StorageKey.VAULT_VIEW_MODE, 'grid'))
  const limit = ref(Storage.get(StorageKey.VAULT_LIMIT, 20))

  watch(viewMode, (mode) => {
    Storage.set(StorageKey.VAULT_VIEW_MODE, mode)
  })

  watch(limit, (newLimit) => {
    Storage.set(StorageKey.VAULT_LIMIT, newLimit)
  })

  /**
   * Toggles the sort direction (ASC/DESC).
   */
  function toggleSortOrder() {
    libraryStore.sortOrder = libraryStore.sortOrder === 'asc' ? 'desc' : 'asc'
  }

  /**
   * Sets the primary sort column. If the column is already active, 
   * toggles the order instead.
   */
  function setSort(column: string) {
    if (libraryStore.sortBy === column) {
      toggleSortOrder()
    } else {
      libraryStore.sortBy = column
      libraryStore.sortOrder = 'desc' // Default to descending for new sorts
    }
  }

  return {
    viewMode,
    limit,
    toggleSortOrder,
    setSort
  }
}
