import { ref, watch, type Ref } from 'vue'
import type { LibraryGame } from '../libraryStore'

/**
 * Composable for library filtering and sorting.
 * Offloads heavy filtering work to a Web Worker to keep the UI responsive.
 */
export function useLibraryFilter(
  games: Ref<LibraryGame[]>,
  userStore: any,
  searchQuery: Ref<string>,
  filterResult: Ref<string>,
  selectedTag: Ref<string>,
  filterPerspective: Ref<'all' | 'white' | 'black'>,
  sortBy: Ref<string>,
  sortOrder: Ref<string>
) {
  const isFiltering = ref(false)
  const filteredGames = ref<LibraryGame[]>([])
  const allTags = ref<string[]>(['My Games'])

  // Worker initialization
  const filterWorker = new Worker(
    new URL('../../workers/libraryFilter.worker.ts', import.meta.url), 
    { type: 'module' }
  )

  filterWorker.onmessage = (e) => {
    filteredGames.value = e.data
    isFiltering.value = false
  }

  /**
   * Triggers the filtering process in the worker.
   */
  function triggerFilter() {
    isFiltering.value = true
    const username = userStore.profile?.username || 'Player'
    
    filterWorker.postMessage({
      type: 'FILTER',
      payload: {
        username,
        searchQuery: searchQuery.value,
        filterResult: filterResult.value,
        selectedTag: selectedTag.value,
        filterPerspective: filterPerspective.value,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value
      }
    })
  }

  /**
   * Scans the current game list for unique tags.
   */
  function updateTagCloud() {
    const tagsSet = new Set<string>(['My Games'])
    games.value.forEach(g => {
      if (g.tags) {
        g.tags.forEach(t => tagsSet.add(t))
      }
    })
    allTags.value = Array.from(tagsSet).sort()
  }

  // Watch for list changes to update tags (debounced)
  let tagDebounce: any = null
  watch(() => games.value.length, () => {
    if (tagDebounce) clearTimeout(tagDebounce)
    tagDebounce = setTimeout(updateTagCloud, 1000)
  }, { immediate: true })

  // Watch for game list changes to sync worker cache
  watch(() => games.value, (newGames) => {
    filterWorker.postMessage({ 
      type: 'SET_GAMES', 
      payload: JSON.parse(JSON.stringify(newGames)) 
    })
    triggerFilter()
  }, { deep: false })

  // Watch for filter parameter changes
  watch([searchQuery, filterResult, selectedTag, filterPerspective, sortBy, sortOrder], () => {
    triggerFilter()
  })

  return {
    isFiltering,
    filteredGames,
    allTags,
    triggerFilter
  }
}
