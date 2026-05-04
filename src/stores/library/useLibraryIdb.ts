import { type Ref, type ShallowRef } from 'vue'
import type { LibraryGame } from '../libraryStore'

/**
 * useLibraryIdb: Local persistence pillar for the Neural Vault.
 * Manages the IndexedDB lifecycle and atomic transactions.
 */
export function useLibraryIdb(
  games: ShallowRef<LibraryGame[]>,
  isProcessingIntegrity: Ref<boolean>,
  integrityProgress: Ref<number>,
  integrityMessage: Ref<string>
) {
  let db: IDBDatabase | null = null

  async function initDb(): Promise<IDBDatabase> {
    if (db) return db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('KnightfallLibrary', 4)

      request.onupgradeneeded = (event: any) => {
        const activeDb = event.target.result
        if (!activeDb.objectStoreNames.contains('games')) {
          activeDb.createObjectStore('games', { keyPath: 'id' })
        }
      }

      request.onsuccess = () => {
        db = request.result
        resolve(db)
      }

      request.onerror = () => reject(request.error)
    })
  }

  async function loadGames(): Promise<LibraryGame[]> {
    const activeDb = await initDb()
    return new Promise((resolve, reject) => {
      const transaction = activeDb.transaction(['games'], 'readonly')
      const store = transaction.objectStore('games')
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Fetches ALL personal games (white or black) without pagination.
   * This ensures stats and personal lists are always accurate even in 
   * massive vaults.
   */
  async function loadPersonalGames(): Promise<LibraryGame[]> {
    const activeDb = await initDb()
    return new Promise((resolve, reject) => {
      const transaction = activeDb.transaction(['games'], 'readonly')
      const store = transaction.objectStore('games')
      const results: LibraryGame[] = []
      
      const request = store.openCursor()
      request.onsuccess = (event: any) => {
        const cursor = event.target.result
        if (cursor) {
          const game = cursor.value as LibraryGame
          if (game.userSide === 'white' || game.userSide === 'black') {
            results.push(game)
          }
          cursor.continue()
        } else {
          resolve(results)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Returns the total number of records in the vault.
   * Essential for calculating pagination metadata.
   */
  async function getGameCount(): Promise<number> {
    const activeDb = await initDb()
    return new Promise((resolve, reject) => {
      const transaction = activeDb.transaction(['games'], 'readonly')
      const store = transaction.objectStore('games')
      const request = store.count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Fetches a specific chunk of games from the database.
   * We use a cursor to efficiently skip to the offset without loading 
   * the entire dataset into memory.
   * 
   * @param limit - Max number of games to return
   * @param offset - Number of games to skip
   */
  async function loadGamesPaged(limit: number, offset: number): Promise<LibraryGame[]> {
    const activeDb = await initDb()
    return new Promise((resolve, reject) => {
      const transaction = activeDb.transaction(['games'], 'readonly')
      const store = transaction.objectStore('games')
      const results: LibraryGame[] = []
      let hasSkipped = false

      const request = store.openCursor(null, 'prev') // Load newest first

      request.onsuccess = (event: any) => {
        const cursor = event.target.result
        if (!cursor) {
          resolve(results)
          return
        }

        // Skip to the starting offset
        if (offset > 0 && !hasSkipped) {
          hasSkipped = true
          cursor.advance(offset)
          return
        }

        // Collect results up to the limit
        results.push(cursor.value)
        if (results.length < limit) {
          cursor.continue()
        } else {
          resolve(results)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  async function deleteGame(id: string) {
    const activeDb = await initDb()
    const transaction = activeDb.transaction(['games'], 'readwrite')
    const store = transaction.objectStore('games')
    store.delete(id)
    games.value = games.value.filter(g => g.id !== id)
  }

  async function deleteGames(ids: string[]) {
    const activeDb = await initDb()
    const transaction = activeDb.transaction(['games'], 'readwrite')
    const store = transaction.objectStore('games')
    ids.forEach(id => store.delete(id))
    games.value = games.value.filter(g => !ids.includes(g.id))
  }

  async function persistGameUpdate(game: LibraryGame) {
    const activeDb = await initDb()
    const transaction = activeDb.transaction(['games'], 'readwrite')
    const store = transaction.objectStore('games')
    store.put(JSON.parse(JSON.stringify(game)))
  }

  async function resetLibrary() {
    if (db) {
      db.close()
      db = null
    }
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('KnightfallLibrary')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
    games.value = []
    await initDb()
  }

  async function purgeDuplicates(): Promise<number> {
    const { generateGameFingerprint } = await import('../../utils/gameFingerprint')
    const activeDb = await initDb()
    
    isProcessingIntegrity.value = true
    integrityProgress.value = 0
    integrityMessage.value = 'Scanning for duplicates...'
    
    const uniqueMap = new Map<string, LibraryGame>()
    const totalScanned = games.value.length

    games.value.forEach((game, index) => {
      const white = (game.white || 'Unknown').trim()
      const black = (game.black || 'Unknown').trim()
      const newId = generateGameFingerprint(white, black, game.pgn)
      
      if (!uniqueMap.has(newId)) {
        uniqueMap.set(newId, { ...game, id: newId, white, black })
      } else {
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
    
    const transaction = activeDb.transaction(['games'], 'readwrite')
    const store = transaction.objectStore('games')
    store.clear()
    
    uniqueGames.forEach((g, i) => {
      store.put(JSON.parse(JSON.stringify(g)))
      if (i % 50 === 0) integrityProgress.value = 40 + Math.round((i / uniqueGames.length) * 60)
    })

    return new Promise((resolve) => {
      transaction.oncomplete = () => {
        games.value = uniqueGames
        isProcessingIntegrity.value = false
        integrityProgress.value = 100
        resolve(duplicateCount)
      }
    })
  }

  return {
    initDb,
    loadGames,
    getGameCount,
    loadGamesPaged,
    deleteGame,
    deleteGames,
    persistGameUpdate,
    resetLibrary,
    purgeDuplicates,
    loadPersonalGames
  }
}
