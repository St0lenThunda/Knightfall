import { computed, type Ref } from 'vue'
import type { LibraryGame } from '../libraryStore'
import type { PastGame, PuzzleAttempt } from '../userStore'

/**
 * Coach Archetype Composable (The Brain)
 * 
 * Analyzes the player's performance patterns across games and puzzles to determine 
 * their "Chess Persona" and tactical radar scores.
 */
export function useCoachArchetype(
  games: Ref<LibraryGame[]>,
  puzzleAttempts: Ref<PuzzleAttempt[]>,
  isMe: (name: string) => boolean
) {
  
  /**
   * The core analytical report that calculates radar scores and archetype.
   */
  const archetypeReport = computed(() => {
    const labels: Record<string, string> = {
      'endgame': 'Endgame Technique',
      'tactics': 'Tactical Vision',
      'opening': 'Opening Theory',
      'mixed': 'Overall Play'
    }
    const categories = ['opening', 'tactics', 'endgame', 'mixed']
    const scores: Record<string, number> = { endgame: 0, tactics: 0, opening: 0, mixed: 0 }

    // --- Signal 1: Puzzle failures ---
    const failures = puzzleAttempts.value.filter(a => !a.solved)
    let totalSignals = 0
    failures.forEach(a => {
      a.themes.forEach(t => {
        const cat = ['endgame', 'opening'].includes(t) ? t
          : ['mate', 'tactics', 'middlegame', 'backRankMate'].includes(t) ? 'tactics'
          : 'mixed'
        scores[cat] += 1.0
        totalSignals++
      })
    })

    // --- Signal 2: Game losses ---
    games.value.forEach(g => {
      if (g.result === '1/2-1/2' || g.result.includes('1/2')) return
      
      const amWhite = isMe(g.white)
      const amBlack = isMe(g.black)

      // Only analyze games where we can definitively identify the student
      if (!amWhite && !amBlack) return

      const won = (g.result === '1-0' && amWhite) || (g.result === '0-1' && amBlack)
      
      if (!won) {
        if (g.eco) scores['opening'] += 2.0
        else scores['tactics'] += 2.0
        totalSignals += 2
      }
    })

    // Fallback for new players
    if (totalSignals === 0) {
      return {
        category: 'mixed',
        title: 'The Unwritten Page',
        label: 'Balanced Initiate',
        missRate: 0,
        radarScores: { opening: 0.7, tactics: 0.7, endgame: 0.7, mixed: 0.7, time: 0.8 }
      }
    }

    // Determine the dominant weakness
    let topCat = 'mixed'
    let topScore = 0
    for (const cat of categories) {
      if (scores[cat] > topScore) { topScore = scores[cat]; topCat = cat }
    }

    const titles: Record<string, string> = {
      'opening': 'Theoretical Specialist',
      'tactics': 'Tactical Opportunist',
      'endgame': 'Technical Grindmaster',
      'mixed': 'Versatile General'
    }

    return {
      category: topCat,
      title: titles[topCat],
      label: labels[topCat],
      missRate: Math.round((topScore / totalSignals) * 100),
      radarScores: {
        opening: Math.max(0.3, 1 - (scores['opening'] / (totalSignals || 1))),
        tactics: Math.max(0.3, 1 - (scores['tactics'] / (totalSignals || 1))),
        endgame: Math.max(0.3, 1 - (scores['endgame'] / (totalSignals || 1))),
        mixed: 0.75,
        time: 0.85
      }
    }
  })

  return { archetypeReport }
}
