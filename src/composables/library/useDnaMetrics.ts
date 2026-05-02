import { computed } from 'vue'
import { useLibraryStore } from '../../stores/libraryStore'

/**
 * Pillar Composable: useDnaMetrics
 * 
 * Extracts behavioral trait logic and metrics from the raw library data.
 * This separates the "physics" of behavioral analysis from the UI presentation.
 */
export function useDnaMetrics() {
  const libraryStore = useLibraryStore()

  /**
   * Aggression Score Calculation
   * We measure aggression as the inverse of the draw rate. 
   * High aggression means the user plays for decisive results (win/loss).
   */
  const aggressionScore = computed(() => {
    const total = libraryStore.personalGames.length
    if (total === 0) return 0
    const draws = libraryStore.personalGames.filter(g => g.result === '1/2-1/2').length
    // Higher percentage = lower draw rate = higher aggression
    return Math.round((1 - (draws / total)) * 100)
  })

  /**
   * Stability Score Calculation
   * Currently uses a placeholder for engine-derived consistency.
   * In future, this will reflect standard deviation of Centipawn Loss.
   */
  const stabilityScore = computed(() => {
    return 82 // Logic for future engine-integrated accuracy scaling
  })

  /**
   * DNA Traits Mapping
   * Converts raw scores into UI-ready objects with styling and descriptions.
   */
  const dnaTraits = computed(() => [
    { 
      label: 'Aggression', 
      val: aggressionScore.value, 
      color: 'var(--rose)', 
      icon: '⚔️', 
      desc: 'Tendency to avoid draws and seek decisive results.' 
    },
    { 
      label: 'Stability', 
      val: stabilityScore.value, 
      color: 'var(--teal)', 
      icon: '⚖️', 
      desc: 'Consistency of move quality across phases.' 
    },
    { 
      label: 'Resilience', 
      val: 74, 
      color: 'var(--gold)', 
      icon: '🛡️', 
      desc: 'Ability to recover from negative evaluations.' 
    },
    { 
      label: 'Precision', 
      val: 68, 
      color: 'var(--accent)', 
      icon: '🎯', 
      desc: 'Closeness to engine-preferred theoretical lines.' 
    }
  ])

  return {
    aggressionScore,
    stabilityScore,
    dnaTraits
  }
}
