import { computed } from 'vue'
import { useCoachStore } from '../../stores/coachStore'
import { useLibraryStore } from '../../stores/libraryStore'

/**
 * Pillar Composable: useDnaStats
 * 
 * Aggregates high-level intelligence statistics and phase vulnerability metrics.
 */
export function useDnaStats() {
  const coachStore = useCoachStore()
  const libraryStore = useLibraryStore()

  /**
   * Phase Vulnerability Mapping
   * Determines which phase of the game (Opening/Mid/End) is currently the weakest.
   */
  const phaseVulnerability = computed(() => {
    const report = coachStore.archetypeReport
    return [
      { 
        label: 'Opening', 
        pct: report.category === 'opening' ? report.missRate : 30, 
        color: 'var(--accent)' 
      },
      { 
        label: 'Middlegame', 
        pct: report.category === 'tactics' ? report.missRate : 45, 
        color: 'var(--rose)' 
      },
      { 
        label: 'Endgame', 
        pct: report.category === 'endgame' ? report.missRate : 25, 
        color: 'var(--teal)' 
      },
    ]
  })

  /**
   * Personal Intelligence Statistics
   * Provides the raw numbers for the top-level overview.
   */
  const personalStats = computed(() => [
    { 
      label: 'Personal Games', 
      val: libraryStore.personalGames.length, 
      icon: '♟', 
      desc: 'Total games where you are a primary participant.' 
    },
    { 
      label: 'Win Rate', 
      val: `${libraryStore.libraryWinRate}%`, 
      icon: '📈', 
      desc: 'Overall win percentage across your entire personal archive.' 
    },
    { 
      label: 'Avg Opponent', 
      val: libraryStore.avgOpponentElo, 
      icon: '⚔️', 
      desc: 'The average Elo rating of your opponents across all platforms.' 
    },
    { 
      label: 'Native Identity', 
      val: libraryStore.sourceBreakdown.knightfall, 
      icon: '♞', 
      desc: 'Games played natively using the Knightfall engine.' 
    },
    { 
      label: 'Platform Syncs', 
      val: libraryStore.sourceBreakdown.chessCom + libraryStore.sourceBreakdown.lichess, 
      icon: '🌍', 
      desc: 'Total intelligence snapshots imported from Chess.com and Lichess.' 
    }
  ])

  return {
    phaseVulnerability,
    personalStats
  }
}
