<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'
import { useUserStore } from '../stores/userStore'
import { useCurriculumStore } from '../stores/curriculumStore'
import { useUiStore } from '../stores/uiStore'
import ChessBoard from '../components/ChessBoard.vue'
import { fetchPuzzleBatch } from '../api/puzzleApi'
import type { Puzzle } from '../api/puzzleApi'
import { logger } from '../utils/logger'

const route = useRoute()
const router = useRouter()
const store = useGameStore()
const userStore = useUserStore()
const curriculum = useCurriculumStore()
const uiStore = useUiStore()

const nodeId = route.params.id as string
const node = computed(() => curriculum.nodes.find(n => n.id === nodeId))

const puzzles = ref<Puzzle[]>([])
const currentPuzzleIndex = ref(0)
const isExplanationMode = ref(true)
const lessonComplete = ref(false)
const puzzlesSolvedInLesson = ref(0)

const progress = computed(() => {
  if (lessonComplete.value) return 100
  return (puzzlesSolvedInLesson.value / 5) * 100
})

onMounted(async () => {
  if (!node.value) {
    router.push('/path')
    return
  }

  try {
    // Fetch 5 puzzles matching the node's theme/category
    const batch = await fetchPuzzleBatch(node.value.category.toLowerCase(), 5)
    puzzles.value = batch
    loadCurrentStep()
  } catch (err) {
    logger.error('[Lesson] Failed to load:', err)
  }
})

function loadCurrentStep() {
  if (currentPuzzleIndex.value >= puzzles.value.length) {
    finishLesson()
    return
  }
  
  const p = puzzles.value[currentPuzzleIndex.value]
  store.loadPosition(p.fen)
  isExplanationMode.value = true // Show intro for each puzzle or just the first one?
}

function startDrill() {
  isExplanationMode.value = false
}

async function handleMove() {
  if (isExplanationMode.value) return
  
  const p = puzzles.value[currentPuzzleIndex.value]
  const lastM = store.moveHistory[store.moveHistory.length - 1]
  const uci = lastM.from + lastM.to
  
  if (uci === p.solution[0].slice(0, 4)) {
    uiStore.addToast('Correct!', 'success')
    puzzlesSolvedInLesson.value++
    
    setTimeout(() => {
      currentPuzzleIndex.value++
      loadCurrentStep()
    }, 1500)
  } else {
    uiStore.addToast('Incorrect. Try again!', 'error')
    userStore.deductHeart()
    
    if (userStore.hearts <= 0) {
      router.push('/path') // Out of hearts
    } else {
      setTimeout(() => {
        store.loadPosition(p.fen)
      }, 1000)
    }
  }
}

async function finishLesson() {
  lessonComplete.value = true
  if (userStore.profile?.id) {
    await curriculum.completeNode(userStore.profile.id, nodeId)
    userStore.addXP(node.value?.xp_reward || 50)
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
        <ChessBoard @move="handleMove" />
      </div>

      <div class="content-area glass">
        <Transition name="fade" mode="out-in">
          <div v-if="isExplanationMode" class="explanation-slide">
            <div class="node-meta">
              <span class="icon">{{ node?.icon }}</span>
              <h2>{{ node?.title }}</h2>
            </div>
            <p class="text-secondary">
              {{ node?.category === 'Tactics' ? 'Tactical patterns like this appear frequently in winning games. Find the winning continuation.' : 'Mastering this positional concept will give you a long-term advantage.' }}
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
      <p>You've mastered <strong>{{ node?.title }}</strong>.</p>
      
      <div class="rewards-row">
        <div class="reward">
          <span class="val">+{{ node?.xp_reward }}</span>
          <span class="lbl">XP EARNED</span>
        </div>
        <div class="reward">
          <span class="val">✅</span>
          <span class="lbl">SKILL UNLOCKED</span>
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
