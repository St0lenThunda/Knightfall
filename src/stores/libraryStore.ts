import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import { Chess } from 'chess.js'
import { logger } from '../utils/logger'
import { Storage, StorageKey } from '../utils/storage'
import { useUserStore } from './userStore'

// Import Sub-Composables
import { useLibraryIdb } from './library/useLibraryIdb'
import { useLibraryImport } from './library/useLibraryImport'
import { useLibraryStats } from './library/useLibraryStats'
import { useLibraryFilter } from './library/useLibraryFilter'
import { useLibrarySync } from './library/useLibrarySync'
import { useLibraryConstellation } from './library/useLibraryConstellation'
import { useLibraryAnalysis } from './library/analysis/index'

// Import Types
export type { LibraryGame } from './library/types'
import type { LibraryGame } from './library/types'

/**
 * Knightfall Library Store: The central orchestrator for game management.
 * 
 * DESIGN PATTERN: Orchestrator-Composable
 * This store delegates complex logic to specialized sub-composables (IDB, Import, Stats, Filter, etc.)
 * while maintaining the public API for the rest of the application.
 */
export const useLibraryStore = defineStore('library', () => {
  // --- CORE STATE ---
  // We use shallowRef for the game lists to prevent Vue from deeply tracking 
  // every property of 100k+ games, which would cause significant lag.
  const games = shallowRef<LibraryGame[]>([])
  const isImporting = ref(false)
  const importProgress = ref(0)
  
  const isProcessingIntegrity = ref(false)
  const integrityProgress = ref(0)
  const integrityMessage = ref('')
  
  const totalVaultGames = ref(0)
  const vaultOffset = ref(0)
  const VAULT_PAGE_SIZE = 500
  
  // Pinia Store Hoisting
  const userStore = useUserStore()
  
  // FILTER STATE (Centralized)
  const searchQuery = ref('')
  const filterResult = ref('all')
  const selectedTag = ref('all')
  const filterPerspective = ref<'all' | 'white' | 'black'>('all')
  const sortBy = ref(Storage.get(StorageKey.VAULT_SORT_BY, 'addedAt'))
  const sortOrder = ref(Storage.get(StorageKey.VAULT_SORT_ORDER, 'desc'))

  // --- PERSONAL DATA FILTERING ---
  /** 
   * Games where the user is an active participant. 
   * This excludes curated master collections for the 'Weakness DNA' analysis.
   */
  const personalGames = computed(() => {
    return games.value.filter(g => {
      // 1. Identity Check (PRIMARY): If the user is a participant, it's 'My DNA'
      // even if it's part of a curated collection.
      const isMeWhite = userStore.isMe(g.white)
      const isMeBlack = userStore.isMe(g.black)
      if (isMeWhite || isMeBlack) return true

      // 2. Verified Personal DNA (Tag-based)
      // If it's tagged 'My Games', we trust it's a personal game.
      const lowerTags = (g.tags || []).map(t => t.toLowerCase())
      if (lowerTags.includes('my games')) return true

      // 3. Native Fallback
      const isNative = g.event === 'Knightfall Match' || lowerTags.includes('knightfall')
      if (isNative) return true

      return false
    })
  })

  // --- SUB-COMPOSABLES (Decomposition) ---
  const idb = useLibraryIdb(
    games,
    isProcessingIntegrity,
    integrityProgress,
    integrityMessage
  )
  const importer = useLibraryImport(
    games, 
    isImporting, 
    importProgress, 
    idb.initDb
  )
  
  const stats = useLibraryStats(personalGames, userStore)
  
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
  
  const cloud = useLibrarySync(
    games, 
    idb.initDb,
    isProcessingIntegrity,
    integrityProgress,
    integrityMessage
  )
  
  const constellation = useLibraryConstellation(
    computed(() => {
      // If we are in the default 'all' view with no search, 
      // focus the constellation on 'Personal DNA' (Your games).
      // If a specific tag or search is active, show the filtered result.
      if (selectedTag.value === 'all' && !searchQuery.value) {
        return personalGames.value
      }
      return filter.filteredGames.value
    }),
    filter.isFiltering,
    importProgress,
    searchQuery,
    filterResult,
    selectedTag,
    filterPerspective
  )
  
  const intel = useLibraryAnalysis(games, async (game: LibraryGame) => {
    await idb.persistGameUpdate(game)
    await cloud.pushGameAnalysis(game)
  })

  /**
   * Initializes the library by loading the first chunk of games.
   * Priority 1: Load all personal games (for live stats).
   * Priority 2: Lazy load the rest of the vault in chunks.
   */
  async function loadGames() {
    totalVaultGames.value = await idb.getGameCount()
    
    // 1. Gather all identities for priority fetch
    const identities = [
      userStore.profile?.username,
      userStore.profile?.lichess_handle,
      userStore.profile?.chesscom_handle
    ].filter(Boolean) as string[]
    
    // 2. Load all personal games immediately to ensure stats are live
    const personal = await idb.loadGamesByUser(identities)
    games.value = personal
    
    logger.info(`[Library] Priority load complete. ${personal.length} personal games loaded for stats.`)

    // 3. If vault is manageable (< 2000), load everything for best UX
    if (totalVaultGames.value < 2000) {
      await idb.loadGames() // This will update games.value with everything
      vaultOffset.value = totalVaultGames.value
    } else {
      // Otherwise, load first chunk of the entire vault
      // We'll deduplicate using the gamesMap/unique IDs
      const chunk = await idb.loadGamesPaged(VAULT_PAGE_SIZE, 0, sortBy.value, sortOrder.value as 'asc' | 'desc')
      
      // Merge unique entries only
      const existingIds = new Set(games.value.map(g => g.id))
      const uniqueChunk = chunk.filter(g => !existingIds.has(g.id))
      
      games.value = [...games.value, ...uniqueChunk]
      vaultOffset.value = VAULT_PAGE_SIZE
      logger.info(`[Library] Lazy loading active. ${games.value.length} total games in memory.`)
    }
  }

  /**
   * Loads the next chunk of games into memory.
   */
  async function loadMoreGames() {
    if (vaultOffset.value >= totalVaultGames.value) return
    
    isImporting.value = true // Reuse loading state
    const nextChunk = await idb.loadGamesPaged(VAULT_PAGE_SIZE, vaultOffset.value, sortBy.value, sortOrder.value as 'asc' | 'desc')
    
    // Deduplicate
    const existingIds = new Set(games.value.map(g => g.id))
    const uniqueChunk = nextChunk.filter(g => !existingIds.has(g.id))

    games.value = [...games.value, ...uniqueChunk]
    vaultOffset.value += VAULT_PAGE_SIZE
    isImporting.value = false
  }

  const gamesMap = computed(() => {
    const map = new Map<string, LibraryGame>()
    for (const g of games.value) {
      map.set(g.id, g)
    }
    return map
  })

  // --- ORCHESTRATION METHODS ---

  /**
   * Triggers a metadata repair by re-parsing all PGNs in the vault.
   * Useful when upgrading the application with new telemetry fields.
   */
  async function repairVaultMetadata() {
    const { safeLoadPgn } = await import('../utils/pgnParser')
    const chess = new Chess()
    
    isProcessingIntegrity.value = true
    integrityProgress.value = 0
    integrityMessage.value = 'Sanitizing metadata...'
    
    // Yield to let Vue paint the overlay immediately
    await new Promise(r => setTimeout(r, 50))
    
    const total = games.value.length
    const upgradedGames = []
    
    for (let i = 0; i < total; i++) {
      const game = games.value[i]
      safeLoadPgn(chess, game.pgn)
      const headers = chess.header()
      
      const lowerEvent = (headers.Event || '').toLowerCase()
      const lowerPgn = game.pgn.toLowerCase()
      const isChessCom = lowerPgn.includes('chess.com') || lowerEvent.includes('live chess')
      const isLichess = lowerPgn.includes('lichess.org') || lowerPgn.includes('lichess')
      const isNative = lowerEvent === 'play vs coach' || lowerEvent === 'knightfall match'
      const isMe = userStore.isMe(headers.White) || userStore.isMe(headers.Black)
      
      const newTags = (game.tags || []).filter(t => {
        const lt = t.toLowerCase()
        return lt !== 'my games' && lt !== 'chess.com' && lt !== 'lichess' && lt !== 'chesscom' && lt !== 'live chess'
      })
      
      if (isMe || isNative) newTags.push('My Games')
      if (isChessCom) newTags.push('Chess.com')
      if (isLichess) newTags.push('Lichess')

      const upgraded = {
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
        tags: [...new Set(newTags)],
        userSide: userStore.isMe(headers.White) ? 'white' as const : (userStore.isMe(headers.Black) ? 'black' as const : 'none' as const)
      }
      
      upgradedGames.push(upgraded)
      await idb.persistGameUpdate(upgraded)
      
      // Update progress and yield to UI every 25 games
      if (i % 25 === 0) {
        integrityProgress.value = Math.round((i / total) * 100)
        await new Promise(r => setTimeout(r, 0))
      }
    }

    games.value = upgradedGames
    
    isProcessingIntegrity.value = false
    integrityProgress.value = 100
    logger.info('[Library] Vault metadata repair complete.')
  }

  /**
   * Re-evaluates identity for every game in the vault.
   * Ensures 'My Games' tag is only present if the user actually participated.
   */
  async function repairVaultIdentity() {
    isProcessingIntegrity.value = true
    integrityProgress.value = 0
    integrityMessage.value = 'Re-evaluating identity...'
    
    // Yield to let Vue paint the overlay immediately
    await new Promise(r => setTimeout(r, 50))
    
    const total = games.value.length
    const upgradedGames = []
    
    for (let i = 0; i < total; i++) {
      const game = games.value[i]
      const isMe = userStore.isMe(game.white) || userStore.isMe(game.black)
      const lowerEvent = (game.event || '').toLowerCase()
      const isNative = lowerEvent === 'play vs coach' || lowerEvent === 'knightfall match'
      
      const newTags = (game.tags || []).filter(t => {
        const lt = t.toLowerCase()
        return lt !== 'my games' && lt !== 'chess.com' && lt !== 'lichess' && lt !== 'chesscom' && lt !== 'live chess'
      })
      
      const lowerPgn = (game.pgn || '').toLowerCase()
      const isChessCom = lowerPgn.includes('chess.com') || lowerEvent.includes('live chess')
      const isLichess = lowerPgn.includes('lichess.org') || lowerPgn.includes('lichess')
      
      if (isMe || isNative) {
        newTags.push('My Games')
      }
      if (isChessCom) {
        newTags.push('Chess.com')
      }
      if (isLichess) {
        newTags.push('Lichess')
      }
      
      const upgraded = {
        ...game,
        tags: [...new Set(newTags)],
        userSide: userStore.isMe(game.white) ? 'white' as const : (userStore.isMe(game.black) ? 'black' as const : 'none' as const)
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
    logger.info('[Library] Identity repair complete.')
  }

  /**
   * Persists a game update to the local database.
   */
  async function persistGameUpdate(game: LibraryGame) {
    await idb.persistGameUpdate(game)
  }

  return {
    // State
    games,
    isImporting,
    importProgress,
    isProcessingIntegrity,
    integrityProgress,
    integrityMessage,
    
    personalGames,
    gamesMap,
    analyzedGamesCount: computed(() => games.value.filter(g => g.evals && g.evals.length > 0).length),
    
    // Core Reactive State (Hoisted for UI)
    
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
    isGeneratingTree: constellation.isGeneratingTree,
    openingTree: constellation.openingTree,
    constellationLayout: constellation.constellationLayout,
    isConstellationActive: constellation.isConstellationActive,

    // Hoisted Stats
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
    
    // Actions
    loadGames,
    loadMoreGames,
    persistGameUpdate,
    resetLibrary: idb.resetLibrary,
    deleteGame: idb.deleteGame,
    
    importPgn: importer.importPgn,
    importPgnText: importer.importPgn, // Alias for UI compatibility
    importPgnZip: importer.importPgnZip,
    importFromLichess: importer.importFromLichess,
    saveGameToLibrary: importer.saveGameToLibrary,
    
    syncCloudGames: cloud.syncCloudGames,
    purgeCloudLibrary: cloud.purgeCloudLibrary,
    pushLocalGamesToCloud: cloud.pushLocalGamesToCloud,
    deleteCloudGame: cloud.deleteCloudGame,
    pushGameAnalysis: cloud.pushGameAnalysis,
    analyzeLibraryWithCloud: cloud.analyzeLibraryWithCloud,
    
    generateOpeningTree: constellation.generateOpeningTree,
    changePerspectiveAndMap: constellation.changePerspectiveAndMap,
    isConstellationStale: constellation.isConstellationStale,
    
    startBulkAnalysis: intel.startBulkAnalysis,
    stopBulkAnalysis: intel.stopBulkAnalysis,
    updateGameAnalysis: intel.updateGameAnalysis,
    currentAnalyzingId: intel.currentAnalyzingId,
    
    repairVaultMetadata,
    repairVaultIdentity,
    purgeDuplicates: idb.purgeDuplicates,
    deduplicate: idb.purgeDuplicates, // Alias

    // Expose filtered list
    filteredGames: filter.filteredGames,
    isFiltering: filter.isFiltering,
    searchQuery,
    filterResult,
    selectedTag,
    setFilter: (tag: string) => { selectedTag.value = tag }, // Alias
    allTags: filter.allTags,
    filterPerspective,
    sortBy,
    sortOrder,
    totalVaultGames,
    vaultOffset,
    hasMoreGames: computed(() => games.value.length < totalVaultGames.value),

    // Internal Composables (Exposed for testing/advanced orchestration)
    idb,
    importer,
    stats,
    filter,
    cloud,
    constellation,
    intel,

    // Legacy Helpers
    nukeVault: async (wipeCloud = false) => {
      await idb.resetLibrary()
      if (wipeCloud) await cloud.purgeCloudLibrary()
    },
    ecoStats: stats.openingStats, // Alias
    importFromUrl: async (url: string, name = 'Collection') => {
      isImporting.value = true
      const { importPgnFromUrl } = await import('../api/lichessApi')
      const pgn = await importPgnFromUrl(url)
      await importer.importPgn(pgn, true, [name])
      isImporting.value = false
    }
  }
})
