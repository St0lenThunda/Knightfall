import { ref, shallowRef, computed } from 'vue'
import { defineStore } from 'pinia'
import { Chess } from 'chess.js'
import { useUserStore } from './userStore'
import { useLibrarySync } from './library/useLibrarySync'
import { useLibraryFilter } from './library/useLibraryFilter'
import { useLibraryStats } from './library/useLibraryStats'
import { useLibraryConstellation } from './library/useLibraryConstellation'
import { useLibraryAnalysis } from './library/analysis'
import { useLibraryImport } from './library/useLibraryImport'
import { useLibraryIdb } from './library/useLibraryIdb'
import { logger } from '../utils/logger'

import { type LibraryGame, type ConstellationLayout, type OpeningNode } from './library/types'
export type { LibraryGame, ConstellationLayout, OpeningNode }

/**
 * useLibraryStore: The central orchestrator for Knightfall's game intelligence vault.
 * 
 * This store manages the lifecycle of game records across three layers:
 * 1. UI Layer: Reactive state for the Vault components.
 * 2. Local Layer (IndexedDB): Persistent storage for high-performance retrieval.
 * 3. Cloud Layer (Supabase): Synchronized backup and cross-device availability.
 * 
 * It decomposes logic into "Pillars" (sub-composables) to maintain modularity and prevent 
 * the 500-line "God Component" anti-pattern.
 */
