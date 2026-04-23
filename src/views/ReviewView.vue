<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useUserStore } from '../stores/userStore'
import { useEngineStore } from '../stores/engineStore'
import { useReviewSession } from '../composables/useReviewSession'
import ChessBoard from '../components/ChessBoard.vue'

const store = useGameStore()
const userStore = useUserStore()
const { 
  isActive, 
  currentMistake, 
  progress, 
  startReview, 
  submitAttempt,
  finishReview,
  updateMistakeBestMove
} = useReviewSession()

const engineStore = useEngineStore()
const feedbackMsg = ref('')
const feedbackType = ref<'success' | 'error' | 'info'>('info')
const isAnalyzing = ref(false)

onMounted(() => {
  // Start review automatically if a game is loaded
  if (store.moveHistory.length > 0) {
    startReview()
  } else {
    feedbackMsg.value = "Load a game in the Analysis Lab first to start a review session."
  }
})

// Automatically analyze the current mistake if bestMove is missing
watch(currentMistake, (m) => {
  if (m && !m.bestMove) {
    isAnalyzing.value = true
    engineStore.analyze(m.fen)
  }
}, { immediate: true })

// Catch the engine result and update the mistake
watch(() => engineStore.bestMove, (newBest) => {
  if (newBest && currentMistake.value && !currentMistake.value.bestMove) {
    updateMistakeBestMove(currentMistake.value.index, newBest)
    isAnalyzing.value = false
  }
})

async function handleMove() {
  if (!currentMistake.value) return
  if (isAnalyzing.value) {
    feedbackMsg.value = "Still thinking... please wait for the analysis to finish."
    feedbackType.value = 'info'
    return
  }
  
  const lastMove = store.moveHistory[store.moveHistory.length - 1]
  
  // Convert bestMove (UCI) to SAN for comparison if possible, or just use UCI if that's what we have
  const isCorrect = lastMove.san === currentMistake.value.bestMove || 
                    (lastMove.from + lastMove.to) === currentMistake.value.bestMove
  
  if (isCorrect) {
    feedbackMsg.value = "Perfect! You found the best continuation."
    feedbackType.value = 'success'
    await submitAttempt(lastMove.san, true)
  } else {
    feedbackMsg.value = `Incorrect. You lost a heart! Try again.`
    feedbackType.value = 'error'
    await submitAttempt(lastMove.san, false)
    
    // Reset to mistake position if failed
    if (userStore.hearts > 0) {
      setTimeout(() => {
        store.loadPosition(currentMistake.value!.fen)
      }, 1000)
    }
  }
}
</script>

<template>
  <div class="page review-page container">
    <header class="review-header">
      <div class="header-main">
        <h1 class="title-lg gradient-text">Fix Your Mistakes</h1>
        <p class="text-secondary">Replay critical moments from your recent games.</p>
      </div>

      <div class="stats-row glass">
        <div class="stat-pill hearts" :class="{ empty: userStore.hearts === 0 }">
          <span class="icon">❤️</span> {{ userStore.hearts }}/{{ userStore.maxHearts }}
        </div>
        <div class="stat-pill xp">
          <span class="icon">✨</span> {{ userStore.xp }} XP
        </div>
        <div class="stat-pill streak">
          <span class="icon">🔥</span> {{ userStore.streak }} day streak
        </div>
      </div>
    </header>

    <div v-if="isActive && currentMistake" class="review-layout">
      <div class="board-section">
        <ChessBoard @move="handleMove" />
        
        <div class="progress-bar-wrap">
          <div class="progress-bar-inner" :style="{ width: progress + '%' }"></div>
        </div>
      </div>

      <div class="sidebar-section glass">
        <div class="mistake-info">
          <div class="tag" :class="currentMistake.tag.severity">
            {{ currentMistake.tag.severity.toUpperCase() }}: {{ currentMistake.tag.theme }}
          </div>
          <h3>What's the best move?</h3>
          <p v-if="isAnalyzing" class="thinking-text">
            <span class="spinner-tiny"></span> Calculating optimal continuation...
          </p>
          <p v-else class="text-secondary">
            You blundered in this position. Can you find the correct continuation that maintains the advantage?
          </p>
        </div>

        <div v-if="feedbackMsg" class="feedback-toast" :class="feedbackType">
          {{ feedbackMsg }}
        </div>

        <div class="review-controls">
          <button class="btn btn-ghost" @click="finishReview">Skip Mistake</button>
          <button class="btn btn-primary" @click="finishReview">End Session</button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state glass-card">
      <div class="icon">🏁</div>
      <h2>Review Complete!</h2>
      <p>You've addressed all the critical blunders detected in this game.</p>
      <router-link to="/analysis" class="btn btn-primary">Back to Analysis</router-link>
    </div>
  </div>
</template>

<style scoped>
.review-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  max-width: 1000px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-6);
}

.stats-row {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 800;
  font-size: 0.9rem;
}

.hearts.empty { color: var(--rose); animation: shake 0.5s ease; }

.review-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-8);
  align-items: start;
}

@media (max-width: 850px) {
  .review-layout { grid-template-columns: 1fr; }
}

.board-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.progress-bar-wrap {
  height: 8px;
  background: rgba(255,255,255,0.05);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-inner {
  height: 100%;
  background: var(--accent);
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar-section {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-height: 400px;
}

.mistake-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.tag {
  display: inline-flex;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 800;
  width: fit-content;
}
.tag.blunder { background: rgba(244, 63, 94, 0.2); color: var(--rose); }
.tag.mistake { background: rgba(251, 191, 36, 0.2); color: var(--gold); }

.feedback-toast {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 600;
  animation: slideIn 0.3s ease;
}
.feedback-toast.success { background: rgba(16, 185, 129, 0.2); color: var(--green); border: 1px solid var(--green); }
.feedback-toast.error { background: rgba(244, 63, 94, 0.2); color: var(--rose); border: 1px solid var(--rose); }

.thinking-text {
  font-size: 0.85rem;
  color: var(--accent);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner-tiny {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(139,92,246,0.3);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.review-controls {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.empty-state {
  text-align: center;
  padding: var(--space-12);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
}

.empty-state .icon { font-size: 4rem; }

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
