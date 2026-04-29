import { defineStore } from 'pinia'
import { ref, computed, watch, shallowRef } from 'vue'
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
  userSide?: 'white' | 'black' | 'none'
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
  // We use shallowRef for the game lists to prevent Vue from deeply tracking 
  // every property of 100k+ games, which would cause significant lag.
  const games = shallowRef<LibraryGame[]>([])
  const isImporting = ref(false)
  const importProgress = ref(0)
  
  const isProcessingIntegrity = ref(false)
  const integrityProgress = ref(0)
  const integrityMessage = ref('')
  
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
    
    isProcessingIntegrity.value = true
    integrityProgress.value = 0
    integrityMessage.value = 'Sanitizing metadata...'
    
    logger.info('[Library] Starting vault metadata repair and tag sanitation...')

    const total = games.value.length
    for (let i = 0; i < total; i++) {
      const g = games.value[i]
      let changed = false
      
      if (i % 50 === 0) {
        integrityProgress.value = Math.round((i / total) * 100)
        await new Promise(r => setTimeout(r, 0))
      }

      // 0. Resolve User Side (Persist Identity)
      if (!g.userSide || g.userSide === 'none') {
        const isWhite = userStore.isMe(g.white) || (userStore.displayName && g.white.toLowerCase() === userStore.displayName.toLowerCase())
        const isBlack = userStore.isMe(g.black) || (userStore.displayName && g.black.toLowerCase() === userStore.displayName.toLowerCase())
        
        if (isWhite) { g.userSide = 'white'; changed = true }
        else if (isBlack) { g.userSide = 'black'; changed = true }
      }
      
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

      // 2. Comprehensive Identity & Platform Re-validation
      const isMe = userStore.isMe(g.white) || userStore.isMe(g.black)
      const lowerEvent = (g.event || '').toLowerCase()
      const isNative = lowerEvent === 'play vs coach' || lowerEvent === 'knightfall match'
      const isMyGame = isMe || isNative
      
      let currentTags = [...(g.tags || [])]
      let lowerTags = currentTags.map(t => t.toLowerCase())
      const hasMyGames = lowerTags.includes('my games')

      // A. "My Games" and Username strict enforcement
      const myUsername = userStore.displayName ? userStore.displayName.toLowerCase() : null

      if (isMyGame) {
        if (!hasMyGames) {
          currentTags.push('My Games')
          changed = true
        }
        if (userStore.displayName && !lowerTags.includes(myUsername!)) {
          currentTags.push(userStore.displayName)
          changed = true
        }
      } else {
        // Aggressively strip "My Games" and native username if it's NOT their game
        const originalLen = currentTags.length
        currentTags = currentTags.filter(t => {
          const lt = t.toLowerCase()
          if (lt === 'my games') return false
          if (myUsername && lt === myUsername) return false
          return true
        })
        if (currentTags.length !== originalLen) changed = true
      }

      // B. Platform Mapping Logic
      lowerTags = currentTags.map(t => t.toLowerCase())
      const isChessPlatform = lowerTags.includes('chess.com') || lowerEvent.includes('chess.com')
      const isLiveChess = lowerEvent === 'live chess' || lowerTags.includes('live chess')
      
      if (isChessPlatform && isLiveChess) {
        if (!lowerTags.includes('chess.com')) {
          currentTags.push('Chess.com')
          changed = true
        }
      }
      
      // C. Source Tagging
      if (g.event && !lowerTags.includes(g.event.toLowerCase())) {
        currentTags.push(g.event)
        changed = true
      }

      // D. Final UserSide Fallback
      if ((!g.userSide || g.userSide === 'none') && currentTags.some(t => t.toLowerCase() === 'my games')) {
        const w = g.white.toLowerCase()
        const b = g.black.toLowerCase()
        const tags = currentTags.map(t => t.toLowerCase())
        if (tags.includes(w)) { g.userSide = 'white' }
        else if (tags.includes(b)) { g.userSide = 'black' }
        else { g.userSide = 'white' } // Default so it is not lost from stats
        changed = true
      }

      if (changed) g.tags = [...new Set(currentTags)]

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
        // Trigger shallowRef reactivity
        games.value = [...games.value]
        
        const ui = useUiStore()
        ui.addToast(`Vault sanitized: ${updatedGames.length} metadata fixes applied.`, 'success')
      }
    } else {
      const ui = useUiStore()
      ui.addToast(`Vault is already clean. No metadata corrections needed.`, 'info')
    }

    isProcessingIntegrity.value = false
    integrityProgress.value = 100
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
    isProcessingIntegrity.value = true
    integrityProgress.value = 0
    integrityMessage.value = 'Cleaning duplicate entries...'
    
    const beforeCount = games.value.length
    await idb.purgeDuplicates()
    
    // Trigger shallowRef reactivity
    games.value = [...games.value]
    
    const afterCount = games.value.length
    
    isProcessingIntegrity.value = false
    integrityProgress.value = 100
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
    
    isProcessingIntegrity,
    integrityProgress,
    integrityMessage,
    
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
    persistGameUpdate: idb.persistGameUpdate,
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
