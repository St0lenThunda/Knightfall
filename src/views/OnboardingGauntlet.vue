<template>
  <div class="onboarding-gauntlet page">
    <!-- God Rays Atmospheric Background -->
    <div class="god-rays" aria-hidden="true">
      <div class="ray"></div>
      <div class="ray"></div>
      <div class="ray"></div>
    </div>

    <!-- HEADER: Dynamic Progress Header -->
    <header class="gauntlet-header glass-sm">
      <div class="progress-info">
        <span v-if="step === 'landing'" class="stage-label">STAGE 0: INITIATION</span>
        <span v-else-if="step === 'quick-win'" class="stage-label">STAGE 1: FIRST STRIKE</span>
        <span v-else class="stage-label">DIAGNOSTIC STAGE {{ curriculumStore.currentStageIndex + 1 }}/5</span>
        <h2 class="current-task">{{ headerTitle }}</h2>
      </div>
      <div class="progress-track-bg">
        <div class="progress-track-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
      <button class="btn-exit" @click="handleExit">✕</button>
    </header>

    <!-- MAIN AREA -->
    <main class="gauntlet-main">
      
      <!-- SCREEN 1: Hero Landing & Self-Declaration -->
      <OnboardingDeclaration 
        v-if="step === 'landing'"
        v-model="declaredSkill"
        @submit="proceedToQuickWin"
      />

      <!-- SCREEN 2: Quick Win Puzzle -->
      <OnboardingQuickWin 
        v-else-if="step === 'quick-win'"
        @solved="showQuickWinSuccess = true"
      />

      <!-- SCREEN 3+: Diagnostic Stages -->
      <OnboardingDiagnostic 
        v-else
        :declared-skill="declaredSkill!"
        :current-stage="curriculumStore.currentStage"
        :current-stage-index="curriculumStore.currentStageIndex"
        @stage-complete="handleStageComplete"
      />

    </main>

    <!-- Quick Win Success Overlay -->
    <Transition name="fade-slide">
      <div v-if="showQuickWinSuccess" class="success-modal-overlay">
        <div class="success-modal glass-floating text-center">
          <span class="success-icon">⚔️</span>
          <h2 class="text-gradient">First Victory Achieved!</h2>
          <p class="muted mt-2">
            Excellent vision. You delivered a classic Scholar's Mate.
          </p>
          <div class="xp-badge mt-4">+50 XP</div>
          <button class="btn btn-primary btn-lg mt-8 btn-glow" @click="startDiagnosticAssessment">
            Begin Diagnostic Assessment →
          </button>
        </div>
      </div>
    </Transition>

    <!-- Stage Complete / Assessment Complete Overlay -->
    <Transition name="fade-slide">
      <div v-if="showSuccess" class="success-modal-overlay">
        <div class="success-modal glass-floating text-center">
          <span class="success-icon">{{ curriculumStore.isComplete ? '🧬' : '✨' }}</span>
          <h2>{{ curriculumStore.isComplete ? 'Assessment Complete' : 'Stage Complete' }}</h2>
          <p class="muted mt-2">
            {{ curriculumStore.isComplete 
              ? 'Your cognitive chess profile has been fully sequenced.' 
              : 'Your tactical baseline has been mapped.' }}
          </p>

          <!-- Oracle Mismatch Resolution Warning -->
          <div v-if="curriculumStore.isComplete && hasRatingMismatch" class="mismatch-warning glass-sm mt-6">
            <span class="warning-emoji">⚠️</span>
            <div class="warning-text">
              <strong>Oracle Realignment:</strong>
              <p>
                Your diagnostic performance suggested a different rating benchmark than self-declared. We have adjusted your starting benchmark to optimize your Spaced Repetition queue.
              </p>
            </div>
          </div>

          <button v-if="!curriculumStore.isComplete" class="btn btn-primary btn-lg mt-8 btn-glow" @click="nextStage">
            Proceed to Next Stage →
          </button>
          <button v-else class="btn btn-gold btn-lg mt-8 btn-glow" @click="revealDna">
            Reveal My Chess DNA →
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * OnboardingGauntlet.vue
 *
 * The Rite of Initiation Orchestrator.
 * Manages the onboarding stages funnel (landing selection, quick win challenge, and 5-stage
 * diagnostic tasks). It tracks overall progress, shows success feedback overlays, resolves final
 * diagnostic ratings compared to declared skills, and saves the final cached DNA profile before
 * sending the user to the visual DNA reveal showcase.
 *
 * Decoupled into sub-components (OnboardingDeclaration.vue, OnboardingQuickWin.vue, OnboardingDiagnostic.vue)
 * to comply with the project style guidelines (500 lines limit).
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCurriculumStore } from '../stores/curriculumStore'
import { useGameStore } from '../stores/gameStore'
import { useUiStore } from '../stores/uiStore'
import { logger } from '../utils/logger'
import { Storage, StorageKey } from '../utils/storage'

