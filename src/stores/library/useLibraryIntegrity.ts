import { ref, type Ref, type ShallowRef } from 'vue'
import { Chess } from 'chess.js'
import { logger } from '../../utils/logger'
import { type LibraryGame } from './types'
import { useUserStore } from '../userStore'

/**
 * useLibraryIntegrity: The forensic and maintenance layer for the Knightfall Vault.
 * 
 * This pillar handles "Data Hygiene" operations:
 * - Sanitizing "Ghost Games" (test pollution).
 * - Repairing metadata from raw PGN.
 * - Re-evaluating identity (UserSide) when profiles change.
 * - Fetching the Warden's Shield health reports.
 */
export function useLibraryIntegrity(
  games: ShallowRef<LibraryGame[]>,
  userStore: ReturnType<typeof useUserStore>,
  idb: any, 
  cloud: any, 
  loadGames: () => Promise<void>,
  // Receive shared state from the main store
  isProcessingIntegrity: Ref<boolean>,
  integrityProgress: Ref<number>,
  integrityMessage: Ref<string>
) {
  // --- STATE ---
  const wardenReport = ref<any>(null)

  // --- MAINTENANCE ACTIONS ---

  /**
   * Automatically identifies and purges ghost games (1 move or less).
   */
  async function autoSanitize() {
    let targets = games.value
    if (targets.length === 0) {
      targets = await idb.loadGames()
    }

    if (targets.length === 0) return

    const seenPgn = new Set<string>()
    const purgeIds: string[] = []

    for (const g of targets) {
      const isGhost = (g.movesCount || 0) <= 1 || !g.pgn || g.pgn.length < 10
      const isUnfinished = g.result === '*' || g.result === '?' || !g.result || g.result === '1/2'
      const isDuplicate = seenPgn.has(g.pgn)
      
      if (isGhost || isUnfinished || isDuplicate) {
        purgeIds.push(g.id)
      } else {
        seenPgn.add(g.pgn)
      }
    }

    if (purgeIds.length > 0) {
      logger.info(`[Integrity] Auto-sanitizing ${purgeIds.length} invalid games...`)
      
      const cloudIds: string[] = []
      purgeIds.forEach(id => {
        const game = targets.find(g => g.id === id)
        if (game?.cloudId) cloudIds.push(game.cloudId)
      })

      // Wipe local
      await idb.deleteGames(purgeIds)
      
      // Wipe cloud in background
      if (cloudIds.length > 0) {
        Promise.allSettled(cloudIds.map(cid => cloud.deleteCloudGame(cid)))
      }
      
      // Refresh memory if active
      if (games.value.length > 0) {
        games.value = games.value.filter(g => !purgeIds.includes(g.id))
      }
    }
  }

  /**
   * Removes "ghost" games typically generated during automated testing.
   */
  async function purgeTestPollution() {
    const ghostIds = games.value
      .filter(g => g.movesCount <= 1)
      .map(g => g.id)

    if (ghostIds.length === 0) return 0

    await idb.deleteGames(ghostIds)
    return ghostIds.length
  }

  /**
   * Purges games without a definitive result.
   */
  async function purgeUnfinishedGames() {
    const allGames = await idb.loadGames()
    const unfinishedIds = allGames
      .filter((g: any) => g.result === '*' || g.result === '?' || !g.result)
      .map((g: any) => g.id)

    if (unfinishedIds.length === 0) return 0

    await idb.deleteGames(unfinishedIds)
    await loadGames()
    return unfinishedIds.length
  }

  /**
   * Recalculates metadata from raw PGN data for the entire vault.
   */
  async function repairVaultMetadata() {
    const { safeLoadPgn } = await import('../../utils/pgnParser')
    const chess = new Chess()
    
    isProcessingIntegrity.value = true
    integrityProgress.value = 0
    integrityMessage.value = 'Sanitizing metadata...'
    
    const total = games.value.length
    const upgradedGames = []

    for (let i = 0; i < total; i++) {
      const game = games.value[i]
      try {
        safeLoadPgn(chess, game.pgn)
        const headers = chess.header()
        
        const upgraded: LibraryGame = {
          ...game,
          white: headers.White || 'Unknown',
          black: headers.Black || 'Unknown',
          result: headers.Result || '*',
          date: headers.Date || '?',
          whiteElo: headers.WhiteElo || undefined,
          blackElo: headers.BlackElo || undefined,
          eco: headers['ECO'] || '',
          openingName: headers['Opening'] || undefined,
          termination: headers['Termination'] || undefined,
          event: headers.Event || 'Local Game',
          movesCount: chess.history().length,
          userSide: userStore.isMe(headers.White) ? 'white' : (userStore.isMe(headers.Black) ? 'black' : 'none')
        }
        upgradedGames.push(upgraded)
        await idb.persistGameUpdate(upgraded)
      } catch (e) {
        upgradedGames.push(game)
      }

      if (i % 25 === 0) {
        integrityProgress.value = Math.round((i / total) * 100)
        await new Promise(r => setTimeout(r, 0))
      }
    }
    
    games.value = upgradedGames
    isProcessingIntegrity.value = false
    integrityProgress.value = 100
  }

  /**
   * Re-checks every game to see if the current user is playing.
   */
  async function repairVaultIdentity() {
    isProcessingIntegrity.value = true
    integrityProgress.value = 0
    integrityMessage.value = 'Re-evaluating identity for entire vault...'
    
    const allGames = await idb.loadGames()
    const total = allGames.length
    const updates: LibraryGame[] = []

    for (let i = 0; i < total; i++) {
      const game = allGames[i]
      const newUserSide = (userStore.isMe(game.white) ? 'white' : (userStore.isMe(game.black) ? 'black' : 'none')) as 'white' | 'black' | 'none'
      
      if (newUserSide !== game.userSide) {
        const upgraded = { ...game, userSide: newUserSide }
        await idb.persistGameUpdate(upgraded)
        updates.push(upgraded)
      }
      
      if (i % 100 === 0) {
        integrityProgress.value = Math.round((i / total) * 100)
        await new Promise(r => setTimeout(r, 0))
      }
    }
    
    logger.info(`[Integrity] Identity repair complete. Updated ${updates.length} games.`)
    await loadGames()
    
    isProcessingIntegrity.value = false
    integrityProgress.value = 100
  }

  /**
   * Fetches the Warden Shield health report.
   */
  async function fetchWardenReport() {
    try {
      const response = await fetch(`/data/warden_report.json?t=${Date.now()}`)
      if (response.ok) wardenReport.value = await response.json()
    } catch (e) {
      logger.warn('[Integrity] Warden report unavailable.')
    }
  }

  return {
    isProcessingIntegrity,
    integrityProgress,
    integrityMessage,
    wardenReport,
    autoSanitize,
    purgeTestPollution,
    purgeUnfinishedGames,
    repairVaultMetadata,
    repairVaultIdentity,
    fetchWardenReport
  }
}
