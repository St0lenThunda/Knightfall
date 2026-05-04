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
})
