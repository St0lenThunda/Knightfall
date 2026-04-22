<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Square, PieceSymbol } from 'chess.js'
import { useGameStore } from '../stores/gameStore'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'
import { fetchDailyGauntlet, Puzzle } from '../api/puzzleApi'
import ChessBoard from '../components/ChessBoard.vue'

const store = useGameStore()
const userStore = useUserStore()
const uiStore = useUiStore()

// Gauntlet State
const puzzles = ref<Puzzle[]>([])
const currentIndex = ref(0)
const puzzleSolved = ref(false)
const puzzleStep = ref(0)
const timer = ref(0)
const isFinished = ref(false)
const isLoading = ref(true)
const processingMove = ref(false) // Guard against recursive updates
let timerInterval: any = null

const currentPuzzle = computed(() => puzzles.value[currentIndex.value] || null)
const progress = computed(() => ((currentIndex.value) / 5) * 100)

const arrows = computed(() => {
  if (!currentPuzzle.value) return []
  return []
})

async function startGauntlet() {
  isLoading.value = true
  const daily = await fetchDailyGauntlet()
  puzzles.value = daily
  currentIndex.value = 0
  isFinished.value = false
  timer.value = 0
  
  await nextTick()
  loadPuzzle(0)
  
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (!isFinished.value && !isLoading.value) timer.value++
  }, 1000)
  
  isLoading.value = false
}

function loadPuzzle(index: number) {
  const p = puzzles.value[index]
  if (!p) return
  
  puzzleSolved.value = false
  puzzleStep.value = 0
  processingMove.value = false
  store.loadPosition(p.fen, 'puzzle')
  store.forceGameOver = false
}

watch(() => store.moveHistory.length, (newLen, oldLen) => {
  // Only process if the history grew, we have a puzzle, and we aren't already solved or processing
  if (newLen > oldLen && currentPuzzle.value && !puzzleSolved.value && !isFinished.value && !processingMove.value) {
    const lastM = store.moveHistory[newLen - 1]
    const uci = lastM.from + lastM.to + (lastM.san.includes('=') ? 'q' : '') 
    const expected = currentPuzzle.value.solution[puzzleStep.value]

    if (uci === expected || uci.slice(0,4) === expected.slice(0,4)) {
      puzzleStep.value++
      
      // Check if puzzle is complete
      if (puzzleStep.value >= currentPuzzle.value.solution.length) {
        handlePuzzleSolved()
      } else {
        // Opponent's turn to respond
        if (puzzleStep.value % 2 !== 0) {
          const oppMove = currentPuzzle.value.solution[puzzleStep.value]
          processingMove.value = true
          setTimeout(() => {
            store.makeMove(oppMove.slice(0,2) as Square, oppMove.slice(2,4) as Square, (oppMove[4] || 'q') as PieceSymbol)
            processingMove.value = false
          }, 400)
        }
      }
    } else {
      // Wrong move
      if (puzzleStep.value % 2 === 0) {
        processingMove.value = true
        store.undoMove()
        uiStore.addToast('Incorrect. Accuracy is key in the Gauntlet.', 'error')
        nextTick(() => { processingMove.value = false })
      }
    }
  }
})

function handlePuzzleSolved() {
  if (puzzleSolved.value) return
  puzzleSolved.value = true
  
  uiStore.addToast(`Puzzle ${currentIndex.value + 1}/5 Solved!`, 'success')
  
  setTimeout(() => {
    if (currentIndex.value < 4) {
      currentIndex.value++
      loadPuzzle(currentIndex.value)
    } else {
      finishGauntlet()
    }
  }, 800)
}

function finishGauntlet() {
  isFinished.value = true
  clearInterval(timerInterval)
  
  const today = new Date().toISOString().split('T')[0]
  userStore.submitGauntletResult(today, timer.value)
  uiStore.addToast(`🔥 Gauntlet Completed in ${timer.value}s!`, 'success', 10000)
}

