import { computed, type Ref } from 'vue'
import type { PastGame, PuzzleAttempt } from '../userStore'
import { BASE_RATING, calculateNewRating } from '../../composables/useRatingSystem'

/**
 * User Stats Composable
 * 
 * Aggregates game and puzzle history into meaningful statistical reports.
 * 
 * @param pastGames - Reactive reference to the user's game history
 * @param puzzleAttempts - Reactive reference to the user's puzzle attempts
 */
export function useUserStats(
  pastGames: Ref<PastGame[]>,
  puzzleAttempts: Ref<PuzzleAttempt[]>
) {
  
  /** Wins, Losses, and Draws summary. */
  const winLossDraw = computed(() => {
    const stats = { wins: 0, losses: 0, draws: 0 }
    pastGames.value.forEach(g => {
      if (g.result === 'win') stats.wins++
      else if (g.result === 'loss') stats.losses++
      else stats.draws++
    })
    return stats
  })

  /** Total puzzle success rate. */
  const puzzleStats = computed(() => {
    const total = puzzleAttempts.value.length
    const solved = puzzleAttempts.value.filter(a => a.solved).length
    return {
      total,
      solved,
      accuracy: total > 0 ? Math.round((solved / total) * 100) : 100
    }
  })

  /** Activity Heatmap: Count of puzzles solved by date. */
  const activityHeatmap = computed(() => {
    const map: Record<string, number> = {}
    puzzleAttempts.value.forEach(a => {
      if (!a.solved) return
      const date = a.created_at.slice(0, 10)
      map[date] = (map[date] || 0) + 1
    })
    return map
  })

  /** Activity today specifically. */
  const solvedTodayCount = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return puzzleAttempts.value.filter(a => a.solved && a.created_at.startsWith(today)).length
  })

  /** Deduplicated opening performance stats. */
  const openingPerformance = computed(() => {
    const openings: Record<string, { win: number, loss: number, draw: number }> = {}
    pastGames.value.forEach(g => {
      const op = g.opening || 'Unknown'
      if (!openings[op]) openings[op] = { win: 0, loss: 0, draw: 0 }
      if (g.result === 'win') openings[op].win++
      else if (g.result === 'loss') openings[op].loss++
      else openings[op].draw++
    })
    return Object.entries(openings).map(([name, s]) => {
      const total = s.win + s.loss + s.draw || 1
      return {
        name,
        games: total,
        winPct: Math.round(s.win / total * 100),
      }
    }).sort((a, b) => b.games - a.games)
  })

  /** Actual rating history calculated using the Elo system. */
  const calculatedRatingHistory = computed(() => {
    const normalizeDate = (d: string) => {
      if (!d || d.includes('?')) return new Date().toISOString()
      const clean = d.replace(/\./g, '-')
      const p = new Date(clean)
      return isNaN(p.getTime()) ? new Date().toISOString() : p.toISOString()
    }

    let current = BASE_RATING
    const history: { date: string, rating: number }[] = []
    
    // Dedup and Sort
    const uniqueIds = new Set<string>()
    const sorted = [...pastGames.value]
      .filter(g => {
        if (uniqueIds.has(g.id)) return false
        uniqueIds.add(g.id)
        return true
      })
      .sort((a, b) => new Date(normalizeDate(a.date)).getTime() - new Date(normalizeDate(b.date)).getTime())
    
    if (sorted.length > 0) {
      const firstDate = new Date(normalizeDate(sorted[0].date))
      firstDate.setDate(firstDate.getDate() - 1)
      history.push({ date: firstDate.toISOString(), rating: BASE_RATING })
    }

    sorted.forEach(g => {
      const resultValue = g.result === 'win' ? 1.0 : (g.result === 'draw' ? 0.5 : 0.0)
      const oppRating = g.opponentRating || current
      current = calculateNewRating(current, oppRating, resultValue)
      history.push({ date: normalizeDate(g.date), rating: current })
    })

    return history
  })

  return {
    winLossDraw,
    puzzleStats,
    activityHeatmap,
    solvedTodayCount,
    openingPerformance,
    calculatedRatingHistory
  }
}