// Step-specific components imports
import OnboardingDeclaration from '../components/onboarding/OnboardingDeclaration.vue'
import OnboardingQuickWin from '../components/onboarding/OnboardingQuickWin.vue'
import OnboardingDiagnostic from '../components/onboarding/OnboardingDiagnostic.vue'

const router = useRouter()
const curriculumStore = useCurriculumStore()
const gameStore = useGameStore()
const uiStore = useUiStore()

// --- ONBOARDING FUNNEL STATE ---
type Step = 'landing' | 'quick-win' | 'diagnostic'
const step = ref<Step>('landing')

const declaredSkill = ref<number | null>(null)
const showQuickWinSuccess = ref(false)

const showSuccess = ref(false)
const hasRatingMismatch = ref(false)

// Results accumulator across all 5 diagnostic assessment cycles
const finalResults = ref<{ stage: string; accuracy: number; avgTime: number; difficulty: number }[]>([])

// --- COMPUTED VIEW DATA ---

/**
 * Computes the header title dynamically based on the current step and active stage.
 */
const headerTitle = computed(() => {
  if (step.value === 'landing') return 'Initiate Assessment'
  if (step.value === 'quick-win') return 'First Battle'
  
  const stageTitles: Record<string, string> = {
    tactics: 'Pattern Recognition',
    calculation: 'Deep Visualization',
    endgame: 'Fundamental Technique',
    strategy: 'Positional Insight',
    speed: 'Instinctual Tempo'
  }
  return stageTitles[curriculumStore.currentStage] || 'Skill Evaluation'
})

/**
 * Computes the current step's progress percentage across the 0-100% path.
 */
const progressPercentage = computed(() => {
  if (step.value === 'landing') return 5
  if (step.value === 'quick-win') return 15
  // Diagnostic stages make up the remaining 20% to 100%
  return 20 + (curriculumStore.currentStageIndex / 5) * 80
})

// --- ACTIONS & FLOW HANDLERS ---

/**
 * Transitions from Screen 1 (Self-Declaration Selection) to Screen 2 (Quick Win Challenge).
 */
function proceedToQuickWin() {
  if (!declaredSkill.value) return
  step.value = 'quick-win'
}

/**
 * Advances from Screen 2 (Quick Win) to Screen 3 (Diagnostic Stages initiation).
 */
function startDiagnosticAssessment() {
  showQuickWinSuccess.value = false
  step.value = 'diagnostic'
  curriculumStore.startAssessment()
}

/**
 * Triggered by the diagnostic component when a full assessment stage is finished.
 * Accumulates the metrics, records them inside the curriculum store, and shows the overlay.
 *
 * @param stageMetrics - Object containing accuracy and average pace time
 */
function handleStageComplete({ accuracy, pace }: { accuracy: number; pace: number }) {
  showSuccess.value = true
  
  // Use user's declared skill rating as the difficulty index target
  const baseDifficulty = declaredSkill.value || 1200
  
  const stageResult = {
    stage: curriculumStore.currentStage,
    accuracy,
    avgTime: pace,
    difficulty: baseDifficulty
  }
  
  finalResults.value.push(stageResult)
  
  curriculumStore.recordStageResult(stageResult)
}

/**
 * Moves to the next diagnostic stage. Called from the Proceed button on the stage complete overlay.
 */
function nextStage() {
  showSuccess.value = false
  // curriculumStore will handle advancing currentStageIndex automatically
}

/**
 * Finalizes the assessment, resolves rating mismatches, caches DNA locally, and redirects.
 */
