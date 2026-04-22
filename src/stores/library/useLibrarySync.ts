import { type Ref } from 'vue'
import { Chess } from 'chess.js'
import { supabase } from '../../api/supabaseClient'
import type { LibraryGame } from '../libraryStore'
import { safeLoadPgn } from '../../utils/pgnParser'
import { generateGameFingerprint } from '../../utils/gameFingerprint'
import { logger } from '../../utils/logger'

/**
 * Composable for Supabase cloud synchronization logic.
 * Ensures the local library stays in sync with matches stored in the cloud.
 */
export function useLibrarySync(
  games: Ref<LibraryGame[]>,
  initDb: () => Promise<IDBDatabase>
) {

  /**
   * Fetches matches from Supabase and merges them into the local library.
   */
  async function syncCloudGames() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .or(`white_id.eq.${session.user.id},black_id.eq.${session.user.id}`)
    
    if (error || !matches) {
      logger.error('[Sync] Failed to fetch cloud matches', error)
      return
    }

    const chess = new Chess()
    const syncedGames: LibraryGame[] = []
    const existingIds = new Set(games.value.map(g => g.id))
    
    for (const m of matches) {
      try {
        safeLoadPgn(chess, m.pgn)
        const headers = chess.header()
        
        const white = headers['White'] || 'Unknown'
        const black = headers['Black'] || 'Unknown'
        const stableId = generateGameFingerprint(white, black, m.pgn)

        if (existingIds.has(stableId)) continue

        const game: LibraryGame = {
          id: stableId,
          pgn: m.pgn,
          white,
          black,
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
        logger.error('[Sync] Failed to parse game during sync', m.id, e)
      }
    }

    if (syncedGames.length > 0) {
      const db = await initDb()
      const transaction = db.transaction(['games'], 'readwrite')
      const store = transaction.objectStore('games')
      syncedGames.forEach(g => store.put(g))
      
      return new Promise<void>((resolve) => {
        transaction.oncomplete = () => {
          games.value = [...games.value, ...syncedGames]
          resolve()
        }
      })
    }
  }

  /**
   * Aggressively wipes the cloud matches for the current user.
   */
  async function purgeCloudLibrary() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    logger.info('[Sync] Purging cloud library...')
    const { error } = await supabase
      .from('matches')
      .delete()
      .or(`white_id.eq.${session.user.id},black_id.eq.${session.user.id}`)

    if (error) {
      logger.error('[Sync] Cloud purge failed', error)
      throw error
    }
  }

  return {
    syncCloudGames,
    purgeCloudLibrary
  }
}
