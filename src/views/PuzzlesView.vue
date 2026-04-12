<template>
  <div class="page puzzles-page">
    <div class="puzzles-header">
      <div>
        <h2>⚡ Puzzle Training</h2>
        <p class="muted" style="font-size: 0.9rem;">Targeted by your Weakness DNA</p>
      </div>
      <div class="puzzle-stats">
        <div class="stat-card" style="padding: var(--space-3) var(--space-5);">
          <div class="stat-label">Puzzle Rating</div>
          <div class="stat-value" style="font-size: 1.4rem;">{{ puzzleRating }}</div>
        </div>
        <div class="stat-card" style="padding: var(--space-3) var(--space-5);">
          <div class="stat-label">Streak 🔥</div>
          <div class="stat-value text-gold-gradient" style="font-size: 1.4rem;">{{ streak }}</div>
        </div>
      </div>
    </div>

    <div class="puzzles-layout">
      <!-- Puzzle board -->
      <div class="puzzle-board-area">
        <!-- Category pills -->
        <div class="category-pills">
          <button
            v-for="cat in categories" :key="cat.id"
            class="cat-pill" :class="{ active: activeCat === cat.id }"
            @click="setCat(cat.id)"
          >
            {{ cat.icon }} {{ cat.label }}
          </button>
        </div>

        <!-- Puzzle card -->
        <div class="puzzle-card glass">
          <div class="puzzle-card-header">
            <div>
              <div class="label">Puzzle #{{ puzzle.id }}</div>
              <h3 style="margin-top: 4px;">{{ puzzle.title }}</h3>
            </div>
            <div style="display:flex; gap: var(--space-2); align-items: center;">
              <span class="badge badge-rose">Endgame</span>
              <span class="badge badge-teal">⭐ {{ puzzle.difficulty }}</span>
            </div>
          </div>

          <div class="puzzle-turn-indicator" :class="puzzle.toMove">
            {{ puzzle.toMove === 'white' ? '♔' : '♚' }}
            <span>{{ puzzle.toMove === 'white' ? 'White' : 'Black' }} to move</span>
          </div>

          <!-- Real puzzle board -->
          <div class="puzzle-board-wrapper">
            <ChessBoard :flipped="puzzleColor === 'b'" />
          </div>

          <!-- Feedback -->
          <Transition name="fade-up">
            <div v-if="feedback" class="puzzle-feedback" :class="feedback.type">
              <span class="feedback-icon">{{ feedback.icon }}</span>
              <div>
                <div class="feedback-title">{{ feedback.title }}</div>
                <div class="feedback-msg">{{ feedback.message }}</div>
              </div>
            </div>
          </Transition>

          <!-- Controls -->
          <div class="puzzle-controls">
            <button class="btn btn-ghost btn-sm" @click="showHint" :disabled="hintShown">
              💡 Hint
            </button>
            <button class="btn btn-ghost btn-sm" @click="loadNextPuzzle">
              Skip →
            </button>
            <button class="btn btn-primary btn-sm" @click="loadNextPuzzle" v-if="puzzleSolved">
              Next Puzzle →
            </button>
          </div>
        </div>

        <!-- Hint box -->
        <Transition name="fade-up">
          <div v-if="hintShown" class="hint-box glass-sm">
            <span style="color: var(--gold)">💡 Hint:</span> {{ puzzle.hint }}
          </div>
        </Transition>
      </div>

      <!-- Right: puzzle queue + progress -->
      <div class="puzzle-sidebar">
        <!-- Today's progress -->
        <div class="glass progress-card">
          <div class="card-header">
            <h4>Today's Progress</h4>
          </div>
          <div class="progress-row">
            <span class="muted" style="font-size:0.85rem;">Solved today</span>
            <span style="font-weight: 700;">{{ solvedToday }} / 10</span>
          </div>
          <div class="progress-bar" style="margin-top: var(--space-2);">
            <div class="progress-bar-fill" :style="{ width: (solvedToday * 10) + '%' }"></div>
          </div>

          <div class="xp-bar" style="margin-top: var(--space-5);">
            <div class="progress-row" style="margin-bottom: var(--space-2);">
              <span class="muted" style="font-size:0.85rem;">XP toward next rank</span>
              <span class="badge badge-gold">Tactician</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill" style="width: 63%; background: linear-gradient(90deg, var(--gold), #f59e0b);"></div>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px;">630 / 1000 XP</div>
          </div>
        </div>

        <!-- Puzzle queue -->
        <div class="glass puzzle-queue">
          <div class="card-header"><h4>Up Next</h4></div>
          <div class="queue-list">
            <div v-for="p in queuePuzzles" :key="p.id" class="queue-item">
              <div class="queue-board-thumb">
                <span style="font-size: 1.5rem">♟</span>
              </div>
              <div class="queue-meta">
                <div style="font-weight: 600; font-size:0.88rem;">{{ p.title }}</div>
                <div style="display:flex; gap: var(--space-2); margin-top: 3px;">
                  <span class="badge badge-accent">{{ p.theme }}</span>
                  <span style="font-size:0.75rem; color: var(--text-muted);">⭐ {{ p.difficulty }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Weakness targeting -->
        <div class="glass weakness-target">
          <div class="card-header">
            <h4>🧬 Targeting your weakness</h4>
          </div>
          <p class="muted" style="font-size: 0.82rem; margin-top: var(--space-2);">
            These puzzles are selected based on your <strong style="color: var(--text-primary);">endgame technique</strong> weakness (71% miss rate).
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { fetchRandomPuzzle } from '../api/puzzleApi'
import type { Puzzle } from '../api/puzzleApi'
import { useGameStore } from '../stores/gameStore'
import ChessBoard from '../components/ChessBoard.vue'
import type { Square, PieceSymbol } from 'chess.js'

const store = useGameStore()

const puzzleRating = ref(1124)
const streak = ref(7)
const solvedToday = ref(4)
const activeCat = ref('mixed')
const hintShown = ref(false)
const puzzleSolved = ref(false)
const feedback = ref<{ type: string; icon: string; title: string; message: string } | null>(null)

const categories = [
  { id: 'endgame', icon: '🏁', label: 'Endgame' },
  { id: 'tactics', icon: '⚡', label: 'Tactics' },
  { id: 'opening', icon: '📖', label: 'Opening' },
  { id: 'mixed',   icon: '🎲', label: 'Mixed' },
]

const currentPuzzle = ref<Puzzle | null>(null)
const puzzleColor = computed(() => {
  if (!currentPuzzle.value) return 'w'
  return currentPuzzle.value.fen.split(' ')[1] as 'w' | 'b'
})
const puzzleStep = ref(0)


// Formatter for display
const puzzle = computed(() => ({
  id: currentPuzzle.value?.id || '----',
  title: currentPuzzle.value?.title || 'Loading...',
  difficulty: currentPuzzle.value?.rating || '?',
  toMove: puzzleColor.value === 'w' ? 'white' : 'black',
  hint: 'Look for forced moves or piece targets in ' + (currentPuzzle.value?.category || 'this position')
}))

watch(() => store.moveHistory.length, (newLen, oldLen) => {
  if (newLen > oldLen && currentPuzzle.value && !puzzleSolved.value && store.mode === 'puzzle') {
    // A move was made. Wait, is it the player or computer?
    // If it's the computer's auto-reply, let it pass.
    // The player's move is on even puzzleSteps.
    if (puzzleStep.value % 2 !== 0) return 

    const lastM = store.moveHistory[newLen - 1]
    const uci = lastM.from + lastM.to + (lastM.san.includes('=') ? 'q' : '') // simplified promotion detection
    const expected = currentPuzzle.value.solution[puzzleStep.value]

    // Check against expected move (handle loose promotion matches)
    if (uci === expected || uci.slice(0,4) === expected.slice(0,4)) {
      puzzleStep.value++
      // If end of solution
      if (puzzleStep.value >= currentPuzzle.value.solution.length) {
        puzzleSolved.value = true
        streak.value++
        solvedToday.value++
        puzzleRating.value += 12
        feedback.value = { type: 'correct', icon: '★', title: 'Solved!', message: 'Excellent technique.' }
        store.forceGameOver = true // Stop interaction
      } else {
        feedback.value = { type: 'correct', icon: '✓', title: 'Good move!', message: 'Keep going...' }
        // Opponent auto reply
        const oppMove = currentPuzzle.value.solution[puzzleStep.value]
        setTimeout(() => {
          store.makeMove(oppMove.slice(0,2) as Square, oppMove.slice(2,4) as Square, (oppMove[4] || 'q') as PieceSymbol)
          puzzleStep.value++
        }, 350)
      }
    } else {
      store.undoMove()
      feedback.value = { type: 'wrong', icon: '✗', title: 'Incorrect', message: 'That move loses the advantage.' }
      streak.value = 0
    }
  }
})

function showHint() { hintShown.value = true }

function setCat(id: string) {
  activeCat.value = id
  loadNextPuzzle()
}

async function loadNextPuzzle() {
  feedback.value = null
  puzzleSolved.value = false
  hintShown.value = false
  
  store.forceGameOver = false // ensure pieces are draggable
  currentPuzzle.value = await fetchRandomPuzzle(activeCat.value)
  if (currentPuzzle.value) {
    store.loadPosition(currentPuzzle.value.fen, 'puzzle')
  }
  puzzleStep.value = 0
}

onMounted(() => {
  loadNextPuzzle()
})

const queuePuzzles = [
  { id: 1, title: 'Rook vs King', theme: 'Endgame', difficulty: 1180 },
  { id: 2, title: 'Back Rank Mate', theme: 'Tactics', difficulty: 1050 },
  { id: 3, title: 'Knight Fork!', theme: 'Tactics', difficulty: 1300 },
]
</script>

<style scoped>
.puzzles-page { padding-top: var(--space-6); }
.puzzles-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4);
}
.puzzle-stats { display: flex; gap: var(--space-3); }