async function revealDna() {
  showSuccess.value = false
  
  // Calculate average diagnostic performance rating
  const totalWeight = finalResults.value.reduce((acc, r) => acc + r.difficulty, 0)
  let calculatedElo = finalResults.value.length > 0 ? totalWeight / finalResults.value.length : 1200
  
  // Mismatch Resolution: If average diagnostic accuracy is low, adjust rating down
  const avgAccuracy = finalResults.value.reduce((acc, r) => acc + r.accuracy, 0) / (finalResults.value.length || 1)
  if (avgAccuracy < 0.5) {
    calculatedElo = Math.max(600, calculatedElo - 300)
    hasRatingMismatch.value = true
  } else if (avgAccuracy > 0.85) {
    calculatedElo = Math.min(2200, calculatedElo + 200)
    hasRatingMismatch.value = true
  }

  // Cache DNA and final rating locally for Delayed Auth Gate
  const pendingDna = {
    rating: Math.round(calculatedElo),
    puzzle_rating: Math.round(calculatedElo + 100),
    archetype: calculatedElo > 1600 ? 'The Strategist' : calculatedElo > 1200 ? 'The Tactician' : 'The Initiate',
    declared_rating: declaredSkill.value,
    gauntlet_completed: true,
    results: finalResults.value
  }
  
  Storage.set(StorageKey.LAST_ANALYSIS_ID, 'guest-dna-profile')
  localStorage.setItem('knightfall_pending_dna', JSON.stringify(pendingDna))
  logger.info('[Onboarding] Cached pending guest DNA:', pendingDna)

  // Redirect to DNA reveal view
  router.push('/dna-reveal')
}

/**
 * Exits the onboarding funnel with standard confirmation check.
 */
function handleExit() {
  uiStore.confirm('Exit Assessment?', 'Your current progress will not be saved.', () => {
    router.push('/')
  })
}

onMounted(() => {
  // Reset game state on initiation
  gameStore.forceGameOver = false
  finalResults.value = []
})
</script>

<style scoped>
.onboarding-gauntlet {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-base);
  overflow: hidden;
  position: relative;
}

/* Atmospheric Background */
.god-rays {
  position: fixed;
  top: -20%;
  left: 0;
  width: 100%;
  height: 150%;
  pointer-events: none;
  z-index: 0;
}
.ray {
  position: absolute;
  top: 0;
  width: 400px;
  height: 100%;
  background: linear-gradient(to bottom, rgba(167, 139, 250, 0.08) 0%, transparent 70%);
  transform: rotate(-15deg);
  filter: blur(100px);
}
.ray:nth-child(1) { left: -5%; }
.ray:nth-child(2) { left: 45%; }
.ray:nth-child(3) { left: 85%; }

/* Header Layout Styles */
.gauntlet-header {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-8);
  position: relative;
  z-index: 2;
}

.stage-label {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.current-task {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-top: 2px;
}

.progress-track-bg {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
}

.progress-track-fill {
  height: 100%;
  background: var(--accent-gradient);
  transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-exit {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.2s;
}
.btn-exit:hover { color: white; }

.gauntlet-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  padding: var(--space-8);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Success Modal & Overlays Styles */
.success-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(20px);
}

.success-modal {
  max-width: 480px;
  padding: var(--space-10);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border);
}

.success-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: var(--space-4);
}

.xp-badge {
  display: inline-block;
  background: var(--gold-dim);
  color: var(--gold);
  padding: 4px 14px;
  border-radius: var(--radius-full);
  font-weight: 800;
  font-size: 0.95rem;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.mismatch-warning {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  text-align: left;
  border-left: 3px solid var(--rose);
  background: rgba(244, 63, 94, 0.05);
}

.warning-emoji {
  font-size: 1.4rem;
}

.warning-text strong {
  color: var(--rose);
  font-size: 0.9rem;
}

.warning-text p {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-top: 2px;
  line-height: 1.4;
}

.btn-glow {
  box-shadow: 0 0 25px rgba(139, 92, 246, 0.4);
}
.btn-glow:hover {
  box-shadow: 0 0 50px rgba(139, 92, 246, 0.7);
}

/* Slide Transitions */
.fade-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fade-slide-leave-active {
  transition: all 0.25s ease-in;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}
</style>
