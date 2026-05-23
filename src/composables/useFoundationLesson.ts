import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'
import { useUserStore } from '../stores/userStore'
import { useCurriculumStore } from '../stores/curriculumStore'
import { useUiStore } from '../stores/uiStore'
import { useSettingsStore } from '../stores/settingsStore'
import { logger } from '../utils/logger'
import { FOUNDATION_LESSONS } from '../data/foundationLessons'
import type { FoundationLesson, FoundationSlide } from '../types/foundationTypes'

/**
 * Composable to manage the state and pedagogical logic of a single Foundation Lesson.
 * This coordinates the three key learning phases:
 *   1. Story (narrative slides with free board exploration)
 *   2. Do (interactive chess board challenges mapped to specific slide targets)
 *   3. Confirm (multiple choice comprehension quizzes requiring >=70% to pass)
 */
export function useFoundationLesson() {
  const route = useRoute()
  const router = useRouter()
  const store = useGameStore()
  const userStore = useUserStore()
  const curriculum = useCurriculumStore()
  const uiStore = useUiStore()
  const settingsStore = useSettingsStore()

  /** The unique identifier of the active lesson (e.g. 'found-origins') */
  const lessonId = route.params.id as string

  /** Resolved lesson configuration containing all slides and quiz data */
  const lesson = computed<FoundationLesson | undefined>(() =>
    FOUNDATION_LESSONS.find(l => l.id === lessonId)
  )

  /** Matching curriculum quest defining XP rewards and status milestones */
  const quest = computed(() =>
    curriculum.quests.find(q => q.id === lessonId)
  )

  // ─── SLIDE STATE ───
  
  /** Current active slide index within the lesson (0-indexed) */
  const currentSlideIndex = ref(0)

  /** Loaded data for the current active slide */
  const currentSlide = computed<FoundationSlide | undefined>(() =>
    lesson.value?.slides[currentSlideIndex.value]
  )

  /** Whether the current slide contains an interactive chess puzzle challenge */
  const hasChallenge = computed(() => !!currentSlide.value?.challenge)

  /** Whether the user has successfully solved the challenge on the current slide */
  const challengeCompleted = ref(false)

  /** Whether the challenge is currently active (board checks for success/failure moves) */
  const challengeActive = ref(false)

  // ─── PHASE STATE ───
  
  /** The current high-level stage of the lesson: story, quiz, complete, or failed */
  const phase = ref<'story' | 'quiz' | 'complete' | 'failed'>('story')

  /** Template reference to the challenge rendering banner component */
  const challengeRef = ref<any>(null)

  // ─── BOARD MANAGEMENT ───

  /**
   * Resets the interactive chessboard to the starting FEN defined by the current slide.
   * Loads in 'analysis' mode to permit free movement during the story stage.
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
   * Advances navigation to the next slide in sequence. If the user has completed
   * all slides, transitions the lesson state to the quiz assessment phase.
   */
  function handleNext() {
    if (!lesson.value) return

    if (currentSlideIndex.value < lesson.value.slides.length - 1) {
      currentSlideIndex.value++
      loadSlidePosition()
    } else {
      phase.value = 'quiz'
      logger.info('[Foundation] All slides complete — entering quiz phase.')
    }
  }

  /**
   * Activates the interactive challenge overlay for the current slide.
   * Reloads the starting position to clear any free exploration moves.
   */
  function activateChallenge() {
    if (!hasChallenge.value) return

    challengeActive.value = true
    loadSlidePosition()
    nextTick(() => {
      challengeActive.value = true
    })
  }

  /**
   * Resets the board to its slide starting state.
   */
  function resetBoard() {
    loadSlidePosition()
  }

  // ─── CHALLENGE VALIDATION ───

  // Watch for board square selections during the exploration story phase to show coordinate toasts.
  watch(() => store.selectedSquare, (sq) => {
    if (sq && phase.value === 'story' && !challengeActive.value) {
      // Show coord overlays on the coordinates lesson, or if globally configured
      if (lessonId === 'found-board' || settingsStore.showCoordinates) {
        uiStore.addToast(`Square: ${sq.toUpperCase()}`, 'info')
      }
    }
  })

  // Watch for moves executed on the board to validate active challenge completion
  watch(() => store.lastMove, (newMove) => {
    if (!newMove || !currentSlide.value?.challenge) return

    const challenge = currentSlide.value.challenge
    // Determine correctness by checking matching starting and ending squares
    const isMoveCorrect = newMove.from === challenge.from && newMove.to === challenge.to

    logger.info(`[Foundation] Validating move: from=${newMove.from}, to=${newMove.to}. Challenge expected: from=${challenge.from}, to=${challenge.to} (isCorrect: ${isMoveCorrect})`)

    if (isMoveCorrect) {
      challengeActive.value = true
      challengeCompleted.value = true
      
      if (challengeRef.value) {
        challengeRef.value.validateMove(newMove.from, newMove.to)
      }

      uiStore.addToast(challenge.successMessage, 'success')
      logger.info('[Foundation] Challenge completed successfully!')

      // Auto-advance to the next slide after a brief completion delay
      setTimeout(() => {
        handleNext()
      }, 1200)
    } else {
      if (challengeActive.value) {
        logger.info('[Foundation] Incorrect move made during active challenge. Shaking and resetting...')
        if (challengeRef.value) {
          challengeRef.value.validateMove(newMove.from, newMove.to)
        }
        
        // Reset board position after a brief display delay to let the shake animation play out
        setTimeout(() => {
          if (currentSlide.value) {
            store.loadPosition(currentSlide.value.fen, 'analysis')
            nextTick(() => {
              challengeActive.value = true
            })
          }
        }, 600)
      }
    }
  }, { deep: true })

  // ─── QUIZ COMPLETION & RETRY STATE ───
  
  const failedScore = ref(0)
  const failedTotal = ref(0)
  const isAlreadyCompleted = ref(false)

  /**
   * Evaluates quiz submission. Checks if score matches the 70% threshold,
   * saves user progress database entries, and handles completion transitions.
   */
  async function handleQuizComplete(score: number) {
    const total = lesson.value?.quiz.length || 0
    const passed = total === 0 || (score / total) >= 0.7

    logger.info(`[Foundation] Quiz complete: ${score}/${total} (Passed: ${passed})`)

    if (passed) {
      phase.value = 'complete'
      if (userStore.profile?.id) {
        await curriculum.completeQuest(userStore.profile.id, lessonId)
      }
    } else {
      failedScore.value = score
      failedTotal.value = total
      phase.value = 'failed'
    }
  }

  /** Resets the quiz state to permit a retry run */
  function retryQuiz() {
    phase.value = 'quiz'
  }

  /** Navigates back to the beginning slides for review */
  function reviewLesson() {
    currentSlideIndex.value = 0
    phase.value = 'story'
    loadSlidePosition()
  }

  /** Router helper to navigate backward or default to the curriculum path map */
  function goBack() {
    if (window.history.state && window.history.state.back) {
      router.back()
    } else {
      router.push('/path')
    }
  }

  onMounted(() => {
    if (!lesson.value) {
      logger.warn(`[Foundation] Lesson not found: ${lessonId}. Redirecting to path.`)
      router.push('/path')
      return
    }

    isAlreadyCompleted.value = curriculum.isQuestCompleted(lessonId)
    loadSlidePosition()
    logger.info(`[Foundation] Loaded lesson: "${lesson.value.title}" (${lesson.value.slides.length} slides)`)
  })

  return {
    lessonId,
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
  }
}
