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
      <div v-if="step === 'landing'" class="landing-step animate-fade-in">
        <div class="hero-arch glass-lg">
          <span class="ritual-tag">THE RITE OF INITIATION</span>
          <h1 class="hero-title">Forge Your <span class="text-gradient">Chess DNA</span></h1>
          <p class="hero-desc">
            Welcome to Knightfall. To map your cognitive strengths and weaknesses, we must initialize your tactical profile.
          </p>

          <!-- Oracle Rating Notice -->
          <div class="oracle-notice glass-sm">
            <span class="oracle-icon">🔮</span>
            <div class="oracle-text">
              <strong>The Oracle Whispers:</strong>
              <p>
                The ratings generated here are platform-specific skill benchmarks designed to optimize your personalized training queue. They do not constitute official federation ratings (like FIDE, USCF, Lichess, or Chess.com).
              </p>
            </div>
          </div>

          <!-- Self-Declaration Form -->
          <div class="declaration-form">
            <h3>Select your estimated chess experience:</h3>
            <div class="skill-grid">
              <button 
                v-for="opt in skillOptions" 
                :key="opt.label"
                class="skill-btn glass-sm"
                :class="{ active: declaredSkill === opt.value }"
                @click="declaredSkill = opt.value"
              >
                <span class="skill-emoji">{{ opt.emoji }}</span>
                <div class="skill-meta">
                  <span class="skill-title">{{ opt.label }}</span>
                  <span class="skill-desc">Est. {{ opt.rating }} Elo</span>
                </div>
              </button>
            </div>

            <button 
              class="btn btn-primary btn-lg btn-glow mt-8" 
              :disabled="!declaredSkill"
              @click="proceedToQuickWin"
            >
              Begin Assessment →
            </button>
          </div>
        </div>
      </div>

      <!-- SCREEN 2: Quick Win Puzzle -->
      <div v-else-if="step === 'quick-win'" class="quick-win-step animate-fade-in">
        <div class="board-layout">
          <div class="board-wrapper glass-lg">
            <ChessBoard 
              :interactive="true"
              :flipped="false"
            />
            <div class="board-overlay-banner white">
              White to Move — Deliver Checkmate!
            </div>
          </div>

          <aside class="sidebar glass-sm">
            <div class="sidebar-top">
              <span class="ritual-tag">TEST 1: QUICK WIN</span>
              <h3>Deliver the Strike</h3>
              <p class="muted mt-4">
                The enemy king is exposed. Cooperate with your Queen on f3 and Bishop on c4 to deliver checkmate on f7 in a single move.
              </p>
            </div>

            <div class="sidebar-bottom">
              <div class="telemetry-item">
                <span class="label">PUZZLE DIFFICULTY</span>
                <span class="val text-gold-gradient">★ 600 Elo</span>
              </div>
              <div class="telemetry-item">
                <span class="label">ATTEMPTS</span>
                <span class="val">{{ gameStore.mistakeCount }}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <!-- SCREEN 3+: Diagnostic Stages -->
      <div v-else class="diagnostic-step animate-fade-in">
        <div class="board-layout">
          <div class="board-wrapper glass-lg">
            <ChessBoard 
              v-if="currentPuzzle"
              :interactive="true"
              :flipped="isFlipped"
            />
            <div class="intel-overlay" v-if="showIntel">
              <div class="intel-pulse"></div>
              <span>SEQUENCING COGNITIVE DNA...</span>
            </div>
          </div>

          <aside class="sidebar glass-sm">
            <div class="sidebar-top">
              <span class="ritual-tag">{{ curriculumStore.currentStage.toUpperCase() }} ASSESSMENT</span>
              <h3>Task Briefing</h3>
              <p class="muted mt-4">{{ stageDescription }}</p>
            </div>

            <div class="sidebar-bottom">
              <div class="telemetry-item">
                <span class="label">ACCURACY</span>
                <span class="val">{{ Math.round(accuracy * 100) }}%</span>
              </div>
              <div class="telemetry-item">
                <span class="label">PACE</span>
                <span class="val">{{ pace }}s</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCurriculumStore } from '../stores/curriculumStore'
