import { computed } from 'vue'
import { useCoachStore } from '../../stores/coachStore'

/**
 * Pillar Composable: useDnaRadar
 * 
 * Manages the geometry and mapping for the Radar (Spider) Chart visualization.
 * Separating math from components ensures the SVG remains declarative.
 */
export function useDnaRadar() {
  const coachStore = useCoachStore()

  // Chart Configuration Constants
  const cx = 150 // Center X
  const cy = 150 // Center Y
  const r = 85   // Max Radius

  /**
   * Radar Axes Definitions
   * Maps UI labels to the keys found in coachStore.archetypeReport.radarScores.
   */
  const axes = [
    { label: 'Opening', key: 'opening' },
    { label: 'Tactics', key: 'tactics' },
    { label: 'Endgame', key: 'endgame' },
    { label: 'Defense', key: 'mixed' },
    { label: 'Time', key: 'time' },
  ]

  /**
   * Generates the SVG polygon points based on normalized scores.
   * Returns a string formatted for the <polygon points="..."> attribute.
   */
  const radarPoints = computed(() => {
    const n = axes.length
    const scores = coachStore.archetypeReport.radarScores
    
    return axes.map((ax, i) => {
      // Calculate angle for this specific axis (rotated -90deg to start at top)
      const angle = (Math.PI * 2 * i / n) - Math.PI / 2
      
      // Get score or fallback to a default "neutral" value
      const score = scores[ax.key as keyof typeof scores] || 0.7
      
      // Convert Polar (r, angle) to Cartesian (x, y) coordinates
      const x = cx + r * score * Math.cos(angle)
      const y = cy + r * score * Math.sin(angle)
      
      return `${x},${y}`
    }).join(' ')
  })

  /**
   * Calculates the position for axis labels, slightly offset from the max radius.
   * 
   * @param i - The index of the axis
   */
  function getAxisLabelPos(i: number) {
    const n = axes.length
    const angle = (Math.PI * 2 * i / n) - Math.PI / 2
    const lr = r + 35 // Label radius (padding from the outer ring)
    
    return { 
      x: cx + lr * Math.cos(angle), 
      y: cy + lr * Math.sin(angle) 
    }
  }

  return {
    cx,
    cy,
    r,
    axes,
    radarPoints,
    getAxisLabelPos
  }
}
