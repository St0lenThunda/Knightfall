import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { Chess } from 'chess.js'
import { logger } from '../utils/logger'
import { useUserStore } from './userStore'

// Import Sub-Composables
import { useLibraryIdb } from './library/useLibraryIdb'
import { useLibraryImport } from './library/useLibraryImport'
import { useLibraryStats } from './library/useLibraryStats'
import { useLibraryFilter } from './library/useLibraryFilter'
import { useLibrarySync } from './library/useLibrarySync'
import { useLibraryConstellation } from './library/useLibraryConstellation'
import { useLibraryAnalysis } from './library/useLibraryAnalysis'

export interface LibraryGame {
  id: string
  pgn: string
  white: string
  black: string
  result: string
  date: string
  event: string
  eco: string
  movesCount: number
  addedAt: number
  isCurated?: boolean
  whiteElo?: string
  blackElo?: string
  tags?: string[]
  analysisCache?: Record<string, string>
  clocks?: number[]
  evals?: any[]
}

export interface OpeningNode {
  san: string
  fen: string
  weight: number
  children: Record<string, OpeningNode>
}

/**
 * Knightfall Library Store: The central orchestrator for game management.
 * 
 * DESIGN PATTERN: Orchestrator
 * This store delegates heavy logic to specialized composables in @/stores/library/
 * while maintaining the public API for the rest of the application.
 */
