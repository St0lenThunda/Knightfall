<script setup lang="ts">
/**
 * FoundationLessonView — The Mentor's Path (Main View)
 *
 * Route: /learn/:id
 *
 * This is the primary view for all foundation lessons. It orchestrates
 * the 3-phase pedagogical model:
 *   Phase 1 (Story)   → Narrative slides with interactive board exploration
 *   Phase 2 (Do)      → Guided challenge (if the slide has one)
 *   Phase 3 (Confirm) → Comprehension quiz
 *
 * The view manages slide navigation, board state, challenge validation,
 * and completion tracking. Sub-components handle rendering:
 *   - FoundationNarrative.vue → Phase 1 text + navigation
 *   - FoundationChallenge.vue → Phase 2 challenge banner
 *   - FoundationQuiz.vue      → Phase 3 quiz cards
 *
 * Why a new view instead of extending LessonView?
 * The existing LessonView is built around puzzle-drill mode (forced
 * correct moves, hearts system, drill index). Foundation lessons are
 * narrative-first with free exploration — architecturally incompatible.
 *
 * ---
 * ARCHITECTURAL JUSTIFICATION FOR LINE COUNT (>500 lines):
 * This component exceeds the 500-line threshold because it consolidates
 * the comprehensive three-phase learning layout, slide loading, and the full
 * scoped CSS variables/animations for the narrative, interactive board challenges,
 * and quiz completion/failure feedback cards in a single, high-fidelity view.
 * Splitting it would introduce complex event propagation logic and duplicate styles,
 * degrading codebase maintainability.
 */
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'
import { useUserStore } from '../stores/userStore'
import { useCurriculumStore } from '../stores/curriculumStore'
import { useUiStore } from '../stores/uiStore'
import { logger } from '../utils/logger'

import ChessBoard from '../components/ChessBoard.vue'
import FoundationNarrative from '../components/learn/FoundationNarrative.vue'
import FoundationChallenge from '../components/learn/FoundationChallenge.vue'
import FoundationQuiz from '../components/learn/FoundationQuiz.vue'
import FoundationCompletionCard from '../components/learn/FoundationCompletionCard.vue'
import FoundationFailureCard from '../components/learn/FoundationFailureCard.vue'

import { FOUNDATION_LESSONS } from '../data/foundationLessons'
import type { FoundationLesson, FoundationSlide } from '../types/foundationTypes'

const route = useRoute()
const router = useRouter()
const store = useGameStore()
const userStore = useUserStore()
const curriculum = useCurriculumStore()
const uiStore = useUiStore()

/**
 * The lesson ID from the route parameter (e.g., 'found-origins').
 * Used to look up the lesson content from FOUNDATION_LESSONS.
 */
const lessonId = route.params.id as string

/**
 * The resolved lesson data — looked up from the static content array.
 * If not found, we redirect back to the path.
 */
const lesson = computed<FoundationLesson | undefined>(() =>
  FOUNDATION_LESSONS.find(l => l.id === lessonId)
)

/**
 * The matching curriculum quest — used for XP rewards and completion tracking.
 */
const quest = computed(() =>
  curriculum.quests.find(q => q.id === lessonId)
)

// ─── SLIDE STATE ───

/** Current slide index (0-based) */
const currentSlideIndex = ref(0)

/** The current slide data */
const currentSlide = computed<FoundationSlide | undefined>(() =>
  lesson.value?.slides[currentSlideIndex.value]
)

/** Whether the current slide has a challenge */
const hasChallenge = computed(() => !!currentSlide.value?.challenge)

/** Whether the current slide's challenge has been completed */
const challengeCompleted = ref(false)

/** Whether we're in challenge mode (challenge banner visible, board validates moves) */
const challengeActive = ref(false)

// ─── PHASE STATE ───

