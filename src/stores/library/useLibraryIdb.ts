import { type Ref } from 'vue'
import type { LibraryGame } from '../libraryStore'
import { logger } from '../../utils/logger'

/**
 * Composable for IndexedDB persistence logic.
 * Handles the lifecycle of the local KnightfallLibrary database.
 */
export function useLibraryIdb(games: Ref<LibraryGame[]>) {
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
    const activeDb = await initDb()
    return new Promise<void>((resolve) => {
      const transaction = activeDb.transaction(['games'], 'readonly')
      const store = transaction.objectStore('games')
      const request = store.getAll()

      request.onsuccess = () => {
        games.value = request.result || []
        resolve()
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
    
    logger.info('[IDB] Starting vault deduplication and ID upgrade...')
    
    // 1. Gather all current unique games
    const uniqueMap = new Map<string, LibraryGame>()
    let totalScanned = 0

    for (const game of games.value) {
      totalScanned++
      const newId = generateGameFingerprint(game.white, game.black, game.pgn)
      
      const existing = uniqueMap.get(newId)
      if (!existing) {
        uniqueMap.set(newId, { ...game, id: newId })
      } else {
        // Keep the one with more analysis if possible
        const existingEvals = (existing.evals || []).length
        const currentEvals = (game.evals || []).length
        if (currentEvals > existingEvals) {
          uniqueMap.set(newId, { ...game, id: newId })
        }
      }
    }

    const uniqueGames = Array.from(uniqueMap.values())
    const duplicateCount = totalScanned - uniqueGames.length
    
    logger.info(`[IDB] Found ${duplicateCount} duplicates. Upgrading ${uniqueGames.length} games.`)

    // 2. Nuclear Swap: Clear and Re-fill
    const transaction = activeDb.transaction(['games'], 'readwrite')
    const store = transaction.objectStore('games')
    store.clear()
    
    uniqueGames.forEach(g => store.put(JSON.parse(JSON.stringify(g))))

    transaction.oncomplete = () => {
      games.value = uniqueGames
      logger.info('[IDB] Vault upgrade complete.')
    }
  }

  return {
    initDb,
    loadGames,
    deleteGame,
    persistGameUpdate,
    resetLibrary,
    purgeDuplicates
  }
}
