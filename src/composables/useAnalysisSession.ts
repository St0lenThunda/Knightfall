import { ref, watch, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useGameStore } from '../stores/gameStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useEngineStore } from '../stores/engineStore'
import { useUiStore } from '../stores/uiStore'
import { useSettingsStore } from '../stores/settingsStore'
import { getMoveQuality } from '../utils/analysisUtils'
import { Storage, StorageKey } from '../utils/storage'
import { logger } from '../utils/logger'

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
  const isActive = ref(true)
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

    const queryFen = route.query.fen as string
    if (queryId) {
      let targetGame = libraryStore.gamesMap.get(queryId)
      
      // Fallback: If not in memory (due to paging), fetch from IDB
      if (!targetGame) {
        targetGame = await libraryStore.getGame(queryId)
      }

      if (targetGame) {
        store.loadPgn(targetGame.pgn, 'analysis', targetGame.id, { 
          evals: targetGame.evals,
        })
        gameLoaded = true
      }
    } else if (queryFen) {
      store.loadPosition(queryFen, 'analysis')
      gameLoaded = true
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
        store.loadPgn(latest.pgn, 'analysis', latest.id, { evals: latest.evals })
        gameLoaded = true
      }
    }

    // Determine if we should restore the index from a previous session
    const savedIdBefore = Storage.get<string | null>(StorageKey.LAST_ANALYSIS_ID, null)
    const savedIndex = Storage.get<number | null>(StorageKey.LAST_ANALYSIS_VIEW_INDEX, null)

    if (gameLoaded) {
      // Only restore index if we are loading the SAME game as last time
      if (savedIdBefore === store.loadedGameId && savedIndex !== null) {
        store.goToMove(savedIndex)
        logger.info(`[AnalysisSession] Restored index ${savedIndex} for game ${store.loadedGameId}`)
      } else {
        store.goToMove(-1) // Default to end for new games
        logger.info(`[AnalysisSession] New game or no index saved. Jumping to end.`)
      }

      // --- AUTO-SYNTHESIS TRIGGER ---
      // If the game has not been fully analyzed (e.g. fresh live match), trigger background synthesis.
      const targetGame = libraryStore.gamesMap.get(store.loadedGameId || '')
      if (targetGame && !targetGame.isSynthesized) {
        logger.info(`[AnalysisSession] Game ${targetGame.id} is not synthesized. Triggering auto-analysis...`)
        libraryStore.analyzeGame(targetGame.id)
      }
    }
  }

  // --- PERSISTENCE WATCHERS ---
  
  // Bridge the current view index to storage so refreshes don't "rewind" the game
  watch(() => store.viewIndex, (newIdx) => {
    if (store.mode === 'analysis') {
      Storage.set(StorageKey.LAST_ANALYSIS_VIEW_INDEX, newIdx)
    }
  })

  // Sync Analysis Session with URL changes
  watch(() => route.query.id, (newId) => {
    if (newId) {
      logger.info(`[AnalysisSession] ID change detected: ${newId}. Re-initializing...`)
      initializeSession()
    }
  })

  // Live Synthesis: Watch for engine evals and store them in the history
  watch(() => engineStore.evalNumber, (newEval) => {
    if (!isActive.value) return
    if (store.mode === 'analysis') {
      const idx = store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex
      const move = store.moveHistory[idx]
      if (move) {
        move.eval = newEval
      }
    }
  })

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
    isActive.value = false
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