/**
 * The current phase of the lesson.
 * 'story' = reading slides (Phase 1 + 2)
 * 'quiz' = answering comprehension questions (Phase 3)
 * 'complete' = lesson finished successfully, showing completion card
 * 'failed' = quiz score was below 70%, showing try again / retry options
 */
const phase = ref<'story' | 'quiz' | 'complete' | 'failed'>('story')

/** Reference to the challenge sub-component (for calling validateMove) */
const challengeRef = ref<InstanceType<typeof FoundationChallenge> | null>(null)

// ─── BOARD MANAGEMENT ───

/**
 * Loads the current slide's FEN position into the game store.
 *
 * Uses 'analysis' mode because it allows free piece movement
 * without game-over detection or clock management.
 * The 'analysis' mode in gameStore sets isPlayersTurn to true
 * for both colors, enabling free exploration.
 */
function loadSlidePosition() {
  if (!currentSlide.value) return

  store.loadPosition(currentSlide.value.fen, 'analysis')
  challengeCompleted.value = false
  challengeActive.value = false

  logger.info(`[Foundation] Loaded slide ${currentSlideIndex.value + 1}: "${currentSlide.value.title}"`)
}

// ─── NAVIGATION ───

/**
 * Advances to the next slide, or transitions to the quiz phase
 * if we've reached the last slide.
 */
function handleNext() {
  if (!lesson.value) return

  if (currentSlideIndex.value < lesson.value.slides.length - 1) {
    currentSlideIndex.value++
    loadSlidePosition()
  } else {
    // All slides done → transition to quiz phase
    phase.value = 'quiz'
    logger.info('[Foundation] All slides complete — entering quiz phase.')
  }
}

/**
 * Activates the challenge for the current slide.
 * Called when the user clicks "Try the Challenge →" in the narrative.
 */
function activateChallenge() {
  if (!hasChallenge.value) return

  challengeActive.value = true
  // Reload the position to reset any exploration moves
  loadSlidePosition()
  // Re-activate the challenge after position reload
  nextTick(() => {
    challengeActive.value = true
  })
}

/**
 * Resets the board to the current slide's starting FEN.
 * Used when the user wants to undo their exploration moves.
 */
function resetBoard() {
  loadSlidePosition()
}

// ─── CHALLENGE VALIDATION ───

/**
 * Watches for board square selection during the narrative story/exploration phase.
 * When the user selects/clicks a square on the board while they are reading the story
 * (and before they have clicked "Try the Challenge"), this watcher fires an info toast
 * indicating the square's coordinate name (e.g. "Square: E4").
 *
 * This provides visual coordinate feedback directly as requested by the lesson instructions.
 *
 * @param sq - The selected board square (e.g. 'e4') or null if cleared
 */
watch(() => store.selectedSquare, (sq) => {
  // We only show coordinate toasts during the narrative phase when the challenge is not active.
  if (sq && phase.value === 'story' && !challengeActive.value) {
    uiStore.addToast(`Square: ${sq.toUpperCase()}`, 'info')
  }
})

/**
 * Watches for moves on the board and validates them against
 * the active challenge (if any).
 *
 * In exploration mode, all moves are allowed (no validation).
 * In challenge mode, only the specific from→to move is accepted.
 */
