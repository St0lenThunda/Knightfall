import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { Chess } from 'chess.js'
import { logger } from '../utils/logger'
import { useUserStore } from './userStore'
import { useUiStore } from './uiStore'

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
  acpl?: number
  missedWins?: number
  theoreticalAccuracy?: number
  cloudId?: string // Native Supabase UUID for cloud push
  telemetry?: {
    blurCount: number
    suspicionScore: number
    isBusted: boolean
  }
}

export interface OpeningNode {
  san: string
  fen: string
  weight: number
  wins: number
  losses: number
  draws: number
  children: Record<string, OpeningNode>
}

/**
 * Represents a node in the flattened visual graph.
 * Pre-calculated with spatial coordinates (x, y) to avoid blocking the UI thread.
 */
export interface GraphNode extends OpeningNode {
  id: string
  x: number
  y: number
  isWhite: boolean
  depth: number
  wins: number
  losses: number
  draws: number
}

/**
 * Represents a connection between two nodes in the visual graph.
 */
export interface GraphEdge {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  weight: number
  d: string // SVG Path data
}

/**
 * The complete pre-calculated layout for the Constellation map.
 */
export interface ConstellationLayout {
  nodes: GraphNode[]
  edges: GraphEdge[]
  maxWeight: number
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
      // 1. Curated collections should NEVER be in 'My DNA' stats
      if (g.isCurated) return false

      // 2. Identity Check: Must be one of the players to be 'My DNA'
      // This is the most reliable check as it uses current authenticated handles
      const isMeWhite = userStore.isMe(g.white)
      const isMeBlack = userStore.isMe(g.black)
      if (isMeWhite || isMeBlack) return true

      // 3. Native Fallback: If it's a native Knightfall game, we trust the 'My Games' tag
      // to preserve local/guest history from before the user logged in.
      const isNative = g.event === 'Knightfall Match' || (g.tags || []).includes('Knightfall')
      if (isNative) {
        const tags = (g.tags || []).map(t => t.toLowerCase())
        return tags.includes('my games')
      }

      return false
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
  
  const intel = useLibraryAnalysis(games, async (game: LibraryGame) => {
    await idb.persistGameUpdate(game)
    await cloud.pushGameAnalysis(game)
  })

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
    
    logger.info('[Library] Starting vault metadata repair and tag sanitation...')

    for (const g of games.value) {
      let changed = false
      
      // 1. Tag Sanitation: Curated games should NEVER have 'My Games' tag
      if (g.isCurated) {
        const originalTags = g.tags || []
        const cleanTags = originalTags.filter(t => t.toLowerCase() !== 'my games')
        if (cleanTags.length !== originalTags.length) {
          g.tags = cleanTags
          changed = true
        }
        
        // Ensure it has a source tag if curated
        if (g.event && !g.tags?.includes(g.event)) {
          g.tags = [...(g.tags || []), g.event]
          changed = true
        }
      }

      // 2. Identity Re-validation: If it's not curated, check if it should have 'My Games'
      if (!g.isCurated) {
        const isMe = userStore.isMe(g.white) || userStore.isMe(g.black)
        let currentTags = [...(g.tags || [])]
        const lowerTags = currentTags.map(t => t.toLowerCase())
        const hasMyGames = lowerTags.includes('my games')
        
        if (isMe && !hasMyGames) {
          currentTags.push('My Games')
          changed = true
        } else if (!isMe && hasMyGames) {
          // If it's not me, and it has the tag, but it's NOT a native Knightfall guest game, strip it
          const isNative = g.event === 'Knightfall Match' || lowerTags.includes('knightfall')
          if (!isNative) {
            currentTags = currentTags.filter(t => t.toLowerCase() !== 'my games')
            changed = true
          }
        }

        // 3. Source Tagging: Ensure imported games have their source tag
        if (g.event && !lowerTags.includes(g.event.toLowerCase())) {
          currentTags.push(g.event)
          changed = true
        }

        if (changed) g.tags = currentTags
      }

      // 3. Header Repair (Legacy logic)
      const isMissingElo = !g.whiteElo || !g.blackElo
      const isMissingInfo = g.white === 'Unknown' || g.date === '?'
      
      if (isMissingElo || isMissingInfo) {
        try {
          chess.loadPgn(g.pgn)
          const headers = chess.header()
          
          if (headers['White'] && g.white === 'Unknown') { g.white = headers['White']!; changed = true }
          if (headers['Black'] && g.black === 'Unknown') { g.black = headers['Black']!; changed = true }
          if (headers['WhiteElo'] && !g.whiteElo) { g.whiteElo = headers['WhiteElo']!; changed = true }
          if (headers['BlackElo'] && !g.blackElo) { g.blackElo = headers['BlackElo']!; changed = true }
        } catch (e) {}
      }

      if (changed) updatedGames.push(g)
    }

    if (updatedGames.length > 0) {
      const db = await idb.initDb()
      const tx = db.transaction(['games'], 'readwrite')
      const store = tx.objectStore('games')
      
      for (const g of updatedGames) {
        store.put(JSON.parse(JSON.stringify(g)))
      }
      
      tx.oncomplete = () => {
        logger.info(`[Library] Repaired ${updatedGames.length} games.`)
        const ui = useUiStore()
        ui.addToast(`Vault sanitized: ${updatedGames.length} metadata fixes applied.`, 'success')
      }
    }
  }

  /**
   * Unified deletion: removes from memory, IDB, and Cloud.
   */
  async function deleteGame(id: string) {
    const game = games.value.find(g => g.id === id)
    if (!game) return

    // 1. Cloud Deletion (if applicable)
    if (game.cloudId) {
      try {
        await cloud.deleteCloudGame(game.cloudId)
        logger.info('[Library] Cloud game deleted:', game.cloudId)
      } catch (e) {
        logger.error('[Library] Cloud deletion failed, proceeding with local only', e)
      }
    }

    // 2. IDB & Memory Deletion
    await idb.deleteGame(id)
    
    // 3. UI Update (Trigger filter to refresh view)
    filter.triggerFilter()
    
    // 4. Feedback
    const ui = useUiStore()
    ui.addToast('Game permanently deleted.', 'success')
  }

  async function purgeDuplicates() {
    const beforeCount = games.value.length
    await idb.purgeDuplicates()
    const afterCount = games.value.length
    return beforeCount - afterCount
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
    deleteGame,
    
    importPgn: importer.importPgn,
    importPgnZip: importer.importPgnZip,
    saveGameToLibrary: importer.saveGameToLibrary,
    importFromLichess: importer.importFromLichess,
    
    syncCloudGames: cloud.syncCloudGames,
    purgeCloudLibrary: cloud.purgeCloudLibrary,
    pushLocalGamesToCloud: cloud.pushLocalGamesToCloud,
    
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
