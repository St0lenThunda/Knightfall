<template>
  <div class="page puzzles-page">
    <PuzzleHeader 
      :rating="puzzleRating" 
      :streak="streak" 
    />

    <div class="puzzles-layout">
      <!-- Puzzle board -->
      <div class="puzzle-board-area">
        <!-- Mobile Stats Strip (Level, XP, Solved Today) -->
        <div v-if="isMobile" class="mobile-stats-strip glass-sm">
          <div class="strip-item">
            <span class="strip-label">Level</span>
            <span class="strip-val">{{ userStore.currentLevel }}</span>
          </div>
          <div class="strip-item">
            <span class="strip-label">XP</span>
            <span class="strip-val text-accent">{{ userStore.xp }}</span>
          </div>
          <div class="strip-item">
            <span class="strip-label">Today</span>
            <span class="strip-val text-gold">{{ solvedToday }}</span>
          </div>
        </div>

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
          :explanation="puzzleExplanation"
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
              :debugData="{ step: puzzleStep, solution: currentPuzzle?.solution, title: currentPuzzle?.title }"
            />

            <PuzzleIntroOverlay
              :visible="!introDismissed"
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
              :explanation="puzzleExplanation"
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
        v-if="!isMobile"
        :solvedToday="solvedToday"
        :xp="userStore.xp"
        :xpForNextLevel="userStore.xpForNextLevel"
        :levelProgress="userStore.levelProgress"
        :nextTitle="userStore.nextTitle"
        :queue="queuePuzzles"
        :weakness="weakness"
        :shadowStats="userStore.shadowRealmStats"
        @view-sanctum="router.push('/sanctum')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePuzzleLogic } from '../composables/usePuzzleLogic'
import { useMobileDetect } from '../composables/useMobileDetect'

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
const { isMobile } = useMobileDetect()

const {
  store, userStore, 
  currentPuzzle, puzzleSolved, introDismissed, solutionUsed,
  hintLevel, timeTakenNow, timeTakenFinal, xpGainedFinal, bonusLabelFinal,
  showDiscardConfirm, showSuccessOverlay, puzzleStep, queuePuzzles,
  activeCat, puzzleColor, puzzle, isMatePuzzle, movesToSolve,
  hintSquares, hintArrows, weakness, puzzleExplanation,
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

/* Mobile stats strip */
.mobile-stats-strip {
  display: flex;
  justify-content: space-around;
  padding: var(--space-3) var(--space-2);
  margin-bottom: var(--space-4);
  border-radius: var(--radius-md);
}

.strip-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.strip-label {
  font-size: 0.55rem;
  color: var(--text-muted);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.strip-val {
  font-size: 0.95rem;
  font-weight: 900;
}

.text-gold {
  color: var(--gold);
}

@media (max-width: 768px) {
  .puzzles-layout {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
  
  .category-pills {
    flex-wrap: nowrap !important;
    overflow-x: auto;
    padding-bottom: var(--space-2);
    -webkit-overflow-scrolling: touch;
    /* Hide scrollbar */
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .category-pills::-webkit-scrollbar {
    display: none;
  }
  
  .category-pills .pill {
    flex-shrink: 0;
  }

  .external-sources {
    flex-direction: column;
    gap: var(--space-3);
    align-items: stretch;
    text-align: center;
  }

  .sources-actions {
    justify-content: center;
  }
}
</style>
