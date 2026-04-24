import { describe, it, expect } from 'vitest'
import { evaluateBadges } from '../../../utils/badgeEngine'

describe('BadgeEngine (Milestones & Achievements)', () => {
  const baseInput = {
    profile: { rating: 1200, puzzle_rating: 1200 },
    pastGames: [],
    puzzleAttempts: [],
    archetype: {
      category: 'mixed',
      title: 'Balanced Initiate',
      missRate: 0,
      radarScores: { opening: 0.5, tactics: 0.5, endgame: 0.5 }
    }
  }

  describe('Pillar 4: Chess Titles', () => {
    it('awards "Pawn" title for new players', () => {
      const result = evaluateBadges(baseInput)
      expect(result.title.label).toBe('Pawn')
    })

    it('awards "Knight" for 10 games and 1200+ puzzle rating', () => {
      const input = {
        ...baseInput,
        pastGames: new Array(10).fill({ result: 'win' }),
        profile: { rating: 1200, puzzle_rating: 1250 }
      }
      const result = evaluateBadges(input)
      expect(result.title.label).toBe('Knight')
    })

    it('awards "Grandmaster" for elite performance', () => {
      const input = {
        ...baseInput,
        pastGames: new Array(500).fill({ result: 'win' }),
        profile: { rating: 2000, puzzle_rating: 1850 }
      }
      const result = evaluateBadges(input)
      expect(result.title.label).toBe('Grandmaster')
    })
  })

  describe('Pillar 1: Milestones', () => {
    it('awards "First Blood" on first win', () => {
      const input = {
        ...baseInput,
        pastGames: [{ result: 'win' }] as any
      }
      const result = evaluateBadges(input)
      const badge = result.badges.find(b => b.id === 'first_win')
      expect(badge?.earned).toBe(true)
    })

    it('calculates Centurion progress correctly', () => {
      const input = {
        ...baseInput,
        pastGames: new Array(50).fill({ result: 'win' }) as any
      }
      const result = evaluateBadges(input)
      const centurion = result.badges.find(b => b.id === 'games_100')
      expect(centurion?.earned).toBe(false)
      expect(centurion?.progress).toBe(0.5)
    })
  })

  describe('Pillar 2: Mastery', () => {
    it('awards "Endgame Surgeon" for high accuracy', () => {
      const input = {
        ...baseInput,
        puzzleAttempts: new Array(10).fill({ solved: true, themes: ['endgame'], time_taken_seconds: 10, created_at: '2024-01-01T12:00:00Z' }) as any
      }
      const result = evaluateBadges(input)
      const badge = result.badges.find(b => b.id === 'endgame_surgeon')
      expect(badge?.earned).toBe(true)
    })

    it('awards "Speed Demon" for fast solves', () => {
      const input = {
        ...baseInput,
        puzzleAttempts: new Array(5).fill({ solved: true, themes: ['tactics'], time_taken_seconds: 5, created_at: '2024-01-01T12:00:00Z' }) as any
      }
      const result = evaluateBadges(input)
      const badge = result.badges.find(b => b.id === 'speed_demon')
      expect(badge?.earned).toBe(true)
    })

    it('awards "Pure Genius" for flawless solves', () => {
      const input = {
        ...baseInput,
        puzzleAttempts: new Array(25).fill({ solved: true, hints_used: 0, attempts: 1, themes: [], created_at: '2024-01-01T12:00:00Z' }) as any
      }
      const result = evaluateBadges(input)
      const badge = result.badges.find(b => b.id === 'pure_genius')
      expect(badge?.earned).toBe(true)
    })
  })

  describe('Pillar 3: Rituals', () => {
    it('detects 3-day streaks correctly', () => {
      const today = new Date().toISOString().slice(0, 10)
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      const dayBefore = new Date(Date.now() - 172800000).toISOString().slice(0, 10)

      const input = {
        ...baseInput,
        puzzleAttempts: [
          { solved: true, created_at: today + 'T12:00:00Z', themes: [] },
          { solved: true, created_at: yesterday + 'T12:00:00Z', themes: [] },
          { solved: true, created_at: dayBefore + 'T12:00:00Z', themes: [] }
        ] as any
      }
      const result = evaluateBadges(input)
      const badge = result.badges.find(b => b.id === 'streak_3')
      expect(badge?.earned).toBe(true)
    })

    it('awards "Midnight Tactician" for late night solves', () => {
      // Create attempts in the 0-4 hour range in LOCAL time for the test environment
      const localLateDate = new Date()
      localLateDate.setHours(1, 0, 0, 0)
      const timestamp = localLateDate.toISOString()

      const input = {
        ...baseInput,
        puzzleAttempts: new Array(10).fill({ 
          solved: true, 
          created_at: timestamp,
          themes: [] 
        }) as any
      }
      const result = evaluateBadges(input)
      const badge = result.badges.find(b => b.id === 'midnight_tactician')
      expect(badge?.earned).toBe(true)
    })
  })

  describe('Pillar 4: Titles', () => {
    it('awards "Tactical Beast" for 0.9+ radar score', () => {
      const input = {
        ...baseInput,
        archetype: {
          ...baseInput.archetype,
          radarScores: { opening: 0.5, tactics: 0.95, endgame: 0.5 }
        }
      }
      const result = evaluateBadges(input)
      const badge = result.badges.find(b => b.id === 'tactical_beast')
      expect(badge?.earned).toBe(true)
    })
  })
})
