<template>
  <div class="page puzzles-page">
    <PuzzleHeader 
      :rating="puzzleRating" 
      :streak="streak" 
    />

    <div class="puzzles-layout">
      <!-- Puzzle board -->
      <div class="puzzle-board-area">
        <!-- Category pills -->
        <div class="category-pills">
          <button 
            v-for="cat in categories" 
            :key="cat.id"
            class="pill"
            :class="{ active: activeCat === cat.id }"
            @click="setCat(cat.id)"
          >
            {{ cat.label }}
          </button>
        </div>

        <!-- MERCENARY TACTICS (External Sources) -->
        <div class="external-sources glass-sm">
          <div class="sources-header">
            <span class="muted">MERCENARY TACTICS</span>
          </div>
          <div class="sources-actions">
            <button class="btn btn-ghost btn-sm" @click="importLichessDaily">
              <span class="icon">♞</span> Lichess Daily
            </button>
            <button class="btn btn-ghost btn-sm" @click="importChesscomDaily">
              <span class="icon">♟</span> Chess.com Daily
            </button>
          </div>
        </div>

        <PuzzleCard
          v-if="currentPuzzle"
          :id="puzzle.id"
          :title="puzzle.title"
          :difficulty="puzzle.difficulty"
          :time="timeTakenNow"
          :toMove="puzzle.toMove"
          :isMate="isMatePuzzle"
          :movesToSolve="movesToSolve"
          :solved="puzzleSolved"
          :explanation="currentPuzzle.explanation"
          :hintLabel="hintLabelText"
          :isPersonal="!!route.query.personal"
          @hint="showHint"
          @solve="revealSolution"
          @next="loadNextPuzzle(false)"
          @discard="showDiscardConfirm = true"
        >
          <template #board>
            <ChessBoard 
              :fen="store.fen" 
              :lastMove="store.lastMove"
              :playerColor="puzzleColor"
              :flipped="puzzleColor === 'b'"
              :turn="store.turn"
              :interactive="!puzzleSolved"
              :hintSquares="hintSquares"
              :hintArrows="hintArrows"
              :debugData="{ step: puzzleStep, solution: currentPuzzle?.solution }"
            />

            <PuzzleIntroOverlay
              :visible="!!route.query.personal && !introDismissed"
              :title="currentPuzzle?.title"
              :category="currentPuzzle?.category"
              :themes="currentPuzzle?.themes"
              :severity="currentPuzzle?.severity"
              @start="startTraining"
            />

            <PuzzleSuccessOverlay
              :visible="showSuccessOverlay"
              :solution-used="solutionUsed"
              :xp-gained="xpGainedFinal"
              :time-taken="timeTakenFinal"
              :bonus-label="bonusLabelFinal"
              :explanation="currentPuzzle?.explanation"
              @next="loadNextPuzzle"
              @close="showSuccessOverlay = false"
            />

            <ConfirmModal
              v-if="showDiscardConfirm"
              title="Discard Drill?"
              message="Are you sure this drill is broken? This will remove it from your Shadow Realm vault forever."
              icon="🗑️"
              variant="danger"
              confirmLabel="Discard Forever"
              @confirm="confirmDiscard"
              @cancel="showDiscardConfirm = false"
            />
          </template>
        </PuzzleCard>
      </div>

      <!-- Right: Sidebar -->
      <PuzzleSidebar
        :solvedToday="solvedToday"
        :xp="userStore.xp"
        :xpForNextLevel="userStore.xpForNextLevel"
        :levelProgress="userStore.levelProgress"
        :nextTitle="userStore.nextTitle"
        :queue="queuePuzzles"
        :weakness="weakness"
        :shadowStats="userStore.shadowRealmStats"
        @view-academy="router.push('/academy')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePuzzleLogic } from '../composables/usePuzzleLogic'

// Components
import ChessBoard from '../components/ChessBoard.vue'
import PuzzleSuccessOverlay from '../components/PuzzleSuccessOverlay.vue'
import PuzzleIntroOverlay from '../components/PuzzleIntroOverlay.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import PuzzleHeader from '../components/puzzles/PuzzleHeader.vue'
import PuzzleSidebar from '../components/puzzles/PuzzleSidebar.vue'
import PuzzleCard from '../components/puzzles/PuzzleCard.vue'

const route = useRoute()
const router = useRouter()

const {
  store, userStore, 
  currentPuzzle, puzzleSolved, introDismissed, solutionUsed,
  hintLevel, timeTakenNow, timeTakenFinal, xpGainedFinal, bonusLabelFinal,
  showDiscardConfirm, showSuccessOverlay, puzzleStep, queuePuzzles,
  activeCat, puzzleColor, puzzle, isMatePuzzle, movesToSolve,
  hintSquares, hintArrows, weakness,
  startTraining, loadNextPuzzle, showHint, revealSolution,
  setCat, importLichessDaily, importChesscomDaily, confirmDiscard
} = usePuzzleLogic()

const puzzleRating = computed(() => userStore.profile?.puzzle_rating ?? 1200)
const streak = computed(() => userStore.currentStreak)
const solvedToday = computed(() => userStore.solvedToday)

const hintLabelText = computed(() => {
  if (hintLevel.value === 0) return 'Hint'
  if (hintLevel.value === 1) return 'Show Move'
  return 'Hint Shown'
})

const categories = [
  { id: 'endgame', icon: '🏁', label: 'Endgame' },
  { id: 'tactics', icon: '⚡', label: 'Tactics' },
  { id: 'opening', icon: '📖', label: 'Opening' },
  { id: 'Personal Mistake', icon: '🎯', label: 'Mistakes' },
  { id: 'mixed',   icon: '🎲', label: 'Mixed' },
]
</script>

<style scoped>
.puzzles-page { padding-top: var(--space-6); }

.puzzles-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-8);
  align-items: start;
}
@media (max-width: 900px) { .puzzles-layout { grid-template-columns: 1fr; } }

/* Categories */
.category-pills {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}

.external-sources {
  padding: var(--space-3) var(--space-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  border-radius: var(--radius-lg);
}

.sources-header { font-weight: 800; font-size: 0.7rem; letter-spacing: 0.1em; }
.sources-actions { display: flex; gap: var(--space-2); }
</style>
