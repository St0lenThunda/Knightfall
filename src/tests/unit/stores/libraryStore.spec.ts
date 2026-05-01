import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLibraryStore } from '../../../stores/libraryStore'
import { useUserStore } from '../../../stores/userStore'

// Mock Worker for sub-composables
global.Worker = class {
  onmessage = null
  postMessage() {}
  terminate() {}
} as any;

// Mock chess.js
vi.mock('chess.js', () => ({
  Chess: vi.fn(() => ({
    loadPgn: vi.fn(),
    header: vi.fn(() => ({})),
    history: vi.fn(() => []),
    fen: vi.fn(() => ''),
    move: vi.fn(() => true)
  }))
}))

// Mock userStore
vi.mock('../../../stores/userStore', () => ({
  useUserStore: vi.fn(() => ({
    profile: { username: 'Guest' },
    isMe: vi.fn((name) => name === 'Thunda')
  }))
}))

// Mock Storage Utility
vi.mock('../../../utils/storage', () => ({
  Storage: {
    get: vi.fn((_key, def) => def),
    set: vi.fn(),
    remove: vi.fn()
  },
  StorageKey: {
    VAULT_SORT_BY: 'vault_sort_by',
    VAULT_SORT_ORDER: 'vault_sort_order',
    LAST_ANALYSIS_PGN: 'last_analysis_pgn',
    LAST_ANALYSIS_ID: 'last_analysis_id',
    LICHESS_USERNAME: 'lichess_username',
    VAULT_VIEW_MODE: 'vault_view_mode',
    VAULT_LIMIT: 'vault_limit'
  }
}))

// Mock the sub-composables to isolate the Orchestrator
vi.mock('../../../stores/library/useLibraryIdb', () => ({
  useLibraryIdb: vi.fn((games) => ({
    loadGames: vi.fn(),
    initDb: vi.fn(async () => ({
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          put: vi.fn()
        })),
        oncomplete: null
      }))
    })),
    resetLibrary: vi.fn(),
    deleteGame: vi.fn(),
    persistGameUpdate: vi.fn(),
    purgeDuplicates: vi.fn(async () => {
      if (games && games.value) games.value = games.value.slice(0, 1)
      return 1
    }),
    getGameCount: vi.fn(async () => 100),
    loadGamesByUser: vi.fn(async () => []),
    loadGamesPaged: vi.fn(async (limit, offset) => {
      return Array(limit).fill(null).map((_, i) => ({
        id: `paged-${offset + i}`,
        pgn: '', white: '', black: '', result: '', date: '', event: '', eco: '', movesCount: 0, addedAt: 0
      }))
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
    isFiltering: { value: false },
    allTags: { value: [] }
  }))
}))

vi.mock('../../../stores/library/useLibrarySync', () => ({
  useLibrarySync: vi.fn(() => ({
    syncCloudGames: vi.fn(),
    purgeCloudLibrary: vi.fn(),
    pushGameAnalysis: vi.fn()
  }))
}))

vi.mock('../../../stores/library/useLibraryConstellation', () => ({
  useLibraryConstellation: vi.fn(() => ({
    generateOpeningTree: vi.fn()
  }))
}))

vi.mock('../../../stores/library/analysis/index', () => ({
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
    vi.clearAllMocks()
  })

  describe('Lazy Loading Strategy', () => {
    it('loads everything if vault is small (< 2000)', async () => {
      const libraryStore = useLibraryStore()
      // @ts-ignore
      libraryStore.idb.getGameCount.mockResolvedValue(1500)
      // @ts-ignore
      libraryStore.idb.loadGames.mockImplementation(async () => {
        libraryStore.games = Array(1500).fill({}) as any
      })

      await libraryStore.loadGames()

      expect(libraryStore.games.length).toBe(1500)
      expect(libraryStore.vaultOffset).toBe(1500)
    })

    it('uses pagination for large vaults (> 2000)', async () => {
      const libraryStore = useLibraryStore()
      // @ts-ignore
      libraryStore.idb.getGameCount.mockResolvedValue(5000)
      
      await libraryStore.loadGames()

      expect(libraryStore.games.length).toBe(500) // VAULT_PAGE_SIZE
      expect(libraryStore.vaultOffset).toBe(500)
      expect(libraryStore.hasMoreGames).toBe(true)
    })

    it('can load subsequent chunks', async () => {
      const libraryStore = useLibraryStore()
      // @ts-ignore
      libraryStore.idb.getGameCount.mockResolvedValue(5000)
      
      await libraryStore.loadGames()
      const initialCount = libraryStore.games.length
      
      await libraryStore.loadMoreGames()
      
      expect(libraryStore.games.length).toBe(initialCount + 500)
      expect(libraryStore.vaultOffset).toBe(1000)
    })
  })

  describe('Identity Filtering (Personal DNA)', () => {
    it('correctly identifies personal games via username', () => {
      const libraryStore = useLibraryStore()
      const userStore = useUserStore()
      // @ts-ignore
      userStore.isMe.mockImplementation((name) => name === 'Thunda')

      libraryStore.games = [
        { white: 'Thunda', black: 'Magnus', tags: [] } as any,
        { white: 'Hikaru', black: 'Thunda', tags: [] } as any,
        { white: 'Magnus', black: 'Hikaru', tags: [] } as any
      ]

      expect(libraryStore.personalGames.length).toBe(2)
    })

    it('identifies games via "My Games" tag', () => {
      const libraryStore = useLibraryStore()
      const userStore = useUserStore()
      // @ts-ignore
      userStore.isMe.mockReturnValue(false)

      libraryStore.games = [
        { white: 'Someone', black: 'Else', tags: ['My Games'] } as any,
        { white: 'Someone', black: 'Else', tags: [] } as any
      ]

      expect(libraryStore.personalGames.length).toBe(1)
    })
  })
})
