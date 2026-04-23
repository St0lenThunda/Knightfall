import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useUserStore } from '../stores/userStore'
import { useLibraryStore } from '../stores/libraryStore'
import { TaggingService, type TaggedMistake } from '../services/taggingService'
import { logger } from '../utils/logger'

export interface MistakeNode {
  index: number
  fen: string
  playedMove: string
  bestMove: string
  tag: TaggedMistake
}

/**
 * useReviewSession Composable
 * 
 * Manages the "Fix Your Mistakes" interactive flow.
 * Scans a game for blunders and lets the user re-play them.
 */
export function useReviewSession() {
  const gameStore = useGameStore()
  const userStore = useUserStore()

  const isActive = ref(false)
  const mistakes = ref<MistakeNode[]>([])
  const currentIndex = ref(0)
  const heartsAtStart = ref(5)
  const xpEarned = ref(0)

  const currentMistake = computed(() => mistakes.value[currentIndex.value] || null)
  const progress = computed(() => mistakes.value.length > 0 ? (currentIndex.value / mistakes.value.length) * 100 : 0)

  /**
   * Initializes a review session for the currently loaded game.
   */
  function startReview() {
    if (gameStore.moveHistory.length === 0) return
    
    const nodes: MistakeNode[] = []
    
    // Scan history for mistakes (skipping first 5 moves for theory)
    for (let i = 5; i < gameStore.moveHistory.length; i++) {
      const entry = gameStore.moveHistory[i]
      const prevEntry = gameStore.moveHistory[i - 1]
      
      // We need evals to detect mistakes. 
      // If the game wasn't analyzed yet, this flow might be empty.
      if (entry.eval !== undefined && prevEntry.eval !== undefined) {
        const tag = TaggingService.identifyMistake(
          prevEntry.fen,
          entry.fen,
          prevEntry.eval / 100,
          entry.eval / 100
        )
        
        // We only review "mistakes" and "blunders"
        if (tag && (tag.severity === 'blunder' || tag.severity === 'mistake')) {
          // Check if we have a bestMove in the cache
          const bestMove = gameStore.loadedGameId ? 
            useLibraryStore().gamesMap.get(gameStore.loadedGameId)?.analysisCache?.[prevEntry.fen] : ''

          nodes.push({
            index: i,
            fen: prevEntry.fen,
            playedMove: entry.san,
            bestMove: bestMove || '', 
            tag
          })
        }
      }
    }

    if (nodes.length > 0) {
      mistakes.value = nodes
      currentIndex.value = 0
      isActive.value = true
      heartsAtStart.value = userStore.hearts
      xpEarned.value = 0
      
      // Jump to the first mistake position
      loadCurrentMistake()
    } else {
      logger.info('[Review] No significant mistakes found to review.')
    }
  }

  function loadCurrentMistake() {
    const m = currentMistake.value
    if (m) {
      gameStore.loadPosition(m.fen)
    }
  }

  /**
   * Evaluates the user's attempt at the "Best Move".
   */
  async function submitAttempt(_moveSan: string, isCorrect: boolean) {
    if (isCorrect) {
      xpEarned.value += 10
      userStore.addXP(10)
      
      // Move to next mistake after a delay
      setTimeout(() => {
        if (currentIndex.value < mistakes.value.length - 1) {
          currentIndex.value++
          loadCurrentMistake()
        } else {
          finishReview()
        }
      }, 1500)
    } else {
      // Blundered again!
      userStore.deductHeart()
      if (userStore.hearts <= 0) {
        // Game over for this session
        isActive.value = false
      }
    }
  }

  /**
   * Allows the UI to inject the best move once the engine finds it.
   */
  function updateMistakeBestMove(nodeIndex: number, bestMove: string) {
    const mistake = mistakes.value.find(m => m.index === nodeIndex)
    if (mistake) {
      mistake.bestMove = bestMove
    }
  }

  function finishReview() {
    isActive.value = false
    logger.info(`[Review] Finished. Earned ${xpEarned.value} XP.`)
  }

  return {
    isActive,
    mistakes,
    currentIndex,
    currentMistake,
    progress,
    startReview,
    submitAttempt,
    updateMistakeBestMove,
    finishReview
  }
}
