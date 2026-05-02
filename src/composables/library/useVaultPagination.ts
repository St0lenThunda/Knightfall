import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'
import { useLibraryStore } from '../../stores/libraryStore'

/**
 * Pillar Composable: useVaultPagination
 * 
 * Manages the current page state and calculates visible page ranges
 * for the library's paginated views.
 * 
 * @param limit - Reactive reference to the items-per-page limit
 */
export function useVaultPagination(limit: Ref<number>) {
  const libraryStore = useLibraryStore()
  const currentPage = ref(1)

  // Reset to first page when limit or filters change
  watch([limit, () => libraryStore.searchQuery, () => libraryStore.filterResult, () => libraryStore.selectedTag, () => libraryStore.filterPerspective, () => libraryStore.sortBy, () => libraryStore.sortOrder], () => {
    currentPage.value = 1
  })

  const totalPages = computed(() => Math.ceil(libraryStore.filteredGames.length / limit.value) || 1)

  const displayedGames = computed(() => {
    const start = (currentPage.value - 1) * limit.value
    return libraryStore.filteredGames.slice(start, start + limit.value)
  })

  const visiblePages = computed(() => {
    const range = 2
    const pages: number[] = []
    for (let i = Math.max(1, currentPage.value - range); i <= Math.min(totalPages.value, currentPage.value + range); i++) {
      pages.push(i)
    }
    return pages
  })

  function nextPage() {
    if (currentPage.value < totalPages.value) currentPage.value++
  }

  function prevPage() {
    if (currentPage.value > 1) currentPage.value--
  }

  return {
    currentPage,
    totalPages,
    displayedGames,
    visiblePages,
    nextPage,
    prevPage
  }
}
