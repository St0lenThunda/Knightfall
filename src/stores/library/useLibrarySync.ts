import { type Ref } from 'vue'
import { Chess } from 'chess.js'
import { supabase } from '../../api/supabaseClient'
import { useUserStore } from '../userStore'
import type { LibraryGame } from '../libraryStore'
import { safeLoadPgn } from '../../utils/pgnParser'
import { generateGameFingerprint } from '../../utils/gameFingerprint'
import { logger } from '../../utils/logger'
import { useUiStore } from '../uiStore'

/**
 * Composable for Supabase cloud synchronization logic.
 * Ensures the local library stays in sync with matches stored in the cloud.
 */
export function useLibrarySync(
  games: Ref<LibraryGame[]>,
  initDb: () => Promise<IDBDatabase>
) {

  /**
   * Normalizes a PGN to its core move sequence for reliable matching.
   */
  function normalizePgnForMatching(pgn: string): string {
    // Remove headers, comments, and whitespace
    return pgn
      .replace(/\[.*?\]/g, '') // Remove [Tags]
      .replace(/\{.*?\}/g, '') // Remove {Comments}
      .replace(/\d+\.+\s*/g, '') // Remove move numbers (1. e4 -> e4)
      .replace(/\s+/g, '') // Remove all whitespace
      .trim()
  }

  async function syncCloudGames() {
    const uiStore = useUiStore()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    logger.info('[Sync] Starting cloud synchronization...')
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .or(`white_id.eq.${session.user.id},black_id.eq.${session.user.id}`)
      .limit(5000)
    
    if (error || !matches) {
      logger.error('[Sync] Failed to fetch cloud matches', error)
      uiStore.addToast('Cloud sync failed. Check connection.', 'error')
      return
    }

    logger.info(`[Sync] Cloud Probe: Found ${matches.length} matches in Supabase.`)
    if (matches.length > 0) {
      const sample = matches[0]
      const w = sample.white || sample.metadata?.white || 'Unknown'
      const b = sample.black || sample.metadata?.black || 'Unknown'
      logger.info(`[Sync] Cloud Sample: "${w} vs ${b}"`)
    }

    const chess = new Chess()
    const syncedGames: LibraryGame[] = []
    let backfillCount = 0
    
    for (const m of matches) {
      try {
        safeLoadPgn(chess, m.pgn)
        const headers = chess.header()
        
        const white = (headers['White'] || 'Unknown').trim()
        const black = (headers['Black'] || 'Unknown').trim()
        const stableId = generateGameFingerprint(white, black, m.pgn)

        // --- SMART MATCHING (Hardened) ---
        // 1. Strict Fingerprint Match
        let existing = games.value.find(g => g.id === stableId)
        
        // 2. Molecular Match (Move Sequence Comparison)
        if (!existing) {
          const cloudMoves = normalizePgnForMatching(m.pgn)

          existing = games.value.find(g => {
            if (g.cloudId) return false
            return normalizePgnForMatching(g.pgn) === cloudMoves
          })
        }

        // 3. Metadata Fallback (Case-Insensitive)
        if (!existing) {
          const moveCount = chess.history().length
          existing = games.value.find(g => {
            if (g.cloudId) return false
            
            const nameMatch = (
              g.white.toLowerCase() === white.toLowerCase() && 
              g.black.toLowerCase() === black.toLowerCase()
            ) || (
              g.white.toLowerCase() === black.toLowerCase() && 
              g.black.toLowerCase() === white.toLowerCase()
            )
            
            return nameMatch && g.movesCount === moveCount
          })
        }

        if (existing) {
          if (!existing.cloudId) {
            existing.cloudId = m.id
            const db = await initDb()
            const tx = db.transaction(['games'], 'readwrite')
            tx.objectStore('games').put(JSON.parse(JSON.stringify(existing)))
            backfillCount++
            logger.info(`[Sync] Re-linked local game "${white} vs ${black}" to cloud ID: ${m.id}`)
          }
          continue
        }

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
          tags: ['My Games', 'Synced'],
          cloudId: m.id 
        }
        syncedGames.push(game)
      } catch (e) {
        logger.error('[Sync] Failed to parse game during sync', m.id, e)
      }
    }

    if (syncedGames.length > 0 || backfillCount > 0) {
      const db = await initDb()
      const transaction = db.transaction(['games'], 'readwrite')
      const store = transaction.objectStore('games')
      syncedGames.forEach(g => store.put(g))
      
      if (syncedGames.length > 0) {
        games.value = [...games.value, ...syncedGames]
      }

      const msg = [
        syncedGames.length > 0 ? `Downloaded ${syncedGames.length} new games.` : '',
        backfillCount > 0 ? `Re-linked ${backfillCount} existing games.` : ''
      ].filter(Boolean).join(' ')
      
      uiStore.addToast(msg || 'Vault is already up to date.', 'success')
    } else {
      uiStore.addToast('Vault is already up to date.', 'info')
    }
  }

  /**
   * Pushes all local games missing a cloudId to Supabase.
   * This is essential for migrating locally imported PGNs to the cloud.
   */
  async function pushLocalGamesToCloud() {
    const uiStore = useUiStore()
    const userStore = useUserStore()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      uiStore.addToast('Please log in to push games to the cloud.', 'error')
      return
    }

    const unlinkedGames = games.value.filter(g => !g.cloudId)
    if (unlinkedGames.length === 0) {
      uiStore.addToast('All games are already in the cloud.', 'info')
      return
    }

    logger.info(`[Sync] Migrating ${unlinkedGames.length} games to Supabase...`)
    uiStore.addToast(`Migrating ${unlinkedGames.length} games to cloud...`, 'info')

    let successCount = 0
    const db = await initDb()

    for (const game of unlinkedGames) {
      try {
        const chess = new Chess()
        let white = game.white
        let black = game.black
        
        if (white === 'Unknown' || black === 'Unknown' || !white || !black) {
          try {
            safeLoadPgn(chess, game.pgn)
            const headers = chess.header()
            white = headers['White'] || white || 'Unknown'
            black = headers['Black'] || black || 'Unknown'
            game.white = white
            game.black = black
          } catch (e) {}
        }

        const isWhite = userStore.isMe(white) || (game.tags || []).map(t => t.toLowerCase()).includes('my games')
        
        const { data, error } = await supabase
          .from('matches')
          .insert({
            pgn: game.pgn,
            result: game.result,
            white_id: isWhite ? session.user.id : null,
            black_id: !isWhite ? session.user.id : null,
            eco: game.eco || null,
            opening: game.event || null,
            metadata: {
              white: white,
              black: black,
              acpl: game.acpl,
              missedWins: game.missedWins,
              theoreticalAccuracy: game.theoreticalAccuracy
            }
          })
          .select()
          .single()

        if (error) throw error

        if (data) {
          game.cloudId = data.id
          const tx = db.transaction(['games'], 'readwrite')
          tx.objectStore('games').put(JSON.parse(JSON.stringify(game)))
          successCount++
        }
      } catch (e) {
        logger.error(`[Sync] Failed to push game ${game.id}`, e)
      }
    }

    if (successCount > 0) {
      uiStore.addToast(`Successfully migrated ${successCount} games to cloud.`, 'success')
      games.value = [...games.value] // Trigger reactivity
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

  /**
   * Pushes a game's synthesis results (ACPL, Missed Wins, etc.) to the cloud.
   */
  async function pushGameAnalysis(game: LibraryGame) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // We only push analysis for personal games (where user is white or black)
    // Curated master collections are read-only DNA.
    if (!game.cloudId) {
      logger.info('[Sync] Skipping cloud push - game not linked to Supabase record:', game.id)
      return
    }

    const metadata = {
      acpl: game.acpl,
      missed_wins: game.missedWins,
      theory_accuracy: game.theoreticalAccuracy,
      evals: game.evals,
      analyzed_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('matches')
      .update({ metadata })
      .eq('id', game.cloudId) // ALWAYS use cloudId for Supabase

    if (error) {
      logger.warn('[Sync] Failed to push analysis metadata for', game.id, error)
    } else {
      logger.info('[Sync] Cloud Metadata Synced for', game.id)
    }
  }

  return {
    syncCloudGames,
    purgeCloudLibrary,
    pushGameAnalysis,
    pushLocalGamesToCloud
  }
}
