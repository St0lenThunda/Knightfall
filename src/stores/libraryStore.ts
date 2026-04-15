import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { Chess } from 'chess.js'
import JSZip from 'jszip'
import { supabase } from '../api/supabaseClient'

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
  
  // FILTER STATE (Centralized)
  const searchQuery = ref('')
  const filterResult = ref('all')
  const selectedTag = ref('all')
  const sortBy = ref(localStorage.getItem('vault_sortBy') || 'addedAt')
  const sortOrder = ref(localStorage.getItem('vault_sortOrder') || 'desc')
  
  let db: IDBDatabase | null = null

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
        generateOpeningTree() // Background task
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
            chess.loadPgn(raw)
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
        generateOpeningTree() // Background task
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
      chess.loadPgn(pgn)
      const headers = chess.header()
      
      let cleanResult = headers['Result'] || '*'
      if (cleanResult.startsWith('1-0')) cleanResult = '1-0'
      else if (cleanResult.startsWith('0-1')) cleanResult = '0-1'
      else if (cleanResult.startsWith('1/2-1/2') || cleanResult.includes('1/2') || cleanResult.includes('½')) cleanResult = '1/2-1/2'

      const game: LibraryGame = {
        id: crypto.randomUUID(),
        pgn: pgn,
        white: headers['White'] || 'Unknown',
        black: headers['Black'] || 'Unknown',
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
      
      if (!db) await initDb()
      const transaction = db!.transaction(['games'], 'readwrite')
      const store = transaction.objectStore('games')
      store.put(game)
      
      transaction.oncomplete = () => {
        // Use spread to avoid proxy issues, but JSON clone is safer for nested data
        games.value.push(JSON.parse(JSON.stringify(game)))
        generateOpeningTree()
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
      // Avoid duplicates: check if ID exists locally (O(1) with Set)
      if (existingIds.has(m.id)) continue

      try {
        chess.loadPgn(m.pgn)
        const headers = chess.header()
        
        const game: LibraryGame = {
          id: m.id, // Use Supabase UUID as local ID for stability
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

  const filteredGames = computed(() => {
    let result = games.value.filter(g => {
        const matchesSearch = 
            g.white.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            g.black.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            g.event.toLowerCase().includes(searchQuery.value.toLowerCase())
        
        const matchesResult = filterResult.value === 'all' || g.result === filterResult.value
        const matchesTag = selectedTag.value === 'all' || (g.tags && g.tags.includes(selectedTag.value))
        
        return matchesSearch && matchesResult && matchesTag
    })

    result.sort((a,b) => {
        let valA: any, valB: any
        switch(sortBy.value) {
            case 'date': valA = a.date; valB = b.date; break
            case 'movesCount': valA = a.movesCount; valB = b.movesCount; break
            case 'player': valA = a.white; valB = b.white; break
            case 'opening': valA = a.eco; valB = b.eco; break
            default: valA = a.addedAt; valB = b.addedAt
        }
        if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
        if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
        return 0
    })
    return result
  })

  // DEBOUNCED SYNC
  let debounceTimer: any = null
  watch([searchQuery, filterResult, selectedTag], () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
          generateOpeningTree()
      }, 500)
  })

  // Watch for sort changes just for persistence
  watch([sortBy, sortOrder], () => {
      localStorage.setItem('vault_sortBy', sortBy.value)
      localStorage.setItem('vault_sortOrder', sortOrder.value)
  })

  // --- The Opening Constellation Logic ---
  let lastProcessedFingerprint = ''
  
  const isConstellationActive = ref(false)
  
  // Transforms the flat game list into a recursive trie asynchronously
  async function generateOpeningTree() {
    if (!isConstellationActive.value) return

    // SUSPEND while in Analysis View to save CPU for the engine
    if (window.location.pathname.includes('/analysis')) {
        console.log('[Library] Constellation generation suspended (Analysis Lab active)')
        return
    }
    
    const currentGames = filteredGames.value
    const fingerprint = `${currentGames.length}-${currentGames[0]?.id || ''}-${searchQuery.value}-${selectedTag.value}`
    
    if (fingerprint === lastProcessedFingerprint) return
    if (isGeneratingTree.value) return 
    
    isGeneratingTree.value = true
    lastProcessedFingerprint = fingerprint
    
    const root: OpeningNode = { san: 'Root', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', weight: currentGames.length, children: {} }
    const chess = new Chess()
    
    // Process in chunks to keep the UI snappy
    const CHUNK_SIZE = 100
    const total = currentGames.length

    for (let i = 0; i < total; i++) {
        const game = currentGames[i]
        try {
            chess.loadPgn(game.pgn)
            const history = chess.history({ verbose: true })
            let currentNode = root
            const depth = Math.min(history.length, 10)
            
            for (let j = 0; j < depth; j++) {
                const move = history[j]
                const san = move.san
                const fen = move.after
                
                if (!currentNode.children[san]) {
                    currentNode.children[san] = { san, fen, weight: 0, children: {} }
                }
                
                currentNode.children[san].weight++
                currentNode = currentNode.children[san]
            }
        } catch (e) { /* skip */ }

        // Yield to main thread
        if (i > 0 && i % CHUNK_SIZE === 0) {
            await new Promise(r => setTimeout(r, 0))
        }
    }

    openingTree.value = root
    isGeneratingTree.value = false
  }

  return { 
    games,
    gamesMap,
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
    repairVaultMetadata,
    generateOpeningTree,
    isConstellationActive,
    isGeneratingTree,
    openingTree,
    searchQuery,
    filterResult,
    selectedTag,
    sortBy,
    sortOrder,
    allTags,
    filteredGames
  }
})
