import { computed, type Ref } from 'vue'
import type { LibraryGame } from '../libraryStore'
import { ecoToName, ecoToDescription } from '../../utils/ecoLookup'
import type { useUserStore } from '../userStore'
import { calculateRatingHistory } from '../../composables/useRatingSystem'

/**
 * Composable for statistical computations on the game library.
 * Handles Elo calculation, win rates, and heatmap generation.
 */
/**
 * Composable for statistical computations on the game library.
 * Handles Elo calculation, win rates, and heatmap generation.
 * 
 * PERFORMANCE: This uses a 'Single-Pass Reducer' pattern to avoid N*M iterations.
 */
export function useLibraryStats(
  games: Ref<LibraryGame[]>,
  userStore: ReturnType<typeof useUserStore>
) {
  const personalGames = games

  /**
   * The 'Single Pass Reducer'
   * Calculates almost all statistics in a single iteration over the games array.
   * Because it is a computed property, it automatically handles deletions and 
   * edits (PGN/Result changes) by re-running the aggregation whenever the array changes.
   */
  const librarySummary = computed(() => {
    // Initial State
    const summary = {
      wld: { win: 0, loss: 0, draw: 0, total: 0 },
      openingMap: {} as Record<string, any>,
      sourceStats: { knightfall: 0, chessCom: 0, lichess: 0, curated: 0, other: 0 },
      elo: { total: 0, ratedCount: 0 },
      accuracy: { total: 0, analyzedCount: 0 },
      heatmap: Array.from({ length: 12 }, () => Array(7).fill(0)),
      vaultOpenings: new Set<string>()
    }

    if (personalGames.value.length === 0) return summary

    // Heatmap date reference
    const now = new Date()
    const heatmapStart = new Date(now)
    heatmapStart.setDate(now.getDate() - (12 * 7))
    heatmapStart.setDate(heatmapStart.getDate() - heatmapStart.getDay())

    personalGames.value.forEach(g => {
      // 1. Identity Detection (Persisted)
      // We rely on the 'userSide' property which was resolved during Import/Sanitize.
      // This avoids hardcoding name-matching logic in the stats engine.
      const isWhite = g.userSide === 'white'
      const isBlack = g.userSide === 'black'
      const result = g.result
      
      const isParticipant = isWhite || isBlack

      // 2. WLD & Participation
      if (isParticipant) {
        summary.wld.total++
        if (result === '1/2-1/2' || result.includes('1/2')) {
          summary.wld.draw++
        } else if ((result === '1-0' && isWhite) || (result === '0-1' && isBlack)) {
          summary.wld.win++
        } else {
          summary.wld.loss++
        }

        // 2. Elo Calculations
        const oppRatingStr = isWhite ? g.blackElo : g.whiteElo
        const oppRating = oppRatingStr ? parseInt(oppRatingStr) : null
        if (oppRating && !isNaN(oppRating)) {
          summary.elo.total += oppRating
          summary.elo.ratedCount++
        }

        // 3. Opening Repertoire Map
        const opName = g.eco ? ecoToName(g.eco) 
          : (g.event && !g.event.toLowerCase().includes('live chess') ? g.event : 'Unknown Opening')
        
        if (!summary.openingMap[opName]) {
          summary.openingMap[opName] = { win: 0, loss: 0, draw: 0, games: 0, eco: g.eco || '', desc: ecoToDescription(g.eco || '') }
        }
        summary.openingMap[opName].games++
        if (result === '1/2-1/2') summary.openingMap[opName].draw++
        else if ((result === '1-0' && isWhite) || (result === '0-1' && isBlack)) summary.openingMap[opName].win++
        else summary.openingMap[opName].loss++

        // 4. Heatmap
        if (g.date) {
          const gDate = new Date(g.date)
          const diffDays = Math.floor((gDate.getTime() - heatmapStart.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDays >= 0 && diffDays < 84) {
            summary.heatmap[Math.floor(diffDays / 7)][diffDays % 7]++
          }
        }
      }

      // 5. Source Breakdown (using raw games array check)
      const tags = (g.tags || []).map(t => t.toLowerCase())
      if (! (isWhite || isBlack)) summary.sourceStats.curated++
      else if (tags.includes('chess.com') || tags.includes('chesscom')) summary.sourceStats.chessCom++
      else if (tags.includes('lichess')) summary.sourceStats.lichess++
      else if (tags.includes('my games')) summary.sourceStats.knightfall++
      else summary.sourceStats.other++

      // 6. Global Accuracy (Analyzed Games)
      if (g.acpl !== undefined && g.acpl !== null) {
        summary.accuracy.total += Math.max(0, 100 - (g.acpl / 2))
        summary.accuracy.analyzedCount++
      }

      // 7. Vault Openings (Set handles uniqueness)
      summary.vaultOpenings.add(g.eco || g.event || 'Unknown')
    })

    return summary
  })

  /**
   * Performance History remains a separate calculation because it requires 
   * a chronological sort (O(N log N)) which is different from the O(N) aggregate.
   */
  const performanceHistory = computed(() => {
    const nativeUsername = userStore.displayName?.toLowerCase()
    return calculateRatingHistory(personalGames.value, (u) => {
      return !!(userStore.isMe(u) || (nativeUsername && u.toLowerCase() === nativeUsername))
    })
  })

  // --- Public API Projections (Lightweight Computed Aliases) ---
  const libraryWldStats = computed(() => {
    const wld = librarySummary.value.wld
    return {
      ...wld,
      winPct: wld.total > 0 ? (wld.win / wld.total) * 100 : 0,
      lossPct: wld.total > 0 ? (wld.loss / wld.total) * 100 : 0,
      drawPct: wld.total > 0 ? (wld.draw / wld.total) * 100 : 0
    }
  })

  const openingStats = computed(() => {
    return Object.entries(librarySummary.value.openingMap).map(([name, s]) => ({
      name,
      games: s.games,
      eco: s.eco,
      description: s.desc,
      winPct: Math.round((s.win / s.games) * 100),
      lossPct: Math.round((s.loss / s.games) * 100),
      drawPct: Math.round((s.draw / s.games) * 100)
    })).sort((a, b) => b.games - a.games)
  })

  const performanceRating = computed(() => {
    const hist = performanceHistory.value
    return hist.length > 0 ? hist[hist.length - 1].rating : 1200
  })

  return {
    performanceRating,
    performanceHistory,
    activityHeatmap: computed(() => librarySummary.value.heatmap),
    libraryWinRate: computed(() => Math.round(libraryWldStats.value.winPct)),
    libraryWldStats,
    globalAccuracy: computed(() => {
      const acc = librarySummary.value.accuracy
      return acc.analyzedCount > 0 ? Math.round(acc.total / acc.analyzedCount) : 0
    }),
    avgOpponentElo: computed(() => {
      const elo = librarySummary.value.elo
      return elo.ratedCount > 0 ? Math.round(elo.total / elo.ratedCount) : 0
    }),
    openingStats,
    vaultOpeningStats: computed(() => Array.from(librarySummary.value.vaultOpenings)),
    sourceBreakdown: computed(() => librarySummary.value.sourceStats)
  }
}
