import { computed } from 'vue'
import { Chess } from 'chess.js'
import { logger } from '../utils/logger'

/**
 * POSITIONAL HEALTH HEURISTICS COMPOSABLE
 * 
 * Extracts the logic for calculating real-time metrics for the "Health Bars".
 * This improves modularity and reduces the size of the AnalysisView component.
 * 
 * @param fen - The current position FEN
 * @param evalNumber - The current engine evaluation (centipawns / 100)
 */
export function usePositionalHealth(fen: () => string, evalNumber: () => number) {
  
  /**
   * Main metrics calculation.
   */
  const metrics = computed(() => {
    try {
      const currentFen = fen()
      const currentEval = evalNumber()
      
      // Fallback to start FEN if invalid
      const chess = new Chess(currentFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
      const board = chess.board()
      
      // 1. MATERIAL BALANCE
      let wMat = 0, bMat = 0
      const vals: Record<string, number> = { p: 1, n: 3, b: 3.25, r: 5, q: 9, k: 0 }
      board.flat().forEach(c => {
        if (!c) return
        if (c.color === 'w') wMat += vals[c.type]
        else bMat += vals[c.type]
      })
      
      // Normalize around 50%. A +3 advantage is roughly +15% shift.
      const matPct = 50 + (wMat - bMat) * 5

      // 2. ACTIVITY (Mobility & Space)
      const mobility = chess.moves().length || 20 
      const actPct = Math.min(95, Math.max(5, (mobility / 40) * 100))

      // 3. KING SAFETY (Based on Engine Eval & Structure)
      const evalAbs = Math.abs(currentEval || 0)
      let kgsPct = 90 - (evalAbs * 8) 
      if (chess.isCheck()) kgsPct -= 20
      
      return {
        material: Math.min(100, Math.max(0, matPct || 50)),
        activity: Math.min(100, Math.max(0, actPct || 50)),
        safety: Math.min(100, Math.max(0, kgsPct || 90))
      }
    } catch (e) {
      logger.warn('[usePositionalHealth] Error calculating metrics', e)
      return { material: 50, activity: 50, safety: 90 }
    }
  })

  /**
   * Generates a text-based diagnosis based on the metrics.
   */
  const diagnosis = computed(() => {
    const h = metrics.value
    let matDesc = "Material is balanced."
    if (h.material > 60) matDesc = "You have a significant material advantage."
    else if (h.material < 40) matDesc = "You are down material. Look for counterplay."
    
    let actDesc = "Pieces are normally active."
    if (h.activity > 70) actDesc = "Your pieces dominate the board. Press the attack!"
    else if (h.activity < 30) actDesc = "Your pieces are cramped. Try to simplify or break open the center."
    
    let kgsDesc = "Kings are relatively safe."
    if (h.safety < 60) kgsDesc = "King safety is compromised! Be alert for tactics."
    else if (h.safety < 30) kgsDesc = "Critical King Exposure. Defend immediately!"

    return { material: matDesc, activity: actDesc, safety: kgsDesc }
  })

  return {
    metrics,
    diagnosis
  }
}