import { useGameStore } from '../stores/gameStore'
import { useUiStore } from '../stores/uiStore'
import { fetchAssessmentPuzzles, type Puzzle } from '../api/puzzleApi'
import { QUICK_WIN_PUZZLE } from '../data/onboardingData'
import ChessBoard from '../components/ChessBoard.vue'
import { logger } from '../utils/logger'
import { Storage, StorageKey } from '../utils/storage'

const router = useRouter()
const curriculumStore = useCurriculumStore()
const gameStore = useGameStore()
const uiStore = useUiStore()

// --- ONBOARDING STATE ---
type Step = 'landing' | 'quick-win' | 'diagnostic'
const step = ref<Step>('landing')

const declaredSkill = ref<number | null>(null)
const showQuickWinSuccess = ref(false)

// Diagnostic stage states
const currentPuzzles = ref<Puzzle[]>([])
const puzzleIdx = ref(0)
const startTime = ref(0)
const stageResults = ref<{ time: number; errors: number }[]>([])
const showIntel = ref(false)
const showSuccess = ref(false)
const hasRatingMismatch = ref(false)

const skillOptions = [
  { label: 'Beginner', value: 800, rating: 800, emoji: '♟️' },
  { label: 'Casual', value: 1200, rating: 1200, emoji: '🍻' },
  { label: 'Club Player', value: 1600, rating: 1600, emoji: '⚔️' },
  { label: 'Expert', value: 2000, rating: 2000, emoji: '👑' }
]

// --- COMPUTED ---

/**
 * Computes the header title dynamically based on the current step and stage.
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
 * Computes the current step's progress percentage.
 */
const progressPercentage = computed(() => {
  if (step.value === 'landing') return 5
  if (step.value === 'quick-win') return 15
  // Diagnostic stages make up the remaining 20% to 100%
  return 20 + (curriculumStore.currentStageIndex / 5) * 80
})

/**
 * Fetches the active puzzle.
 */
const currentPuzzle = computed(() => {
  if (step.value === 'quick-win') return QUICK_WIN_PUZZLE
  return currentPuzzles.value[puzzleIdx.value]
})

/**
 * Flips the board if playing as Black (to match bottom-up convention).
 */
const isFlipped = computed(() => {
  if (!currentPuzzle.value) return false
  return currentPuzzle.value.fen.split(' ')[1] === 'b'
})

const accuracy = computed(() => {
  if (stageResults.value.length === 0) return 1
  const totalPuzzles = stageResults.value.length
  const perfectPuzzles = stageResults.value.filter(r => r.errors === 0).length
  return perfectPuzzles / totalPuzzles
})

const pace = computed(() => {
  if (stageResults.value.length === 0) return 0
  const totalTime = stageResults.value.reduce((acc, r) => acc + r.time, 0)
  return Math.round(totalTime / stageResults.value.length)
})

const stageDescriptions: Record<string, string> = {
  tactics: 'Find the winning sequence as quickly as possible. We are measuring your tactical floor.',
  calculation: 'Look 3-4 moves ahead. Accuracy is more important than speed in this phase.',
  endgame: 'Convert the advantage. This measures your technical precision in high-leverage moments.',
  strategy: 'Choose the best positional plan. No immediate tactics; purely conceptual.',
  speed: 'Instinct test. Solve simple patterns under extreme time pressure.'
}

const stageDescription = computed(() => stageDescriptions[curriculumStore.currentStage] || 'Analyzing performance...')

// --- ACTIONS ---

/**
 * Transitions from Screen 1 (Hero) to Screen 2 (Quick Win).
 */
function proceedToQuickWin() {
  if (!declaredSkill.value) return
  step.value = 'quick-win'
  loadPuzzle(QUICK_WIN_PUZZLE)
}

/**
 * Sets up a puzzle position in the gameStore.
 * 
 * @param puzzle - The chess puzzle object
 */
function loadPuzzle(puzzle: Puzzle) {
  logger.info(`[Onboarding] Loading puzzle ${puzzle.id}`, puzzle.solution)
  
  // 1. Load position into the board logic
  gameStore.loadPosition(puzzle.fen, 'puzzle')
  
  // 2. Configure drill properties
  gameStore.mode = 'puzzle'
  gameStore.setDrill(puzzle.solution || [])
  gameStore.playerColor = puzzle.fen.split(' ')[1] as 'w' | 'b'
  
  // 3. Start game clock and state
  gameStore.startMatch()
  
  // 4. Record telemetry timestamps
  startTime.value = Date.now()
}