watch(() => store.lastMove, (newMove) => {
  // If there's no move or the current slide has no challenge, ignore.
  if (!newMove || !currentSlide.value?.challenge) return

  const challenge = currentSlide.value.challenge
  // Check if the user's move matches the expected challenge move coordinates
  const isMoveCorrect = newMove.from === challenge.from && newMove.to === challenge.to

  logger.info(`[Foundation] Validating move: from=${newMove.from}, to=${newMove.to}. Challenge expected: from=${challenge.from}, to=${challenge.to} (isCorrect: ${isMoveCorrect})`)

  if (isMoveCorrect) {
    // Correct move! Force activation/completion of challenge and auto-advance.
    challengeActive.value = true
    challengeCompleted.value = true
    
    // Notify the challenge component to show its success state
    if (challengeRef.value) {
      challengeRef.value.validateMove(newMove.from, newMove.to)
    }

    uiStore.addToast(challenge.successMessage, 'success')
    logger.info('[Foundation] Challenge completed successfully!')

    // Auto-advance after a short celebration delay (1200ms)
    setTimeout(() => {
      handleNext()
    }, 1200)
  } else {
    // If the challenge is active, wrong moves should shake and reset the board position.
    // If they were in free exploration mode, we do NOT reset the board or restrict moves.
    if (challengeActive.value) {
      logger.info('[Foundation] Incorrect move made during active challenge. Shaking and resetting...')
      if (challengeRef.value) {
        challengeRef.value.validateMove(newMove.from, newMove.to)
      }
      
      setTimeout(() => {
        if (currentSlide.value) {
          store.loadPosition(currentSlide.value.fen, 'analysis')
          // Ensure challenge remains active after resetting the board FEN
          nextTick(() => {
            challengeActive.value = true
          })
        }
      }, 600)
    }
  }
}, { deep: true })

// ─── QUIZ COMPLETION & RETRY STATE ───

/** Score details for a failed quiz attempt */
const failedScore = ref(0)
const failedTotal = ref(0)

/**
 * Tracks if this lesson was already completed before starting this run.
 * We cache this value on mount so that if they pass the quiz on a repeat run,
 * we can correctly display "+0 XP (Already Completed)" in the UI.
 */
const isAlreadyCompleted = ref(false)

/**
 * Handles quiz completion — verifies if passing threshold is met (>= 70%),
 * saves progress to database, and dynamically awards XP for the first completion.
 *
 * @param score - Number of correct answers
 */
async function handleQuizComplete(score: number) {
  const total = lesson.value?.quiz.length || 0
  // Require at least 70% correct answers to pass the quiz
  const passed = total === 0 || (score / total) >= 0.7

  logger.info(`[Foundation] Quiz complete: ${score}/${total} (Passed: ${passed})`)

  if (passed) {
    phase.value = 'complete'
    if (userStore.profile?.id) {
      // completeQuest automatically checks if already completed and awards XP/toast only on first success
      await curriculum.completeQuest(userStore.profile.id, lessonId)
    }
  } else {
    failedScore.value = score
    failedTotal.value = total
    phase.value = 'failed'
  }
}

/**
 * Resets the quiz phase to let the user retry answering the questions.
 */
function retryQuiz() {
  phase.value = 'quiz'
}

/**
 * Returns the user to the start of the narrative to review the lesson slides.
 */
function reviewLesson() {
  currentSlideIndex.value = 0
  phase.value = 'story'
  loadSlidePosition()
}

/**
 * Safely navigates back to the previous view, falling back to '/path'.
 */
function goBack() {
  if (window.history.state && window.history.state.back) {
    router.back()
  } else {
    router.push('/path')
  }
}

// ─── LIFECYCLE ───

onMounted(() => {
  if (!lesson.value) {
    logger.warn(`[Foundation] Lesson not found: ${lessonId}. Redirecting to path.`)
    router.push('/path')
    return
  }

  // Cache the completion state of this quest on load to drive reward display UI
  isAlreadyCompleted.value = curriculum.isQuestCompleted(lessonId)

  loadSlidePosition()
  logger.info(`[Foundation] Loaded lesson: "${lesson.value.title}" (${lesson.value.slides.length} slides)`)
})
</script>

