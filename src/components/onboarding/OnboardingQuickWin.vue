<template>
  <div class="quick-win-step animate-fade-in">
    <!-- Grid Layout containing board and instruction sidebar -->
    <div class="board-layout">
      <!-- Board Wrapper -->
      <div class="board-wrapper glass-lg">
        <ChessBoard 
          :interactive="true"
          :flipped="false"
        />
        <div class="board-overlay-banner white">
          White to Move — Deliver Checkmate!
        </div>
      </div>

      <!-- Instruction & Telemetry Sidebar -->
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
</template>

<script setup lang="ts">
/**
 * OnboardingQuickWin.vue
 *
 * Screen 2 of the Onboarding Gauntlet.
 * Presents a simple one-move checkmate challenge (Scholar's Mate on f7) to establish
 * immediate interactive engagement ("Quick Win") and verify basic chess control familiarity.
 *
 * Emits a 'solved' event when the player successfully inputs the correct move.
 */
import { onMounted, watch } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { logger } from '../../utils/logger'
import { QUICK_WIN_PUZZLE } from '../../data/onboardingData'
import ChessBoard from '../ChessBoard.vue'

const emit = defineEmits<{
  /** Solved event triggered when the puzzle's final solution index is reached */
  (e: 'solved'): void
}>()

const gameStore = useGameStore()

/**
 * Prepares the gameStore state for the quick win puzzle.
 * Seeds the starting position (FEN), set the drill mode, and sets player color context.
 */
function loadPuzzle() {
  logger.info(`[OnboardingQuickWin] Loading puzzle ${QUICK_WIN_PUZZLE.id}`, QUICK_WIN_PUZZLE.solution)
  
  // Load position into the board logic
  gameStore.loadPosition(QUICK_WIN_PUZZLE.fen, 'puzzle')
  
  // Set up the puzzle metadata and verification parameters
  gameStore.mode = 'puzzle'
  gameStore.setDrill(QUICK_WIN_PUZZLE.solution || [])
  gameStore.playerColor = QUICK_WIN_PUZZLE.fen.split(' ')[1] as 'w' | 'b'
  
  // Initialize the match clock and telemetry track
  gameStore.startMatch()
}

// Watch the drill progress index. If the index matches or exceeds the solution length,
// the puzzle has been fully resolved by the user.
watch(() => gameStore.drillIndex, (newIdx) => {
  const solution = QUICK_WIN_PUZZLE.solution || []
  if (newIdx >= solution.length) {
    // Delay slightly for visual comfort before reporting checkmate success
    setTimeout(() => {
      emit('solved')
    }, 500)
    return
  }

  // Auto-respond for the opponent if it's their turn (not used in single-move puzzles, but kept for reliability)
  const currentTurn = gameStore.turn
  if (currentTurn !== gameStore.playerColor) {
    const nextMove = solution[newIdx]
    setTimeout(() => {
      const from = nextMove.slice(0, 2) as any
      const to = nextMove.slice(2, 4) as any
      gameStore.makeMove(from, to)
      logger.info(`[OnboardingQuickWin] Opponent played auto-move: ${nextMove}`)
    }, 400) // 400ms delay simulates realistic human response lag
  }
})

onMounted(() => {
  // Ensure the game is active (not accidentally frozen in a gameover state)
  gameStore.forceGameOver = false
  loadPuzzle()
})
</script>

<style scoped>
.quick-win-step {
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

.animate-fade-in {
  animation: fadeIn 0.4s var(--ease) both;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
