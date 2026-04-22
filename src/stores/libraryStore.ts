import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { Chess } from 'chess.js'
import * as JSZip from 'jszip'
import { supabase } from '../api/supabaseClient'
import { parse } from '@mliebelt/pgn-parser'
import { buildOpeningTree } from '../utils/constellationUtils'
import { ecoToName, ecoToDescription } from '../utils/ecoLookup'
import { generateGameFingerprint } from '../utils/gameFingerprint'
import { useUserStore } from './userStore'

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
  analysisCache?: Record<string, string> // FEN -> Analysis Text
}

export interface OpeningNode {
  san: string
  fen: string
  weight: number // Number of games passing through this node
  children: Record<string, OpeningNode>
}

export const useLibraryStore = defineStore('library', () => {
  const games = ref<LibraryGame[]>([])
  const isImporting = ref(false)
  const importProgress = ref(0)
  const isGeneratingTree = ref(false)
  const openingTree = ref<OpeningNode | null>(null)
  
  // Pinia Store Hoisting
  const userStore = useUserStore()
  
  // FILTER STATE (Centralized)
  const searchQuery = ref('')
  const filterResult = ref('all')
  const selectedTag = ref('all')
  const filterPerspective = ref<'all' | 'white' | 'black'>('all')
  const sortBy = ref(localStorage.getItem('vault_sortBy') || 'addedAt')
  const sortOrder = ref(localStorage.getItem('vault_sortOrder') || 'desc')
  
  let db: IDBDatabase | null = null

  /**
   * Helper to load a PGN into chess.js. We dynamically switch parsers for fault tolerance:
   * 1. Strict PEG Parser (`chess.js`) - Fast but fragile
   * 2. AST Tolerant Parser (`@mliebelt/pgn-parser`) - Handles nested metadata perfectly
   * 3. RegEx Scrubber - Destructive last resort to salvage unreadable syntax
   */
  function safeLoadPgn(chess: Chess, pgn: string) {
    try {
      chess.loadPgn(pgn)
    } catch {
      try {
        // Fallback 1: Tolerant AST compilation
        const ast = parse(pgn, { startRule: 'game' }) as any
        chess.reset()
        if (ast.tags && ast.tags.FEN) {
           chess.load(ast.tags.FEN)
        }
        for (const m of ast.moves) {
           chess.move(m.notation.notation)
        }
        if (ast.tags) {
           for (const [key, value] of Object.entries(ast.tags)) {
             if (typeof value === 'string') chess.header(key, value)
           }
        }
      } catch {
        // Fallback 2: Destructive String Scrubbing
        let clean = pgn.replace(/\[%[^\]]+\]/g, '')
        let prev = ''
        while (clean !== prev) {
          prev = clean
          clean = clean.replace(/\([^()]*\)/g, '')
        }
        try { chess.loadPgn(clean) } catch { /* Surrender */ }
      }
    }
  }

  // Initialize IndexedDB
  async function initDb() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('KnightfallLibrary', 1)
      
      request.onerror = () => reject('IDB Error')
      request.onsuccess = () => {
        db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains('games')) {
          const store = db.createObjectStore('games', { keyPath: 'id' })
          store.createIndex('date', 'date', { unique: false })
          store.createIndex('addedAt', 'addedAt', { unique: false })
        }
      }
    })
  }

  async function loadGames() {
    if (!db) await initDb()
    return new Promise<void>((resolve) => {
      const transaction = db!.transaction(['games'], 'readonly')
      const store = transaction.objectStore('games')
      const request = store.getAll()
      
      request.onsuccess = () => {
        games.value = request.result || []
        // generateOpeningTree() // Automatical generation disabled to save processing power
        resolve()
      }
    })
  }

  async function importPgn(pgnContent: string, isCurated: boolean = false, extraTags: string[] = []) {
    isImporting.value = true
    importProgress.value = 0
    
    // Robust splitting: Split at the start of any line beginning with [Event "
    const gameStrings = pgnContent.split(/(?=\n\[Event ")/)
    
    const total = gameStrings.length
    const chess = new Chess()
    const newGames: LibraryGame[] = []

    for (let i = 0; i < total; i++) {
        const raw = gameStrings[i].trim()
        if (!raw) continue

        try {
            safeLoadPgn(chess, raw)
            const headers = chess.header()
            
            const game: LibraryGame = {
                id: crypto.randomUUID(),
                pgn: raw,
                white: headers['White'] || 'Unknown',
                black: headers['Black'] || 'Unknown',
                result: headers['Result'] || '*',
                date: headers['Date'] || '?',
                event: headers['Event'] || 'Local Game',
                eco: headers['ECO'] || '',
                movesCount: chess.history().length,
                addedAt: Date.now(),
                isCurated,
                tags: extraTags.length > 0 ? extraTags : ['Imported']
            }
            newGames.push(game)
        } catch (e) {
            console.error('Failed to parse game', i, e)
        }

        if (i % 10 === 0) {
            importProgress.value = Math.round((i / total) * 100)
            // Allow UI to breathe
            await new Promise(r => setTimeout(r, 0))
        }
    }

    // Bulk save to IDB
    if (!db) await initDb()
    const transaction = db!.transaction(['games'], 'readwrite')
    const store = transaction.objectStore('games')
    newGames.forEach(g => store.put(g))
    
    transaction.oncomplete = () => {
        games.value = [...games.value, ...newGames]
        isImporting.value = false
        importProgress.value = 100
        // generateOpeningTree() // Automatical generation disabled
    }
  }

  async function importPgnZip(file: File | Blob, isCurated: boolean = true, tags: string[] = []) {
    isImporting.value = true
    importProgress.value = 0
    
    try {
        const zip = await JSZip.loadAsync(file)
        const pgnFiles = Object.keys(zip.files).filter(name => name.toLowerCase().endsWith('.pgn'))
        
        for (let i = 0; i < pgnFiles.length; i++) {
            const content = await zip.files[pgnFiles[i]].async('string')
            await importPgn(content, isCurated, tags)
            importProgress.value = Math.round(((i + 1) / pgnFiles.length) * 100)
        }
    } catch (e) {
        console.error('Failed to unzip PGN archive', e)
    } finally {
        isImporting.value = false
    }
  }

  async function importFromUrl(url: string, name: string = 'Collection') {
    isImporting.value = true
    try {
        const res = await fetch(url)
        const blob = await res.blob()
        const tags = [name]
        
        if (url.toLowerCase().endsWith('.zip')) {
            await importPgnZip(blob, true, tags)
        } else {
            const text = await blob.text()
            await importPgn(text, true, tags)
        }
    } catch (e) {
        console.error('Failed to import from URL', e)
    } finally {
        isImporting.value = false
    }
  }

  async function importPgnText(text: string, name: string = 'Snippet') {
    await importPgn(text, false, [name, 'Manual Paste'])
  }

  async function saveGameToLibrary(pgn: string, tags: string[] = []) {
    const chess = new Chess()
    try {
      safeLoadPgn(chess, pgn)
      const headers = chess.header()
      
      let cleanResult = headers['Result'] || '*'
      if (cleanResult.startsWith('1-0')) cleanResult = '1-0'
      else if (cleanResult.startsWith('0-1')) cleanResult = '0-1'
      else if (cleanResult.startsWith('1/2-1/2') || cleanResult.includes('1/2') || cleanResult.includes('½')) cleanResult = '1/2-1/2'

      const white = headers['White'] || 'Unknown'
      const black = headers['Black'] || 'Unknown'
      const stableId = generateGameFingerprint(white, black, pgn)

      // Deduplication Check — using our stable ID
      const alreadyExists = games.value.some(g => g.id === stableId)
      if (alreadyExists) return

      const game: LibraryGame = {
        id: stableId,
        pgn: pgn,
        white,
        black,
        result: cleanResult,
        date: headers['Date'] || new Date().toISOString().split('T')[0],
        event: headers['Event'] || 'Local Game',
        eco: headers['ECO'] || '',
        movesCount: (chess.history() || []).length,
        addedAt: Date.now(),
        whiteElo: headers['WhiteElo'] ?? undefined,
        blackElo: headers['BlackElo'] ?? undefined,
        tags: [...new Set(['My Games', ...tags])]
      }

      // Update local state immediately to prevent race conditions in deduplication
      games.value.push(JSON.parse(JSON.stringify(game)))
      
      if (!db) await initDb()
      const transaction = db!.transaction(['games'], 'readwrite')
      const store = transaction.objectStore('games')
      store.put(JSON.parse(JSON.stringify(game)))
      
      transaction.oncomplete = async () => {
        generateOpeningTree()

        // 5. Cloud Sync (Permanent DB)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const myUsername = userStore.profile?.username || ''
          const isWhite = game.white.toLowerCase() === myUsername.toLowerCase()
          
          await supabase.from('matches').upsert({
            id: game.id,
            white_id: isWhite ? session.user.id : null,
            black_id: !isWhite ? session.user.id : null,
            pgn: game.pgn,
            result: game.result,
            created_at: game.date
          })
        }
      }
    } catch (e) {
      console.error('Failed to save game to library', e)
    }
  }

  async function deleteGame(id: string) {
    if (!db) await initDb()
    const transaction = db!.transaction(['games'], 'readwrite')
    const store = transaction.objectStore('games')
    store.delete(id)
    
    transaction.oncomplete = () => {
        games.value = games.value.filter(g => g.id !== id)
    }
  }

  async function syncCloudGames() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .or(`white_id.eq.${session.user.id},black_id.eq.${session.user.id}`)
    
    if (error || !matches) return

    const chess = new Chess()
    const syncedGames: LibraryGame[] = []
    const existingIds = new Set(games.value.map(g => g.id))
    
    for (const m of matches) {
      try {
        safeLoadPgn(chess, m.pgn)
        const headers = chess.header()
        
        // Recalculate fingerprint to ensure local ID consistency
        const white = headers['White'] || 'Unknown'
        const black = headers['Black'] || 'Unknown'
        const stableId = generateGameFingerprint(white, black, m.pgn)

        if (existingIds.has(stableId)) continue

        const game: LibraryGame = {
          id: stableId,
          pgn: m.pgn,
          white: headers['White'] || 'Unknown',
          black: headers['Black'] || 'Unknown',
          result: m.result || headers['Result'] || '*',
          date: headers['Date'] || m.created_at?.split('T')[0] || '?',
          event: headers['Event'] || 'Online Game',
          eco: headers['ECO'] || '',
          movesCount: chess.history().length,
          addedAt: Date.now(),
          whiteElo: headers['WhiteElo'] ?? undefined,
          blackElo: headers['BlackElo'] ?? undefined,
          tags: ['My Games', 'Synced']
        }
        syncedGames.push(game)
      } catch (e) {
        console.error('Failed to sync game', m.id, e)
      }
    }

    if (syncedGames.length > 0) {
      if (!db) await initDb()
      const transaction = db!.transaction(['games'], 'readwrite')
      const store = transaction.objectStore('games')
      syncedGames.forEach(g => store.put(g))
      
      transaction.oncomplete = () => {
        games.value = [...games.value, ...syncedGames]
        generateOpeningTree()
      }
    }
  }

  async function repairVaultMetadata() {
    if (games.value.length === 0) return
    if (!db) await initDb()

    const chess = new Chess()
    const updatedGames: LibraryGame[] = []
    
    const CHUNK_SIZE = 50
    for (let i = 0; i < games.value.length; i++) {
        const g = games.value[i]
        // Repair if metadata is missing or looks like "Unknown"
        const isMissingElo = !g.whiteElo || !g.blackElo
        const isMissingInfo = g.white === 'Unknown' || g.date === '?'
        
        if (isMissingElo || isMissingInfo) {
            try {
                chess.loadPgn(g.pgn)
                const headers = chess.getHeaders()
                
                let changed = false
                if (headers['White'] && g.white === 'Unknown') { g.white = headers['White']!; changed = true }
                if (headers['Black'] && g.black === 'Unknown') { g.black = headers['Black']!; changed = true }
                if (headers['WhiteElo'] && !g.whiteElo) { g.whiteElo = headers['WhiteElo']!; changed = true }
                if (headers['BlackElo'] && !g.blackElo) { g.blackElo = headers['BlackElo']!; changed = true }
                
                // Fallback for Date if missing
                if (g.date === '?' || !g.date) {
                    g.date = headers['Date'] || new Date(g.addedAt).toISOString().split('T')[0].replace(/-/g, '.')
                    changed = true
                }

                if (changed) {
                    updatedGames.push(g)
                }
            } catch (e) {
                console.warn('[repairVaultMetadata] Failed to parse PGN for game:', g.id, e)
            }
        }

        // Yield to main thread every CHUNK_SIZE games to prevent UI lockup
        if (i > 0 && i % CHUNK_SIZE === 0) {
            await new Promise(r => setTimeout(r, 0))
        }
    }

    if (updatedGames.length > 0) {
        const transaction = db!.transaction(['games'], 'readwrite')
        const store = transaction.objectStore('games')
        
        updatedGames.forEach(g => {
            // We must clone the reactive object to avoid proxy issues with IDB
            store.put(JSON.parse(JSON.stringify(g)))
        })
        
        transaction.oncomplete = () => {
             console.log(`[repairVaultMetadata] Successfully repaired ${updatedGames.length} games.`)
             generateOpeningTree()
        }
    }
  }

  async function purgeDuplicates() {
    if (!db) await initDb()
    const seen = new Set<string>()
    const toDelete: string[] = []
    
    /**
     * Multi-layer fingerprinting to catch ALL duplicate variants:
     * 1. Extract just the move text from the PGN (strip headers)
     * 2. Normalize whitespace so formatting differences don't matter
     * 3. Combine with lowercase player names for uniqueness
     */
    games.value.forEach(g => {
      const fingerprint = generateGameFingerprint(g.white, g.black, g.pgn)
      
      // If the current ID doesn't match the correct fingerprint, it's a legacy entry
      const isLegacyId = g.id !== fingerprint

      if (seen.has(fingerprint) || isLegacyId) {
        toDelete.push(g.id)
      } else {
        seen.add(fingerprint)
      }
    })

    console.log(`[purgeDuplicates] Found ${toDelete.length} duplicates out of ${games.value.length} games`)

    if (toDelete.length === 0) return 0

    const transaction = db!.transaction(['games'], 'readwrite')
    const store = transaction.objectStore('games')
    toDelete.forEach(id => store.delete(id))
    
    return new Promise<number>((resolve) => {
      transaction.oncomplete = () => {
        games.value = games.value.filter(g => !toDelete.includes(g.id))
        resolve(toDelete.length)
      }
    })
  }

  /**
   * Nuclear option: completely destroys and recreates the IndexedDB database.
   * We use `indexedDB.deleteDatabase()` instead of `store.clear()` because
   * clear() runs inside a transaction that can silently fail if navigation
   * happens before it commits. deleteDatabase() is fully atomic — once it
   * resolves, the data is guaranteed gone.
   */
  async function resetLibrary() {
    console.log('[resetLibrary] Destroying database...')
    
    // 1. Close the active connection so deleteDatabase can proceed
    if (db) {
      db.close()
      db = null
    }
    
    // 2. Delete the entire database — this is atomic and cannot partially fail
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('KnightfallLibrary')
      req.onsuccess = () => {
        console.log('[resetLibrary] Database destroyed successfully.')
        resolve()
      }
      req.onerror = () => {
        console.error('[resetLibrary] Database deletion failed:', req.error)
        reject(req.error)
      }
      req.onblocked = () => {
        // Another tab might have the DB open — force it
        console.warn('[resetLibrary] Database deletion blocked, forcing...')
        resolve()
      }
    })
    
    // 3. Clear in-memory state
    games.value = []
    filteredGames.value = []
    
    // 4. Flush the Web Worker cache
    filterWorker.postMessage({ type: 'SET_GAMES', payload: [] })
    
    // 5. Reinitialize a fresh empty database for future use
    await initDb()
    console.log('[resetLibrary] Fresh database ready.')
  }

  /**
   * Aggressively cleans up the Supabase 'matches' table for the user.
   * This is useful for clearing out legacy duplicates that were saved
   * before the stable fingerprinting system was implemented.
   */
  async function purgeCloudLibrary() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    console.log('[purgeCloudLibrary] Wiping cloud matches...')
    const { error } = await supabase
      .from('matches')
      .delete()
      .or(`white_id.eq.${session.user.id},black_id.eq.${session.user.id}`)

    if (error) {
      console.error('[purgeCloudLibrary] Error:', error)
      throw error
    } else {
      console.log('[purgeCloudLibrary] Cloud library wiped.')
    }
  }

  async function updateGameAnalysis(id: string, fen: string, text: string) {
    const game = gamesMap.value.get(id)
    if (!game) return

    if (!game.analysisCache) game.analysisCache = {}
    game.analysisCache[fen] = text

    // Persist to IDB
    const transaction = db!.transaction(['games'], 'readwrite')
    const store = transaction.objectStore('games')
    // Deep clone to strip Proxy wrappers which cause DataCloneError in IndexedDB
    store.put(JSON.parse(JSON.stringify(game)))
  }

  // --- Statistical Intelligence ---
  /**
   * Aggregates opening statistics from the game library.
   * Uses the pre-stored ECO code (from PGN import) and the ecoLookup
   * utility to produce clean opening names — no need to re-parse
   * every PGN on each render.
   */
  /**
   * PERFORMANCE RATING ENGINE (ELO)
   * Calculates a unified rating based on the chronological history of all library games.
   * Uses standard Elo formula: R_new = R_old + K * (S - E)
   */
  const performanceRating = computed(() => {
    const history = performanceHistory.value
    return history.length > 0 ? history[history.length - 1] : 1200
  })

  /**
   * Generates the full rating progression history.
   * Useful for charts and trend analysis.
   */
  const performanceHistory = computed(() => {
    if (games.value.length === 0) return [1200]

    const myName = userStore.profile?.username?.toLowerCase() || ''
    const myChessCom = userStore.profile?.chessComUsername?.toLowerCase() || ''
    
    const sortedGames = [...games.value].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateA - dateB
    })

    let currentElo = 1200
    const K = 32
    const history = [1200]

    sortedGames.forEach(g => {
      const isWhite = g.white.toLowerCase() === myName || (myChessCom && g.white.toLowerCase() === myChessCom)
      const oppRatingStr = isWhite ? g.blackElo : g.whiteElo
      const oppRating = oppRatingStr ? parseInt(oppRatingStr) : null
      
      if (!oppRating) return

      let S = 0.5
      if (g.result === '1-0') S = isWhite ? 1 : 0
      if (g.result === '0-1') S = isWhite ? 0 : 1

      const E = 1 / (1 + Math.pow(10, (oppRating - currentElo) / 400))
      currentElo = currentElo + K * (S - E)
      history.push(Math.round(currentElo))
    })

    return history
  })

  /**
   * Generates a 12-week activity heatmap based on game frequency.
   * Each cell represents a day, value is game count.
   */
  const activityHeatmap = computed(() => {
    const weeks = 12
    const days = 7
    const heatmap = Array.from({ length: weeks }, () => Array(days).fill(0))
    
    if (games.value.length === 0) return heatmap

    const now = new Date()
    // Start of the heatmap (12 weeks ago, start of that week)
    const startDate = new Date(now)
    startDate.setDate(now.getDate() - (weeks * 7))
    // Align to start of week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    games.value.forEach(g => {
      if (!g.date) return
      const gDate = new Date(g.date)
      const diffTime = gDate.getTime() - startDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays >= 0 && diffDays < (weeks * 7)) {
        const weekIdx = Math.floor(diffDays / 7)
        const dayIdx = diffDays % 7
        heatmap[weekIdx][dayIdx]++
      }
    })

    return heatmap
  })

  /**
   * Overall library win rate (0-100).
   */
  const libraryWinRate = computed(() => {
    if (games.value.length === 0) return 0
    
    const myName = userStore.profile?.username?.toLowerCase() || ''
    const myChessCom = userStore.profile?.chessComUsername?.toLowerCase() || ''
    
    const wins = games.value.filter(g => {
      const pWhite = g.white.toLowerCase()
      const isWhite = pWhite === myName || (myChessCom && pWhite === myChessCom)
      return (g.result === '1-0' && isWhite) || (g.result === '0-1' && !isWhite)
    }).length
    
    return Math.round((wins / games.value.length) * 100)
  })

  /**
   * Average Elo of all opponents in the library.
   */
  const avgOpponentElo = computed(() => {
    if (games.value.length === 0) return 0
    
    const myName = userStore.profile?.username?.toLowerCase() || ''
    const myChessCom = userStore.profile?.chessComUsername?.toLowerCase() || ''
    
    let totalElo = 0
    let ratedGames = 0

    games.value.forEach(g => {
      const pWhite = g.white.toLowerCase()
      const isWhite = pWhite === myName || (myChessCom && pWhite === myChessCom)
      const oppRatingStr = isWhite ? g.blackElo : g.whiteElo
      const oppRating = oppRatingStr ? parseInt(oppRatingStr) : null
      
      if (oppRating && !isNaN(oppRating)) {
        totalElo += oppRating
        ratedGames++
      }
    })

    return ratedGames > 0 ? Math.round(totalElo / ratedGames) : 0
  })

  const openingStats = computed(() => {
    const myName = userStore.profile?.username?.toLowerCase() || ''
    const myChessCom = userStore.profile?.chessComUsername?.toLowerCase() || ''
    
    const stats: Record<string, { win: number, loss: number, draw: number, games: number, eco: string, description: string }> = {}
    
    games.value.forEach(g => {
      // Priority: ECO code → stored event name → fallback
      const opName = g.eco
        ? ecoToName(g.eco)
        : (g.event && !g.event.toLowerCase().includes('live chess') && !g.event.toLowerCase().includes('tournament')
           ? g.event
           : 'Unknown Opening')
      
      if (!stats[opName]) {
        stats[opName] = { 
          win: 0, 
          loss: 0, 
          draw: 0, 
          games: 0, 
          eco: g.eco || '',
          description: ecoToDescription(g.eco || '')
        }
      }
      
      const pWhite = g.white.toLowerCase()
      const isWhite = pWhite === myName || (myChessCom && pWhite === myChessCom)
      const result = g.result
      
      stats[opName].games++
      if (result === '1/2-1/2') stats[opName].draw++
      else if ((result === '1-0' && isWhite) || (result === '0-1' && !isWhite)) stats[opName].win++
      else stats[opName].loss++
    })

    return Object.entries(stats).map(([name, s]) => ({
      name,
      games: s.games,
      eco: s.eco,
      description: s.description,
      winPct: Math.round((s.win / s.games) * 100),
      lossPct: Math.round((s.loss / s.games) * 100),
      drawPct: Math.round((s.draw / s.games) * 100)
    })).sort((a, b) => b.games - a.games)
  })

  // --- Filter Engine Logic ---
  const allTags = ref<string[]>(['My Games'])
  
  // Optimized Tag Tally: We calculate this only once games are loaded or significantly changed
  const gamesMap = computed(() => {
    const map = new Map<string, LibraryGame>()
    for (let i = 0; i < games.value.length; i++) {
        map.set(games.value[i].id, games.value[i])
    }
    return map
  })

  function updateTagCloud() {
    const tagsSet = new Set<string>(['My Games'])
    for (let i = 0; i < games.value.length; i++) {
        const g = games.value[i]
        if (g.tags) {
            for (let j = 0; j < g.tags.length; j++) {
                tagsSet.add(g.tags[j])
            }
        }
    }
    allTags.value = Array.from(tagsSet).sort()
  }

  // Watch for game list changes but debounce the heavy tag scanning
  let tagDebounce: any = null
  watch(() => games.value.length, () => {
      if (tagDebounce) clearTimeout(tagDebounce)
      tagDebounce = setTimeout(updateTagCloud, 1000)
  }, { immediate: true })

  const isFiltering = ref(false)
  const filteredGames = ref<LibraryGame[]>([])

  const filterWorker = new Worker(new URL('../workers/libraryFilter.worker.ts', import.meta.url), { type: 'module' })

  filterWorker.onmessage = (e) => {
    filteredGames.value = e.data
    isFiltering.value = false
  }

  function triggerFilter() {
    isFiltering.value = true
    const username = userStore.profile?.username || 'Player'
    
    filterWorker.postMessage({
      type: 'FILTER',
      payload: {
        username,
        searchQuery: searchQuery.value,
        filterResult: filterResult.value,
        selectedTag: selectedTag.value,
        filterPerspective: filterPerspective.value,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value
      }
    })
  }

  // Watch for game list changes to update Worker Cache
  watch(() => games.value, (newGames) => {
      // JSON roundtrip fully strips Vue's reactive Proxy wrappers.
      // toRaw() only unwraps the top-level ref, but each game object
      // inside the array remains a Proxy — which postMessage cannot clone.
      try {
        filterWorker.postMessage({ type: 'SET_GAMES', payload: JSON.parse(JSON.stringify(newGames)) })
      } catch (e) {
        console.warn('[Library] Worker cache sync failed:', e)
      }
      triggerFilter()
  }, { deep: false })

  // Watch for filter changes to trigger worker
  watch([searchQuery, filterResult, selectedTag, filterPerspective, sortBy, sortOrder], () => {
    triggerFilter()
  })


  // Track if the constellation map matches the current filters
  const constellationFingerprint = ref('')
  const isConstellationStale = computed(() => {
    const current = `${filteredGames.value.length}-${searchQuery.value}-${filterResult.value}-${selectedTag.value}-${filterPerspective.value}`
    return constellationFingerprint.value !== current
  })

  // Watch for filter changes to mark the map as stale (without triggering worker explicitly here, to avoid double trigger)
  watch([searchQuery, filterResult, selectedTag, games], () => {
    // We don't automatically re-generate, just ensure the UI knows it's stale
    console.log('[Library] Filters changed, Constellation is now stale.')
  })

  // Watch for sort changes just for persistence
  watch([sortBy, sortOrder], () => {
      localStorage.setItem('vault_sortBy', sortBy.value)
      localStorage.setItem('vault_sortOrder', sortOrder.value)
  })

  // --- The Opening Constellation Logic ---
  const isConstellationActive = ref(false)
  
  // Transforms the flat game list into a recursive trie asynchronously
  async function generateOpeningTree() {
    // SUSPEND while in Analysis View to save CPU for the engine
    if (window.location.pathname.includes('/analysis')) {
        console.log('[Library] Constellation generation suspended (Analysis Lab active)')
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
        constellationFingerprint.value = fingerprint // Sync the fingerprint
    } finally {
        isGeneratingTree.value = false
    }
  }

  // Helper for UI to trigger a seamless perspective change and map update 
  function changePerspectiveAndMap(persp: 'all' | 'white' | 'black') {
      filterPerspective.value = persp
      
      // We must wait for the Web Worker to finish filtering the games before mapping
      const unwatch = watch(isFiltering, (filtering) => {
          if (!filtering) {
              unwatch()
              generateOpeningTree()
          }
      })
  }

  return { 
    games,
    gamesMap,
    openingStats,
    isImporting, 
    importProgress, 
    loadGames, 
    importPgn, 
    importPgnZip,
    importFromUrl,
    importPgnText,
    saveGameToLibrary,
    deleteGame,
    updateGameAnalysis,
    syncCloudGames,
    performanceRating,
    performanceHistory,
    activityHeatmap,
    libraryWinRate,
    avgOpponentElo,
    repairVaultMetadata,
    purgeDuplicates,
    resetLibrary,
    purgeCloudLibrary,
    generateOpeningTree,
    isConstellationActive,
    isGeneratingTree,
    isConstellationStale,
    changePerspectiveAndMap,
    filterPerspective,
    openingTree,
    searchQuery,
    filterResult,
    selectedTag,
    sortBy,
    sortOrder,
    allTags,
    filteredGames,
    isFiltering
  }
})
