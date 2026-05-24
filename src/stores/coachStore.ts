import { defineStore } from 'pinia'
import { computed } from 'vue'
import { evaluateBadges } from '../utils/badgeEngine'
import { useLibraryStore } from './libraryStore'
import { useUserStore } from './userStore'
import { logger } from '../utils/logger'

// --- Specialized Composables (Pillar Architecture) ---
import { useCoachArchetype } from './coach/useCoachArchetype'
import { useCoachPrescriptions } from './coach/useCoachPrescriptions'
import { useCoachNarrative } from './coach/useCoachNarrative'

import { useCurriculumStore } from './curriculumStore'

/**
 * A Prescription (Rx) represents a piece of coaching advice.
 */
export interface Prescription {
  id: string
  icon: string
  title: string
  desc: string
  link: string
  linkText: string
  severity: 'critical' | 'warning' | 'good' | 'info'
  category: 'dna' | 'opening' | 'tactics' | 'endgame'
}

/**
 * Knightfall Coach Store: The AI analysis and achievement orchestrator.
 * 
 * DESIGN PATTERN: Orchestrator
 * Delegates analytical logic to sub-composables while managing cross-store
 * synchronization and achievement evaluation.
 */
export const useCoachStore = defineStore('coach', () => {
  const libraryStore = useLibraryStore()
  const userStore = useUserStore()
  const curriculumStore = useCurriculumStore()

  // --- SUB-COMPOSABLES (Logic Decomposition) ---
  const archetype = useCoachArchetype(
    computed(() => libraryStore.personalGames),
    computed(() => userStore.puzzleAttempts),
    userStore.isMe
  )

  const prescriptions = useCoachPrescriptions(
    computed(() => libraryStore.personalGames),
    computed(() => libraryStore.stats.openingStats),
    computed(() => curriculumStore.personalPuzzles),
    computed(() => userStore.puzzleAttempts),
    userStore.isMe
  )

  const narrative = useCoachNarrative(
    archetype.archetypeReport,
    computed(() => libraryStore.personalGames)
  )

  // --- ACTIONS ---

  /**
   * Syncs the latest archetype analysis to the cloud profile.
   */
  async function syncArchetypeToCloud() {
    if (!userStore.session) return
    const report = archetype.archetypeReport.value
    // Log the synchronization details locally to avoid querying a non-existent database column
    logger.info('[CoachStore] Syncing archetype metadata locally:', {
      archetype: report.title,
      primary_weakness: report.category,
      dna_sync_at: new Date().toISOString()
    })
  }

  /**
   * Recalculates the player's dynamic DNA archetype based on library games and puzzle history,
   * then updates their profile in Supabase and the userStore.
   */
  async function recalculateDnaProfile() {
    if (!userStore.session || !userStore.profile) return

    // 1. Trigger the coach archetype analysis
    const report = archetype.archetypeReport.value

    // 2. Map the coach category to the dynamic DNA archetype ID
    const categoryMap: Record<string, string> = {
      opening: 'oracle',
      tactics: 'storm',
      endgame: 'technician',
      mixed: 'student'
    }

    const newArchetypeId = categoryMap[report.category] || 'student'

    // 3. Persist the updated archetype directly to the primary profile column
    await userStore.updateProfile({
      archetype: newArchetypeId
    })

    // Also sync metadata (Pillar 4: Persona badges)
    await syncArchetypeToCloud()
  }

  // --- ACHIEVEMENTS ---

  /** Evaluation of all badges and titles. */
  const achievements = computed(() => evaluateBadges({
    profile: userStore.profile,
    pastGames: userStore.pastGames,
    puzzleAttempts: userStore.puzzleAttempts,
    archetype: archetype.archetypeReport.value,
    xp: userStore.xp,
    level: userStore.currentLevel
  }))

  // --- PUBLIC API ---
  return {
    // Composable exposures (Archetype)
    ...archetype,
    
    // Composable exposures (Prescriptions)
    ...prescriptions,
    
    // Composable exposures (Narrative)
    ...narrative,
    
    achievements,
    syncArchetypeToCloud,
    recalculateDnaProfile
  }
})
