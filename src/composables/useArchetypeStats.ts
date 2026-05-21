import { computed, type Ref } from 'vue'
import { useCurriculumStore } from '../stores/curriculumStore'
import type { AssessmentResult } from '../stores/curriculum/useAssessmentEngine'

export const archetypes = [
  { 
    id: 'storm', 
    name: 'The Storm', 
    icon: '⚡', 
    description: 'A whirlwind of tactical energy. You rely on instinct and lightning-fast pattern recognition to overwhelm opponents before they can react.'
  },
  { 
    id: 'oracle', 
    name: 'The Oracle', 
    icon: '👁️', 
    description: 'A master of deep visualization. You see the board not as it is, but as it will be, calculating lines that others fear to tread.'
  },
  { 
    id: 'technician', 
    name: 'The Technician', 
    icon: '⚙️', 
    description: 'Precision personified. Your endgame technique and positional accuracy make you a grinder who converts the smallest advantages into victory.'
  },
  { 
    id: 'rogue', 
    name: 'The Rogue', 
    icon: '🗡️', 
    description: 'Unpredictable and sharp. You thrive in chaos, finding unconventional solutions and tactical swindles when your back is against the wall.'
  },
  {
    id: 'student',
    name: 'The Apprentice',
    icon: '🌱',
    description: 'A balanced seeker of wisdom. Your DNA is still forming, showing potential across all categories as you build your unique style.'
  }
]

export function useArchetypeStats(computedElo: Ref<number>) {
  const curriculumStore = useCurriculumStore()

  const stats = computed(() => {
    let res: AssessmentResult[] = []
    try {
      const raw = localStorage.getItem('knightfall_pending_dna')
      if (raw) {
        const stored = JSON.parse(raw)
        if (Array.isArray(stored?.results) && stored.results.length > 0) {
          res = stored.results as AssessmentResult[]
        }
      }
    } catch { /* fall through to store */ }

    if (res.length === 0) res = curriculumStore.results

    const MAX_ELO = 2200

    const getScore = (stageKey: string, timeWeight = 0.2): number => {
      const stage = res.find(r => r.stage === stageKey)

      if (!stage) {
        const eloBase = computedElo.value / MAX_ELO
        const variance = (Math.random() * 0.06) - 0.03
        return Math.min(0.95, Math.max(0.08, eloBase + variance))
      }

      const difficultyScore = Math.min(1, stage.difficulty / MAX_ELO)
      const accuracyBonus = (stage.accuracy - 0.5) * 0.15
      const timeFactor = Math.max(0, (20 - stage.avgTime) / 20) * timeWeight

      const blended = difficultyScore * 0.6 + (stage.accuracy + timeFactor) * 0.4 + accuracyBonus
      return Math.min(0.98, Math.max(0.08, blended))
    }

    return {
      tactics:     getScore('tactics',     0.3),
      calculation: getScore('calculation', 0.1),
      endgame:     getScore('endgame',     0.15),
      strategy:    getScore('strategy',    0.2),
      speed:       getScore('speed',       0.4)
    }
  })

  const archetype = computed(() => {
    const s = stats.value
    if (s.tactics > 0.75 && s.speed > 0.75) return archetypes[0] // Storm
    if (s.calculation > 0.75 && s.strategy > 0.7) return archetypes[1] // Oracle
    if (s.endgame > 0.8) return archetypes[2] // Technician
    if (s.tactics > 0.65) return archetypes[3] // Rogue
    return archetypes[4] // Student
  })

  return {
    stats,
    archetype,
    archetypes
  }
}
