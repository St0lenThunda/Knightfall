import { ref, shallowRef, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from './userStore'
import { useLibrarySync } from './library/useLibrarySync'
import { useLibraryFilter } from './library/useLibraryFilter'
import { useLibraryStats } from './library/useLibraryStats'
import { useLibraryConstellation } from './library/useLibraryConstellation'
import { useLibraryAnalysis } from './library/analysis'
import { useLibraryImport } from './library/useLibraryImport'
import { useLibraryIdb } from './library/useLibraryIdb'
import { useLibraryIntegrity } from './library/useLibraryIntegrity'
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
  
  // Shared Integrity State (Passed to IDB and Sync pillars)
  const isProcessingIntegrity = ref(false)
  const integrityProgress = ref(0)
  const integrityMessage = ref('')

  // Constants
  const VAULT_PAGE_SIZE = 500

  // --- CORE ACTIONS ---

  /**
   * Loads the library using a Hybrid Intelligence Strategy:
   * 1. Always fetches ALL personal games to ensure 'My Games' list and stats are 100% accurate.
   * 2. Lazy loads 'All Games' via paging if the vault is massive (> 2000).
   * 3. Runs an automatic sanitization pass to purge test pollution (ghost games).
   * 
   * SECURITY: If not logged in, strictly only loads Curated games.
   */
  async function loadGames() {
    // A. Clean up any leftover test pollution (Both Local & Cloud)
    if (integrity) await integrity.autoSanitize()
    
    const isLoggedIn = !!userStore.session
    totalVaultGames.value = await idb.getGameCount()
    
    // B. Fetch all personal games (essential for exhaustive DNA profiling)
    // PROTECTED: Guests skip this entirely
    const personal = isLoggedIn ? await idb.loadPersonalGames() : []
    
    // C. Fetch the 'All Games' view (respecting performance limits)
    if (totalVaultGames.value < 2000) {
      let all = await idb.loadGames()
      
      // Deduplicate against personal set
      const uniqueMap = new Map()
      all.forEach(g => uniqueMap.set(g.id, g))
      personal.forEach(g => uniqueMap.set(g.id, g))
      games.value = Array.from(uniqueMap.values())
      vaultOffset.value = games.value.length
    } else {
      // Lazy load the first chunk for the 'All' view
      let pagedChunk = await idb.loadGamesPaged(VAULT_PAGE_SIZE, 0)

      const uniqueMap = new Map()
      pagedChunk.forEach(g => uniqueMap.set(g.id, g))
      personal.forEach(g => uniqueMap.set(g.id, g))
      games.value = Array.from(uniqueMap.values())
      vaultOffset.value = VAULT_PAGE_SIZE
    }
    
    logger.info(`[Library] Vault loaded. Total: ${totalVaultGames.value}, Displaying: ${games.value.length}`)

    // D. Auto-Sync Cloud Updates (Silent background task)
    // This ensures we have the latest games without manual intervention
    if (isLoggedIn) {
      // We don't await this to keep the UI responsive, let it run in the background
      cloud.syncCloudGames()
    }
  }

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
  const searchQuery = ref('')
  const filterResult = ref('all')
  const selectedTag = ref('all')
  const filterPerspective = ref<'all' | 'white' | 'black'>('all')
  const sortBy = ref('date')
  const sortOrder = ref('desc')
  const vaultOffset = ref(0)
  const totalVaultGames = ref(0)

  /**
   * Watcher on the main games collection to keep totalVaultGames synchronized.
   * Whenever games are imported, deleted, or repaired, this automatically queries
   * IndexedDB for the up-to-date count and updates the store state reactively.
   */
  watch(games, async () => {
    // Retrieve the current count directly from the local IndexedDB instance
    totalVaultGames.value = await idb.getGameCount()
  })

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
  const intel = useLibraryAnalysis(games, async (game: LibraryGame) => {
    // A. Persist to Local Layer (IDB) for instant UI feedback
    await idb.persistGameUpdate(game)
    
    // B. Push to Cloud Layer (Supabase) immediately if logged in
    // This ensures "Synthesis" results are backed up right away
    if (userStore.session && game.cloudId) {
      await cloud.pushGameAnalysis(game)
    }
  })
  
  // 7. Import Layer (PGN/Lichess/Zips)
  const importer = useLibraryImport(games, isImporting, importProgress, idb.initDb)

  // 8. Integrity & Maintenance Layer
  const integrity = useLibraryIntegrity(
    games, 
    userStore, 
    idb, 
    cloud, 
    loadGames,
    isProcessingIntegrity,
    integrityProgress,
    integrityMessage
  )

  // --- SESSION SENTINEL ---
  // When the user changes, we MUST purge the local IDB to prevent identity bleed.
  watch(() => userStore.session?.user.id, async (newId, oldId) => {
    if (newId !== oldId) {
      logger.info(`[Library] Identity shift detected (${oldId} -> ${newId}). Purging local vault...`)
      // 1. Clear memory immediately to prevent "ghost" stats from being calculated while IDB is wiping
      games.value = []
      
      // 2. Perform nuclear wipe of local storage
      await idb.resetLibrary()
      
      // 3. Reload for the new identity
      await loadGames()
      
      // 4. Update Warden telemetry for new session
      await integrity.fetchWardenReport()
    }
  }, { immediate: false }) // Don't run on first load, App.vue handles bootup

  // --- COMPUTEDS ---
  
  /**
   * Fast lookup map for UI operations.
   */
  const gamesMap = computed(() => new Map(games.value.map(g => [g.id, g])))
  
  /**
   * Filtered list of games where the user was one of the players.
   * PROTECTED: Guests only see an empty list here to prevent DNA leakage.
   */
  const personalGames = computed(() => {
    if (!userStore.session) return []
    return games.value.filter(g => g.userSide !== 'none')
  })
  
  /**
   * Count of games that have undergone full engine synthesis.
   * PROTECTED: Guests only see curated analyzed counts.
   */
  const analyzedGamesCount = computed(() => {
    return games.value.filter(g => {
      const hasEvals = g.evals && g.evals.length > 0
      if (!userStore.session) return hasEvals && g.isCurated
      return hasEvals
    }).length
  })


  // --- ACTIONS ---

  // Maintenance and repair logic moved to useLibraryIntegrity

  /**
   * Fetches the next chunk of games and appends them to the vault.
   */
  async function loadMoreGames() {
    if (games.value.length >= totalVaultGames.value) return []

    let chunk = await idb.loadGamesPaged(VAULT_PAGE_SIZE, vaultOffset.value)
    
    // AUTH GUARD: Anonymous users ONLY see curated content
    if (!userStore.session) {
      chunk = chunk.filter(g => g.isCurated)
    }

    if (chunk.length > 0) {
      games.value = [...games.value, ...chunk]
      vaultOffset.value += chunk.length
    }
    return chunk
  }

  /**
   * Deletes one or more games from both local IndexedDB and the cloud.
   */
  async function deleteGames(ids: string[], sourceList?: LibraryGame[]) {
    const cloudIds: string[] = []
    
    ids.forEach(id => {
      let game = gamesMap.value.get(id)
      if (!game && sourceList) {
        game = sourceList.find(g => g.id === id)
      }
      if (game?.cloudId) {
        cloudIds.push(game.cloudId)
      }
    })
    
    await idb.deleteGames(ids)
    
    if (cloudIds.length > 0) {
      await Promise.allSettled(cloudIds.map(cid => cloud.deleteCloudGame(cid)))
    }
  }

  /**
   * Automatically triggers a background cloud analysis pass for newly imported games.
   * This parses moves, checks opening theory, and harvests blunders for the Shadow Realm.
   */
  async function triggerAutoAnalysis() {
    logger.info('[Library] Import complete. Auto-triggering background cloud analysis pass.')
    // We analyze up to 30 games in the background. A limit of 30 covers typical curated 
    // or custom PGN uploads without overwhelming Lichess API rate limits.
    cloud.analyzeLibraryWithCloud(30)
  }

  /**
   * Imports a raw PGN string and automatically runs a background analysis pass.
   * 
   * @param pgnContent - The raw PGN string containing one or more games
   * @param isCurated - Whether this is a system-curated collection
   * @param extraTags - Additional tags to assign to the imported games
   */
  async function importPgnWithAnalysis(pgnContent: string, isCurated = false, extraTags: string[] = []) {
    await importer.importPgn(pgnContent, isCurated, extraTags)
    triggerAutoAnalysis()
  }

  /**
   * Imports a zipped archive of PGN files and automatically runs a background analysis pass.
   * 
   * @param file - The JSZip-readable zip file or blob containing PGNs
   * @param isCurated - Whether this is a system-curated collection
   * @param tags - Additional tags to assign to the imported games
   */
  async function importPgnZipWithAnalysis(file: File | Blob, isCurated = true, tags: string[] = []) {
    await importer.importPgnZip(file, isCurated, tags)
    triggerAutoAnalysis()
  }

  /**
   * Fetches a PGN or zipped archive from a URL and automatically runs a background analysis pass.
   * 
   * @param url - The remote endpoint to download from
   * @param name - The human-readable collection name
   */
  async function importFromUrlWithAnalysis(url: string, name: string = 'Web Import') {
    await importer.importFromUrl(url, name)
    triggerAutoAnalysis()
  }

  /**
   * Imports recent games for a Lichess player and automatically runs a background analysis pass.
   * 
   * @param username - The Lichess handle to import
   * @param limit - Max number of recent games to retrieve
   */
  async function importFromLichessWithAnalysis(username: string, limit = 20) {
    await importer.importFromLichess(username, limit)
    triggerAutoAnalysis()
  }

  // --- EXPOSED INTERFACE ---
  
  return {
    // State
    games, 
    isImporting, 
    importProgress, 
    isProcessingIntegrity: integrity.isProcessingIntegrity, 
    integrityProgress: integrity.integrityProgress, 
    integrityMessage: integrity.integrityMessage, 
    wardenReport: integrity.wardenReport,
    VAULT_PAGE_SIZE,

    // Computeds
    personalGames, 
    gamesMap, 
    analyzedGamesCount,
    
    // Core Actions
    loadGames, 
    loadMoreGames, 
    getGame: idb.getGame,
    fetchWardenReport: integrity.fetchWardenReport,
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
    analyzeGame: intel.analyzeGame,
    updateGameAnalysis: intel.updateGameAnalysis,
    currentAnalyzingId: intel.currentAnalyzingId,
    activeGameStats: intel.activeGameStats,

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
    repairVaultMetadata: integrity.repairVaultMetadata, 
    repairVaultIdentity: integrity.repairVaultIdentity, 
    purgeTestPollution: integrity.purgeTestPollution, 
    autoSanitize: integrity.autoSanitize,
    purgeDuplicates: idb.purgeDuplicates, 
    deduplicate: idb.purgeDuplicates,
    purgeUnfinishedGames: integrity.purgeUnfinishedGames,

    // Import (Importer Pillar)
    importPgn: importPgnWithAnalysis,
    importPgnText: importPgnWithAnalysis,
    importPgnZip: importPgnZipWithAnalysis,
    importFromUrl: importFromUrlWithAnalysis,
    importFromLichess: importFromLichessWithAnalysis,
    saveGameToLibrary: importer.saveGameToLibrary,

    // Cloud (Sync Pillar)
    syncCloudGames: cloud.syncCloudGames,
    refreshCloudDna: async () => {
      await cloud.syncCloudGames()
      await integrity.autoSanitize()
    },
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
    totalVaultGames,
    vaultOffset,
    allTags: filter.allTags,
    setFilter: (tag: string) => { selectedTag.value = tag },
    hasMoreGames: computed(() => games.value.length < totalVaultGames.value),

    // Raw Pillar Access (for advanced debugging)
    idb, stats, filter, cloud, constellation, intel
  }
})
