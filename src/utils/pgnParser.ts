/**
 * Fault-Tolerant PGN Parser
 *
 * Chess PGN (Portable Game Notation) files come from many sources —
 * Chess.com, Lichess, Fritz, ChessBase — and each has its own quirks.
 * Some embed clock annotations `[%clk 0:05:23]`, some nest variations
 * in parentheses `(1.e4 e5 2.Nf3)`, and some have broken formatting.
 *
 * This parser uses a 3-tier fallback strategy:
 *
 * 1. **Strict (chess.js)** — Fast native parser. Works for ~90% of PGNs.
 * 2. **AST Tolerant (@mliebelt/pgn-parser)** — Handles nested metadata
 *    and non-standard annotations that chess.js chokes on.
 * 3. **Regex Scrubber** — Destructive last resort. Strips all annotations
 *    and variations to salvage just the raw move text.
 *
 * @param chess - A chess.js instance to load the PGN into
 * @param pgn - The raw PGN string to parse
 */
import { Chess } from 'chess.js'
import { parse } from '@mliebelt/pgn-parser'

export function safeLoadPgn(chess: Chess, pgn: string): void {
  try {
    // Tier 1: Strict PEG parser — fast but fragile
    chess.loadPgn(pgn)
  } catch {
    try {
      // Tier 2: AST-based tolerant parser — handles nested metadata
      const ast = parse(pgn, { startRule: 'game' }) as any
      chess.reset()
      if (ast.tags && ast.tags.FEN) {
        chess.load(ast.tags.FEN)
      }
      for (const m of ast.moves) {
        chess.move(m.notation.notation)
      }
      if (ast.tags) {
        for (const [key, value] of Object.entries(ast.tags)) {
          if (typeof value === 'string') chess.header(key, value)
        }
      }
    } catch {
      // Tier 3: Destructive regex scrubber — strips all annotations
      let clean = pgn.replace(/\[%[^\]]+\]/g, '')
      let prev = ''
      while (clean !== prev) {
        prev = clean
        clean = clean.replace(/\([^()]*\)/g, '')
      }
      try { chess.loadPgn(clean) } catch { /* Surrender — PGN is truly unreadable */ }
    }
  }
}
