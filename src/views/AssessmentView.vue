<template>
  <div class="assessment-container page">
    <!-- Header: Global Progress -->
    <header class="assessment-header glass-sm">
      <div class="progress-info">
        <span class="stage-label">STAGE {{ curriculumStore.currentStageIndex + 1 }}/5</span>
        <h2 class="current-task">{{ stageTitle }}</h2>
      </div>
      <div class="progress-track-bg">
        <div class="progress-track-fill" :style="{ width: curriculumStore.progress + '%' }"></div>
      </div>
      <button class="btn-exit" @click="handleExit">✕</button>
    </header>

    <main class="assessment-main">
      <div class="board-wrapper glass-lg">
        <ChessBoard 
          v-if="currentPuzzle"
          :interactive="true"
          :flipped="isFlipped"
        />
        <div class="intel-overlay" v-if="showIntel">
          <div class="intel-pulse"></div>
          <span>ANALYZING VISION DNA...</span>
        </div>
      </div>

      <aside class="assessment-sidebar glass-sm">
        <div class="sidebar-top">
          <h3>Task Briefing</h3>
          <p class="muted mt-2">{{ stageDescription }}</p>
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
    </main>

    <!-- Success/Stage Transition Overlay -->
    <Transition name="fade-slide">
      <div v-if="showSuccess" class="stage-complete-overlay glass-lg">
        <div class="success-content">
          <span class="icon">{{ curriculumStore.isComplete ? '🧬' : '✨' }}</span>
          <h2>{{ curriculumStore.isComplete ? 'Assessment Complete' : 'Stage Complete' }}</h2>
          <p class="muted">
            {{ curriculumStore.isComplete 
              ? 'Your cognitive chess profile has been fully sequenced.' 
              : 'Your tactical baseline has been mapped.' }}
          </p>
          
          <button v-if="!curriculumStore.isComplete" class="btn btn-primary mt-6" @click="nextStage">
            Proceed to Next Stage →
          </button>
          <button v-else class="btn btn-accent mt-6" @click="revealDna">
            Reveal My DNA →
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
import ChessBoard from '../components/ChessBoard.vue'
import { logger } from '../utils/logger'

const router = useRouter()
const curriculumStore = useCurriculumStore()
const gameStore = useGameStore()
const uiStore = useUiStore()

// --- ASSESSMENT STATE ---
const currentPuzzles = ref<Puzzle[]>([])
const puzzleIdx = ref(0)
const startTime = ref(0)
const stageResults = ref<{ time: number; errors: number }[]>([])
const errorsInCurrentPuzzle = ref(0)

const showIntel = ref(false)
const showSuccess = ref(false)

const currentPuzzle = computed(() => currentPuzzles.value[puzzleIdx.value])

/**
 * Ensures the user is always playing from the bottom of the screen.
 */
