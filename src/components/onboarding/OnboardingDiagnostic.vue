<template>
  <div class="diagnostic-step animate-fade-in">
    <!-- Grid Layout containing board and instruction/telemetry sidebar -->
    <div class="board-layout">
      <!-- Board Wrapper -->
      <div class="board-wrapper glass-lg">
        <ChessBoard 
          v-if="currentPuzzle"
          :interactive="true"
          :flipped="isFlipped"
        />
        <!-- Live telemetry sequencer status -->
        <div class="intel-overlay" v-if="showIntel">
          <div class="intel-pulse"></div>
          <span>SEQUENCING COGNITIVE DNA...</span>
        </div>
      </div>

      <!-- Live Assessment Statistics Sidebar -->
      <aside class="sidebar glass-sm">
        <div class="sidebar-top">
          <span class="ritual-tag">{{ currentStage.toUpperCase() }} ASSESSMENT</span>
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
</template>

<script setup lang="ts">
/**
 * OnboardingDiagnostic.vue
 *
 * Screen 3+ of the Onboarding Gauntlet.
 * Drives the interactive baseline diagnostic tests (across domains: tactics, calculation,
 * endgame, strategy, speed). Fetches dynamic puzzles, evaluates timing + error margins,
 * and reports performance updates to the parent component.
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { fetchAssessmentPuzzles, type Puzzle } from '../../api/puzzleApi'
import { logger } from '../../utils/logger'
import ChessBoard from '../ChessBoard.vue'

const props = defineProps<{
  /** The starting estimated skill selected by the user in Step 1 */
  declaredSkill: number
  /** Active stage key name (e.g. 'tactics', 'strategy') */
  currentStage: string
  /** Active stage sequence index (0-based) */
  currentStageIndex: number
}>()

const emit = defineEmits<{
  /** Triggered when the user finishes all puzzles of the current stage */
  (e: 'stage-complete', data: { accuracy: number; pace: number }): void
}>()

const gameStore = useGameStore()

// State management for the active stage puzzles and results tracking
const currentPuzzles = ref<Puzzle[]>([])
const puzzleIdx = ref(0)
const startTime = ref(0)
const stageResults = ref<{ time: number; errors: number }[]>([])
const showIntel = ref(false)

// Computed reference to the active puzzle object
const currentPuzzle = computed(() => currentPuzzles.value[puzzleIdx.value])

// Auto-flip the board view if the position is from Black's perspective
const isFlipped = computed(() => {
  if (!currentPuzzle.value) return false
  // Standard split on FEN string: index 1 determines active color turn ('w' or 'b')
  return currentPuzzle.value.fen.split(' ')[1] === 'b'
})

// Calculate accuracy dynamically as a percentage of perfect (zero-error) solutions
const accuracy = computed(() => {
  if (stageResults.value.length === 0) return 1
  const totalPuzzles = stageResults.value.length
  const perfectPuzzles = stageResults.value.filter(r => r.errors === 0).length
  return perfectPuzzles / totalPuzzles
})

// Calculate average time pace across the completed stage puzzles
const pace = computed(() => {
  if (stageResults.value.length === 0) return 0
  const totalTime = stageResults.value.reduce((acc, r) => acc + r.time, 0)
  return Math.round(totalTime / stageResults.value.length)
})

// Dynamic descriptions displayed to the user based on stage context
const stageDescriptions: Record<string, string> = {
  tactics: 'Find the winning sequence as quickly as possible. We are measuring your tactical floor.',
  calculation: 'Look 3-4 moves ahead. Accuracy is more important than speed in this phase.',
  endgame: 'Convert the advantage. This measures your technical precision in high-leverage moments.',
  strategy: 'Choose the best positional plan. No immediate tactics; purely conceptual.',
  speed: 'Instinct test. Solve simple patterns under extreme time pressure.'
}

const stageDescription = computed(() => stageDescriptions[props.currentStage] || 'Analyzing performance...')

/**
 * Seeds and initializes the board for a specific puzzle structure.
 */
function loadPuzzle(puzzle: Puzzle) {
  logger.info(`[OnboardingDiagnostic] Loading puzzle ${puzzle.id}`, puzzle.solution)
  
  // Load position
  gameStore.loadPosition(puzzle.fen, 'puzzle')
  
  // Set verification limits
  gameStore.mode = 'puzzle'
  gameStore.setDrill(puzzle.solution || [])
  gameStore.playerColor = puzzle.fen.split(' ')[1] as 'w' | 'b'
  
  // Initialize timers
  gameStore.startMatch()
  startTime.value = Date.now()
}

/**
 * Queries the database API for the stage-specific puzzles, reset states, and seeds the first puzzle.
 */
async function loadStage() {
  try {
    currentPuzzles.value = await fetchAssessmentPuzzles(props.currentStage)
    puzzleIdx.value = 0
    stageResults.value = []
    
    if (currentPuzzles.value.length > 0) {
      loadPuzzle(currentPuzzles.value[0])
    }
  } catch (err) {
    logger.error('[OnboardingDiagnostic] Failed to load stage:', err)
  }
}

/**
 * Handles progression when a puzzle is solved. Stores results and checks stage bounds.
 */
function handlePuzzleComplete() {
  // Convert elapsed milliseconds to seconds
  const timeTaken = (Date.now() - startTime.value) / 1000
  
  stageResults.value.push({
    time: timeTaken,
    errors: gameStore.mistakeCount
  })

  // If there are more puzzles in this stage, load the next one
  if (puzzleIdx.value < currentPuzzles.value.length - 1) {
    puzzleIdx.value++
    loadPuzzle(currentPuzzles.value[puzzleIdx.value])
  } else {
    // Stage fully completed! Emit results metrics back to parent orchestrator
    emit('stage-complete', {
      accuracy: accuracy.value,
      pace: pace.value
    })
  }
}

// Watch for parent-driven changes in the active stage index to reload puzzles
watch(() => props.currentStageIndex, () => {
  loadStage()
})

// Watch gameStore progress to automatically trigger opponent moves or puzzle completion checks
watch(() => gameStore.drillIndex, (newIdx) => {
  if (!currentPuzzle.value) return
  const solution = currentPuzzle.value.solution || []
  
  // 1. Check if the user successfully completed all moves in the solution
  if (newIdx >= solution.length) {
    setTimeout(() => {
      handlePuzzleComplete()
    }, 500)
    return
  }

  // 2. Play counter-moves automatically for the opposing side on their turn
  const currentTurn = gameStore.turn
  if (currentTurn !== gameStore.playerColor) {
    const nextMove = solution[newIdx]
    setTimeout(() => {
      const from = nextMove.slice(0, 2) as any
      const to = nextMove.slice(2, 4) as any
      gameStore.makeMove(from, to)
      logger.info(`[OnboardingDiagnostic] Opponent played auto-move: ${nextMove}`)
    }, 400)
  }
})

onMounted(() => {
  gameStore.forceGameOver = false
  // Delayed decorative visual animation
  setTimeout(() => { showIntel.value = true }, 1500)
  loadStage()
})
</script>

<style scoped>
.diagnostic-step {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  width: 100%;
}

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

.sidebar {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: var(--radius-xl);
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

/* Decorative Cognitive Sequencer Telemetry */
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

.animate-fade-in {
  animation: fadeIn 0.4s var(--ease) both;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
  70% { transform: scale(1.1); opacity: 0.5; box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
  100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
}
</style>
