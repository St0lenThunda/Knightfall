import { describe, it, expect, vi } from 'vitest'
import { useLibraryStore } from '../src/stores/libraryStore'
import { useCurriculumStore } from '../src/stores/curriculumStore'
import { setActivePinia, createPinia } from 'pinia'

describe('Personalized Drills Verification', () => {
  it('correctly harvests a blunder from an analyzed game', async () => {
    setActivePinia(createPinia())
    const library = useLibraryStore()
    const curriculum = useCurriculumStore()

    // Setup mock analyzed game with a blunder (9. Nxg5? in a specific tactical line)
    library.games = [
      {
        id: 'test-game',
        pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 Bc5 5. c3 d6 6. O-O O-O 7. Bg5 h6 8. Bh4 g5 9. Nxg5 hxg5 10. Bxg5',
        white: 'Thunda',
        black: 'Bot',
        result: '1-0',
        evals: [
          ...new Array(16).fill({ score: 0.3, isMate: false }), // moves 1-8
          { score: -2.5, isMate: false, bestMove: 'Bg3' }, // 9. Nxg5? (Blunder)
        ],
        analysisCache: {}
      }
    ] as any

    await curriculum.generatePersonalPuzzles()
    
    expect(curriculum.personalPuzzles.length).toBeGreaterThan(0)
    const p = curriculum.personalPuzzles[0]
    
    // The TaggingService should identify this as a blunder or major piece hang
    expect(p.severity).toBe('blunder')
    expect(p.category).toBe('Personal Mistake')
    console.log('✅ Harvested Puzzle:', p.title)
  })
})