export const useLibraryStore = defineStore('library', () => {
  const userStore = useUserStore()

  // --- GLOBAL STATE ---
  const games = shallowRef<LibraryGame[]>([])
  const isImporting = ref(false)
  const importProgress = ref(0)
  
  // Integrity Feedback State (For War Room overlays)
  const isProcessingIntegrity = ref(false)
  const integrityProgress = ref(0)
  const integrityMessage = ref('')

  // Constants
  const VAULT_PAGE_SIZE = 500

  // --- PILLAR INITIALIZATION ---
  
  // 1. IDB Layer (Persistence)
  const idb = useLibraryIdb(games, isProcessingIntegrity, integrityProgress, integrityMessage)
  
  // 2. Synchronization Layer (Cloud)
  const cloud = useLibrarySync(
    games, 
    idb.initDb, 
    isProcessingIntegrity, 
    integrityProgress, 
    integrityMessage
  )
  
  // 3. Filtering & Pagination Layer
  // Note: These state variables are defined below or inside the pillar
  const searchQuery = ref('')
  const filterResult = ref('all')
  const selectedTag = ref('all')
  const filterPerspective = ref<'all' | 'white' | 'black'>('all')
  const sortBy = ref('date')
  const sortOrder = ref('desc')
  const vaultOffset = ref(0)

  const filter = useLibraryFilter(
    games, 
    userStore, 
    searchQuery, 
    filterResult, 
    selectedTag, 
    filterPerspective, 
    sortBy, 
    sortOrder
  )
  
  // 4. Analytics & Statistics Layer
  const stats = useLibraryStats(games, userStore)
  
  // 5. Visualization Layer (Opening Tree / Constellation)
  const constellation = useLibraryConstellation(
    filter.filteredGames,
    filter.isFiltering,
    importProgress,
    searchQuery,
    filterResult,
    selectedTag,
    filterPerspective
  )
  
  // 6. Intelligence Layer (Engine Analysis)
  const intel = useLibraryAnalysis(games, idb.persistGameUpdate)
  
  // 7. Import Layer (PGN/Lichess/Zips)
  const importer = useLibraryImport(games, isImporting, importProgress, idb.initDb)

  // --- COMPUTEDS ---
  
  /**
   * Fast lookup map for UI operations.
   */
  const gamesMap = computed(() => new Map(games.value.map(g => [g.id, g])))
  
  /**
   * Filtered list of games where the user was one of the players.
   */
  const personalGames = computed(() => games.value.filter(g => g.userSide !== 'none'))
  
  /**
   * Count of games that have undergone full engine synthesis.
   */
  const analyzedGamesCount = computed(() => games.value.filter(g => g.evals && g.evals.length > 0).length)

  const wardenReport = ref<any>(null)

  // --- ACTIONS ---

  /**
   * Loads the library from local storage and triggers initial statistics.
   */
  async function loadGames() {
    games.value = await idb.loadGames()
  }

  /**
   * Placeholder for future infinite scroll implementation.
   */
  async function loadMoreGames() {
    // Current implementation loads everything, but we keep this for API consistency.
    return []
  }

  /**
   * Deletes one or more games from both local IndexedDB and the cloud.
   * Performs operations in parallel where possible.
   * 
   * @param ids - Array of local game IDs to delete
   */
  async function deleteGames(ids: string[]) {
    const cloudIds = ids.map(id => gamesMap.value.get(id)?.cloudId).filter(Boolean) as string[]
    
    // 1. Local Deletion
    await idb.deleteGames(ids)
    
    // 2. Cloud Deletion (Parallel via settling promises)
    if (cloudIds.length > 0) {
      await Promise.allSettled(cloudIds.map(cid => cloud.deleteCloudGame(cid)))
    }
  }

  /**
   * Removes "ghost" games (1 move or less) typically generated during automated testing.
   * Returns the count of purged games.
   */
  async function purgeTestPollution() {
    const ghostIds = games.value
      .filter(g => g.movesCount <= 1)
      .map(g => g.id)

    if (ghostIds.length === 0) return 0

    await deleteGames(ghostIds)
    return ghostIds.length
  }

  /**
   * Recalculates metadata (White/Black names, Elo, ECO, etc.) from raw PGN data.
   * Useful when names or ratings are missing or corrupted in the DB.
   */
  async function repairVaultMetadata() {
    const { safeLoadPgn } = await import('../utils/pgnParser')
    const chess = new Chess()
    
    isProcessingIntegrity.value = true
    integrityProgress.value = 0
    integrityMessage.value = 'Sanitizing metadata...'
    
    const total = games.value.length
    const upgradedGames = []

    for (let i = 0; i < total; i++) {
      const game = games.value[i]
      try {
        safeLoadPgn(chess, game.pgn)
        const headers = chess.header()
        
        const upgraded: LibraryGame = {
          ...game,
          white: headers.White || 'Unknown',
          black: headers.Black || 'Unknown',
          result: headers.Result || '*',
          date: headers.Date || '?',
          whiteElo: headers.WhiteElo || undefined,
          blackElo: headers.BlackElo || undefined,
          eco: headers.ECO || '',
          event: headers.Event || 'Local Game',
          movesCount: chess.history().length,
          userSide: userStore.isMe(headers.White) ? 'white' : (userStore.isMe(headers.Black) ? 'black' : 'none')
        }
        upgradedGames.push(upgraded)
        await idb.persistGameUpdate(upgraded)
      } catch (e) {
        upgradedGames.push(game)
      }

      if (i % 25 === 0) {
        integrityProgress.value = Math.round((i / total) * 100)
        // Yield to browser to keep UI responsive
        await new Promise(r => setTimeout(r, 0))
      }
    }
    
    games.value = upgradedGames
    isProcessingIntegrity.value = false
    integrityProgress.value = 100
  }

  /**
   * Re-checks every game to see if the current user is playing.
   * Necessary if the user changes their display name or link accounts.
   */
  async function repairVaultIdentity() {
    isProcessingIntegrity.value = true
    integrityProgress.value = 0
    integrityMessage.value = 'Re-evaluating identity...'
    
    const total = games.value.length
    const upgradedGames = []

    for (let i = 0; i < total; i++) {
      const game = games.value[i]
      const upgraded: LibraryGame = {
        ...game,
        userSide: userStore.isMe(game.white) ? 'white' : (userStore.isMe(game.black) ? 'black' : 'none')
      }
      upgradedGames.push(upgraded)
      await idb.persistGameUpdate(upgraded)
      
      if (i % 50 === 0) {
        integrityProgress.value = Math.round((i / total) * 100)
        await new Promise(r => setTimeout(r, 0))
      }
    }
    
    games.value = upgradedGames
    isProcessingIntegrity.value = false
    integrityProgress.value = 100
  }

  /**
   * Fetches the Warden Shield health report from the static data directory.
   */
  async function fetchWardenReport() {
    try {
      const response = await fetch(`/data/warden_report.json?t=${Date.now()}`)
      if (response.ok) wardenReport.value = await response.json()
    } catch (e) {
      logger.warn('[Library] Warden report unavailable.')
    }
  }

  // --- EXPOSED INTERFACE ---
  
  return {
    // State
    games, 
    isImporting, 
    importProgress, 
    isProcessingIntegrity, 
    integrityProgress, 
    integrityMessage, 
    wardenReport,
    VAULT_PAGE_SIZE,

    // Computeds
    personalGames, 
    gamesMap, 
    analyzedGamesCount,
    
    // Core Actions
    loadGames, 
    loadMoreGames, 
    fetchWardenReport,
    persistGameUpdate: idb.persistGameUpdate, 
    
    // Intelligence (Intel Pillar)
    isBulkAnalyzing: intel.isBulkAnalyzing,
    analysisProgress: intel.analysisProgress,
    liveAnalyzedCount: intel.liveAnalyzedCount,
    totalMovesProcessed: intel.totalMovesProcessed,
    estimatedTimeRemaining: intel.estimatedTimeRemaining,
    engineNodesPerSecond: intel.engineNodesPerSecond,
    inaccuraciesFound: intel.inaccuraciesFound,
    blundersFound: intel.blundersFound,
    mistakesFound: intel.mistakesFound,
    brilliantMovesFound: intel.brilliantMovesFound,
    startBulkAnalysis: intel.startBulkAnalysis,
    stopBulkAnalysis: intel.stopBulkAnalysis,
    updateGameAnalysis: intel.updateGameAnalysis,
    currentAnalyzingId: intel.currentAnalyzingId,

    // Visualization (Constellation Pillar)
    isGeneratingTree: constellation.isGeneratingTree,
    openingTree: constellation.openingTree,
    constellationLayout: constellation.constellationLayout,
    isConstellationActive: constellation.isConstellationActive,
    generateOpeningTree: constellation.generateOpeningTree,
    changePerspectiveAndMap: constellation.changePerspectiveAndMap,
    isConstellationStale: constellation.isConstellationStale,

    // Statistics (Stats Pillar)
    libraryWldStats: stats.libraryWldStats,
    libraryWinRate: stats.libraryWinRate,
    performanceRating: stats.performanceRating,
    performanceHistory: stats.performanceHistory,
    activityHeatmap: stats.activityHeatmap,
    globalAccuracy: stats.globalAccuracy,
    avgOpponentElo: stats.avgOpponentElo,
    openingStats: stats.openingStats,
    vaultOpeningStats: stats.vaultOpeningStats,
    sourceBreakdown: stats.sourceBreakdown,
    ecoStats: stats.openingStats,

    // Deletion & Maintenance
    deleteGame: async (id: string) => {
      const cloudId = gamesMap.value.get(id)?.cloudId
      await idb.deleteGame(id)
      if (cloudId) await cloud.deleteCloudGame(cloudId)
    },
    deleteGames,
    resetLibrary: idb.resetLibrary,
    nukeVault: async (wipeCloud = false) => {
      await idb.resetLibrary()
      if (wipeCloud) await cloud.purgeCloudLibrary()
    },
    repairVaultMetadata, 
    repairVaultIdentity, 
    purgeTestPollution, 
    purgeDuplicates: idb.purgeDuplicates, 
    deduplicate: idb.purgeDuplicates,

    // Import (Importer Pillar)
    importPgn: importer.importPgn,
    importPgnText: importer.importPgn,
    importPgnZip: importer.importPgnZip,
    importFromUrl: importer.importFromUrl,
    importFromLichess: importer.importFromLichess,
    saveGameToLibrary: importer.saveGameToLibrary,

    // Cloud (Sync Pillar)
    syncCloudGames: cloud.syncCloudGames,
    purgeCloudLibrary: cloud.purgeCloudLibrary,
    pushLocalGamesToCloud: cloud.pushLocalGamesToCloud,
    deleteCloudGame: cloud.deleteCloudGame,
    pushGameAnalysis: cloud.pushGameAnalysis,
    analyzeLibraryWithCloud: cloud.analyzeLibraryWithCloud,

    // Filtering (Filter Pillar)
    filteredGames: filter.filteredGames,
    isFiltering: filter.isFiltering,
    searchQuery,
    filterResult,
    selectedTag,
    filterPerspective,
    sortBy,
    sortOrder,
    totalVaultGames: computed(() => games.value.length), // Placeholder until pagination is fully implemented
    vaultOffset,
    allTags: filter.allTags,
    setFilter: (tag: string) => { selectedTag.value = tag },
    hasMoreGames: computed(() => false), // Placeholder

    // Raw Pillar Access (for advanced debugging)
    idb, stats, filter, cloud, constellation, intel
  }
})
