import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { useCoachStore } from '../../../stores/coachStore'
import { useLibraryStore } from '../../../stores/libraryStore'
import { useUserStore } from '../../../stores/userStore'

// Mock Worker for sub-composables (inherited from libraryStore)
global.Worker = class {
  onmessage = null
  postMessage() {}
  terminate() {}
} as any

describe('CoachStore (The Brain)', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({
      createSpy: vi.fn,
      stubActions: false
    }))
  })

  describe('Archetype Engine', () => {
    it('initializes with a "Balanced Initiate" report when no data exists', () => {
      const coachStore = useCoachStore()
      const report = coachStore.archetypeReport

      expect(report.label).toBe('Balanced Initiate')
      expect(report.category).toBe('mixed')
    })

    it('calculates "Tactical Opportunist" when user has many puzzle failures', () => {
      const userStore = useUserStore()
      userStore.puzzleAttempts = [
        { solved: false, themes: ['tactics', 'mate'], id: '1', date: '', pgn: '', score: 0 },
        { solved: false, themes: ['tactics'], id: '2', date: '', pgn: '', score: 0 }
      ] as any

      const coachStore = useCoachStore()
      const report = coachStore.archetypeReport

      expect(report.category).toBe('tactics')
      expect(report.title).toBe('Tactical Opportunist')
    })

    it('identifies "Theoretical Specialist" when user loses many games with ECO codes', () => {
      const libraryStore = useLibraryStore()
      const userStore = useUserStore()
      userStore.isMe = vi.fn((name: string | null | undefined) => name === 'Player1')
      
      libraryStore.games = [
        { id: '1', white: 'Player1', black: 'Bot', result: '0-1', eco: 'B01', pgn: '', date: '', event: '', movesCount: 20, addedAt: 0 },
        { id: '2', white: 'Player1', black: 'Bot', result: '0-1', eco: 'C50', pgn: '', date: '', event: '', movesCount: 20, addedAt: 0 }
      ] as any

      const coachStore = useCoachStore()
      const report = coachStore.archetypeReport

      expect(report.category).toBe('opening')
      expect(report.title).toBe('Theoretical Specialist')
    })
  })

  describe('DNA Prescriptions', () => {
    it('triggers "White Side Weakness" when color gap is significant', () => {
      const libraryStore = useLibraryStore()
      const userStore = useUserStore()
      userStore.isMe = vi.fn((name: string | null | undefined) => name === 'Thunda')

      // 100% win as Black, 0% win as White
      libraryStore.games = [
        { id: 'w1', white: 'Thunda', black: 'Bot', result: '0-1', movesCount: 40, addedAt: 0, pgn: '' },
        { id: 'b1', white: 'Bot', black: 'Thunda', result: '0-1', movesCount: 40, addedAt: 0, pgn: '' }
      ] as any

      const coachStore = useCoachStore()
      const rx = coachStore.dnaPrescriptions
      expect(rx.some(item => item.id === 'white-weak')).toBe(true)
    })

    it('triggers "Opening Vulnerability" for short average losses', () => {
      const libraryStore = useLibraryStore()
      const userStore = useUserStore()
      userStore.isMe = vi.fn((name: string | null | undefined) => name === 'Thunda')

      libraryStore.games = [
        { id: '1', white: 'Thunda', black: 'Bot', result: '0-1', movesCount: 15, addedAt: 0, pgn: '' },
        { id: '2', white: 'Thunda', black: 'Bot', result: '0-1', movesCount: 10, addedAt: 0, pgn: '' }
      ] as any

      const coachStore = useCoachStore()
      const rx = coachStore.dnaPrescriptions
      expect(rx.some(item => item.id === 'opening-vuln')).toBe(true)
    })

    it('triggers "Endgame Leaks" for long average losses', () => {
      const libraryStore = useLibraryStore()
      const userStore = useUserStore()
      userStore.isMe = vi.fn((name: string | null | undefined) => name === 'Thunda')

      libraryStore.games = [
        { id: '1', white: 'Thunda', black: 'Bot', result: '0-1', movesCount: 65, addedAt: 0, pgn: '' }
      ] as any

      const coachStore = useCoachStore()
      const rx = coachStore.dnaPrescriptions
      expect(rx.some(item => item.id === 'endgame-leaks')).toBe(true)
    })
  })

  describe('Opening Prescriptions', () => {
    it('triggers "Bleeding" for low win rate openings', () => {
      const libraryStore = useLibraryStore()
      // @ts-ignore - Mocking openingStats property
      libraryStore.openingStats = [
        { name: 'Caro-Kann', games: 5, winPct: 20 }
      ]

      const coachStore = useCoachStore()
      const rx = coachStore.openingPrescriptions
      expect(rx.some(item => item.id === 'opening-bleed')).toBe(true)
      expect(rx.find(item => item.id === 'opening-bleed')?.title).toContain('Caro-Kann')
    })

    it('triggers "Predictable Repertoire" when one opening dominates usage', () => {
      const libraryStore = useLibraryStore()
      // @ts-ignore - Mocking openingStats property
      libraryStore.openingStats = [
        { name: 'London System', games: 15, winPct: 50 },
        { name: 'Sicilian', games: 2, winPct: 50 }
      ]

      const coachStore = useCoachStore()
      const rx = coachStore.openingPrescriptions
      expect(rx.some(item => item.id === 'one-trick')).toBe(true)
    })
  })

  describe('Narrative & Achievements', () => {
    it('generates a modified narrative for low-draw-rate players', () => {
      const libraryStore = useLibraryStore()
      const userStore = useUserStore()
      userStore.isMe = vi.fn(() => true)
      
      // 20 decisive games (0 draws)
      libraryStore.games = new Array(20).fill({ result: '1-0', movesCount: 30 }) as any

      const coachStore = useCoachStore()
      const narrative = coachStore.playstyleNarrative
      expect(narrative.desc).toContain('extremely low draw rate')
    })

    it('generates a modified narrative for high-draw-rate players', () => {
      const libraryStore = useLibraryStore()
      const userStore = useUserStore()
      userStore.isMe = vi.fn(() => true)
      
      // 10 decisive, 10 draws (50% draws)
      libraryStore.games = [
        ...new Array(10).fill({ result: '1-0', movesCount: 30 }),
        ...new Array(10).fill({ result: '1/2-1/2', movesCount: 30 })
      ] as any

      const coachStore = useCoachStore()
      const narrative = coachStore.playstyleNarrative
      expect(narrative.desc).toContain('high draw rate')
    })

    it('returns fallback prescriptions when no opening data exists', () => {
      const libraryStore = useLibraryStore()
      // @ts-ignore
      libraryStore.openingStats = []
      libraryStore.games = [{ id: '1' }] as any // Ensure some games exist for DNA Rx

      const coachStore = useCoachStore()
      const rx = coachStore.openingPrescriptions
      expect(rx.some(item => item.id === 'op-import')).toBe(true)
    })

    it('evaluates achievements correctly', () => {
      const coachStore = useCoachStore()
      expect(coachStore.achievements.badges).toBeDefined()
      expect(coachStore.achievements.title).toBeDefined()
    })
  })
})
