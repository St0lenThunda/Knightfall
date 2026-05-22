import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../gameStore'

// Mock dependencies
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('../../utils/storage', () => ({
  Storage: {
    get: vi.fn(),
    set: vi.fn()
  },
  StorageKey: {
    LAST_ANALYSIS_PGN: 'LAST_ANALYSIS_PGN'
  }
}))

vi.mock('../engineStore', () => ({
  useEngineStore: () => ({
    analyze: vi.fn(),
    stop: vi.fn(),
    suggestedMove: null,
    bestMove: null,
    setMortalArchetype: vi.fn()
  })
}))

vi.mock('../game/useBotEngine', () => ({
  useBotEngine: () => ({
    activeBot: { value: { name: 'Mock Bot', depth: 10 } }
  }),
  BOTS: []
}))

describe('GameStore Orchestration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes in an inactive state', () => {
    const store = useGameStore()
    expect(store.gameActive).toBe(false)
    expect(store.mode).toBe('local')
  })

  it('becomes active after loadPosition', () => {
    const store = useGameStore()
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    
    store.loadPosition(fen, 'puzzle')
    
    expect(store.mode).toBe('puzzle')
    expect(store.gameStarted).toBe(true)
    expect(store.forceGameOver).toBe(false)
    expect(store.isGameOver).toBe(false)
    expect(store.gameActive).toBe(true)
  })

  it('correctly reports isPlayersTurn in vs-computer mode', () => {
    const store = useGameStore()
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    
    // Set to computer mode, white player
    store.loadPosition(fen, 'vs-computer')
    store.playerColor = 'w'
    
    expect(store.gameActive).toBe(true)
    expect(store.turn).toBe('w')
    expect(store.isPlayersTurn).toBe(true)
    
    // Make a move for white
    store.makeMove('e2', 'e4')
    
    expect(store.turn).toBe('b')
    expect(store.isPlayersTurn).toBe(false)
  })

  it('stays active with the user reported FEN', () => {
    const store = useGameStore()
    const fen = 'r2qk2r/3b1pp1/1pQ1pB1p/p2p4/2nPP3/2N2N2/PP3PPP/R3KB1R b KQkq - 0 1'
    
    store.loadPosition(fen, 'puzzle')
    
    expect(store.gameActive).toBe(true)
    expect(store.isGameOver).toBe(false)
  })

  it('prevents moves when the game is not active', () => {
    const store = useGameStore()
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    
    // Position loaded but we manually stop it (simulating a bug)
    store.loadPosition(fen, 'local')
    store.gameStarted = false
    
    const move = store.makeMove('e2', 'e4')
    expect(move).toBeNull()
  })

  it('synchronizes playerColor from FEN turn in puzzle mode', () => {
    const store = useGameStore()
    // Black to move FEN
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1'
    
    store.loadPosition(fen, 'puzzle')
    
    // Store should have synced color to 'b'
    expect(store.playerColor).toBe('b')
    expect(store.turn).toBe('b')
    expect(store.isPlayersTurn).toBe(true)
  })

  describe('Drill / Puzzle Validation Mechanics', () => {
    /**
     * Sets up a test puzzle context on the game store.
     * We initialize with the standard starting FEN, where it is White's turn.
     * The drill solution is defined as a 3-move sequence:
     * 1. e2e4 (White pawn move)
     * 2. e7e5 (Black pawn response)
     * 3. d2d4 (White pawn push)
     * This sequence alternates players (White -> Black -> White) to satisfy
     * Chess.js strict turn-alternation rules.
     * 
     * @param store - The game store instance to configure for the test.
     */
    function setupTestDrill(store: any) {
      // Starting FEN: White to move, full board.
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      
      // Load the position into the store under 'puzzle' mode.
      store.loadPosition(fen, 'puzzle')
      
      // Set the drill moves. They must alternate colors to be legally playable.
      store.setDrill(['e2e4', 'e7e5', 'd2d4'])
      
      // Initially, drillIndex is 0 and mistakeCount is 0.
      expect(store.drillIndex).toBe(0)
      expect(store.mistakeCount).toBe(0)
    }

    /**
     * Verifies that playing the correct moves in sequence advances
     * the drillIndex correctly and doesn't record mistakes.
     */
    it('correctly validates correct moves in sequence', () => {
      const store = useGameStore()
      setupTestDrill(store)

      // Play the first correct move: e2e4 (White, index 0).
      // This is legal for White from the starting position.
      const res1 = store.makeMove('e2', 'e4')
      expect(res1).not.toBeNull()
      expect(res1).not.toBe('incorrect')
      expect(store.drillIndex).toBe(1)
      expect(store.mistakeCount).toBe(0)

      // Play the second correct move: e7e5 (Black, index 1).
      // Since e2e4 changed the turn to Black, this move is legal.
      const res2 = store.makeMove('e7', 'e5')
      expect(res2).not.toBeNull()
      expect(res2).not.toBe('incorrect')
      expect(store.drillIndex).toBe(2)
      expect(store.mistakeCount).toBe(0)

      // Play the third correct move: d2d4 (White, index 2).
      // This is legal for White after e7e5 and completes the drill.
      const res3 = store.makeMove('d2', 'd4')
      expect(res3).not.toBeNull()
      expect(res3).not.toBe('incorrect')
      expect(store.drillIndex).toBe(3)
      expect(store.mistakeCount).toBe(0)
    })

    /**
     * Verifies that incorrect moves are rejected, undone, and record mistakes.
     */
    it('correctly rejects incorrect moves, undos them, and registers a mistake', () => {
      const store = useGameStore()
      setupTestDrill(store)

      // Play an incorrect first move (e2e3 instead of e2e4)
      // Even though e2e3 is a legal move in chess, it deviates from the drill solution.
      const res = store.makeMove('e2', 'e3')
      
      // Validation should fail and return 'incorrect'.
      expect(res).toBe('incorrect')
      
      // Drill index should NOT advance.
      expect(store.drillIndex).toBe(0)
      
      // A mistake must be registered.
      expect(store.mistakeCount).toBe(1)
      
      // The board state should be reverted back to the starting FEN.
      expect(store.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    })

    /**
     * Verifies that making a move using a single UCI string format (e.g. 'e2e4')
     * is correctly parsed and validated.
     */
    it('handles UCI-string parameters correctly using finalTo', () => {
      const store = useGameStore()
      setupTestDrill(store)

      // Play the correct move using a single string representing the UCI move.
      const res = store.makeMove('e2e4')
      expect(res).not.toBe('incorrect')
      expect(res).not.toBeNull()
      
      // Should successfully advance the drill index to 1.
      expect(store.drillIndex).toBe(1)
    })

    /**
     * Verifies that if a user tries to play after the drill has been completed,
     * the code safely handles it and does not crash with a TypeError.
     */
    it('guards against expected move being undefined if drill is completed', () => {
      const store = useGameStore()
      setupTestDrill(store)

      // Complete the drill by playing all three correct moves in alternating order.
      store.makeMove('e2', 'e4') // White
      store.makeMove('e7', 'e5') // Black
      store.makeMove('d2', 'd4') // White
      expect(store.drillIndex).toBe(3) // Index 3 matches length of solution (3), drill completed.

      // Play an extra move after the drill is complete.
      // There is no expected move at index 3. The code should guard and evaluate it as incorrect.
      const res = store.makeMove('d8', 'f6') // Black Queen move
      
      // This should be treated as incorrect (or game completed status might restrict it),
      // but most importantly, it should not crash due to reading properties of undefined.
      expect(res).toBe('incorrect')
      expect(store.mistakeCount).toBe(1)
    })

    it('handles pawn promotion in analysis mode', () => {
      const store = useGameStore()
      store.loadPosition('8/4P3/8/8/8/8/8/4K3 w - - 0 1', 'analysis')
      
      // We cast the return value of makeMove to 'any' because makeMove returns a union type:
      // a Chess.js Move object, a status string ('complete' | 'correct' | 'incorrect'), or null.
      // In analysis mode, we expect a Move object, which contains a 'promotion' field.
      const move = store.makeMove('e7', 'e8') as any
      expect(move).not.toBeNull()
      expect(move?.promotion).toBe('q')
    })

    it('forces default promotion piece if passed invalid/falsy values', () => {
      const store = useGameStore()
      store.loadPosition('8/4P3/8/8/8/8/8/4K3 w - - 0 1', 'analysis')
      
      // Explicitly pass an invalid piece symbol and check that it falls back to 'q'.
      // We cast the return value to 'any' here as well to inspect the 'promotion' property on the returned Move object.
      const move = store.makeMove('e7', 'e8', 'x' as any) as any
      expect(move).not.toBeNull()
      expect(move?.promotion).toBe('q')
    })
  })
})

