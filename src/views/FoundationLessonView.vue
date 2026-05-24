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
 * The view delegates its state and logic to the useFoundationLesson composable
 * to keep the component focused purely on template rendering and layouts.
 */
import ChessBoard from '../components/ChessBoard.vue'
import FoundationNarrative from '../components/learn/FoundationNarrative.vue'
import FoundationChallenge from '../components/learn/FoundationChallenge.vue'
import FoundationQuiz from '../components/learn/FoundationQuiz.vue'
import FoundationCompletionCard from '../components/learn/FoundationCompletionCard.vue'
import FoundationFailureCard from '../components/learn/FoundationFailureCard.vue'
import { useFoundationLesson } from '../composables/useFoundationLesson'

const {
  lesson,
  quest,
  currentSlideIndex,
  currentSlide,
  hasChallenge,
  challengeCompleted,
  challengeActive,
  phase,
  challengeRef,
  failedScore,
  failedTotal,
  isAlreadyCompleted,
  resetBoard,
  handleNext,
  activateChallenge,
  handleQuizComplete,
  retryQuiz,
  reviewLesson,
  goBack
} = useFoundationLesson()

// Touch challengeRef to satisfy unused local check
void challengeRef
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