/**
 * Advances from Screen 2 (Quick Win) to Screen 3 (Diagnostic Stages).
 */
function startDiagnosticAssessment() {
  showQuickWinSuccess.value = false
  step.value = 'diagnostic'
  curriculumStore.startAssessment()
  loadStage()
}

/**
 * Loads the current diagnostic stage puzzles.
 */
async function loadStage() {
  try {
    currentPuzzles.value = await fetchAssessmentPuzzles(curriculumStore.currentStage)
    puzzleIdx.value = 0
    stageResults.value = []
    
    if (currentPuzzles.value.length > 0) {
      loadPuzzle(currentPuzzles.value[0])
    }
  } catch (err) {
    logger.error('[Onboarding] Failed to load stage:', err)
  }
}

/**
 * Records individual puzzle results and checks stage progression.
 */
function handlePuzzleComplete() {
  const timeTaken = (Date.now() - startTime.value) / 1000
  
  stageResults.value.push({
    time: timeTaken,
    errors: gameStore.mistakeCount
  })

  if (puzzleIdx.value < currentPuzzles.value.length - 1) {
    puzzleIdx.value++
    loadPuzzle(currentPuzzles.value[puzzleIdx.value])
  } else {
    completeStage()
  }
}

/**
 * Completes a diagnostic stage and checks for total gauntlet completion.
 */
function completeStage() {
  showSuccess.value = true
  
  // We use the declared skill rating as the base difficulty target
  const baseDifficulty = declaredSkill.value || 1200
  
  curriculumStore.recordStageResult({
    stage: curriculumStore.currentStage,
    accuracy: accuracy.value,
    avgTime: pace.value,
    difficulty: baseDifficulty
  })
}

/**
 * Moves to the next diagnostic stage.
 */
function nextStage() {
  showSuccess.value = false
  loadStage()
}

/**
 * Finalizes the assessment, resolves rating mismatches, and redirects to DNA reveal.
 */
async function revealDna() {
  showSuccess.value = false
  
  // Calculate average diagnostic performance rating
  const totalWeight = curriculumStore.results.reduce((acc, r) => acc + r.difficulty, 0)
  let calculatedElo = curriculumStore.results.length > 0 ? totalWeight / curriculumStore.results.length : 1200
  
  // Mismatch Resolution: If average diagnostic accuracy is low, adjust rating down
  const avgAccuracy = curriculumStore.results.reduce((acc, r) => acc + r.accuracy, 0) / (curriculumStore.results.length || 1)
  if (avgAccuracy < 0.5) {
    calculatedElo = Math.max(600, calculatedElo - 300)
    hasRatingMismatch.value = true
  } else if (avgAccuracy > 0.85) {
    calculatedElo = Math.min(2200, calculatedElo + 200)
    hasRatingMismatch.value = true
  }

  // Cache DNA and final rating locally for Delayed Auth Gate (Combination 1 + 3 + 4)
  const pendingDna = {
    rating: Math.round(calculatedElo),
    puzzle_rating: Math.round(calculatedElo + 100),
    archetype: calculatedElo > 1600 ? 'The Strategist' : calculatedElo > 1200 ? 'The Tactician' : 'The Initiate',
    declared_rating: declaredSkill.value,
    gauntlet_completed: true,
    results: curriculumStore.results
  }
  
  Storage.set(StorageKey.LAST_ANALYSIS_ID, 'guest-dna-profile')
  localStorage.setItem('knightfall_pending_dna', JSON.stringify(pendingDna))
  logger.info('[Onboarding] Cached pending guest DNA:', pendingDna)

  // Redirect to DNA reveal view
  router.push('/dna-reveal')
}

/**
 * Exits the onboarding funnel with confirmation.
 */
function handleExit() {
  uiStore.confirm('Exit Assessment?', 'Your current progress will not be saved.', () => {
    router.push('/')
  })
}

// --- WATCHERS & LIFECYCLE ---

