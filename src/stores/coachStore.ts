import { defineStore } from 'pinia'
import { computed } from 'vue'
import { evaluateBadges } from '../utils/badgeEngine'
import { useLibraryStore } from './libraryStore'
import { useUserStore } from './userStore'
import { supabase } from '../api/supabaseClient'

// --- Specialized Composables (Pillar Architecture) ---
import { useCoachArchetype } from './coach/useCoachArchetype'
import { useCoachPrescriptions } from './coach/useCoachPrescriptions'
import { useCoachNarrative } from './coach/useCoachNarrative'

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

  // --- SUB-COMPOSABLES (Logic Decomposition) ---
  const archetype = useCoachArchetype(
    computed(() => libraryStore.personalGames),
    computed(() => userStore.puzzleAttempts),
    userStore.isMe
  )

  const prescriptions = useCoachPrescriptions(
    computed(() => libraryStore.personalGames),
    computed(() => libraryStore.openingStats), // Use the primary library stats
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
    await supabase.from('profiles').update({
      metadata: {
        archetype: report.title,
        primary_weakness: report.category,
        dna_sync_at: new Date().toISOString()
      }
    }).eq('id', userStore.session.user.id)
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
    syncArchetypeToCloud
  }
})