const isFlipped = computed(() => {
  if (!currentPuzzle.value) return false
  // If it's Black's turn to move, we flip the board
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

const stageTitles: Record<string, string> = {
  tactics: 'Pattern Recognition',
  calculation: 'Deep Visualization',
  endgame: 'Fundamental Technique',
  strategy: 'Positional Insight',
  speed: 'Instinctual Tempo'
}

const stageDescriptions: Record<string, string> = {
  tactics: 'Find the winning sequence as quickly as possible. We are measuring your tactical floor.',
  calculation: 'Look 3-4 moves ahead. Accuracy is more important than speed in this phase.',
  endgame: 'Convert the advantage. This measures your technical precision in high-leverage moments.',
  strategy: 'Choose the best positional plan. No immediate tactics; purely conceptual.',
  speed: 'Instinct test. Solve simple patterns under extreme time pressure.'
}

const stageTitle = computed(() => stageTitles[curriculumStore.currentStage] || 'Skill Evaluation')
const stageDescription = computed(() => stageDescriptions[curriculumStore.currentStage] || 'Analyzing performance...')

// --- ACTIONS ---

/**
 * Loads the current set of puzzles for the active stage.
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
    logger.error('[Assessment] Failed to load stage:', err)
  }
}

/**
 * Injects a puzzle into the gameStore and starts the timer.
 */
function loadPuzzle(puzzle: Puzzle) {
  logger.info(`[Assessment] Loading puzzle ${puzzle.id}:`, puzzle.solution)
  
  // 1. Reset board
  gameStore.loadPosition(puzzle.fen, 'puzzle')
  
  // 2. Sync Drill State
  gameStore.setDrill(puzzle.solution || [])
  gameStore.playerColor = puzzle.fen.split(' ')[1] as 'w' | 'b'
  
  // 3. Telemetry
  startTime.value = Date.now()
  errorsInCurrentPuzzle.value = 0
}

/**
 * Handles puzzle completion logic.
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

function completeStage() {
  showSuccess.value = true
  curriculumStore.recordStageResult({
    stage: curriculumStore.currentStage,
    accuracy: accuracy.value,
    avgTime: pace.value,
    difficulty: 1200 // Default for now
  })
}

function handleExit() {
  uiStore.confirm('Exit Assessment?', 'Your current progress will not be saved.', () => {
    router.push('/')
  })
}

function nextStage() {
  showSuccess.value = false
  loadStage()
}

function revealDna() {
  router.push('/dna-reveal')
}

// Watch for drill completion or opponent turns
watch(() => gameStore.drillIndex, (newIdx) => {
  if (!currentPuzzle.value) return

  const solution = currentPuzzle.value.solution
  
  // 1. Check if the puzzle is fully solved
  if (newIdx >= solution.length) {
    setTimeout(handlePuzzleComplete, 500)
    return
  }

  // 2. Check if it's the opponent's turn to move automatically
  // We determine this by checking if the current turn matches the player's initial color
  const currentTurn = gameStore.turn
  if (currentTurn !== gameStore.playerColor) {
    const nextMove = solution[newIdx]
    setTimeout(() => {
      const from = nextMove.slice(0, 2) as any
      const to = nextMove.slice(2, 4) as any
      gameStore.makeMove(from, to)
      logger.info(`[Assessment] Opponent played auto-move: ${nextMove}`)
    }, 600) // Slight delay for realism
  }
})

// Watch for failed moves (we'll need to add a failed-move event to gameStore or check drillIndex)
// For now, we'll assume every move decrement or re-selection after a failed move is an error.

onMounted(() => {
  curriculumStore.startAssessment()
  loadStage()
  
  // Simulate intel pulse
  setTimeout(() => { showIntel.value = true }, 2000)
})
</script>

<style scoped>
.assessment-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-deep);
  overflow: hidden;
}

.assessment-header {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-8);
  position: relative;
}

.progress-track-bg {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255,255,255,0.05);
}

.progress-track-fill {
  height: 100%;
  background: var(--accent-gradient);
  transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.assessment-main {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--space-8);
  padding: var(--space-8);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.board-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.placeholder-board {
  width: 600px;
  height: 600px;
  background: rgba(255,255,255,0.02);
  border: 1px dashed rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.assessment-sidebar {
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.telemetry-item {
  margin-top: var(--space-6);
}

.telemetry-item .label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.1em; }
.telemetry-item .val { font-size: 1.5rem; font-weight: 900; color: var(--accent-bright); display: block; }

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

.stage-complete-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 15, 0.8);
  backdrop-filter: blur(20px);
}

.success-content {
  text-align: center;
  max-width: 400px;
}

.success-content .icon { font-size: 4rem; display: block; margin-bottom: var(--space-4); }

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
  70% { transform: scale(1.1); opacity: 0.5; box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
  100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
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

.btn-accent {
  background: var(--accent-gradient);
  color: white;
  padding: 14px 28px;
  border-radius: var(--radius-lg);
  font-weight: 800;
  font-size: 1.1rem;
  box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-accent:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 30px rgba(139, 92, 246, 0.5);
}
</style>