const formatTime = (s: number) => {
  const mins = Math.floor(s / 60)
  const secs = s % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

onMounted(() => {
  startGauntlet()
})

onUnmounted(() => {
  clearInterval(timerInterval)
})
</script>

<template>
  <div class="gauntlet-page container">
    <div class="gauntlet-header">
      <div class="header-main">
        <h1 class="title-lg gradient-text">Daily Gauntlet</h1>
        <p class="text-secondary">5 puzzles. One shot at glory. Every day.</p>
      </div>
      
      <div class="gauntlet-stats" v-if="!isLoading">
        <div class="stat-card timer" :class="{ 'pulse': !isFinished }">
          <span class="icon">⏱️</span>
          <span class="value">{{ formatTime(timer) }}</span>
        </div>
        <div class="stat-card streak">
          <span class="icon">🔥</span>
          <span class="value">{{ userStore.currentStreak }} Day Streak</span>
        </div>
      </div>
    </div>

    <div class="gauntlet-progress-bar">
      <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      <div class="progress-markers">
        <div v-for="i in 5" :key="i" class="marker" :class="{ active: currentIndex >= i-1, current: currentIndex === i-1 }">
          {{ i }}
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Fetching today's challenge...</p>
    </div>

    <div v-else-if="isFinished" class="finish-screen glass-card">
      <div class="trophy">🏆</div>
      <h2 class="title-xl">Gauntlet Conquered!</h2>
      <p class="final-time">Final Time: <strong>{{ formatTime(timer) }}</strong></p>
      
      <div class="stats-grid">
        <div class="stat-box">
          <label>Today's Rank</label>
          <div class="val">#--</div>
        </div>
        <div class="stat-box">
          <label>Avg Time/Puzzle</label>
          <div class="val">{{ (timer / 5).toFixed(1) }}s</div>
        </div>
      </div>

      <router-link to="/" class="btn btn-primary">Return Home</router-link>
    </div>

    <div v-else class="gauntlet-layout">
      <div class="board-container glass-card">
        <ChessBoard 
          :arrows="arrows"
          @move="(m) => store.makeMove(m.from, m.to, m.promotion)"
        />
        <div class="turn-label" :class="store.turn === 'w' ? 'white' : 'black'">
          {{ store.turn === 'w' ? "White to Move" : "Black to Move" }}
        </div>
      </div>

      <div class="info-sidebar">
        <div class="puzzle-info glass-card">
          <h3 class="title-sm">Current Puzzle</h3>
          <p class="puzzle-title">{{ currentPuzzle?.title }}</p>
          <div class="puzzle-meta">
            <span class="rating">⭐ {{ currentPuzzle?.rating }}</span>
            <span class="category">{{ currentPuzzle?.category }}</span>
          </div>
        </div>

        <div class="gauntlet-rules glass-card">
          <h3 class="title-sm">The Rules</h3>
          <ul class="rules-list">
            <li>No hints allowed in the Gauntlet.</li>
            <li>Inaccurate moves reset the current puzzle.</li>
            <li>The clock stops when the final puzzle is solved.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gauntlet-page { padding-top: var(--space-8); padding-bottom: var(--space-12); }

.gauntlet-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: var(--space-8); flex-wrap: wrap; gap: var(--space-6);
}

.gauntlet-stats { display: flex; gap: var(--space-4); }
.stat-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-lg);
  display: flex; align-items: center; gap: var(--space-3);
}
.stat-card .value { font-weight: 700; font-family: var(--font-mono); font-size: 1.1rem; }
.timer.pulse { border-color: var(--accent); box-shadow: 0 0 15px var(--accent-dim); animation: pulse 2s infinite; }

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.8; }
  100% { opacity: 1; }
}

/* Progress Bar */
.gauntlet-progress-bar {
  height: 6px; background: var(--bg-elevated); border-radius: var(--radius-full);
  margin-bottom: var(--space-10); position: relative;
}
.progress-fill {
  height: 100%; background: var(--accent-gradient); border-radius: var(--radius-full);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.progress-markers {
  position: absolute; top: 50%; left: 0; width: 100%;
  transform: translateY(-50%); display: flex; justify-content: space-between;
}
.marker {
  width: 24px; height: 24px; background: var(--bg-elevated); border: 2px solid var(--border);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; color: var(--text-secondary);
  transition: all 0.3s ease;
}
.marker.active { border-color: var(--accent); color: var(--text-primary); }
.marker.current { background: var(--accent); border-color: var(--accent); color: white; transform: scale(1.2); }

/* Layout */
.gauntlet-layout {
  display: grid; grid-template-columns: 1fr 320px; gap: var(--space-8); align-items: start;
}
@media (max-width: 1000px) { .gauntlet-layout { grid-template-columns: 1fr; } }

.board-container { padding: var(--space-6); display: flex; flex-direction: column; align-items: center; gap: var(--space-6); }
.turn-label {
  padding: var(--space-2) var(--space-6); border-radius: var(--radius-full);
  font-weight: 700; font-size: 0.9rem; letter-spacing: 0.05em; text-transform: uppercase;
}
.turn-label.white { background: white; color: black; }
.turn-label.black { background: #1a1a1a; color: white; border: 1px solid var(--border); }

/* Sidebar */
.info-sidebar { display: flex; flex-direction: column; gap: var(--space-6); }
.puzzle-info, .gauntlet-rules { padding: var(--space-6); }
.puzzle-title { font-weight: 700; margin: var(--space-2) 0; font-size: 1.1rem; }
.puzzle-meta { display: flex; gap: var(--space-3); font-size: 0.85rem; color: var(--text-secondary); }
.rules-list { margin-top: var(--space-3); padding-left: var(--space-4); color: var(--text-secondary); font-size: 0.88rem; line-height: 1.6; }

/* Finish Screen */
.finish-screen {
  max-width: 600px; margin: 0 auto; padding: var(--space-12); text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: var(--space-6);
}
.trophy { font-size: 5rem; animation: bounce 2s infinite; }
.final-time { font-size: 1.5rem; }
.final-time strong { color: var(--accent-bright); }
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); width: 100%; margin: var(--space-4) 0; }
.stat-box { background: var(--bg-elevated); padding: var(--space-5); border-radius: var(--radius-lg); border: 1px solid var(--border); }
.stat-box label { display: block; font-size: 0.8rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: var(--space-1); }
.stat-box .val { font-size: 1.8rem; font-weight: 800; font-family: var(--font-mono); }

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.loading-state { text-align: center; padding: var(--space-12); }
.spinner {
  width: 40px; height: 40px; border: 4px solid var(--border); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto var(--space-4);
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