export const useLibraryStore = defineStore('library', () => {
  // --- CORE STATE ---
  const games = ref<LibraryGame[]>([])
  const isImporting = ref(false)
  const importProgress = ref(0)
  
  // Pinia Store Hoisting
  const userStore = useUserStore()
  
  // FILTER STATE (Centralized)
  const searchQuery = ref('')
  const filterResult = ref('all')
  const selectedTag = ref('all')
  const filterPerspective = ref<'all' | 'white' | 'black'>('all')
  const sortBy = ref(localStorage.getItem('vault_sortBy') || 'addedAt')
  const sortOrder = ref(localStorage.getItem('vault_sortOrder') || 'desc')

  // --- PERSONAL DATA FILTERING ---
  /** 
   * Games where the user is an active participant. 
   * This excludes curated master collections for the 'Weakness DNA' analysis.
   */
  const personalGames = computed(() => {
    return games.value.filter(g => {
      // Identity Check: Must be one of the players to be 'My DNA'
      const isMe = userStore.isMe(g.white) || userStore.isMe(g.black)
      if (isMe) return true

      // Fallback for native Knightfall games that might have 'Anonymous' or different headers
      const tags = (g.tags || []).map(t => t.toLowerCase())
      return tags.includes('my games')
    })
  })

  // --- SUB-COMPOSABLES (Decomposition) ---
  const idb = useLibraryIdb(games)
  
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
  
  const cloud = useLibrarySync(games, idb.initDb)
  
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
  
  const intel = useLibraryAnalysis(games, idb.persistGameUpdate)

  const gamesMap = computed(() => {
    const map = new Map<string, LibraryGame>()
    for (const g of games.value) {
      map.set(g.id, g)
    }
    return map
  })

  // --- ORCHESTRATION METHODS ---

  /**
   * Updates a single game's analysis and persists it.
   */
  async function updateGameAnalysis(gameId: string, fen: string, analysis: string) {
    const game = games.value.find(g => g.id === gameId)
    if (game) {
      if (!game.analysisCache) game.analysisCache = {}
      game.analysisCache[fen] = analysis
      await idb.persistGameUpdate(game)
    }
  }

  /**
   * Manual trigger for repairing metadata in older library entries.
   */
  async function repairVaultMetadata() {
    const chess = new Chess()
    const updatedGames: LibraryGame[] = []
    
    for (const g of games.value) {
      const isMissingElo = !g.whiteElo || !g.blackElo
      const isMissingInfo = g.white === 'Unknown' || g.date === '?'
      
      if (isMissingElo || isMissingInfo) {
        try {
          chess.loadPgn(g.pgn)
          const headers = chess.header()
          let changed = false
          
          if (headers['White'] && g.white === 'Unknown') { g.white = headers['White']!; changed = true }
          if (headers['Black'] && g.black === 'Unknown') { g.black = headers['Black']!; changed = true }
          if (headers['WhiteElo'] && !g.whiteElo) { g.whiteElo = headers['WhiteElo']!; changed = true }
          if (headers['BlackElo'] && !g.blackElo) { g.blackElo = headers['BlackElo']!; changed = true }
          
          if (changed) updatedGames.push(g)
        } catch (e) {
          logger.warn('[Library] Repair failed for game', g.id, e)
        }
      }
    }

    if (updatedGames.length > 0) {
      for (const g of updatedGames) {
        await idb.persistGameUpdate(g)
      }
      logger.info(`[Library] Repaired ${updatedGames.length} games.`)
      constellation.generateOpeningTree()
    }
  }

  /**
   * Deduplication engine: Purges games with identical move sequences.
   */
  async function purgeDuplicates() {
    const seen = new Set<string>()
    const toDelete: string[] = []
    
    games.value.forEach(g => {
      // Create a move-only fingerprint
      const moveText = g.pgn.replace(/\[.*?\]/sg, '').replace(/\s+/g, ' ').trim()
      const fingerprint = `${g.white.toLowerCase()}-${g.black.toLowerCase()}-${moveText}`
      
      if (seen.has(fingerprint)) {
        toDelete.push(g.id)
      } else {
        seen.add(fingerprint)
      }
    })

    if (toDelete.length > 0) {
      for (const id of toDelete) {
        await idb.deleteGame(id)
      }
      logger.info(`[Library] Purged ${toDelete.length} duplicates.`)
    }
    return toDelete.length
  }

  // --- PERSISTENCE WATCHERS ---
  watch([sortBy, sortOrder], () => {
    localStorage.setItem('vault_sortBy', sortBy.value)
    localStorage.setItem('vault_sortOrder', sortOrder.value)
  })

  // --- PUBLIC API ---
  return {
    // State
    games,
    gamesMap,
    isImporting,
    importProgress,
    
    // Sub-module exposures (Stats)
    ...stats,
    
    // Sub-module exposures (Filter)
    ...filter,
    
    // Sub-module exposures (Constellation)
    ...constellation,
    
    // Sub-module exposures (Intel)
    ...intel,

    personalGames,
    
    analyzedGamesCount: computed(() => games.value.filter(g => g.evals && g.evals.length > 0).length),
    
    // Actions
    loadGames: idb.loadGames,
    resetLibrary: idb.resetLibrary,
    deleteGame: idb.deleteGame,
    
    importPgn: importer.importPgn,
    importPgnZip: importer.importPgnZip,
    saveGameToLibrary: importer.saveGameToLibrary,
    importFromLichess: importer.importFromLichess,
    
    syncCloudGames: cloud.syncCloudGames,
    purgeCloudLibrary: cloud.purgeCloudLibrary,
    
    updateGameAnalysis,
    repairVaultMetadata,
    purgeDuplicates,
    
    // Filter Controls
    searchQuery,
    filterResult,
    selectedTag,
    filterPerspective,
    sortBy,
    sortOrder,

    // Legacy Helpers (to be moved if needed)
    importFromUrl: async (url: string, name = 'Collection') => {
      isImporting.value = true
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        
        const blob = await res.blob()
        if (url.toLowerCase().endsWith('.zip')) {
          await importer.importPgnZip(blob, true, [name])
        } else {
          const text = await blob.text()
          if (!text || text.trim().length < 10) throw new Error('Empty or invalid PGN file')
          await importer.importPgn(text, true, [name])
        }
      } catch (err: any) {
        logger.error('[Library] Import from URL failed', url, err)
        throw err // Let the UI handle the toast
      } finally { isImporting.value = false }
    },
    importPgnText: (text: string, name = 'Snippet') => importer.importPgn(text, false, [name, 'Manual Paste'])
  }
})
