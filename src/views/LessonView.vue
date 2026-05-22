<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'
import { useUserStore } from '../stores/userStore'
import { useCurriculumStore } from '../stores/curriculumStore'
import { useUiStore } from '../stores/uiStore'
import ChessBoard from '../components/ChessBoard.vue'
import { fetchPuzzleBatch } from '../api/puzzleApi'
import type { Puzzle } from '../api/puzzleApi'
import { logger } from '../utils/logger'
import { Chess } from 'chess.js'

const route = useRoute()
const router = useRouter()
const store = useGameStore()
const userStore = useUserStore()
const curriculum = useCurriculumStore()
const uiStore = useUiStore()

const questId = route.params.id as string
const quest = computed(() => {
  const staticQuest = curriculum.quests.find(q => q.id === questId)
  if (staticQuest) return staticQuest
  return curriculum.personalLessons.find(l => l.id === questId)
})

const puzzles = ref<Puzzle[]>([])
const currentPuzzleIndex = ref(0)
const isExplanationMode = ref(true)
const lessonComplete = ref(false)
const puzzlesSolvedInLesson = ref(0)

const progress = computed(() => {
  if (lessonComplete.value) return 100
  const total = puzzles.value.length || 5
  return (puzzlesSolvedInLesson.value / total) * 100
})

onMounted(async () => {
  if (!quest.value) {
    // If not found, maybe we need to generate them first?
    await curriculum.generatePersonalLessons()
    if (!quest.value) {
      router.push('/path')
      return
    }
  }

  try {
    if (quest.value.puzzles) {
      // Personal lesson already has puzzles
      puzzles.value = quest.value.puzzles
    } else {
      // Fetch 5 puzzles matching the quest's theme/category
      const batch = await fetchPuzzleBatch(quest.value.category.toLowerCase(), 5)
      puzzles.value = batch
    }
    loadCurrentStep()
  } catch (err) {
    logger.error('[Lesson] Failed to load:', err)
  }
})

// Drill progress is now tracked via store.drillIndex
const playerColor = ref<'w' | 'b'>('w')

/**
 * Loads the current puzzle step from the active batch.
 * Resets board positions, configures the user's player color,
 * and sets up the active solution sequence in the gameStore.
 */
function loadCurrentStep() {
  if (currentPuzzleIndex.value >= puzzles.value.length) {
    finishLesson()
    return
  }
  
  const p = puzzles.value[currentPuzzleIndex.value]
  
  // Single Source of Truth (SSOT): The turn of the starting FEN represents the side 
  // that must move, which is the player.
  const tempChess = new Chess(p.fen)
  playerColor.value = tempChess.turn() // e.g., 'w' or 'b'
  
  // Load position into our global gameplay state machine.
  store.loadPosition(p.fen, 'puzzle')
  
  // Set the player's active color.
  store.playerColor = playerColor.value
  
  // Configure the correct solution steps in the board logic.
  if (typeof store.setDrill === 'function') {
    store.setDrill(p.solution)
  } else {
    logger.error('[Lesson] store.setDrill is missing!')
  }
  
  // Force explanation overlay on first load of each puzzle step.
  isExplanationMode.value = true
}

/**
 * Triggers the start of the exercise, removing the explanation card.
 */
function startDrill() {
  isExplanationMode.value = false
}

// --- WATCHERS ---

/**
 * Watcher: gameStore.drillIndex
 * 
 * Monitors the execution of moves in the active puzzle solution.
 * - If the index reaches or exceeds the solution length, the puzzle is successfully resolved.
 * - If the turn shifts to the opponent (odd indices in 0-indexed solutions), triggers the opponent's
 *   response automatically after a realistic delay.
 */
watch(() => store.drillIndex, (newIdx) => {
  const p = puzzles.value[currentPuzzleIndex.value]
  if (!p) return

  const solution = p.solution
  
  // 1. Check if the puzzle is fully completed
  if (newIdx >= solution.length) {
    uiStore.addToast('Correct!', 'success')
    puzzlesSolvedInLesson.value++
    // Wait 1 second for the visual board animation to complete, then load the next puzzle
    setTimeout(() => {
      currentPuzzleIndex.value++
      loadCurrentStep()
    }, 1000)
    return
  }

  // 2. Play the opponent response automatically if it's the opponent's turn.
  // The player moves on even indices (0, 2, ...), so the opponent moves on odd indices (1, 3, ...).
  if (newIdx % 2 !== 0) {
    const nextMove = solution[newIdx]
    setTimeout(() => {
      const from = nextMove.slice(0, 2) as any
      const to = nextMove.slice(2, 4) as any
      const promotion = nextMove[4] || undefined
      store.makeMove(from, to, promotion)
      logger.info(`[Lesson] Opponent played auto-move: ${nextMove}`)
    }, 600) // 600ms delay simulates response time
  }
})

