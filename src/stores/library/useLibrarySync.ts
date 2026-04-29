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
  initDb: () => Promise<IDBDatabase>,
  isProcessingIntegrity: Ref<boolean>,
  integrityProgress: Ref<number>,
  integrityMessage: Ref<string>
) {


  async function syncCloudGames() {
    const uiStore = useUiStore()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    logger.info('[Sync] Starting cloud synchronization...')
    isProcessingIntegrity.value = true
    integrityProgress.value = 0
    integrityMessage.value = 'Connecting to cloud vault...'
    
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .or(`white_id.eq.${session.user.id},black_id.eq.${session.user.id}`)
      .limit(5000)
    
    if (error || !matches) {
      logger.error('[Sync] Failed to fetch cloud matches', error)
      uiStore.addToast('Cloud sync failed.', 'error')
      isProcessingIntegrity.value = false
      return
    }

    integrityMessage.value = `Downloading ${matches.length} matches...`

    // --- OPTIMIZATION: Use Map for O(1) lookup ---
    const localMap = new Map<string, LibraryGame>()
    games.value.forEach(g => localMap.set(g.id, g))

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

        let existing = localMap.get(stableId)
        
        if (existing) {
          if (!existing.cloudId) {
            existing.cloudId = m.id
            const db = await initDb()
            const tx = db.transaction(['games'], 'readwrite')
            tx.objectStore('games').put(JSON.parse(JSON.stringify(existing)))
            backfillCount++
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
      
      // Update Progress
      const idx = matches.indexOf(m)
      if (idx % 20 === 0) {
        integrityProgress.value = Math.round((idx / matches.length) * 100)
        await new Promise(r => setTimeout(r, 0))
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
      
      uiStore.addToast(msg || 'Vault is up to date.', 'success')
    } else {
      uiStore.addToast('Vault is up to date.', 'info')
    }

    isProcessingIntegrity.value = false
    integrityProgress.value = 100
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
    isProcessingIntegrity.value = true
    integrityProgress.value = 0
    integrityMessage.value = `Migrating ${unlinkedGames.length} games to cloud...`

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
    
    isProcessingIntegrity.value = false
    integrityProgress.value = 100
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

  /**
   * Deletes a single game from the cloud.
   */
  async function deleteCloudGame(cloudId: string) {
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', cloudId)
    
    if (error) {
      logger.error('[Sync] Failed to delete cloud game:', cloudId, error)
      throw error
    }
  }

  return {
    syncCloudGames,
    purgeCloudLibrary,
    deleteCloudGame,
    pushGameAnalysis,
    pushLocalGamesToCloud
  }
}
