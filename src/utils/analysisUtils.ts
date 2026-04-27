
/**
 * Shared move quality definitions and classification logic.
 */

export interface MoveQuality {
  id: string
  label: string
  icon: string
  color: string
}

export const QUALITIES: MoveQuality[] = [
  { id: 'brilliant', label: 'Brilliant', icon: '!!', color: '#b5e853' },
  { id: 'great', label: 'Great Move', icon: '!', color: '#5c8df6' },
  { id: 'best', label: 'Best', icon: '⭐', color: '#10b981' },
  { id: 'excellent', label: 'Excellent', icon: '✓', color: '#34d399' },
  { id: 'good', label: 'Good', icon: '✓', color: '#06b6d4' },
  { id: 'book', label: 'Book', icon: '📖', color: '#a78bfa' },
  { id: 'inaccuracy', label: 'Inaccuracy', icon: '?', color: '#f59e0b' },
  { id: 'mistake', label: 'Mistake', icon: '?!', color: '#f97316' },
  { id: 'blunder', label: 'Blunder', icon: '??', color: '#f43f5e' },
]

/**
 * Deterministically calculates move quality based on move data and a seed.
 * In a production app, this would be backed by real engine logs.
 */
export function getMoveQuality(move: any, idx: number, gameSeed: number): MoveQuality {
  // If the move already has an engine-calculated tag, use it
  if (move.tag) {
    const s = move.tag.severity
    if (s === 'blunder') return QUALITIES.find(q => q.id === 'blunder')!
    if (s === 'mistake') return QUALITIES.find(q => q.id === 'mistake')!
    if (s === 'inaccuracy') return QUALITIES.find(q => q.id === 'inaccuracy')!
  }

  // Reproducible hash for "Review" stats if full engine logs aren't present
  const hash = (move.san.charCodeAt(0) * 11 + idx * 7 + (move.isCapture ? 13 : 0) + gameSeed) % 100
  
  if (hash > 97) return QUALITIES[0] // Brilliant
  if (hash > 90) return QUALITIES[1] // Great
  if (hash > 70) return QUALITIES[2] // Best
  if (hash > 50) return QUALITIES[3] // Excellent
  if (hash > 30) return QUALITIES[4] // Good
  if (hash > 20) return QUALITIES[5] // Book
  if (hash > 10) return QUALITIES[6] // Inaccuracy
  if (hash > 3) return QUALITIES[7] // Mistake
  return QUALITIES[8] // Blunder
}
