import { computed, type Ref } from 'vue'
import type { LibraryGame } from '../libraryStore'
import { ecoToName, ecoToDescription } from '../../utils/ecoLookup'

/**
 * Composable for statistical computations on the game library.
 * Handles Elo calculation, win rates, and heatmap generation.
 */
export function useLibraryStats(
  games: Ref<LibraryGame[]>,
  userStore: any // Access to profile and isMe helper
) {
  // --- INTERNAL FILTERING ---
  /** Games where the user is an active participant (Personal DNA). */
  const personalGames = computed(() => {
    return games.value.filter(g => {
      // Identity Check: Must be one of the players to be 'My DNA'
      const isMe = userStore.isMe(g.white) || userStore.isMe(g.black)
      if (isMe) return true

      // Fallback for native Knightfall games
      const tags = (g.tags || []).map(t => t.toLowerCase())
      return tags.includes('my games')
    })
  })

  /**
   * Generates the full rating progression history using the Elo formula.
   */
  const performanceHistory = computed(() => {
    if (personalGames.value.length === 0) return [1200]
    
    const sortedGames = [...personalGames.value].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateA - dateB
    })

    let currentElo = 1200
    const K = 32
    const history = [1200]

    sortedGames.forEach(g => {
      const isWhite = userStore.isMe(g.white)
      const oppRatingStr = isWhite ? g.blackElo : g.whiteElo
      const oppRating = oppRatingStr ? parseInt(oppRatingStr) : null
      
      if (!oppRating) return

      let S = 0.5
      if (g.result === '1-0') S = isWhite ? 1 : 0
      if (g.result === '0-1') S = isWhite ? 0 : 1

      const E = 1 / (1 + Math.pow(10, (oppRating - currentElo) / 400))
      currentElo = currentElo + K * (S - E)
      history.push(Math.round(currentElo))
    })

    return history
  })

  const performanceRating = computed(() => {
    const history = performanceHistory.value
    return history.length > 0 ? history[history.length - 1] : 1200
  })

  /**
   * Generates a 12-week activity heatmap based on game frequency.
   */
  const activityHeatmap = computed(() => {
    const weeks = 12
    const days = 7
    const heatmap = Array.from({ length: weeks }, () => Array(days).fill(0))
    
    if (personalGames.value.length === 0) return heatmap

    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(now.getDate() - (weeks * 7))
    startDate.setDate(startDate.getDate() - startDate.getDay())

    personalGames.value.forEach(g => {
      if (!g.date) return
      const gDate = new Date(g.date)
      const diffTime = gDate.getTime() - startDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays >= 0 && diffDays < (weeks * 7)) {
        const weekIdx = Math.floor(diffDays / 7)
        const dayIdx = diffDays % 7
        heatmap[weekIdx][dayIdx]++
      }
    })

    return heatmap
  })

  const libraryWinRate = computed(() => {
    if (personalGames.value.length === 0) return 0
    const wins = personalGames.value.filter(g => {
      const isWhite = userStore.isMe(g.white)
      return (g.result === '1-0' && isWhite) || (g.result === '0-1' && !isWhite)
    }).length
    return Math.round((wins / personalGames.value.length) * 100)
  })

  const avgOpponentElo = computed(() => {
    if (personalGames.value.length === 0) return 0
    let totalElo = 0
    let ratedGames = 0

    personalGames.value.forEach(g => {
      const isWhite = userStore.isMe(g.white)
      const oppRatingStr = isWhite ? g.blackElo : g.whiteElo
      const oppRating = oppRatingStr ? parseInt(oppRatingStr) : null
      
      if (oppRating && !isNaN(oppRating)) {
        totalElo += oppRating
        ratedGames++
      }
    })

    return ratedGames > 0 ? Math.round(totalElo / ratedGames) : 0
  })

  const openingStats = computed(() => {
    const stats: Record<string, { win: number, loss: number, draw: number, games: number, eco: string, description: string }> = {}
    
    personalGames.value.forEach(g => {
      const opName = g.eco
        ? ecoToName(g.eco)
        : (g.event && !g.event.toLowerCase().includes('live chess') && !g.event.toLowerCase().includes('tournament')
           ? g.event
           : 'Unknown Opening')
      
      if (!stats[opName]) {
        stats[opName] = { 
          win: 0, 
          loss: 0, 
          draw: 0, 
          games: 0, 
          eco: g.eco || '',
          description: ecoToDescription(g.eco || '')
        }
      }
      
      const isWhite = userStore.isMe(g.white)
      const result = g.result
      
      stats[opName].games++
      if (result === '1/2-1/2') stats[opName].draw++
      else if ((result === '1-0' && isWhite) || (result === '0-1' && !isWhite)) stats[opName].win++
      else stats[opName].loss++
    })

    return Object.entries(stats).map(([name, s]) => ({
      name,
      games: s.games,
      eco: s.eco,
      description: s.description,
      winPct: Math.round((s.win / s.games) * 100),
      lossPct: Math.round((s.loss / s.games) * 100),
      drawPct: Math.round((s.draw / s.games) * 100)
    })).sort((a, b) => b.games - a.games)
  })

  const libraryWldStats = computed(() => {
    const stats = { win: 0, loss: 0, draw: 0, total: 0 }
    personalGames.value.forEach(g => {
      const isMe = userStore.isMe(g.white)
      if (g.result === '1-0') {
        if (isMe) stats.win++
        else stats.loss++
      } else if (g.result === '0-1') {
        if (isMe) stats.loss++
        else stats.win++
      } else if (g.result === '1/2-1/2' || g.result.includes('1/2')) {
        stats.draw++
      }
      stats.total++
    })
    
    return {
      ...stats,
      winPct: stats.total > 0 ? (stats.win / stats.total) * 100 : 0,
      lossPct: stats.total > 0 ? (stats.loss / stats.total) * 100 : 0,
      drawPct: stats.total > 0 ? (stats.draw / stats.total) * 100 : 0
    }
  })

  /**
   * Breakdown of game sources in the entire vault.
   * Prioritizes platform-specific tags to prevent miscategorization.
   */
  const sourceBreakdown = computed(() => {
    const stats = {
      knightfall: 0,
      chessCom: 0,
      lichess: 0,
      curated: 0,
      other: 0
    }
    
    games.value.forEach(g => {
      const isPersonal = userStore.isMe(g.white) || userStore.isMe(g.black)
      
      if (!isPersonal) {
        stats.curated++
        return
      }
      
      const tags = (g.tags || []).map(t => t.toLowerCase())
      
      if (tags.includes('chess.com') || tags.includes('chesscom')) {
        stats.chessCom++
      } else if (tags.includes('lichess')) {
        stats.lichess++
      } else if (tags.includes('my games')) {
        stats.knightfall++
      } else {
        stats.other++
      }
    })
    
    return stats
  })

  return {
    performanceRating,
    performanceHistory,
    activityHeatmap,
    libraryWinRate,
    libraryWldStats,
    avgOpponentElo,
    openingStats,
    sourceBreakdown
  }
}