// Watch for drill index steps to handle checkmate triggers and auto-moves
watch(() => gameStore.drillIndex, (newIdx) => {
  if (!currentPuzzle.value) return

  const solution = currentPuzzle.value.solution
  
  // 1. Check if puzzle is fully solved
  if (newIdx >= solution.length) {
    setTimeout(() => {
      if (step.value === 'quick-win') {
        showQuickWinSuccess.value = true
      } else {
        handlePuzzleComplete()
      }
    }, 500)
    return
  }

  // 2. Trigger opponent's counter-move automatically if it's their turn
  const currentTurn = gameStore.turn
  if (currentTurn !== gameStore.playerColor) {
    const nextMove = solution[newIdx]
    setTimeout(() => {
      const from = nextMove.slice(0, 2) as any
      const to = nextMove.slice(2, 4) as any
      gameStore.makeMove(from, to)
      logger.info(`[Onboarding] Opponent played auto-move: ${nextMove}`)
    }, 400) // 400ms delay for realism
  }
})

onMounted(() => {
  // Reset game state on initiation
  gameStore.forceGameOver = false
  
  // Trigger secondary visual animations
  setTimeout(() => { showIntel.value = true }, 1500)
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

/* Header */
.gauntlet-header {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-8);
  position: relative;
  z-index: 2;
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

/* Layouts */
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

.landing-step {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.hero-arch {
  width: 100%;
  max-width: 750px;
  padding: var(--space-10);
  border-radius: var(--radius-xl);
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.ritual-tag {
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.3em;
  color: var(--accent-bright);
  display: block;
  margin-bottom: var(--space-3);
  text-transform: uppercase;
}

.hero-title {
  font-size: 3.2rem;
  font-weight: 900;
  margin-bottom: var(--space-4);
  line-height: 1.15;
}

.hero-desc {
  font-size: 1.15rem;
  color: var(--text-secondary);
  margin-bottom: var(--space-8);
}

/* Oracle Notice */
.oracle-notice {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  text-align: left;
  margin-bottom: var(--space-8);
  border-left: 3px solid var(--accent);
}

.oracle-icon {
  font-size: 1.8rem;
}

.oracle-text strong {
  color: var(--accent-bright);
  font-size: 0.95rem;
}

.oracle-text p {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin-top: 2px;
  line-height: 1.5;
}

/* Skill Grid */
.skill-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

@media (max-width: 600px) {
  .skill-grid {
    grid-template-columns: 1fr;
  }
}

.skill-btn {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  cursor: pointer;
  text-align: left;
  border: 1px solid var(--border);
  transition: all var(--duration) var(--ease);
}

.skill-btn:hover {
  border-color: var(--accent);
  background: rgba(139, 92, 246, 0.05);
}

.skill-btn.active {
  border-color: var(--accent-bright);
  background: var(--accent-dim);
  box-shadow: var(--shadow-accent);
}

.skill-emoji {
  font-size: 1.8rem;
}

.skill-meta {
  display: flex;
  flex-direction: column;
}

.skill-title {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--text-primary);
}

.skill-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.btn-glow {
  box-shadow: 0 0 25px rgba(139, 92, 246, 0.4);
}
.btn-glow:hover {
  box-shadow: 0 0 50px rgba(139, 92, 246, 0.7);
}

/* Board Layouts */
.board-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-8);
  width: 100%;
  flex: 1;
}

@media (max-width: 1000px) {
  .board-layout {
    grid-template-columns: 1fr;
  }
}

.board-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: var(--space-6);
  border-radius: var(--radius-xl);
}

.board-overlay-banner {
  margin-top: var(--space-4);
  padding: 6px 18px;
  border-radius: var(--radius-full);
  font-weight: 800;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
}

.board-overlay-banner.white {
  background: white;
  color: black;
}

.sidebar {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: var(--radius-xl);
}

.telemetry-item {
  margin-top: var(--space-6);
}

.telemetry-item .label {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.telemetry-item .val {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--accent-bright);
  display: block;
}

.intel-overlay {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(139, 92, 246, 0.1);
  padding: 8px 16px;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--accent-bright);
}

.intel-pulse {
  width: 8px;
  height: 8px;
  background: var(--accent-bright);
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

/* Success Modal Overlay */
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

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
  70% { transform: scale(1.1); opacity: 0.5; box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
  100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
}

.animate-fade-in {
  animation: fadeIn 0.4s var(--ease) both;
}
</style>
