
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
  { id: 'unknown', label: 'Unknown', icon: '', color: 'transparent' },
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
export function getMoveQuality(move: any, idx: number, allMoves?: any[]): MoveQuality {
  // Priority 1: If the move already has an engine-calculated tag, use it
  if (move.tag) {
    const s = typeof move.tag === 'string' ? move.tag : move.tag.severity
    const found = QUALITIES.find(q => q.id === s || q.label.toLowerCase() === s.toLowerCase())
    if (found) return found
  }

  // Priority 2: Use real eval data if available on consecutive moves
  if (allMoves && move.eval !== undefined && idx > 0) {
    const prevMove = allMoves[idx - 1]
    if (prevMove?.eval !== undefined) {
      // Calculate eval delta (how much the eval changed after this move)
      const moveEval = typeof move.eval === 'string' ? (move.eval.startsWith('M') ? (move.eval.startsWith('-M') ? -100 : 100) : parseFloat(move.eval)) : move.eval
      const prevEval = typeof prevMove.eval === 'string' ? (prevMove.eval.startsWith('M') ? (prevMove.eval.startsWith('-M') ? -100 : 100) : parseFloat(prevMove.eval)) : prevMove.eval
      
      // PERSPECTIVE: Engine evals are always from White's POV.
      // If it's Black's turn, a decrease in eval (more negative) is GOOD for them.
      let evalDelta = moveEval - prevEval
      if (move.color === 'b') evalDelta = -evalDelta
      
      const absDelta = Math.abs(evalDelta)
      
      // BRILLIANT: Big positive jump (over 2.0 pawns)
      if (evalDelta >= 2.0) return QUALITIES.find(q => q.id === 'brilliant')!

      // NEGATIVE DELTAS (Mistakes)
      if (evalDelta <= -2.5) return QUALITIES.find(q => q.id === 'blunder')!
      if (evalDelta <= -1.0) return QUALITIES.find(q => q.id === 'mistake')!
      if (evalDelta <= -0.4) return QUALITIES.find(q => q.id === 'inaccuracy')!
      
      // POSITIVE DELTAS (Engine approval)
      if (absDelta <= 0.05) return QUALITIES.find(q => q.id === 'best')!
      if (absDelta <= 0.15) return QUALITIES.find(q => q.id === 'excellent')!
      if (absDelta <= 0.3) return QUALITIES.find(q => q.id === 'good')!
      
      // DEFAULT: If the move didn't change the eval much and is within "Book" range (e.g. 15 moves)
      if (idx < 30 && Math.abs(moveEval) < 1.2) {
        return QUALITIES.find(q => q.id === 'book')!
      }
      
      return QUALITIES.find(q => q.id === 'good')!
    }
  }

  // Priority 3: First move baseline (no previous eval to compare against)
  if (idx === 0 && move.eval !== undefined) {
    const baseline = move.color === 'w' ? 0.3 : 0.2 // Slightly different baseline for White vs Black starting moves
    let delta = move.eval - baseline
    if (move.color === 'b') delta = -delta
    
    const absDelta = Math.abs(delta)
    if (absDelta >= 2.5) return QUALITIES.find(q => q.id === 'blunder')!
    if (absDelta >= 1.0) return QUALITIES.find(q => q.id === 'mistake')!
    if (absDelta >= 0.4) return QUALITIES.find(q => q.id === 'inaccuracy')!
    return QUALITIES.find(q => q.id === 'book')!
  }

  // Fallback: No eval data available — show neutral "unknown" to avoid misleading labels
  return QUALITIES.find(q => q.id === 'unknown')!
}
