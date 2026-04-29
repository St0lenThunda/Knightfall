import { Chess } from 'chess.js'

export type MistakeCategory = 'tactics' | 'positional' | 'opening' | 'endgame' | 'missed_win'
export type MistakeSeverity = 'inaccuracy' | 'mistake' | 'blunder'

export interface TaggedMistake {
  category: MistakeCategory
  severity: MistakeSeverity
  theme: string
  evalDrop: number
  movePlayed?: string
  bestMove?: string
  explanation: string
}

/**
 * TaggingService (Deterministic Intelligence)
 * 
 * Classifies mistakes based on engine evaluation and board state
 * WITHOUT calling an LLM. This provides the "Level 1" explanation.
 */
export class TaggingService {
  /**
   * Analyzes a move to determine its category and theme.
   */
  static identifyMistake(
    fenBefore: string,
    fenAfter: string,
    evalBefore: number,
    evalAfter: number,
    movePlayed?: string,
    bestMove?: string
  ): TaggedMistake | null {
    const evalDrop = Math.abs(evalAfter - evalBefore)
    
    // Thresholds for severity
    let severity: MistakeSeverity = 'inaccuracy'
    if (evalDrop > 2.5) severity = 'blunder'
    else if (evalDrop > 0.9) severity = 'mistake'
    else if (evalDrop < 0.4) return null // Too small to be a mistake

    const chess = new Chess(fenBefore)
    const turn = chess.turn()
    const moveCount = Math.ceil(chess.moveNumber())
    
    // 1. Detect Opening Traps
    if (moveCount <= 10 && evalDrop > 1.5) {
      return {
        category: 'opening',
        severity,
        theme: 'Opening Trap / Theory Deviation',
        evalDrop,
        movePlayed,
        bestMove,
        explanation: bestMove
          ? `${movePlayed || 'This move'} deviates from known theory. **${bestMove}** was the book move here — it avoids a known tactical trap and keeps the position within safe opening principles.`
          : `${movePlayed || 'This move'} falls into a known opening trap. Review the theory for this line to avoid losing tempo or material early.`
      }
    }

    // 2. Detect Tactical vs Positional
    // Check material before and after
    const materialBefore = this.calculateMaterial(fenBefore)
    const materialAfter = this.calculateMaterial(fenAfter)
    
    const materialLoss = turn === 'w' 
      ? materialBefore.white - materialAfter.white 
      : materialBefore.black - materialAfter.black

    // If material was lost (and not part of a trade), it's tactical
    if (materialLoss > 0) {
      const pieceType = materialLoss >= 9 ? 'the queen' : materialLoss >= 5 ? 'a rook' : materialLoss >= 3 ? 'a minor piece' : 'a pawn'
      return {
        category: 'tactics',
        severity,
        theme: materialLoss >= 3 ? 'Major Piece Hang' : 'Tactical Oversight',
        evalDrop,
        movePlayed,
        bestMove,
        explanation: bestMove
          ? `${movePlayed || 'This move'} leaves ${pieceType} undefended. **${bestMove}** was needed to protect the material or create a counter-threat. Always check: "Does my move leave anything hanging?"`
          : `${movePlayed || 'This move'} loses ${pieceType} — a ${evalDrop.toFixed(1)}-pawn swing. Scan for undefended pieces before committing to a move.`
      }
    }

    // 3. Detect Missed Wins
    // If you were winning (+3.0) and now it's equal (0.0)
    if (Math.abs(evalBefore) > 3.0 && Math.abs(evalAfter) < 1.0) {
      return {
        category: 'missed_win',
        severity: 'blunder',
        theme: 'Missed Winning Opportunity',
        evalDrop,
        movePlayed,
        bestMove,
        explanation: bestMove
          ? `The position was winning (${evalBefore > 0 ? '+' : ''}${evalBefore.toFixed(1)}), but ${movePlayed || 'this move'} let the advantage slip away. **${bestMove}** was a forcing continuation that would have converted the advantage decisively.`
          : `A winning position was squandered. The advantage dropped from ${evalBefore > 0 ? '+' : ''}${evalBefore.toFixed(1)} to near equality. Look for checks, captures, and threats when you're ahead.`
      }
    }

    // 4. Default to Positional
    return {
      category: moveCount > 40 ? 'endgame' : 'positional',
      severity,
      theme: moveCount > 40 ? 'Endgame Technique' : 'Positional Inaccuracy',
      evalDrop,
      movePlayed,
      bestMove,
      explanation: bestMove
        ? moveCount > 40
          ? `${movePlayed || 'This move'} is imprecise in the endgame. **${bestMove}** was more accurate — in endgames, every tempo matters. Focus on king activity and pawn advancement.`
          : `${movePlayed || 'This move'} weakens the position by ${evalDrop.toFixed(1)} pawns. **${bestMove}** maintains better piece coordination and long-term structure.`
        : `A ${severity} that costs ${evalDrop.toFixed(1)} pawns. Focus on improving your worst-placed piece before making committal moves.`
    }
  }

  /**
   * Helper to sum material on the board.
   */
  private static calculateMaterial(fen: string) {
    const board = fen.split(' ')[0]
    const values: Record<string, number> = {
      p: 1, n: 3, b: 3, r: 5, q: 9,
      P: 1, N: 3, B: 3, R: 5, Q: 9
    }
    
    let white = 0
    let black = 0
    
    for (const char of board) {
      if (values[char]) {
        if (char === char.toUpperCase()) white += values[char]
        else black += values[char]
      }
    }
    
    return { white, black }
  }

  /**
   * Generates a stable hash for a specific mistake to use as a cache key.
   * SHA-256(FEN + theme + severity)
   */
  static async generatePositionHash(fen: string, theme: string, severity: string, playerName: string = 'Guest'): Promise<string> {
    // Normalize FEN to ignore move counts/en passant for better cache hits
    const normalizedFen = fen.split(' ').slice(0, 4).join(' ')
    const msg = `${normalizedFen}|${theme}|${severity}|${playerName}`
    
    const encoder = new TextEncoder()
    const data = encoder.encode(msg)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
}
