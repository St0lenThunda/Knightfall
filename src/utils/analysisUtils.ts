
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
/**
 * Calculates move quality based on REAL eval data when available.
 * 
 * @param move - The move entry from moveHistory (should have .eval if scanned)
 * @param idx - The move index in the history
 * @param gameSeed - A seed for deterministic fallback (only used when no eval data exists)
 * @param allMoves - Optional: the full moveHistory array for comparing consecutive evals
 */
export function getMoveQuality(move: any, idx: number, gameSeed: number, allMoves?: any[]): MoveQuality {
  // Priority 1: If the move already has an engine-calculated tag, use it
  if (move.tag) {
    const s = move.tag.severity
    if (s === 'blunder') return QUALITIES.find(q => q.id === 'blunder')!
    if (s === 'mistake') return QUALITIES.find(q => q.id === 'mistake')!
    if (s === 'inaccuracy') return QUALITIES.find(q => q.id === 'inaccuracy')!
  }

  // Priority 2: Use real eval data if available on consecutive moves
  if (allMoves && move.eval !== undefined && idx > 0) {
    const prevMove = allMoves[idx - 1]
    if (prevMove?.eval !== undefined) {
      // Calculate eval delta (how much the eval changed after this move)
      const evalDelta = Math.abs(move.eval - prevMove.eval)
      
      if (evalDelta >= 2.5) return QUALITIES.find(q => q.id === 'blunder')!
      if (evalDelta >= 1.0) return QUALITIES.find(q => q.id === 'mistake')!
      if (evalDelta >= 0.4) return QUALITIES.find(q => q.id === 'inaccuracy')!
      if (evalDelta <= 0.05) return QUALITIES.find(q => q.id === 'best')!
      if (evalDelta <= 0.15) return QUALITIES.find(q => q.id === 'excellent')!
      if (evalDelta <= 0.3) return QUALITIES.find(q => q.id === 'good')!
      return QUALITIES.find(q => q.id === 'book')!
    }
  }

  // Priority 3: First move baseline (no previous eval to compare against)
  if (idx === 0 && move.eval !== undefined) {
    const delta = Math.abs(move.eval - 0.2) // Compare to starting position
    if (delta >= 2.5) return QUALITIES.find(q => q.id === 'blunder')!
    if (delta >= 1.0) return QUALITIES.find(q => q.id === 'mistake')!
    if (delta >= 0.4) return QUALITIES.find(q => q.id === 'inaccuracy')!
    return QUALITIES.find(q => q.id === 'good')!
  }

  // Fallback: No eval data available — show neutral "book" to avoid misleading labels
  return QUALITIES.find(q => q.id === 'book')!
}
