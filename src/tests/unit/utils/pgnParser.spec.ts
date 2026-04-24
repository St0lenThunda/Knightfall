import { describe, it, expect, beforeEach } from 'vitest'
import { Chess } from 'chess.js'
import { safeLoadPgn } from '../../../utils/pgnParser'

describe('PGN Parser (Fault-Tolerant Engine)', () => {
  let chess: Chess

  beforeEach(() => {
    chess = new Chess()
  })

  it('Tier 1: Successfully loads a standard, clean PGN', () => {
    const pgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5 *'
    safeLoadPgn(chess, pgn)
    expect(chess.history().length).toBe(5)
    expect(chess.get('e4')).toEqual({ type: 'p', color: 'w' })
  })

  it('Tier 2: Handles PGNs with non-standard tags/annotations via AST', () => {
    // Some complex metadata that chess.js might struggle with if it's malformed
    const pgn = '[FEN "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"]\n[White "DeepBlue"]\n[Black "Kasparov"]\n\n1... c5 2. Nf3 d6 *'
    safeLoadPgn(chess, pgn)
    expect(chess.header().White).toBe('DeepBlue')
    expect(chess.history().length).toBe(3)
  })

  it('Tier 3: Salvages moves from heavily annotated PGNs using regex scrubbing', () => {
    // PGN with clock info and nested variations that might crash a strict parser
    const pgn = '1. e4 {[%clk 0:05:00]} e5 {[%clk 0:04:58]} (1... c5 2. Nf3 {Oops}) 2. Nf3 {[%clk 0:04:55]} Nc6 *'
    safeLoadPgn(chess, pgn)
    
    // We expect the main line to be loaded even if annotations are weird
    expect(chess.history().length).toBe(4)
    expect(chess.history()).toContain('e4')
    expect(chess.history()).toContain('e5')
    expect(chess.history()).toContain('Nf3')
  })

  it('Surrenders gracefully on completely unreadable text', () => {
    const pgn = 'This is not a chess game at all.'
    safeLoadPgn(chess, pgn)
    expect(chess.history().length).toBe(0)
  })
})
