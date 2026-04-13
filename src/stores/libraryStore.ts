import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { Chess } from 'chess.js'
import JSZip from 'jszip'

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
                tags: extraTags
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
        tags: [...new Set(['My Games', ...tags])]
      }
      
      if (!db) await initDb()
      const transaction = db!.transaction(['games'], 'readwrite')
      const store = transaction.objectStore('games')
      store.put(game)
      
      transaction.oncomplete = () => {
        games.value.push(game)
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

  async function updateGameAnalysis(id: string, fen: string, text: string) {
    const game = games.value.find(g => g.id === id)
    if (!game) return

    if (!game.analysisCache) game.analysisCache = {}
    game.analysisCache[fen] = text

    // Persist to IDB
    if (!db) await initDb()
    const transaction = db!.transaction(['games'], 'readwrite')
    const store = transaction.objectStore('games')
    store.put({ ...game }) // Spread to ensure plain object
  }

  // --- Filter Engine Logic ---
  const allTags = computed(() => {
    const tags = new Set<string>()
    games.value.forEach(g => {
        if (g.tags) g.tags.forEach(t => tags.add(t))
    })
    return Array.from(tags).sort()
  })

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
  // Transforms the flat game list into a recursive trie asynchronously
  async function generateOpeningTree() {
    if (isGeneratingTree.value) return 
    isGeneratingTree.value = true
    
    const root: OpeningNode = { san: 'Root', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', weight: filteredGames.value.length, children: {} }
    const chess = new Chess()
    
    // Process in chunks to keep the UI snappy
    const CHUNK_SIZE = 50
    const currentGames = filteredGames.value
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
    generateOpeningTree,
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
