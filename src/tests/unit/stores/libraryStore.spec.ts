import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLibraryStore } from '../../../stores/libraryStore'
import { useUserStore } from '../../../stores/userStore'

// Mock Worker for sub-composables
global.Worker = class {
  onmessage = null
  postMessage() {}
  terminate() {}
} as any

// Mock the sub-composables to isolate the Orchestrator
vi.mock('../../../stores/library/useLibraryIdb', () => ({
  useLibraryIdb: vi.fn((games) => ({
    loadGames: vi.fn(),
    resetLibrary: vi.fn(),
    deleteGame: vi.fn(),
    persistGameUpdate: vi.fn(),
    purgeDuplicates: vi.fn(async () => {
      if (games && games.value) games.value = games.value.slice(0, 1)
      return 1
    })
  }))
}))

vi.mock('../../../stores/library/useLibraryImport', () => ({
  useLibraryImport: vi.fn(() => ({
    importPgn: vi.fn(),
    importPgnZip: vi.fn(),
    saveGameToLibrary: vi.fn(),
    importFromLichess: vi.fn()
  }))
}))

vi.mock('../../../stores/library/useLibraryStats', () => ({
  useLibraryStats: vi.fn(() => ({
    performanceRating: 1500,
    libraryWldStats: { win: 0, loss: 0, draw: 0, winPct: 0, lossPct: 0, drawPct: 0 },
    openingStats: []
  }))
}))

vi.mock('../../../stores/library/useLibraryFilter', () => ({
  useLibraryFilter: vi.fn(() => ({
    filteredGames: { value: [] },
    isFiltering: { value: false }
  }))
}))

vi.mock('../../../stores/library/useLibrarySync', () => ({
  useLibrarySync: vi.fn(() => ({
    syncCloudGames: vi.fn(),
    purgeCloudLibrary: vi.fn()
  }))
}))

vi.mock('../../../stores/library/useLibraryConstellation', () => ({
  useLibraryConstellation: vi.fn(() => ({
    generateOpeningTree: vi.fn()
  }))
}))

vi.mock('../../../stores/library/useLibraryAnalysis', () => ({
  useLibraryAnalysis: vi.fn(() => ({
    isBulkAnalyzing: false,
    analysisProgress: 0,
    startBulkAnalysis: vi.fn(),
    stopBulkAnalysis: vi.fn()
  }))
}))

describe('LibraryStore (Orchestrator)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('filters "Personal DNA" games correctly based on user identity', () => {
    const userStore = useUserStore()
    userStore.isMe = vi.fn((name: string) => name === 'Thunda')

    const libraryStore = useLibraryStore()
    libraryStore.games = [
      { id: '1', white: 'Thunda', black: 'GM_Magnus', result: '1-0', pgn: '', date: '', event: '', eco: '', movesCount: 0, addedAt: 0 },
      { id: '2', white: 'Stockfish', black: 'AlphaZero', result: '1/2-1/2', pgn: '', date: '', event: '', eco: '', movesCount: 0, addedAt: 0 }
    ] as any

    expect(libraryStore.personalGames.length).toBe(1)
    expect(libraryStore.personalGames[0].id).toBe('1')
  })

  it('correctly tracks analyzedGamesCount', () => {
    const libraryStore = useLibraryStore()
    libraryStore.games = [
      { id: '1', evals: [0.5], pgn: '', white: '', black: '', result: '', date: '', event: '', eco: '', movesCount: 0, addedAt: 0 },
      { id: '2', evals: [], pgn: '', white: '', black: '', result: '', date: '', event: '', eco: '', movesCount: 0, addedAt: 0 },
      { id: '3', pgn: '', white: '', black: '', result: '', date: '', event: '', eco: '', movesCount: 0, addedAt: 0 }
    ] as any

    expect(libraryStore.analyzedGamesCount).toBe(1)
  })

  it('repairs metadata by parsing PGN headers', async () => {
    const libraryStore = useLibraryStore()
    libraryStore.games = [
      { 
        id: 'repair-me', 
        white: 'Unknown', 
        black: 'Unknown', 
        pgn: '[White "Legend"]\n[Black "Challenger"]\n[WhiteElo "2800"]\n\n1. e4 *',
        date: '?',
        event: '',
        eco: '',
        movesCount: 1,
        addedAt: 0
      }
    ] as any

    await libraryStore.repairVaultMetadata()

    const game = libraryStore.games[0]
    expect(game.white).toBe('Legend')
    expect(game.black).toBe('Challenger')
    expect(game.whiteElo).toBe('2800')
  })

  it('purges duplicate games based on move fingerprint', async () => {
    const libraryStore = useLibraryStore()
    libraryStore.games = [
      { id: 'orig', white: 'A', black: 'B', pgn: '1. e4 e5 *', addedAt: 1 },
      { id: 'dup', white: 'a', black: 'b', pgn: '1. e4 e5 *', addedAt: 2 }
    ] as any

    const deletedCount = await libraryStore.purgeDuplicates()
    expect(deletedCount).toBe(1)
  })

  it('generates a gamesMap for O(1) lookups', () => {
    const libraryStore = useLibraryStore()
    libraryStore.games = [
      { id: 'unique-id', white: 'A', black: 'B', pgn: '' }
    ] as any

    expect(libraryStore.gamesMap.has('unique-id')).toBe(true)
    expect(libraryStore.gamesMap.get('unique-id')?.white).toBe('A')
  })
})
