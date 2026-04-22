import { ref, computed, watch, type Ref } from 'vue'
import type { LibraryGame, OpeningNode } from '../libraryStore'
import { buildOpeningTree } from '../../utils/constellationUtils'
import { logger } from '../../utils/logger'

/**
 * Composable for generating the recursive opening tree (Constellation).
 * Suspendable based on the current view to save resources.
 */
export function useLibraryConstellation(
  filteredGames: Ref<LibraryGame[]>,
  isFiltering: Ref<boolean>,
  importProgress: Ref<number>,
  searchQuery: Ref<string>,
  filterResult: Ref<string>,
  selectedTag: Ref<string>,
  filterPerspective: Ref<'all' | 'white' | 'black'>
) {
  const isGeneratingTree = ref(false)
  const openingTree = ref<OpeningNode | null>(null)
  const isConstellationActive = ref(false)
  const constellationFingerprint = ref('')

  const isConstellationStale = computed(() => {
    const current = `${filteredGames.value.length}-${searchQuery.value}-${filterResult.value}-${selectedTag.value}-${filterPerspective.value}`
    return constellationFingerprint.value !== current
  })

  /**
   * Transforms the flat game list into a recursive trie asynchronously.
   */
  async function generateOpeningTree() {
    // Suspend during heavy analysis to save CPU for Stockfish
    if (window.location.pathname.includes('/analysis')) {
      logger.info('[Constellation] Suspended (Analysis Lab active)')
      return
    }
    
    const currentGames = filteredGames.value
    const fingerprint = `${currentGames.length}-${searchQuery.value}-${filterResult.value}-${selectedTag.value}-${filterPerspective.value}`
    
    if (isGeneratingTree.value) return 
    
    isGeneratingTree.value = true
    try {
      const tree = await buildOpeningTree(currentGames, (p) => {
        importProgress.value = Math.round(p * 100)
      })
      openingTree.value = tree
      constellationFingerprint.value = fingerprint
    } finally {
      isGeneratingTree.value = false
    }
  }

  /**
   * Helper for UI to trigger a seamless perspective change and map update.
   */
  function changePerspectiveAndMap(persp: 'all' | 'white' | 'black') {
    filterPerspective.value = persp
    
    const unwatch = watch(isFiltering, (filtering) => {
      if (!filtering) {
        unwatch()
        generateOpeningTree()
      }
    })
  }

  return {
    isGeneratingTree,
    openingTree,
    isConstellationActive,
    isConstellationStale,
    generateOpeningTree,
    changePerspectiveAndMap
  }
}
