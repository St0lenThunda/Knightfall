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
        
        // Intelligence pass on each move
        for (let i = 0; i < Math.min(moves.length, 30); i++) {
          const move = moves[i]
          const fen = move.after
          
          // 1. Cloud Eval Check (TRY CACHE FIRST TO AVOID THROTTLE)
          const cloudData = await fetchCloudEval(fen)
          
          if (!cloudData) {
            await new Promise(r => setTimeout(r, 1200))
            const freshData = await fetchCloudEval(fen)
            
            if (isRateLimited()) {
              logger.warn('[Intel Hub] Lichess Rate Limit hit. Pausing analysis pass.')
              return
            }
            
            if (freshData && freshData.pvs && freshData.pvs[0]) {
              processCloudData(freshData, i)
            }
          } else if (cloudData.pvs && cloudData.pvs[0]) {
            processCloudData(cloudData, i)
          }

          function processCloudData(data: any, index: number) {
            const bestMove = data.pvs[0].pv?.split(' ')[0] || ''
            const evalScore = data.pvs[0].cp ?? (data.pvs[0].mate * 100)
            
            if (!game.evals) game.evals = []
            // Store as object for better traceability
            game.evals[index] = { score: evalScore, bestMove }
            
            totalCpl += evalScore

            // Harvest Blunders for move index + 1 (using this position's bestMove)
            // Note: We don't have the eval for nextMove yet, so we'll harvest it in the NEXT iteration
          }

          // Blunder Harvesting (Check move i vs eval i-1)
          if (i > 0 && game.evals) {
            const currentEval = game.evals[i] as any
            const prevEval = game.evals[i-1] as any
            
            if (currentEval && prevEval) {
              const drop = Math.abs(currentEval.score - prevEval.score)
              // If you're White and the eval dropped significantly, you blundered
              const isSignificant = drop > 180 
              
              if (isSignificant) {
                // The solution is what you SHOULD have played (prevEval.bestMove)
                const solution = prevEval.bestMove
                
                // VALIDATE: Ensure the solution is actually legal in the position BEFORE the mistake
                const testChess = new Chess(move.before)
                try {
                  const legal = testChess.move(solution)
                  if (legal) {
                    const b = { 
                      fen: move.before, 
                      drop, 
                      move: solution, // Use the BEST move as the solution
                      playerMove: move.san, 
                      ply: i 
                    }
                    blunders.push(b)
                    curriculum.harvestBlunders(game.id, b)
                  } else {
                    logger.warn(`[Intel Hub] Skipping illegal harvest in ${game.id}: ${solution} illegal in ${move.before}`)
                  }
                } catch (e) {}
              }
            }
          }

          // 2. Theory DNA Check (First 12 moves)
          if (i < 12) {
            // fetchMasterMoves is also cached now!
            const masters = await fetchMasterMoves(move.before)
            if (masters && masters.moves) {
              const isTheory = masters.moves.some((m: any) => m.san === move.san)
              if (isTheory) theoryMoves++
            }
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
