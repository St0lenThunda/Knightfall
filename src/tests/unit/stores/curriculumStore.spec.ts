import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCurriculumStore } from '../../../stores/curriculumStore'
import { useLibraryStore } from '../../../stores/libraryStore'

// Mock the dependencies
vi.mock('../../../stores/libraryStore', () => ({
  useLibraryStore: vi.fn()
}))

vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ error: null })
  }
}))

describe('Curriculum Store - Shadow Realm Intelligence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should generate a personal puzzle when a mistake is detected in an analyzed game', async () => {
    const curriculum = useCurriculumStore()
    
    // 1. Setup a mock game with a known mistake
    // Position: Starting position
    // Played: e2e3 (Inaccurate/Mistake compared to e2e4)
    // Best: e2e4
    const mockGame = {
      id: 'test-game-123',
      pgn: '1. e3 e5',
      whiteElo: '1500',
      event: 'Test Open',
      // The analysisCache contains the coach's explanation for the FEN BEFORE the mistake
      analysisCache: {
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': 'You played e3, but e4 is the primary theoretical move controlling the center.'
      },
      // Evals contains the engine's bestMove for each ply
      evals: [
        { score: 30, isMate: false, bestMove: 'e2e4' }, // Ply 0: e2e4 was best
      ]
    }

    // 2. Mock libraryStore to return our game
    ;(useLibraryStore as any).mockReturnValue({
      games: [mockGame]
    })

    // 3. Trigger Generation
    await curriculum.generatePersonalPuzzles()

    // 4. Assertions
    expect(curriculum.personalPuzzles.length).toBe(1)
    const puzzle = curriculum.personalPuzzles[0]
    
    expect(puzzle.id).toContain('personal-test-game-123')
    expect(puzzle.solution).toContain('e2e4') // Should be the best move
    expect(puzzle.explanation).toContain('You played e3')
    expect(puzzle.category).toBe('Personal Mistake')
  })

  it('should group related puzzles into thematic lessons', async () => {
    const curriculum = useCurriculumStore()
    
    // 1. Manually populate personal puzzles with a common theme
    curriculum.personalPuzzles = [
      { id: 'p1', themes: ['Fork'], category: 'Personal Mistake' },
      { id: 'p2', themes: ['Fork'], category: 'Personal Mistake' }
    ]

    // 2. Trigger Lesson Generation
    await curriculum.generatePersonalLessons()

    // 3. Assertions
    expect(curriculum.personalLessons.length).toBe(1)
    expect(curriculum.personalLessons[0].title).toBe('Focus: Fork')
    expect(curriculum.personalLessons[0].puzzles.length).toBe(2)
  })
})
