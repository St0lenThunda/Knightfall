import { type Ref } from 'vue'
import { Chess } from 'chess.js'
import JSZip from 'jszip'
import type { LibraryGame } from '../libraryStore'
import { safeLoadPgn } from '../../utils/pgnParser'
import { generateGameFingerprint } from '../../utils/gameFingerprint'
import { logger } from '../../utils/logger'

/**
 * Composable for PGN import and game saving logic.
 * Handles parsing, deduplication, and bulk insertion.
 */
export function useLibraryImport(
  games: Ref<LibraryGame[]>,
  isImporting: Ref<boolean>,
  importProgress: Ref<number>,
  initDb: () => Promise<IDBDatabase>
) {

  /**
   * Bulk imports a PGN string containing one or many games.
   */
  async function importPgn(pgnContent: string, isCurated = false, extraTags: string[] = []) {
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
        logger.error('[Import] Failed to parse game at index', i, e)
      }

      if (i % 10 === 0) {
        importProgress.value = Math.round((i / total) * 100)
        // Allow UI to breathe
        await new Promise(r => setTimeout(r, 0))
      }
    }

    const db = await initDb()
    const transaction = db.transaction(['games'], 'readwrite')
    const store = transaction.objectStore('games')
    newGames.forEach(g => store.put(g))
    
    return new Promise<void>((resolve) => {
      transaction.oncomplete = () => {
        games.value = [...games.value, ...newGames]
        isImporting.value = false
        importProgress.value = 100
        resolve()
      }
    })
  }

  /**
   * Imports games from a ZIP archive of PGN files.
   */
  async function importPgnZip(file: File | Blob, isCurated = true, tags: string[] = []) {
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
      logger.error('[Import] Failed to unzip PGN archive', e)
    } finally {
      isImporting.value = false
    }
  }

  /**
   * Saves a single game (e.g., from a live session) to the library.
   * Handles deduplication via fingerprinting.
   */
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

      if (games.value.some(g => g.id === stableId)) return

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

      games.value.push(JSON.parse(JSON.stringify(game)))
      
      const db = await initDb()
      const transaction = db.transaction(['games'], 'readwrite')
      const store = transaction.objectStore('games')
      store.put(JSON.parse(JSON.stringify(game)))
      
      return game
    } catch (e) {
      logger.error('[Import] Failed to save game', e)
      return null
    }
  }

  return {
    importPgn,
    importPgnZip,
    saveGameToLibrary
  }
}
