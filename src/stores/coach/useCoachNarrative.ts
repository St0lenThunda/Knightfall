import { computed, type Ref } from 'vue'
import type { LibraryGame } from '../libraryStore'

/**
 * Coach Narrative Composable
 * 
 * Generates human-readable descriptions of the player's identity and playstyle.
 */
export function useCoachNarrative(
  archetypeReport: Ref<any>,
  games: Ref<LibraryGame[]>
) {
  
  const playstyleNarrative = computed(() => {
    const report = archetypeReport.value
    const allGames = games.value
    
    if (allGames.length === 0) {
      return { 
        title: "The Unwritten Page", 
        desc: "We haven't detected your playstyle signature yet. Play or import games to see your DNA." 
      }
    }

    const narratives: Record<string, { title: string, desc: string }> = {
      'mixed': {
        title: "The Versatile General",
        desc: `You exhibit a balanced approach to the game. With a ${report.missRate}% deviation in accuracy, your play is structural rather than erratic.`
      },
      'opening': {
        title: "The Theoretical Specialist",
        desc: `You thrive in prepared lines. However, your ${report.missRate}% weakness in opening theory suggests you may be memorizing moves without internalizing the underlying structures.`
      },
      'tactics': {
        title: "The Tactical Opportunist",
        desc: `You have a sharp eye for the immediate. Your ${report.missRate}% tactical vulnerability indicates a tendency to play 'hope chess'.`
      },
      'endgame': {
        title: "The Technical Grindmaster",
        desc: `You excel in simplified positions, but your ${report.missRate}% endgame technique gap shows you are letting winning advantages slip.`
      }
    }

    const base = narratives[report.category] || narratives['mixed']
    
    // Aggression modifier based on draw percentage
    const draws = allGames.filter(g => g.result === '1/2-1/2').length
    const drawPct = allGames.length > 0 ? Math.round((draws / allGames.length) * 100) : 0
    
    let modifier = ""
    if (drawPct < 5) modifier = " Your extremely low draw rate suggests a high-risk approach—you play for the 'kill' in every position."
    else if (drawPct > 15) modifier = " Your high draw rate indicates a prophylactic style—you are difficult to beat but may miss chances."

    return {
      title: base.title,
      desc: `${base.desc}${modifier}`
    }
  })

  return { playstyleNarrative }
}