.puzzles-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--space-6);
  align-items: start;
}
@media (max-width: 900px) { .puzzles-layout { grid-template-columns: 1fr; } }

/* Categories */
.category-pills { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-4); }
.cat-pill {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 0.82rem;
  font-weight: 600;
  transition: all 0.15s ease;
}
.cat-pill:hover { background: var(--bg-card); }
.cat-pill.active { border-color: var(--accent); background: var(--accent-dim); color: var(--accent-bright); }

/* Puzzle card */
.puzzle-card { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
.puzzle-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; }

.puzzle-turn-indicator {
  display: flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-size: 0.88rem; font-weight: 600;
  width: fit-content;
}
.puzzle-turn-indicator.white { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); }
.puzzle-turn-indicator.black { background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); }

.puzzle-board-wrapper {
  display: flex;
  justify-content: center;
  margin: var(--space-4) 0;
}

/* Feedback */
.puzzle-feedback {
  display: flex; align-items: flex-start; gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid;
}
.puzzle-feedback.correct { background: var(--green-dim); border-color: rgba(16,185,129,0.3); }
.puzzle-feedback.wrong   { background: var(--rose-dim);  border-color: rgba(244,63,94,0.3); }
.feedback-icon { font-size: 1.4rem; }
.feedback-title { font-weight: 700; margin-bottom: 3px; }
.feedback-msg { font-size: 0.85rem; color: var(--text-secondary); }

.puzzle-controls { display: flex; gap: var(--space-2); flex-wrap: wrap; }

.hint-box {
  padding: var(--space-4);
  font-size: 0.9rem;
  color: var(--text-secondary);
  display: flex; gap: var(--space-2);
}

/* Sidebar */
.puzzle-sidebar { display: flex; flex-direction: column; gap: var(--space-4); }
.progress-card, .puzzle-queue, .weakness-target { padding: var(--space-5); }
.progress-row { display: flex; justify-content: space-between; align-items: center; }

.queue-list { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-3); }
.queue-item { display: flex; gap: var(--space-3); align-items: center; }
.queue-board-thumb {
  width: 48px; height: 48px;
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.fade-up-enter-active, .fade-up-leave-active { transition: all 0.25s ease; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(6px); }
</style>
