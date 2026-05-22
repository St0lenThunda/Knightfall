import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCurriculumStore } from '../../../stores/curriculumStore'
import { useLibraryStore } from '../../../stores/libraryStore'
import { useUserStore } from '../../../stores/userStore'
import { useUiStore } from '../../../stores/uiStore'
import { supabase } from '../../../api/supabaseClient'

// Mock the dependencies
vi.mock('../../../stores/libraryStore', () => ({
  useLibraryStore: vi.fn()
}))

vi.mock('../../../stores/userStore', () => {
  const addXP = vi.fn()
  const markQuestComplete = vi.fn()
  return {
    useUserStore: vi.fn(() => ({
      profile: { id: 'test-user-id', xp: 100 },
      addXP,
      markQuestComplete
    }))
  }
})

vi.mock('../../../stores/uiStore', () => {
  const addToast = vi.fn()
  return {
    useUiStore: vi.fn(() => ({
      addToast
    }))
  }
})

vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
  }
}))

vi.mock('../../../api/puzzleApi', () => ({
  fetchPuzzleBatch: vi.fn().mockResolvedValue([])
}))

describe('Curriculum Store - Shadow Realm Intelligence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should generate a personal puzzle when a mistake is detected in an analyzed game', async () => {
    const curriculum = useCurriculumStore()
    
    // 1. Setup a mock game with a known mistake
    // Position: Starting position
    // Played: e2e3 (Inaccurate/Mistake compared to e2e4)
    // Best: e2e4
    const mockGame = {
      id: 'test-game-123',
      pgn: '1. e4 f6',
      whiteElo: '1500',
      event: 'Test Open',
      analysisCache: {
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1': 'You played f6, but e5 is the standard response to e4.'
      },
      evals: [
        { score: 0.4, bestMove: 'e5' }, // After 1. e4, Black should play e5
        { score: 3.5, bestMove: 'd4' }, // After 1... f6, White is much better
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
    expect(puzzle.solution).toContain('e5') // Best move for Black
    expect(puzzle.explanation).toContain('f6')
    expect(puzzle.category).toBe('Personal Mistake')
  })

  it('should handle null elements in evals gracefully without throwing', async () => {
    const curriculum = useCurriculumStore()
    
    // Setup a game with a null eval in the evals array
    const mockGameWithNullEvals = {
      id: 'test-game-null-evals',
      pgn: '1. e4 f6',
      whiteElo: '1500',
      event: 'Test Open',
      evals: [
        null, // Simulates a null eval
        { score: 3.5, bestMove: 'd4' },
      ]
    }

    ;(useLibraryStore as any).mockReturnValue({
      games: [mockGameWithNullEvals]
    })

    // Verify it doesn't throw a TypeError
    await expect(curriculum.generatePersonalPuzzles()).resolves.not.toThrow()
    expect(curriculum.personalPuzzles.length).toBe(0)
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

  describe('Quest Completion & XP award rules', () => {
    it('should complete a quest for the first time, insert into database, and award XP', async () => {
      const curriculum = useCurriculumStore()
      const userStore = useUserStore()
      const uiStore = useUiStore()

      // Define a quest in our quests ref for testing (found-origins, rewards 30 XP)
      expect(curriculum.quests.some(q => q.id === 'found-origins')).toBe(true)

      // Mock supabase insert to succeed
      const fromSpy = vi.spyOn(supabase, 'from')
      const insertSpy = vi.fn().mockResolvedValue({ error: null })
      fromSpy.mockReturnValue({ insert: insertSpy } as any)

      // Execute completion
      await curriculum.completeQuest('test-user-id', 'found-origins')

      // Assertions
      expect(insertSpy).toHaveBeenCalledWith([{ user_id: 'test-user-id', node_id: 'found-origins' }])
      expect(curriculum.completedQuestIds).toContain('found-origins')
      expect(userStore.markQuestComplete).toHaveBeenCalledWith('found-origins')
      expect(userStore.addXP).toHaveBeenCalledWith(30) // from quest.xp_reward (30 XP)
      expect(uiStore.addToast).toHaveBeenCalledWith('+30 XP earned!', 'success')
    })

    it('should skip completion, database insertion, and XP award if already completed', async () => {
      const curriculum = useCurriculumStore()
      const userStore = useUserStore()
      const uiStore = useUiStore()

      // Pre-populate completed quests
      curriculum.completedQuestIds = ['found-origins']

      // Mock supabase insert (should not be called anyway)
      const fromSpy = vi.spyOn(supabase, 'from')
      const insertSpy = vi.fn().mockResolvedValue({ error: null })
      fromSpy.mockReturnValue({ insert: insertSpy } as any)

      // Execute completion
      await curriculum.completeQuest('test-user-id', 'found-origins')

      // Assertions
      expect(insertSpy).not.toHaveBeenCalled()
      expect(userStore.markQuestComplete).not.toHaveBeenCalled()
      expect(userStore.addXP).not.toHaveBeenCalled()
      expect(uiStore.addToast).not.toHaveBeenCalled()
    })
  })
})
