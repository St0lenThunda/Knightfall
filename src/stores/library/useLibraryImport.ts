import { type Ref } from 'vue'
import { Chess } from 'chess.js'
import type { LibraryGame, MoveEvaluation } from './types'
import { useUserStore } from '../userStore'
import { safeLoadPgn, injectPgnHeaders } from '../../utils/pgnParser'
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
    
    // Robust splitting: Split at [Event " but keep it as the start of the next chunk.
    // We filter out empty chunks that might result from multiple newlines.
    const gameStrings = pgnContent.split(/\[Event\s+"/g).filter(s => s.trim().length > 0).map(s => `[Event "${s}`)
    
    const total = gameStrings.length
    const chess = new Chess()
    const newGames: LibraryGame[] = []

    for (let i = 0; i < total; i++) {
      const raw = gameStrings[i].trim()
      if (!raw) continue

      try {
        safeLoadPgn(chess, raw)
        const headers = chess.header()
        
        const white = headers['White'] || 'Unknown'
        const black = headers['Black'] || 'Unknown'
        
        // Generate a stable ID based on game content to prevent duplicates
        const id = generateGameFingerprint(white, black, raw)
        
        const site = (headers['Site'] || headers['Source'] || '')
        const event = (headers['Event'] || '')
        const autoTags: string[] = []
        
        // Platform Detection
        const lowerEvent = event.toLowerCase()
        const lowerSite = site.toLowerCase()
        const isChessCom = lowerSite.includes('chess.com') || lowerEvent.includes('chess.com')
        const isLiveChess = lowerEvent === 'live chess'
        
        if (isChessCom || isLiveChess) {
          if (isChessCom) autoTags.push('Chess.com')
          if (isLiveChess) autoTags.push('Live Chess')
        }
        
        if (lowerSite.includes('lichess.org') || lowerEvent.includes('lichess.org') || lowerSite.includes('lichess')) {
          autoTags.push('Lichess')
        }
        
        // Identity & Native Detection
        const userStore = useUserStore()
        const isMe = userStore.isMe(white) || userStore.isMe(black)
        const isNative = lowerEvent === 'play vs coach' || lowerEvent === 'knightfall match'
        
        // Force "My Games" ONLY if it is an explicit identity/native match.
        if (!isCurated && (isMe || isNative)) {
          autoTags.push('My Games')
          if (userStore.displayName) autoTags.push(userStore.displayName)
        }
        
        const userSide = userStore.isMe(white) ? 'white' : (userStore.isMe(black) ? 'black' : 'none')

        const result = headers['Result'] || '*'
        
        // --- GUARD: Reject 'Unfinished' games ---
        // Games without a definitive result (* or ?) are just noise and pollute stats.
        if (result === '*' || result === '?' || !result || result === '1/2') {
          continue
        }

        // --- METADATA ENRICHMENT ---
        // We inject the extracted metadata back into the PGN string to ensure 
        // it persists even if the source PGN was missing tags.
        const enrichedPgn = injectPgnHeaders(raw, {
          White: white,
          Black: black,
          WhiteElo: headers['WhiteElo'] || undefined,
          BlackElo: headers['BlackElo'] || undefined,
          Event: event || 'Local Game',
          Date: headers['Date'] || '?',
          Result: result
        })

        const game: LibraryGame = {
          id,
          pgn: enrichedPgn,
          white,
          black,
          result,
          date: headers['Date'] || '?',
          event: event || 'Local Game',
          eco: headers['ECO'] || '',
          openingName: headers['Opening'] || undefined,
          termination: headers['Termination'] || undefined,
          movesCount: chess.history().length,
          addedAt: Date.now(),
          isCurated,
          userSide,
          whiteElo: headers['WhiteElo'] || undefined,
          blackElo: headers['BlackElo'] || undefined,
          tags: [...new Set([...(extraTags.length > 0 ? extraTags : ['Imported']), ...autoTags])]
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
        // Merge without duplicates in memory
        const existingIds = new Set(games.value.map(g => g.id))
        const filteredNew = newGames.filter(g => !existingIds.has(g.id))
        
        games.value = [...games.value, ...filteredNew]
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
      const JSZip = (await import('jszip')).default
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
  async function saveGameToLibrary(pgn: string, tags: string[] = [], telemetry?: { 
    clocks?: number[], 
    evals?: any[],
    antiCheat?: {
      blurCount: number
      suspicionScore: number
      isBusted: boolean
    }
  }, forceSave: boolean = false) {
    const chess = new Chess()
    try {
      safeLoadPgn(chess, pgn)
      const headers = chess.header()
      
      let cleanResult = headers['Result'] || '*'
      if (cleanResult.startsWith('1-0')) cleanResult = '1-0'
      else if (cleanResult.startsWith('0-1')) cleanResult = '0-1'
      else if (cleanResult.startsWith('1/2-1/2') || cleanResult.includes('1/2') || cleanResult.includes('½')) cleanResult = '1/2-1/2'

      // --- GUARD: Reject 'Unfinished' games unless forceSave is true ---
      if (!forceSave && (cleanResult === '*' || cleanResult === '?' || !cleanResult || cleanResult === '1/2')) {
        logger.info('[Import] Skipping unfinished live game.')
        return null
      }

      const white = headers['White'] || 'Unknown'
      const black = headers['Black'] || 'Unknown'
      const stableId = generateGameFingerprint(white, black, pgn)

      const existing = games.value.find(g => g.id === stableId)
      if (existing) return existing
      
      const userStore = useUserStore()
      
      // Enrich the PGN before saving
      const enrichedPgn = injectPgnHeaders(pgn, {
        White: white,
        Black: black,
        WhiteElo: headers['WhiteElo'] || undefined,
        BlackElo: headers['BlackElo'] || undefined,
        Event: headers['Event'] || 'Knightfall Match',
        Date: headers['Date'] || new Date().toISOString().split('T')[0],
        Result: cleanResult
      })

      const game: LibraryGame = {
        id: stableId,
        pgn: enrichedPgn,
        white,
        black,
        result: cleanResult,
        date: headers['Date'] || new Date().toISOString().split('T')[0],
        event: headers['Event'] || 'Knightfall Match',
        eco: headers['ECO'] || '',
        openingName: headers['Opening'] || undefined,
        termination: headers['Termination'] || undefined,
        movesCount: (chess.history() || []).length,
        addedAt: Date.now(),
        whiteElo: headers['WhiteElo'] ?? undefined,
        blackElo: headers['BlackElo'] ?? undefined,
        tags: [...new Set([
          ...(userStore.isMe(white) || userStore.isMe(black) ? ['My Games'] : []),
          ...(userStore.displayName ? [userStore.displayName] : []),
          ...tags
        ])],
        clocks: telemetry?.clocks,
        evals: telemetry?.evals,
        telemetry: telemetry?.antiCheat,
        userSide: userStore.isMe(white) || (userStore.displayName && white.toLowerCase() === userStore.displayName.toLowerCase()) ? 'white' 
               : (userStore.isMe(black) || (userStore.displayName && black.toLowerCase() === userStore.displayName.toLowerCase()) ? 'black' : 'none')
      }

      games.value = [...games.value, JSON.parse(JSON.stringify(game))]
      
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

  /**
   * Fetches a PGN or a zipped archive of PGNs from a remote URL and imports it into the library.
   * Curated master collections (e.g. Capablanca, Kasparov) are stored as .zip files to optimize network transfer.
   * 
   * @param url - The remote endpoint to download the file from
   * @param name - The human-readable name of the collection/source
   */
  async function importFromUrl(url: string, name: string = 'Web Import') {
    isImporting.value = true
    importProgress.value = 0
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`)
      }
      
      // If the URL points to a zip archive, we process it as a binary blob.
      // Otherwise, we read the content directly as raw PGN text.
      if (url.toLowerCase().endsWith('.zip')) {
        const blob = await response.blob()
        await importPgnZip(blob, true, [name, 'Web Import'])
      } else {
        const pgn = await response.text()
        await importPgn(pgn, true, [name, 'Web Import'])
      }
    } catch (e) {
      logger.error('[Import] Failed to fetch PGN from URL', e)
      throw e // Rethrow to let the caller (e.g., UI notifications) handle it
    } finally {
      isImporting.value = false
    }
  }

  return {
    importPgn,
    importPgnZip,
    saveGameToLibrary,
    importFromUrl,
    importFromLichess: async (username: string, limit = 20) => {
      const { fetchRecentLichessGames } = await import('../../api/lichessApi')
      isImporting.value = true
      importProgress.value = 0
      
      try {
        const lichessGames = await fetchRecentLichessGames(username, limit)
        const total = lichessGames.length
        
        const userStore = useUserStore()
        for (let i = 0; i < total; i++) {
          const lg = lichessGames[i]
          const pgn = lg.pgn || ''
          
          const userSide = userStore.isMe(lg.players.white.user?.name) ? 'white' 
                         : (userStore.isMe(lg.players.black.user?.name) ? 'black' : 'none')

          const game: LibraryGame = {
            id: lg.id,
            pgn,
            white: lg.players.white.user?.name || 'Anonymous',
            black: lg.players.black.user?.name || 'Anonymous',
            result: lg.winner === 'white' ? '1-0' : (lg.winner === 'black' ? '0-1' : '1/2-1/2'),
            date: new Date(lg.createdAt).toISOString().split('T')[0],
            event: `Lichess ${lg.speed} Game`,
            eco: lg.opening?.eco || '',
            openingName: lg.opening?.name || undefined,
            movesCount: lg.moves.split(' ').length,
            addedAt: Date.now(),
            whiteElo: lg.players.white.rating.toString(),
            blackElo: lg.players.black.rating.toString(),
            userSide,
            tags: [...new Set([
              ...(username.toLowerCase() === userStore.displayName?.toLowerCase() ? ['My Games'] : []),
              userStore.displayName || username, 
              'Lichess', 
              lg.speed, 
              lg.perf
            ])],
            clocks: lg.clocks,
            evals: lg.evals ? lg.evals.map((e: any): MoveEvaluation | null => {
              if (!e) return null
              return {
                score: e.eval !== undefined ? e.eval : (e.mate !== undefined ? e.mate * 10000 : 0),
                isMate: e.mate !== undefined,
                bestMove: e.best || ''
              }
            }).filter((e): e is MoveEvaluation => e !== null) : undefined,
            isSynthesized: !!(lg.evals && lg.evals.length > 0)
          }

          // Persist
          const db = await initDb()
          const transaction = db.transaction(['games'], 'readwrite')
          transaction.objectStore('games').put(JSON.parse(JSON.stringify(game)))
          
          if (!games.value.some(g => g.id === game.id)) {
            games.value = [...games.value, game]
          }

          importProgress.value = Math.round(((i + 1) / total) * 100)
        }
        logger.info(`[Lichess] Successfully imported ${total} games.`)
      } catch (err) {
        logger.error('[Lichess] Import failed', err)
      } finally {
        isImporting.value = false
      }
    }
  }
}
