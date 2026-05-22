<script setup lang="ts">
/**
 * FoundationQuiz — Phase 3: The Check-In
 *
 * Renders a multiple-choice quiz at the end of a foundation lesson.
 * No score penalty, no hearts — purely educational. The explanation
 * is always shown after answering, regardless of correctness.
 *
 * Why a separate component? Quiz rendering, answer tracking, and
 * completion logic are distinct from narrative and challenge concerns.
 * This also makes it reusable if we add quizzes to other lesson types later.
 */
import { ref, computed } from 'vue'
import type { QuizQuestion } from '../../types/foundationTypes'

/**
 * @prop questions - Array of quiz questions to display
 */
const props = defineProps<{
  questions: QuizQuestion[]
}>()

const emit = defineEmits<{
  /** Fired when all questions have been answered */
  (e: 'complete', score: number): void
}>()

/** Index of the current question being displayed */
const currentQuestionIndex = ref(0)

/** The user's selected answer index (null = no selection yet) */
const selectedAnswer = ref<number | null>(null)

/** Whether the current question has been answered (shows explanation) */
const hasAnswered = ref(false)

/** Running count of correct answers */
const correctCount = ref(0)

/** The current question being displayed */
const currentQuestion = computed(() => props.questions[currentQuestionIndex.value])

/** Whether we're on the last question */
const isLastQuestion = computed(() => currentQuestionIndex.value >= props.questions.length - 1)

/**
 * Handles the user selecting an answer option.
 *
 * Once selected, the answer is locked and the explanation is shown.
 * We don't allow changing answers — this mirrors real comprehension
 * checks where gut instinct reveals true understanding.
 *
 * @param index - The zero-based index of the selected option
 */
function selectAnswer(index: number) {
  // Don't allow re-answering once committed
  if (hasAnswered.value) return

  selectedAnswer.value = index
  hasAnswered.value = true

  // Track correct answers for the completion score
  if (index === currentQuestion.value.correctIndex) {
    correctCount.value++
  }
}

/**
 * Advances to the next question or completes the quiz.
 *
 * On the last question, emits the 'complete' event with the
 * user's score (correct count out of total questions).
 */
function nextQuestion() {
  if (isLastQuestion.value) {
    emit('complete', correctCount.value)
    return
  }

  // Reset state for the next question
  currentQuestionIndex.value++
  selectedAnswer.value = null
  hasAnswered.value = false
}

/**
 * Returns CSS class names for an answer option based on its state.
 *
 * After answering:
 * - Correct answer → green highlight
 * - User's wrong answer → rose highlight
 * - Other options → dimmed
 */
function getOptionClass(index: number) {
  if (!hasAnswered.value) {
    return { 'option-hoverable': true }
  }

  return {
    'option-correct': index === currentQuestion.value.correctIndex,
    'option-wrong': index === selectedAnswer.value && index !== currentQuestion.value.correctIndex,
    'option-dimmed': index !== selectedAnswer.value && index !== currentQuestion.value.correctIndex
  }
}
</script>

<template>
  <div class="quiz-container">
    <!-- Quiz Header -->
    <div class="quiz-header">
      <span class="quiz-icon">🧠</span>
      <h2 class="quiz-title">Quick Check</h2>
      <span class="quiz-counter">
        {{ currentQuestionIndex + 1 }} / {{ questions.length }}
      </span>
    </div>

    <!-- Question Card -->
    <Transition name="quiz-fade" mode="out-in">
      <div :key="currentQuestionIndex" class="question-card glass">
        <!-- Question Text -->
        <p class="question-text">{{ currentQuestion.question }}</p>

        <!-- Answer Options -->
        <div class="options-list">
          <button
            v-for="(option, idx) in currentQuestion.options"
            :key="idx"
            class="option-btn"
            :class="getOptionClass(idx)"
            :disabled="hasAnswered"
            @click="selectAnswer(idx)"
          >
            <span class="option-letter">{{ String.fromCharCode(65 + idx) }}</span>
            <span class="option-text">{{ option }}</span>
            <span v-if="hasAnswered && idx === currentQuestion.correctIndex" class="option-badge">✓</span>
            <span v-if="hasAnswered && idx === selectedAnswer && idx !== currentQuestion.correctIndex" class="option-badge option-badge-wrong">✗</span>
          </button>
        </div>

        <!-- Explanation (shown after answering) -->
        <Transition name="explanation-reveal">
          <div v-if="hasAnswered" class="explanation-card">
            <div class="explanation-header">
              <span class="explanation-icon">
                {{ selectedAnswer === currentQuestion.correctIndex ? '🎯' : '💡' }}
              </span>
              <span class="explanation-label">
                {{ selectedAnswer === currentQuestion.correctIndex ? 'Exactly right!' : 'Good effort — here\'s why:' }}
              </span>
            </div>
            <p class="explanation-text">{{ currentQuestion.explanation }}</p>

            <!-- Next / Finish Button -->
            <button
              class="btn btn-primary btn-lg quiz-next-btn"
              @click="nextQuestion"
            >
              {{ isLastQuestion ? 'Complete Lesson 🎉' : 'Next Question →' }}
            </button>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.quiz-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6);
  animation: fadeIn 0.5s var(--ease) both;
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}

/* ─── HEADER ─── */
.quiz-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.quiz-icon {
  font-size: 1.8rem;
}

.quiz-title {
  font-size: 1.4rem;
  font-weight: 800;
  flex: 1;
}

.quiz-counter {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
}

/* ─── QUESTION CARD ─── */
.question-card {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.question-text {
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.5;
  color: var(--text-primary);
}

/* ─── OPTIONS ─── */
.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.option-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.25s var(--ease);
  text-align: left;
  width: 100%;
}

.option-hoverable:hover {
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateX(4px);
}

.option-letter {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--text-muted);
  flex-shrink: 0;
}

.option-text {
  flex: 1;
}

.option-badge {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--green);
}

.option-badge-wrong {
  color: var(--rose);
}

/* ─── ANSWER STATES ─── */
.option-correct {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.4);
}

.option-correct .option-letter {
  background: var(--green);
  color: #000;
}

.option-wrong {
  background: rgba(244, 63, 94, 0.08);
  border-color: rgba(244, 63, 94, 0.3);
}

.option-wrong .option-letter {
  background: var(--rose);
  color: #fff;
}

.option-dimmed {
  opacity: 0.4;
}

/* ─── EXPLANATION ─── */
.explanation-card {
  padding: var(--space-4);
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.explanation-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.explanation-icon {
  font-size: 1.2rem;
}

.explanation-label {
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--accent-bright);
}

.explanation-text {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.quiz-next-btn {
  align-self: flex-end;
  margin-top: var(--space-2);
}

/* ─── TRANSITIONS ─── */
.quiz-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.quiz-fade-leave-active {
  transition: all 0.2s var(--ease);
}

.quiz-fade-enter-from {
  opacity: 0;
  transform: translateX(24px) scale(0.97);
}

.quiz-fade-leave-to {
  opacity: 0;
  transform: translateX(-24px) scale(0.97);
}

.explanation-reveal-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.explanation-reveal-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