/**
 * Watcher: gameStore.mistakeCount
 * 
 * Listens for failed move attempts. When the user plays an incorrect move,
 * we display an error toast, deduct a heart, and redirect back to the path
 * if they run out of lives.
 */
watch(() => store.mistakeCount, async (newCount, oldCount) => {
  // Only trigger if a new mistake was committed (mistakeCount incremented)
  if (newCount > oldCount) {
    uiStore.addToast('Incorrect. Try again!', 'error')
    const remainingHearts = await userStore.deductHeart()
    
    // Out of lives: send the user back to the Sanctum to recharge
    if (remainingHearts <= 0) {
      logger.info('[Lesson] Out of hearts, redirecting to path.')
      router.push('/path') 
    }
  }
})

/**
 * Marks a quest as complete in the database and user profiles.
 */
async function finishLesson() {
  lessonComplete.value = true
  if (userStore.profile?.id) {
    await curriculum.completeQuest(userStore.profile.id, questId)
  }
}
</script>

<template>
  <div class="page lesson-page container">
    <header class="lesson-header">
      <button class="btn btn-ghost btn-sm" @click="router.push('/path')">← Back</button>
      
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="progress-text">{{ puzzlesSolvedInLesson }} / 5</span>
      </div>

      <div class="hearts-display" :class="{ low: userStore.hearts <= 1 }">
        ❤️ {{ userStore.hearts }}
      </div>
    </header>

    <div v-if="!lessonComplete" class="lesson-layout">
      <div class="board-area">
        <ChessBoard 
          :flipped="playerColor === 'b'" 
          :interactive="!isExplanationMode && store.drillIndex % 2 === 0" 
        />
      </div>

      <div class="content-area glass">
        <Transition name="fade" mode="out-in">
          <div v-if="isExplanationMode" class="explanation-slide">
            <div class="node-meta">
              <span class="icon">{{ quest?.icon }}</span>
              <h2>{{ quest?.title }}</h2>
            </div>
            <p class="text-secondary">
              {{ quest?.category === 'Tactics' ? 'Tactical patterns like this appear frequently in winning games. Find the winning continuation.' : 'Mastering this positional concept will give you a long-term advantage.' }}
            </p>
            <div class="tip glass-xs">
              <strong>Coach's Tip:</strong> Look for unprotected pieces or king safety issues.
            </div>
            <button class="btn btn-primary btn-lg" @click="startDrill">Start Exercise</button>
          </div>
          <div v-else class="drill-info">
            <h3>Find the Best Move</h3>
            <p class="text-secondary">Step {{ currentPuzzleIndex + 1 }} of 5</p>
          </div>
        </Transition>
      </div>
    </div>

    <div v-else class="completion-card glass animated-fade-in">
      <div class="confetti">🎉</div>
      <h1>Lesson Complete!</h1>
      <p>You've mastered <strong>{{ quest?.title }}</strong>.</p>
      
      <div class="rewards-row">
        <div class="reward">
          <span class="val">+{{ quest?.xp_reward }}</span>
          <span class="lbl">XP EARNED</span>
        </div>
        <div class="reward">
          <span class="val">✅</span>
          <span class="lbl">QUEST COMPLETE</span>
        </div>
      </div>

      <button class="btn btn-primary btn-lg" @click="router.push('/path')">Continue Path</button>
    </div>
  </div>
</template>

<style scoped>
.lesson-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  max-width: 1000px;
}

.lesson-header {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.progress-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.progress-bar {
  flex: 1;
  height: 12px;
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.progress-text {
  font-weight: 800;
  font-size: 0.9rem;
  min-width: 40px;
}

.hearts-display {
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--rose);
}
.hearts-display.low { animation: pulse 1s infinite; }

.lesson-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: var(--space-8);
  align-items: start;
}

@media (max-width: 850px) {
  .lesson-layout { grid-template-columns: 1fr; }
}

.content-area {
  padding: var(--space-8);
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.explanation-slide {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.node-meta {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.node-meta .icon {
  font-size: 2.5rem;
  background: rgba(255,255,255,0.05);
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
}

.tip {
  padding: var(--space-4);
  border-left: 3px solid var(--gold);
  font-size: 0.9rem;
}

.completion-card {
  text-align: center;
  padding: var(--space-12);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
}

.completion-card .confetti { font-size: 4rem; }

.rewards-row {
  display: flex;
  gap: var(--space-12);
  margin: var(--space-6) 0;
}

.reward {
  display: flex;
  flex-direction: column;
}

.reward .val { font-size: 2rem; font-weight: 800; color: var(--gold); }
.reward .lbl { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); }

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
