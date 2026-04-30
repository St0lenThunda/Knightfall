import { ref, shallowRef, watch, type Ref } from 'vue'
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
  const filteredGames = shallowRef<LibraryGame[]>([])
  const allTags = ref<string[]>(['My Games', 'Bot Match', 'Local'])

  /**
   * Performs the filtering synchronously on the main thread.
   * This is extremely fast for libraries under 100k games.
   */
  function triggerFilter() {
    isFiltering.value = true
    
    // We wrap in a small timeout to ensure the UI can show a loading state if needed
    // though for 2000 games it will be nearly instantaneous.
    const sq = searchQuery.value.toLowerCase()
    const un = (userStore.profile?.username || 'Guest').toLowerCase()
    const fr = filterResult.value
    const st = selectedTag.value
    const fp = filterPerspective.value

    let result = games.value.filter(g => {
      // 1. Search Query
      const matchesSearch = !sq || 
        (g.white?.toLowerCase().includes(sq)) ||
        (g.black?.toLowerCase().includes(sq)) ||
        (g.event?.toLowerCase().includes(sq))
      
      // 2. Result Filter
      const matchesResult = fr === 'all' || g.result.startsWith(fr)
      
      // 3. Tag Filter
      const matchesTag = st === 'all' || (g.tags && g.tags.includes(st))
      
      // 4. Perspective Filter
      let matchesPerspective = true
      if (fp === 'white') {
        matchesPerspective = g.white.toLowerCase() === un || (un === 'guest' && g.white.toLowerCase() === 'knight')
      } else if (fp === 'black') {
        matchesPerspective = g.black.toLowerCase() === un || (un === 'guest' && g.black.toLowerCase() === 'knight')
      }

      return matchesSearch && matchesResult && matchesTag && matchesPerspective
    })

    // 5. Sorting
    result.sort((a, b) => {
      let valA: any, valB: any
      switch(sortBy.value) {
        case 'date': valA = a.date; valB = b.date; break
        case 'movesCount': valA = a.movesCount; valB = b.movesCount; break
        case 'player': valA = a.white; valB = b.white; break
        case 'opening': valA = a.eco; valB = b.eco; break
        default: valA = a.addedAt; valB = b.addedAt
      }
      
      if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
      return 0
    })

    filteredGames.value = result
    isFiltering.value = false
  }

  /**
   * Scans the current game list for unique tags.
   */
  function updateTagCloud() {
    const tagsSet = new Set<string>(['My Games', 'Bot Match', 'Local'])
    games.value.forEach(g => {
      if (g.tags) {
        g.tags.forEach(t => tagsSet.add(t))
      }
    })
    allTags.value = Array.from(tagsSet).sort()
  }

  // Watch for list changes to update tags (debounced)
  let tagDebounce: any = null
  watch(() => games.value, () => {
    if (tagDebounce) clearTimeout(tagDebounce)
    tagDebounce = setTimeout(updateTagCloud, 1000)
    triggerFilter()
  }, { immediate: true, deep: false })

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
