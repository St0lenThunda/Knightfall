import { ref, computed } from 'vue'
import { logger } from '../../utils/logger'
import { useUserStore } from '../userStore'

export type AssessmentStage = 'tactics' | 'calculation' | 'endgame' | 'strategy' | 'speed'

export interface AssessmentResult {
  stage: AssessmentStage
  accuracy: number      // 0-1
  avgTime: number      // seconds
  difficulty: number    // Elo equivalent
}

/**
 * useAssessmentEngine
 * 
 * Manages the "Magic Moment" onboarding flow. 
 * Orchestrates a 5-part evaluation to determine a user's baseline Chess DNA.
 */
export function useAssessmentEngine() {
  // --- STATE ---
  const status = ref<'idle' | 'active' | 'review' | 'complete'>('idle')
  const currentStageIndex = ref(0)
  const results = ref<AssessmentResult[]>([])
  
  const stages: AssessmentStage[] = ['tactics', 'calculation', 'endgame', 'strategy', 'speed']

  // --- COMPUTED ---
  const currentStage = computed(() => stages[currentStageIndex.value])
  const progress = computed(() => (currentStageIndex.value / stages.length) * 100)
  const isComplete = computed(() => status.value === 'review' || status.value === 'complete')

  // --- ACTIONS ---

  /**
   * Initializes a fresh assessment session.
   */
  function startAssessment() {
    status.value = 'active'
    currentStageIndex.value = 0
    results.value = []
    logger.info('[Assessment] Starting new skill evaluation...')
  }

  /**
   * Records the result of a specific stage and advances the engine.
   * 
   * @param stageResult - The performance data for the completed stage
   */
  function recordStageResult(stageResult: AssessmentResult) {
    results.value.push(stageResult)
    
    if (currentStageIndex.value < stages.length - 1) {
      currentStageIndex.value++
      logger.info(`[Assessment] Stage ${stageResult.stage} complete. Moving to ${stages[currentStageIndex.value]}`)
    } else {
      status.value = 'review'
      logger.info('[Assessment] All stages complete. Analyzing results...')
    }
  }

  /**
   * Finalizes the assessment and generates the starting DNA profile.
   * Maps results to User DNA and triggers Cloud Sync via userStore.
   */
  async function finalizeAssessment() {
    status.value = 'complete'
    
    // Calculate a weighted baseline rating
    const totalWeight = results.value.reduce((acc, r) => acc + r.difficulty, 0)
    const avgDifficulty = results.value.length > 0 ? totalWeight / results.value.length : 1200
    
    // Map to User Store
    const userStore = useUserStore()
    await userStore.updateProfile({
      rating: Math.round(avgDifficulty),
      puzzle_rating: Math.round(avgDifficulty + 100), // Puzzles usually trend higher
      archetype: 'The Initiate'
    })
    
    logger.info(`[Assessment] Finalized. Baseline rating set to ${avgDifficulty}.`)
  }

  return {
    status,
    currentStage,
    currentStageIndex,
    progress,
    results,
    isComplete,
    startAssessment,
    recordStageResult,
    finalizeAssessment
  }
}
