import { type Ref } from 'vue'
import { Chess } from 'chess.js'
import { supabase } from '../../api/supabaseClient'
import { useUserStore } from '../userStore'
import { useCurriculumStore } from '../curriculumStore'
import type { LibraryGame } from './types'
import { safeLoadPgn } from '../../utils/pgnParser'
import { generateGameFingerprint } from '../../utils/gameFingerprint'
import { fetchCloudEval, fetchMasterMoves, isRateLimited } from '../../api/lichessApi'
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

    logger.info('[Sync] Checking cloud vault for updates...')
    
    // PASS 1: Fetch only the UUIDs from the cloud to determine the delta
    const { data: cloudRefs, error } = await supabase
      .from('matches')
      .select('id')
      .or(`white_id.eq.${session.user.id},black_id.eq.${session.user.id}`)
      .limit(5000)
    
    if (error || !cloudRefs) {
      logger.error('[Sync] Failed to fetch cloud references', error)
      // We don't toast here on auto-sync to avoid annoyance, just log
      return
    }

    // Determine which games we already have synced locally
    const localMap = new Map<string, LibraryGame>()
    const localCloudIds = new Set<string>()
    games.value.forEach(g => {
      localMap.set(g.id, g)
      if (g.cloudId) localCloudIds.add(g.cloudId)
    })

    const missingIds = cloudRefs.map(m => m.id).filter(id => !localCloudIds.has(id))
    
    if (missingIds.length === 0) {
      logger.info('[Sync] Local vault is already 100% synchronized with the cloud.')
      return
    }

    // NEW: Only trigger the loading overlay if we actually have work to do
    isProcessingIntegrity.value = true
    integrityProgress.value = 0
    integrityMessage.value = `Downloading ${missingIds.length} new matches...`

    // PASS 2: Download only the missing PGN payloads in chunks (to prevent URI Too Long errors)
    const CHUNK_SIZE = 100
    const fetchedMatches = []
    
    for (let i = 0; i < missingIds.length; i += CHUNK_SIZE) {
      const chunk = missingIds.slice(i, i + CHUNK_SIZE)
      const { data: matchChunk, error: chunkError } = await supabase
        .from('matches')
        .select('*')
        .in('id', chunk)
        
      if (!chunkError && matchChunk) {
        fetchedMatches.push(...matchChunk)
      }
      integrityProgress.value = Math.round(((i + chunk.length) / missingIds.length) * 50) // First 50% is downloading
    }

    integrityMessage.value = `Parsing ${fetchedMatches.length} matches...`

    const chess = new Chess()
    const syncedGames: LibraryGame[] = []
    let backfillCount = 0
    
    for (let i = 0; i < fetchedMatches.length; i++) {
      const m = fetchedMatches[i]
      try {
        safeLoadPgn(chess, m.pgn)
        const headers = chess.header()
        
        const white = (headers['White'] || 'Unknown').trim()
        const black = (headers['Black'] || 'Unknown').trim()
        const stableId = generateGameFingerprint(white, black, m.pgn)

        let existing = localMap.get(stableId)
        const meta = m.metadata || {}
        const cloudIsSynthesized = !!meta.analyzed_at || (meta.evals && meta.evals.length > 0)
        
        if (existing) {
          let modified = false
          if (!existing.cloudId) {
            existing.cloudId = m.id
            modified = true
          }
          // Backfill analysis if cloud has it but local doesn't
          if (cloudIsSynthesized && !existing.isSynthesized) {
            existing.isSynthesized = true
            existing.evals = meta.evals
            existing.acpl = meta.acpl
            existing.missedWins = meta.missed_wins
            existing.theoreticalAccuracy = meta.theory_accuracy
            modified = true
          }
          
          if (modified) {
            const db = await initDb()
            const tx = db.transaction(['games'], 'readwrite')
            tx.objectStore('games').put(JSON.parse(JSON.stringify(existing)))
            backfillCount++
          }
          continue
        }

        const movesCount = chess.history().length
        
        const result = m.result || headers['Result'] || '*'
        
        // --- GUARD: Reject 'Unfinished' games ---
        if (result === '*' || result === '?' || !result || result === '1/2') {
          logger.info(`[Sync] Skipping unfinished game ${m.id} (Result: ${result})`)
          continue
        }

        const userStore = useUserStore()
        const userSide = userStore.isMe(white) ? 'white' : (userStore.isMe(black) ? 'black' : 'none')
        const isMe = userSide !== 'none'

        const autoTags: string[] = ['Synced']
        const lowerPgn = m.pgn.toLowerCase()
        const lowerEvent = (headers['Event'] || '').toLowerCase()
        
        if (lowerPgn.includes('chess.com') || lowerEvent.includes('live chess')) {
          autoTags.push('Chess.com')
        }
        if (lowerPgn.includes('lichess.org') || lowerPgn.includes('lichess')) {
          autoTags.push('Lichess')
        }
        if (isMe) {
          autoTags.push('My Games')
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
          movesCount,
          addedAt: Date.now(),
          whiteElo: headers['WhiteElo'] ?? undefined,
          blackElo: headers['BlackElo'] ?? undefined,
          tags: [...new Set(autoTags)],
          userSide,
          isSynthesized: cloudIsSynthesized,
          evals: meta.evals,
          acpl: meta.acpl,
          missedWins: meta.missed_wins,
          theoreticalAccuracy: meta.theory_accuracy,
          cloudId: m.id 
        }
        syncedGames.push(game)
      } catch (e) {
        logger.error('[Sync] Failed to parse game during sync', m.id, e)
      }
      
      // Update Progress
      if (i % 20 === 0) {
        integrityProgress.value = 50 + Math.round((i / fetchedMatches.length) * 50)
        await new Promise(r => setTimeout(r, 0))
      }
    }

    if (syncedGames.length > 0 || backfillCount > 0) {
      const db = await initDb()
      const transaction = db.transaction(['games'], 'readwrite')
      const store = transaction.objectStore('games')
      syncedGames.forEach(g => store.put(g))
      
      if (syncedGames.length > 0) {
        // --- PREVENTION: Ensure absolute uniqueness before updating store ---
        const allGames = [...games.value, ...syncedGames]
        const uniqueMap = new Map()
        allGames.forEach(g => uniqueMap.set(g.id, g))
        games.value = Array.from(uniqueMap.values())
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

    // APPROACH 4 & 1: Auto-trigger intelligence pass after sync
    if (syncedGames.length > 0) {
      analyzeLibraryWithCloud(15)
    }
  }

  /**
   * Internal helper to push a single game to Supabase.
   * This is used by both bulk migration and immediate analysis sync.
   */
  async function pushSingleGameToCloud(game: LibraryGame): Promise<boolean> {
    const userStore = useUserStore()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return false

    try {
      const chess = new Chess()
      let white = game.white
      let black = game.black
      
      // Ensure we have correct names for the payload
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
          metadata: {
            white: white,
            black: black,
            eco: game.eco || null,
            opening: game.event || null,
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
        const db = await initDb()
        const tx = db.transaction(['games'], 'readwrite')
        tx.objectStore('games').put(JSON.parse(JSON.stringify(game)))
        return true
      }
    } catch (e) {
      logger.error(`[Sync] Failed to push game ${game.id} to cloud`, e)
    }
    return false
  }

  /**
   * Pushes all local games missing a cloudId to Supabase.
   * This is essential for migrating locally imported PGNs to the cloud.
   */
  async function pushLocalGamesToCloud() {
    const uiStore = useUiStore()
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
    for (const game of unlinkedGames) {
      const success = await pushSingleGameToCloud(game)
      if (success) successCount++
      
      // Throttled update to keep UI alive
      integrityProgress.value = Math.round((successCount / unlinkedGames.length) * 100)
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
   * If the game isn't in the cloud yet, it pushes the whole game first.
   */
  async function pushGameAnalysis(game: LibraryGame) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // If no cloudId, we must first "onboard" this game to Supabase
    if (!game.cloudId) {
      logger.info('[Sync] Game not in cloud. Performing initial upload before analysis push...', game.id)
      const success = await pushSingleGameToCloud(game)
      if (!success || !game.cloudId) return 
    }

    const metadata = {
      acpl: game.acpl,
      missed_wins: game.missedWins,
      theory_accuracy: game.theoreticalAccuracy,
      evals: game.evals,
      move_tags: game.moveTags,
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

  /**
   * APPROACH 4 & 1: Cloud Intelligence Pass
   * Analyzes games without analysis data using Lichess Cloud Evals.
   * Also identifies blunders for the Shadow Realm (Approach 1).
   */
  async function analyzeLibraryWithCloud(limit = 10) {
    const unanalyzed = games.value.filter(g => !g.isSynthesized).slice(0, limit)
    if (unanalyzed.length === 0) return

    logger.info(`[Intel Hub] Starting Cloud Pass for ${unanalyzed.length} games...`)
    
    const db = await initDb()
    const chess = new Chess()
    const curriculum = useCurriculumStore()

    for (const game of unanalyzed) {
      try {
        safeLoadPgn(chess, game.pgn)
        const moves = chess.history({ verbose: true })
        
        let totalCpl = 0
        let blunders: any[] = []
        let theoryMoves = 0
        
        // Initialize evaluations list if not present
        if (!game.evals) game.evals = []
        
        // Intelligence pass on each move
        for (let i = 0; i < Math.min(moves.length, 30); i++) {
          const move = moves[i]
          const fen = move.after
          
          // 1. Cloud Eval Check (TRY CACHE FIRST TO AVOID THROTTLE)
          let cloudData = await fetchCloudEval(fen)
          
          if (!cloudData) {
            await new Promise(r => setTimeout(r, 1200))
            cloudData = await fetchCloudEval(fen)
            
            if (isRateLimited()) {
              logger.warn('[Intel Hub] Lichess Rate Limit hit. Pausing analysis pass.')
              return
            }
          }
          
          const evalResult = extractCloudEvalScore(cloudData)
          if (evalResult) {
            game.evals[i] = evalResult
            totalCpl += evalResult.score
          }

          // 2. Blunder Harvesting (Check move i vs eval i-1)
          const harvested = harvestGameBlunder(game.id, move, i, game.evals, curriculum)
          if (harvested) {
            blunders.push(harvested)
          }

          // 3. Theory DNA Check (First 12 moves)
          if (i < 12) {
            const isTheory = await checkTheoryMove(move.before, move.san)
            if (isTheory) theoryMoves++
          }
        }

        // Aggregate Metrics
        const analyzedMoves = Math.min(moves.length, 30)
        game.theoreticalAccuracy = Math.round((theoryMoves / Math.min(moves.length, 12)) * 100)
        game.acpl = analyzedMoves > 0 ? Math.round(totalCpl / analyzedMoves) : 0
        game.missedWins = blunders.length
        
        // Add a tag for visual confirmation
        if (!game.tags) game.tags = []
        if (!game.tags.includes('Cloud Analysis')) game.tags.push('Cloud Analysis')

        // Persist
        const tx = db.transaction(['games'], 'readwrite')
        tx.objectStore('games').put(JSON.parse(JSON.stringify(game)))
        
        if (blunders.length > 0) {
          logger.info(`[Shadow Realm] Harvested ${blunders.length} tactical opportunities from ${game.id}`)
        }

        // Push back to cloud if linked
        await pushGameAnalysis(game)
        
      } catch (e) {
        logger.error(`[Intel Hub] Analysis failed for ${game.id}`, e)
      }
    }
    
    games.value = [...games.value] // Trigger reactivity
    
    // APPROACH 4: Notify completion of intelligence pass
    if (unanalyzed.length > 0) {
      const uiStore = useUiStore()
      uiStore.addToast(`Intelligence Pass Complete: Enriched ${unanalyzed.length} games via Lichess Cloud.`, 'info')
    }
  }

  return {
    syncCloudGames,
    purgeCloudLibrary,
    deleteCloudGame,
    pushGameAnalysis,
    pushLocalGamesToCloud,
    analyzeLibraryWithCloud
  }
}

/**
 * Extracts score and bestMove from Lichess cloud evaluation data if available.
 * 
 * @param cloudData - Raw evaluation data from Lichess Cloud API
 * @returns Object containing score and bestMove, or null if invalid/unavailable
 */
function extractCloudEvalScore(cloudData: any): { score: number; bestMove: string } | null {
  if (cloudData && cloudData.pvs && cloudData.pvs[0]) {
    const pv = cloudData.pvs[0];
    const bestMove = pv.pv?.split(' ')[0] || '';
    const score = pv.cp ?? (pv.mate * 100);
    return { score, bestMove };
  }
  return null;
}

/**
 * Evaluates whether the current move constitutes a significant blunder compared to
 * the previous position evaluation. If a blunder is detected and validated as a legal
 * move in Chess.js, it returns a blunder record and registers it with the curriculum store.
 * 
 * @param gameId - The local database ID of the game
 * @param move - Chess.js verbose move object for the current move
 * @param ply - The current move index (ply)
 * @param evals - Array of evaluations for this game
 * @param curriculum - The curriculum store instance for recording blunders
 * @returns Blunder record if harvested, otherwise null
 */
function harvestGameBlunder(
  gameId: string,
  move: any,
  ply: number,
  evals: Array<{ score: number; bestMove: string } | undefined>,
  curriculum: ReturnType<typeof useCurriculumStore>
): { fen: string; drop: number; move: string; playerMove: string; ply: number } | null {
  if (ply <= 0 || !evals) return null;
  
  const currentEval = evals[ply];
  const prevEval = evals[ply - 1];
  if (!currentEval || !prevEval) return null;
  
  // Calculate difference in engine evaluation Centipawns (CPL)
  const drop = Math.abs(currentEval.score - prevEval.score);
  // Significant drop threshold: 180 centipawns (approx. 1.8 pawns)
  if (drop <= 180) return null;
  
  const solution = prevEval.bestMove;
  if (!solution) return null;
  
  try {
    // Validate that the suggested engine move is actually a legal move in the previous position
    const testChess = new Chess(move.before);
    const legal = testChess.move(solution);
    if (legal) {
      const blunder = {
        fen: move.before,
        drop,
        move: solution, // The engine's recommended best alternative
        playerMove: move.san,
        ply
      };
      curriculum.harvestBlunders(gameId, blunder);
      return blunder;
    } else {
      logger.warn(`[Intel Hub] Skipping illegal harvest in ${gameId}: ${solution} illegal in ${move.before}`);
    }
  } catch (e) {
    // Fail silently to prevent throwing exceptions during analysis pass
  }
  
  return null;
}

/**
 * Queries the Lichess master games database to check if the played move
 * is considered a standard opening theory move.
 * 
 * @param beforeFen - FEN of the position before the move was played
 * @param playerSan - The SAN (Standard Algebraic Notation) representation of the player's move
 * @returns Promise<boolean> - True if the move exists in the master games database
 */
async function checkTheoryMove(beforeFen: string, playerSan: string): Promise<boolean> {
  const masters = await fetchMasterMoves(beforeFen);
  if (masters && masters.moves) {
    return masters.moves.some((m: any) => m.san === playerSan);
  }
  return false;
}

