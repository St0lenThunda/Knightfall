import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fetchLichessDaily } from '../../../api/puzzleApi'
import { Storage, StorageKey } from '../../../utils/storage'

describe('Lichess Daily Puzzle Fetch & Cache', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch from API when no cache exists, validate it, and write to cache', async () => {
    const mockLichessDailyResponse = {
      puzzle: {
        id: 'daily123',
        rating: 1650,
        themes: ['mate', 'short'],
        initialMove: 'e2e4',
        solution: ['e7e5', 'g1f3']
      },
      game: {
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
      }
    }

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockLichessDailyResponse
    } as Response)

    const today = new Date().toISOString().split('T')[0]

    const puzzle = await fetchLichessDaily()

    // Assert that API was called
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith('https://lichess.org/api/puzzle/daily')

    // Assert the parsed puzzle matches schema
    expect(puzzle).not.toBeNull()
    expect(puzzle!.id).toBe('lichess-daily123')
    expect(puzzle!.rating).toBe(1650)
    expect(puzzle!.themes).toContain('mate')
    expect(puzzle!.fen).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1')

    // Assert it was written to cache
    const cachedDate = Storage.get(StorageKey.LICHESS_DAILY_FETCH_DATE, '')
    const cachedPuzzle = Storage.get(StorageKey.LICHESS_DAILY_PUZZLE, null)

    expect(cachedDate).toBe(today)
    expect(cachedPuzzle).toEqual(puzzle)
  })

  it('should return cached puzzle and not call fetch API if cache matches today date', async () => {
    const today = new Date().toISOString().split('T')[0]
    const cachedPuzzle = {
      id: 'lichess-cached123',
      title: 'Lichess Daily Puzzle',
      rating: 1800,
      themes: ['fork'],
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      lastMove: 'e2e4',
      solution: ['e2e4'],
      category: 'External'
    }

    // Set cache manually
    Storage.set(StorageKey.LICHESS_DAILY_FETCH_DATE, today)
    Storage.set(StorageKey.LICHESS_DAILY_PUZZLE, cachedPuzzle)

    const fetchSpy = vi.spyOn(global, 'fetch')

    const puzzle = await fetchLichessDaily()

    // Assert API was NOT called
    expect(fetchSpy).not.toHaveBeenCalled()

    // Assert it returned the cached puzzle
    expect(puzzle).toEqual(cachedPuzzle)
  })
})
