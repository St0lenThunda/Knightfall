import { ref, watch, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useGameStore } from '../stores/gameStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useEngineStore } from '../stores/engineStore'
import { useUiStore } from '../stores/uiStore'
import { useSettingsStore } from '../stores/settingsStore'
import { getMoveQuality } from '../utils/analysisUtils'
import { Storage, StorageKey } from '../utils/storage'

/**
 * Orchestrates the Analysis Session life-cycle.
 * 
 * Includes:
 * - Session restoration from localStorage/Library
 * - Automated engine analysis triggers
 * - Automated "Highlight Playback" reel logic
 */
export function useAnalysisSession() {
  const store = useGameStore()
  const libraryStore = useLibraryStore()
  const engineStore = useEngineStore()
  const uiStore = useUiStore()
  const settings = useSettingsStore()
  const route = useRoute()

  const isPlaying = ref(false)
  const pauseReason = ref<any>(null)
  let playTimeout: any = null

  /**
   * Toggles the automated move-by-move playback reel.
   */
  function togglePlayback() {
    if (isPlaying.value) {
      isPlaying.value = false
      if (playTimeout) clearTimeout(playTimeout)
    } else {
      isPlaying.value = true
      pauseReason.value = null
      runHighlightPace()
    }
  }

  /**
   * Internal recursive loop for highlight playback.
   * Dynamically adjusts speed based on move quality.
   */
  function runHighlightPace() {
    if (!isPlaying.value) return

    const currentIdx = store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex
    const nextIdx = currentIdx + 1

    if (nextIdx >= store.moveHistory.length) {
      isPlaying.value = false
      pauseReason.value = null
      uiStore.addToast('End of game reached.', 'info')
      return
    }

    const nextMove = store.moveHistory[nextIdx]
    const quality = getMoveQuality(nextMove, nextIdx, store.moveHistory)
    
    store.goToMove(nextIdx)

    // Oracle Intervention: Pause at critical mistakes
    if (quality.label === 'blunder' || quality.label === 'mistake') {
      isPlaying.value = false
      pauseReason.value = quality
      uiStore.addToast(`Oracle Intervention: Paused at ${quality.label.toUpperCase()}.`, 'warning')
      return
    }

    // Dynamic Tempo
    let delay = 1500
    if (quality.label === 'inaccuracy' || quality.label === 'mistake') delay = 2500

    playTimeout = setTimeout(runHighlightPace, delay)
  }

  /**
   * Handles initial data loading and session restoration.
   */
  async function initializeSession() {
    await nextTick()
    
    if (libraryStore.games.length === 0) {
      await libraryStore.loadGames()
    }

    engineStore.init()
    
    const queryId = route.query.id as string
    let gameLoaded = false

    if (queryId) {
      const targetGame = libraryStore.gamesMap.get(queryId)
      if (targetGame) {
        store.loadPgn(targetGame.pgn, 'analysis', targetGame.id)
        gameLoaded = true
      }
    } 
    
    if (!gameLoaded) {
      const savedPgn = Storage.get<string | null>(StorageKey.LAST_ANALYSIS_PGN, null)
      if (savedPgn) {
        const savedId = Storage.get<string | null>(StorageKey.LAST_ANALYSIS_ID, null)
        store.loadPgn(savedPgn, 'analysis', savedId || undefined)
        gameLoaded = true
      }
    }
    
    if (!gameLoaded && store.moveHistory.length === 0) {
      const games = libraryStore.games
      if (games.length > 0) {
        const latest = games[games.length - 1]
        store.loadPgn(latest.pgn, 'analysis', latest.id)
        gameLoaded = true
      }
    }

    if (gameLoaded && store.viewIndex === -1) {
      store.goToMove(0)
    }
  }

  // Auto-analyze FEN changes
  let analysisDebounce: any = null
  watch(() => store.fen, (newFen) => {
    if (analysisDebounce) clearTimeout(analysisDebounce)
    analysisDebounce = setTimeout(() => {
      engineStore.analyze(newFen, settings.analysisDepth)
    }, 100)
  }, { immediate: true })

  // Cleanup on leave
  onUnmounted(() => {
    engineStore.stop()
    if (playTimeout) clearTimeout(playTimeout)
  })

  return {
    isPlaying,
    pauseReason,
    togglePlayback,
    initializeSession
  }
}
