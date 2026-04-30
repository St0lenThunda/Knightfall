import { type Ref } from 'vue'
import type { LibraryGame } from './types'
import { logger } from '../../utils/logger'

/**
 * Composable for IndexedDB persistence logic.
 * Handles the lifecycle of the local KnightfallLibrary database.
 */
export function useLibraryIdb(
  games: Ref<LibraryGame[]>,
  isProcessingIntegrity: Ref<boolean>,
  integrityProgress: Ref<number>,
  integrityMessage: Ref<string>
) {
  let db: IDBDatabase | null = null

  /**
   * Initializes the IndexedDB database.
   * Creates the 'games' store if it doesn't exist.
   */
  async function initDb(): Promise<IDBDatabase> {
    if (db) return db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('KnightfallLibrary', 1)

      request.onerror = () => {
        logger.error('[IDB] Failed to open database')
        reject('IDB Error')
      }

      request.onsuccess = () => {
        db = request.result
        resolve(db)
      }

      request.onupgradeneeded = (event: any) => {
        const upgradedDb = event.target.result
        if (!upgradedDb.objectStoreNames.contains('games')) {
          const store = upgradedDb.createObjectStore('games', { keyPath: 'id' })
          store.createIndex('date', 'date', { unique: false })
          store.createIndex('addedAt', 'addedAt', { unique: false })
        }
      }
    })
  }

  /**
   * Loads all games from IndexedDB into memory.
   */
  async function loadGames() {
    const startTime = Date.now()
    const activeDb = await initDb()
    
    return new Promise<void>((resolve) => {
      const transaction = activeDb.transaction(['games'], 'readonly')
      const store = transaction.objectStore('games')
      const request = store.getAll()

      request.onsuccess = () => {
        const result = request.result || []
        games.value = result
        
        // Update Admin Telemetry
        import('../adminStore').then(({ useAdminStore }) => {
          const adminStore = useAdminStore()
          adminStore.coldBootLatency = Date.now() - startTime
          
          // Rough estimate of DB size: Stringified PGN + Metadata overhead
          const totalBytes = result.reduce((acc, g) => {
            return acc + (g.pgn.length * 2) + 500 // 2 bytes per char + approx metadata overhead
          }, 0)
          adminStore.vaultSizeBytes = totalBytes
        })
        
        resolve()
      }
    })
  }

  /**
   * Gets the total number of games in the vault.
   */
  async function getGameCount(): Promise<number> {
    const activeDb = await initDb()
    return new Promise((resolve) => {
      const transaction = activeDb.transaction(['games'], 'readonly')
      const store = transaction.objectStore('games')
      const request = store.count()
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Loads a slice of games from IndexedDB using cursors for maximum efficiency.
   * Optimized for large vaults where getAll() would block the main thread.
   */
  async function loadGamesPaged(limit: number, offset: number, sortBy = 'addedAt', sortOrder: 'asc' | 'desc' = 'desc'): Promise<LibraryGame[]> {
    const activeDb = await initDb()
    return new Promise((resolve) => {
      const transaction = activeDb.transaction(['games'], 'readonly')
      const store = transaction.objectStore('games')
      const index = store.index(sortBy)
      const direction = sortOrder === 'desc' ? 'prev' : 'next'
      
      const results: LibraryGame[] = []
      let skipped = 0
      const request = index.openCursor(null, direction)

      request.onsuccess = (event: any) => {
        const cursor = event.target.result
        if (!cursor) {
          resolve(results)
          return
        }

        if (skipped < offset) {
          skipped++
          cursor.continue()
          return
        }

        if (results.length < limit) {
          results.push(cursor.value)
          cursor.continue()
        } else {
          resolve(results)
        }
      }
    })
  }

  /**
   * Deletes a single game from IndexedDB and updates memory.
   */
  async function deleteGame(id: string) {
    const activeDb = await initDb()
    const transaction = activeDb.transaction(['games'], 'readwrite')
    const store = transaction.objectStore('games')
    store.delete(id)

    transaction.oncomplete = () => {
      games.value = games.value.filter(g => g.id !== id)
    }
  }

  /**
   * Updates a game's analysis cache in IndexedDB.
   */
  async function persistGameUpdate(game: LibraryGame) {
    const activeDb = await initDb()
    const transaction = activeDb.transaction(['games'], 'readwrite')
    const store = transaction.objectStore('games')
    // Clone to strip Proxy wrappers
    store.put(JSON.parse(JSON.stringify(game)))
  }

  /**
   * Nuclear option: completely destroys and recreates the database.
   */
  async function resetLibrary() {
    logger.info('[IDB] Resetting library...')
    if (db) {
      db.close()
      db = null
    }

    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('KnightfallLibrary')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      req.onblocked = () => {
        logger.warn('[IDB] Reset blocked by other tabs')
        resolve()
      }
    })

    games.value = []
    await initDb()
  }

  /**
   * Identifies and removes duplicate games based on the new high-precision fingerprint.
   * This also "upgrades" all existing games to the new ID standard.
   */
  async function purgeDuplicates() {
    const { generateGameFingerprint } = await import('../../utils/gameFingerprint')
    const activeDb = await initDb()
    
    isProcessingIntegrity.value = true
    integrityProgress.value = 0
    integrityMessage.value = 'Scanning for duplicates...'
    
    const uniqueMap = new Map<string, LibraryGame>()
    const totalScanned = games.value.length

    games.value.forEach((game, index) => {
      // 1. Upgrade legacy ID or fix missing player names
      const white = (game.white || 'Unknown').trim()
      const black = (game.black || 'Unknown').trim()
      const newId = generateGameFingerprint(white, black, game.pgn)
      
      if (!uniqueMap.has(newId)) {
        uniqueMap.set(newId, { ...game, id: newId, white, black })
      } else {
        // Tie-breaker: Keep the one with more analysis/clocks
        const existing = uniqueMap.get(newId)!
        const existingEvals = (existing.evals || []).length
        const currentEvals = (game.evals || []).length
        if (currentEvals > existingEvals) {
          uniqueMap.set(newId, { ...game, id: newId, white, black })
        }
      }
      
      if (index % 100 === 0) integrityProgress.value = Math.round((index / totalScanned) * 40)
    })

    const uniqueGames = Array.from(uniqueMap.values())
    const duplicateCount = totalScanned - uniqueGames.length
    
    integrityMessage.value = `Upgrading ${uniqueGames.length} entries...`
    logger.info(`[IDB] Found ${duplicateCount} duplicates. Upgrading ${uniqueGames.length} games.`)

    // 2. Nuclear Swap: Clear and Re-fill
    const transaction = activeDb.transaction(['games'], 'readwrite')
    const store = transaction.objectStore('games')
    store.clear()
    
    uniqueGames.forEach((g, i) => {
      store.put(JSON.parse(JSON.stringify(g)))
      if (i % 50 === 0) integrityProgress.value = 40 + Math.round((i / uniqueGames.length) * 60)
    })

    return new Promise<void>((resolve) => {
      transaction.oncomplete = () => {
        games.value = uniqueGames
        isProcessingIntegrity.value = false
        integrityProgress.value = 100
        logger.info('[IDB] Vault upgrade complete.')
        resolve()
      }
    })
  }

  return {
    initDb, // Exported for sub-composables
    loadGames,
    getGameCount,
    loadGamesPaged,
    deleteGame,
    persistGameUpdate,
    resetLibrary,
    purgeDuplicates
  }
}
