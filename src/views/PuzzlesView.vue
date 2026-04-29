<template>
  <div class="page puzzles-page">
    <div class="puzzles-header">
      <div>
        <h2>⚡ Siege Trials</h2>
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
            v-for="cat in categories" 
            :key="cat.id"
            class="pill"
            :class="{ active: activeCat === cat.id }"
            @click="setCat(cat.id)"
          >
            {{ cat.label }}
          </button>
        </div>

        <!-- MERCENARY TACTICS (External Sources) -->
        <div class="external-sources glass-sm">
          <div class="sources-header">
            <span class="muted">MERCENARY TACTICS</span>
          </div>
          <div class="sources-actions">
            <button class="btn btn-ghost btn-sm" @click="importLichessDaily">
              <span class="icon">♞</span> Lichess Daily
            </button>
            <button class="btn btn-ghost btn-sm" @click="importChesscomDaily">
              <span class="icon">♟</span> Chess.com Daily
            </button>
          </div>
        </div>

        <!-- Puzzle card -->
        <div class="puzzle-card glass">
          <div class="puzzle-card-header">
            <div>
              <div class="label">Puzzle #{{ puzzle.id }}</div>
              <h3 style="margin-top: 4px;">{{ puzzle.title }}</h3>
            </div>
            <div style="display:flex; gap: var(--space-4); align-items: center;">
              <div v-if="!puzzleSolved" class="puzzle-timer">
                <span class="icon">⏱️</span> {{ timeTakenNow }}s
              </div>
              <span class="badge badge-rose">Endgame</span>
              <span class="badge badge-teal">⭐ {{ puzzle.difficulty }}</span>
            </div>
          </div>

          <div class="puzzle-turn-indicator" :class="puzzle.toMove" style="display:flex; align-items:center; justify-content:space-between;">
            <div>
              {{ puzzle.toMove === 'white' ? '♔' : '♚' }}
              <span>{{ puzzle.toMove === 'white' ? 'White' : 'Black' }} to move</span>
            </div>
            <span v-if="isMatePuzzle" class="badge badge-rose">Mate in {{ movesToSolve }}</span>
            <span v-else class="badge badge-accent">{{ movesToSolve }} Move{{ movesToSolve !== 1 ? 's' : '' }}</span>
          </div>

          <!-- Real puzzle board -->
          <div class="puzzle-board-wrapper">
            <ChessBoard 
              :flipped="puzzleColor === 'b'" 
              :highlights="hintSquares"
              :arrows="hintArrows"
            />
          </div>

          <!-- Controls -->
          <div v-if="puzzleSolved && currentPuzzle?.explanation" class="puzzle-feedback correct" style="margin-top: var(--space-4);">
            <div class="feedback-icon">🎓</div>
            <div>
              <div class="feedback-title">Coach's Insight</div>
              <div class="feedback-msg">{{ currentPuzzle.explanation }}</div>
            </div>
          </div>

          <div class="puzzle-controls">
            <button class="btn btn-ghost btn-sm" @click="showHint" :disabled="puzzleSolved">
              💡 {{ hintLevel === 0 ? 'Hint' : hintLevel === 1 ? 'Show Move' : 'Hint Shown' }}
            </button>
            <button class="btn btn-ghost btn-sm" @click="revealSolution" :disabled="puzzleSolved" title="Viewing the solution awards 0 XP">
              📝 Solution
            </button>
            <button class="btn btn-ghost btn-sm" @click="loadNextPuzzle(true)">
              Skip →
            </button>
            <button class="btn btn-primary btn-sm" @click="loadNextPuzzle(false)" v-if="puzzleSolved">
              Next Puzzle →
            </button>
          </div>
        </div>
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
              <span class="badge badge-gold">{{ userStore.nextTitle || 'Knight' }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill" :style="{ width: userStore.levelProgress + '%', background: 'linear-gradient(90deg, var(--gold), #f59e0b)' }"></div>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px;">
              {{ userStore.xp }} / {{ userStore.xpForNextLevel }} XP
            </div>
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
                  <span class="badge badge-accent">{{ p.category || (p.themes && p.themes[0]) || 'Mixed' }}</span>
                  <span style="font-size:0.75rem; color: var(--text-muted);">⭐ {{ p.rating }}</span>
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
            These puzzles are selected based on your <strong style="color: var(--text-primary);">{{ weakness.label }}</strong> weakness ({{ weakness.missRate }}% miss rate).
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { fetchDailyPuzzle } from '../api/lichessApi'
import { fetchChesscomDailyPuzzle } from '../api/chesscomApi'
import { fetchPuzzleBatch, fetchPuzzleById } from '../api/puzzleApi'
import type { Puzzle } from '../api/puzzleApi'
import { useGameStore } from '../stores/gameStore'
import { useUserStore } from '../stores/userStore'
import { useCoachStore } from '../stores/coachStore'
import { useUiStore } from '../stores/uiStore'
import { useCurriculumStore } from '../stores/curriculumStore'
import ChessBoard from '../components/ChessBoard.vue'
import type { Square, PieceSymbol } from 'chess.js'

const store = useGameStore()
const userStore = useUserStore()
const coachStore = useCoachStore()
const uiStore = useUiStore()

const puzzleRating = computed(() => userStore.profile?.puzzle_rating ?? 1200)
const streak = computed(() => userStore.currentStreak)
const solvedToday = computed(() => userStore.solvedToday)
const activeCat = ref(coachStore.archetypeReport.category || 'mixed')
const hintLevel = ref(0)
const puzzleSolved = ref(false)
const solutionUsed = ref(false)

// Attempt tracking
const puzzleStartTime = ref(Date.now())
const timeTakenNow = ref(0)
const attemptCount = ref(0)

// Timer interval
let timerInterval: any = null
onMounted(() => {
  timerInterval = setInterval(() => {
    if (!puzzleSolved.value) {
      timeTakenNow.value = Math.round((Date.now() - puzzleStartTime.value) / 1000)
    }
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

/**
 * Calculates the XP bonus based on time taken.
 * Lightning: < 5s (+10)
 * Quick: < 15s (+5)
 * Solid: < 30s (+2)
 */
function calculateTimeBonus(seconds: number): { amount: number; label: string } {
  if (seconds < 5) return { amount: 10, label: 'Lightning!' }
  if (seconds < 15) return { amount: 5, label: 'Quick!' }
  if (seconds < 30) return { amount: 2, label: 'Solid.' }
  return { amount: 0, label: '' }
}

const categories = [
  { id: 'endgame', icon: '🏁', label: 'Endgame' },
  { id: 'tactics', icon: '⚡', label: 'Tactics' },
  { id: 'opening', icon: '📖', label: 'Opening' },
  { id: 'Personal Mistake', icon: '🎯', label: 'Mistakes' },
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

const isMatePuzzle = computed(() => {
  return currentPuzzle.value?.themes?.includes('mate') || false
})

const movesToSolve = computed(() => {
  if (!currentPuzzle.value) return 0
  return Math.ceil(currentPuzzle.value.solution.length / 2)
})

const hintSquares = computed(() => {
  if (hintLevel.value < 1 || !currentPuzzle.value) return []
  const expected = currentPuzzle.value.solution[puzzleStep.value]
  if (!expected) return []
  return [expected.slice(0, 2)]
})

const hintArrows = computed(() => {
  if (hintLevel.value < 2 || !currentPuzzle.value) return []
  const expected = currentPuzzle.value.solution[puzzleStep.value]
  if (!expected) return []
  return [{ from: expected.slice(0, 2), to: expected.slice(2, 4), type: 'suggestion' as const }]
})

watch(() => store.moveHistory.length, (newLen, oldLen) => {
  if (newLen > oldLen && currentPuzzle.value && !puzzleSolved.value && store.mode === 'puzzle') {
    const lastM = store.moveHistory[newLen - 1]
    const uci = lastM.from + lastM.to + (lastM.san.includes('=') ? 'q' : '') 
    const expected = currentPuzzle.value.solution[puzzleStep.value]

    // Check if the made move matches what we expected for this step
    if (uci === expected || uci.slice(0,4) === expected.slice(0,4)) {
      puzzleStep.value++
      
        // Check if end of solution
        if (puzzleStep.value >= currentPuzzle.value.solution.length) {
          if (puzzleSolved.value) return // Guard against double submission
          puzzleSolved.value = true
          hintLevel.value = 0
          
          const timeTaken = Math.round((Date.now() - puzzleStartTime.value) / 1000)
          const bonus = calculateTimeBonus(timeTaken)
          
          userStore.submitPuzzleAttempt(
            currentPuzzle.value.id,
            true,
            Math.max(1, attemptCount.value),
            timeTaken,
            hintLevel.value,
            currentPuzzle.value.themes || []
          )

          // Award bonus XP only if solution was NOT used
          if (!solutionUsed.value) {
            userStore.addXP(15) // Base XP
            if (bonus.amount > 0) userStore.addXP(bonus.amount)
            uiStore.addToast(`Solved! +15 XP ${bonus.amount > 0 ? `+ ${bonus.amount} ${bonus.label}` : ''}`, 'success')
          } else {
            uiStore.addToast(`Learned! (0 XP awarded for viewing solution)`, 'info')
          }
          
          store.forceGameOver = true 
        } else {
          // If it's the opponent's turn to respond, play the move automatically
          if (puzzleStep.value % 2 !== 0) {
            hintLevel.value = 0
            uiStore.addToast('Good move! Keep going...', 'info', 2000)
            
            const oppMove = currentPuzzle.value.solution[puzzleStep.value]
            setTimeout(() => {
              if (!puzzleSolved.value) {
                store.makeMove(oppMove.slice(0,2) as Square, oppMove.slice(2,4) as Square, (oppMove[4] || 'q') as PieceSymbol)
              }
            }, 400)
          }
        }
    } else {
      // If it's the player's turn to guess, and they guessed wrong, bounce the piece back.
      if (puzzleStep.value % 2 === 0) {
        store.undoMove()
        attemptCount.value++
        uiStore.addToast('Incorrect. That move loses the advantage.', 'error')
      }
    }
  }
})

function showHint() { 
  if (hintLevel.value >= 2 || puzzleSolved.value) return
  hintLevel.value++
  if (hintLevel.value === 1) {
    uiStore.addToast('💡 Hint: ' + puzzle.value.hint, 'warning', 6000)
  }
}

const queuePuzzles = ref<Puzzle[]>([])
const weakness = computed(() => coachStore.archetypeReport)

async function revealSolution() {
  if (!currentPuzzle.value || puzzleSolved.value) return
  
  solutionUsed.value = true
  
  const playRemaining = async () => {
    // Only continue if not solved and it's our turn (even step)
    // The watch handles the opponent's reply (odd steps)
    if (!currentPuzzle.value || puzzleSolved.value) return
    
    if (puzzleStep.value % 2 === 0) {
      const expected = currentPuzzle.value.solution[puzzleStep.value]
      if (expected) {
        store.makeMove(expected.slice(0,2) as Square, expected.slice(2,4) as Square, (expected[4] || 'q') as PieceSymbol)
      }
    }
    
    // If not solved, wait and check again
    if (!puzzleSolved.value) {
      setTimeout(playRemaining, 800)
    }
  }

  uiStore.addToast('Oracle revealing the path...', 'info')
  playRemaining()
}

async function setCat(id: string) {
  activeCat.value = id
  await nextPuzzle()
}

async function importLichessDaily() {
  const data = await fetchDailyPuzzle()
  if (data) {
    const puzzle: Puzzle = {
      id: `lichess-${data.puzzle.id}`,
      title: 'Lichess Daily Puzzle',
      rating: data.puzzle.rating,
      themes: data.puzzle.themes,
      fen: data.game.fen,
      lastMove: data.puzzle.initialMove,
      solution: data.puzzle.solution,
      category: 'External'
    }
    currentPuzzle.value = puzzle
    activeCat.value = 'mixed'
    // The board will react to currentPuzzle changes
  }
}

async function importChesscomDaily() {
  const data = await fetchChesscomDailyPuzzle()
  if (data) {
    const puzzle: Puzzle = {
      id: `chesscom-daily`,
      title: 'Chess.com Daily Puzzle',
      rating: 1500,
      themes: ['Daily Challenge'],
      fen: data.fen,
      lastMove: '', 
      solution: [], 
      category: 'External'
    }
    currentPuzzle.value = puzzle
    activeCat.value = 'mixed'
  }
}

async function nextPuzzle() {
  queuePuzzles.value = [] // clear queue to fetch new category
  loadNextPuzzle()
}

async function loadNextPuzzle(skipped = false) {
  const curriculumStore = useCurriculumStore()
  
  // If skipping an incomplete puzzle, record the failed attempt
  if (skipped && currentPuzzle.value && !puzzleSolved.value) {
    const timeTaken = Math.round((Date.now() - puzzleStartTime.value) / 1000)
    userStore.submitPuzzleAttempt(
      currentPuzzle.value.id,
      false,
      Math.max(1, attemptCount.value),
      timeTaken,
      hintLevel.value,
      currentPuzzle.value.themes || []
    )
  }

  puzzleSolved.value = false
  solutionUsed.value = false
  hintLevel.value = 0
  attemptCount.value = 0
  store.forceGameOver = false
  
  if (queuePuzzles.value.length === 0) {
    // Check Personal Puzzles first if in that mode
    if (activeCat.value === 'Personal Mistake') {
      if (curriculumStore.personalPuzzles.length === 0) {
        await curriculumStore.generatePersonalPuzzles()
      }
      queuePuzzles.value = [...curriculumStore.personalPuzzles]
    }

    // Check Spaced Repetition Queue next
    if (queuePuzzles.value.length === 0) {
      const now = new Date()
      const queue = userStore.puzzleQueue || []
      const due = queue
        .filter(q => new Date(q.next_review) <= now)
        .sort((a, b) => new Date(a.next_review).getTime() - new Date(b.next_review).getTime())
        .slice(0, 10)

      if (due.length > 0) {
        uiStore.addToast(`Loading ${due.length} review puzzles...`, 'info')
        for (const item of due) {
          const p = await fetchPuzzleById(item.puzzle_id)
          if (p) queuePuzzles.value.push(p)
        }
      }
    }

    // Still empty? Fetch from batch
    if (queuePuzzles.value.length === 0) {
      queuePuzzles.value = await fetchPuzzleBatch(activeCat.value, 4)
    }
  }
  
  currentPuzzle.value = queuePuzzles.value.shift() || null
  if (currentPuzzle.value) {
    store.loadPosition(currentPuzzle.value.fen, 'puzzle')
  }
  puzzleStep.value = 0
  puzzleStartTime.value = Date.now()

  // Refill batch if low and NOT in personal/review mode
  if (queuePuzzles.value.length < 3 && activeCat.value !== 'Personal Mistake') {
    const more = await fetchPuzzleBatch(activeCat.value, 3)
    queuePuzzles.value.push(...more)
  }
}

onMounted(() => {
  loadNextPuzzle()
})
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
.category-pills {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}

.external-sources {
  padding: var(--space-3) var(--space-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  border-radius: var(--radius-lg);
}

.sources-header { font-weight: 800; font-size: 0.7rem; letter-spacing: 0.1em; }
.sources-actions { display: flex; gap: var(--space-2); }

.puzzle-card {
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

.puzzle-timer {
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: 4px;
}

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