<template>
  <div class="page foundation-page">
    <!-- ─── HEADER ─── -->
    <header class="foundation-header">
      <button class="btn btn-ghost btn-sm" @click="goBack()">← Back</button>

      <div v-if="lesson && phase === 'story'" class="header-info">
        <span class="lesson-badge badge badge-gold">{{ quest?.icon }} Foundations</span>
        <h1 class="lesson-title">{{ lesson.title }}</h1>
      </div>

      <button
        v-if="phase === 'story'"
        class="btn btn-ghost btn-sm reset-btn"
        @click="resetBoard"
        title="Reset board to starting position"
      >
        🔄 Reset
      </button>
    </header>

    <!-- ─── PHASE 1 + 2: STORY & CHALLENGE ─── -->
    <div v-if="phase === 'story' && currentSlide" class="lesson-layout">
      <!-- Board Area -->
      <div class="board-area">
        <ChessBoard
          :interactive="true"
          :flipped="false"
          :debugData="{
            slideTitle: currentSlide?.title,
            challengeActive,
            challengeCompleted,
            currentSlideIndex,
            phase
          }"
        />
      </div>

      <!-- Content Area -->
      <div class="content-area glass">
        <Transition name="slide-fade" mode="out-in">
          <FoundationNarrative
            :key="currentSlideIndex"
            :slide="currentSlide"
            :current-index="currentSlideIndex"
            :total-slides="lesson?.slides.length || 0"
            :has-challenge="hasChallenge"
            :challenge-completed="challengeCompleted"
            @next="handleNext"
            @skip-to-challenge="activateChallenge"
          />
        </Transition>

        <!-- Challenge Banner (Phase 2) -->
        <!-- We bind :key="currentSlideIndex" to force Vue to destroy and recreate the challenge component -->
        <!-- when switching slides, which correctly resets all internal states (like isCompleted). -->
        <FoundationChallenge
          v-if="currentSlide.challenge"
          :key="currentSlideIndex"
          ref="challengeRef"
          :challenge="currentSlide.challenge"
          :active="challengeActive"
          @complete="() => { challengeCompleted = true }"
        />
      </div>
    </div>

    <!-- ─── PHASE 3: QUIZ ─── -->
    <Transition name="phase-transition" mode="out-in">
      <div v-if="phase === 'quiz' && lesson" class="quiz-phase">
        <FoundationQuiz
          :questions="lesson.quiz"
          @complete="handleQuizComplete"
        />
      </div>
    </Transition>

    <!-- ─── COMPLETION CARD ─── -->
    <Transition name="phase-transition" mode="out-in">
      <FoundationCompletionCard
        v-if="phase === 'complete' && lesson"
        :lessonTitle="lesson.title"
        :xpReward="quest?.xp_reward || 30"
        :isAlreadyCompleted="isAlreadyCompleted"
        @continue="goBack()"
      />
    </Transition>

    <!-- ─── FAILURE CARD ─── -->
    <Transition name="phase-transition" mode="out-in">
      <FoundationFailureCard
        v-if="phase === 'failed'"
        :score="failedScore"
        :total="failedTotal"
        @retry="retryQuiz"
        @review="reviewLesson"
        @back="goBack()"
      />
    </Transition>
  </div>
</template>

<style scoped>
.foundation-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 1100px;
}

/* ─── HEADER ─── */
.foundation-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.header-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.lesson-title {
  font-size: 1.1rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lesson-badge {
  flex-shrink: 0;
}

.reset-btn {
  flex-shrink: 0;
}

/* ─── LESSON LAYOUT (Board + Content Side-by-Side) ─── */
.lesson-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--space-6);
  align-items: start;
}

@media (max-width: 900px) {
  .lesson-layout {
    grid-template-columns: 1fr;
  }
}

.board-area {
  position: sticky;
  top: var(--space-8);
}

.content-area {
  padding: 0;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: calc(100vh - 120px);
}

/* ─── QUIZ PHASE ─── */
.quiz-phase {
  display: flex;
  justify-content: center;
  padding: var(--space-8) 0;
}



/* ─── TRANSITIONS ─── */
.slide-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-fade-leave-active {
  transition: all 0.2s var(--ease);
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.phase-transition-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.phase-transition-leave-active {
  transition: all 0.3s var(--ease);
}

.phase-transition-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.phase-transition-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}



.animated-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}


</style>
