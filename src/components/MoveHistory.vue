<template>
  <div class="move-history">
    <div class="history-header" v-if="!hideHeader">
      <div class="header-main">
        <span class="label">Move History</span>
        <div class="accuracy-summary" v-if="store.moveHistory.length > 4">
          <span class="w">W: {{ accuracy.white }}%</span>
          <span class="divider">|</span>
          <span class="b">B: {{ accuracy.black }}%</span>
        </div>
      </div>
      <div class="nav-controls">
        <button class="btn btn-icon" @click="store.goToMove(0)" :disabled="store.moveHistory.length === 0" title="First">⏮</button>
        <button class="btn btn-icon" @click="store.stepBack()" :disabled="store.moveHistory.length === 0" title="Back">◀</button>
        <button class="btn btn-icon" @click="store.stepForward()" :disabled="store.viewIndex === -1" title="Forward">▶</button>
        <button class="btn btn-icon" @click="goToEnd()" :disabled="store.viewIndex === -1" title="Last">⏭</button>
      </div>
    </div>

    <div class="moves-list" ref="listEl">
      <div v-if="store.moveHistory.length === 0" class="empty-state">
        <span class="muted">No moves yet. Make your first move!</span>
      </div>
      <div
        v-for="(pair, i) in movePairs"
        :key="i"
        class="move-pair"
      >
        <span class="move-num">{{ i + 1 }}.</span>
        
        <!-- White Move -->
        <div class="move-container">
          <button
            class="move-btn"
            :class="[
              { active: isActive(i * 2) },
              getMoveQuality(pair[0], i * 2).label
            ]"
            @click="store.goToMove(i * 2)"
          >
            <span v-if="pair[0].isCapture" class="cap-dot">×</span>
            {{ pair[0].san }}
            <span v-if="pair[0].isCheck" class="check-badge">+</span>
            <span class="quality-icon" :title="getMoveQuality(pair[0], i * 2).label">
              {{ getMoveQuality(pair[0], i * 2).icon }}
            </span>
          </button>
          <span class="move-eval" :class="getEvalColor(pair[0])">
            {{ formatEval(pair[0].eval) }}
          </span>
        </div>

        <!-- Black Move -->
        <div v-if="pair[1]" class="move-container">
          <button
            class="move-btn"
            :class="[
              { active: isActive(i * 2 + 1) },
              getMoveQuality(pair[1], i * 2 + 1).label
            ]"
            @click="store.goToMove(i * 2 + 1)"
          >
            <span v-if="pair[1].isCapture" class="cap-dot">×</span>
            {{ pair[1].san }}
            <span v-if="pair[1].isCheck" class="check-badge">+</span>
            <span class="quality-icon" :title="getMoveQuality(pair[1], i * 2 + 1).label">
              {{ getMoveQuality(pair[1], i * 2 + 1).icon }}
            </span>
          </button>
          <span class="move-eval" :class="getEvalColor(pair[1])">
            {{ formatEval(pair[1].eval) }}
          </span>
        </div>
        <span v-else class="move-btn" style="opacity:0; pointer-events:none">...</span>
      </div>
    </div>

    <!-- Game result -->
    <Transition name="fade-up">
      <div v-if="store.isGameOver" class="game-result">
        <div class="result-badge">
          {{ store.gameResult }}
        </div>
        <div class="result-text">
          {{ resultText }}
        </div>
        <button class="btn btn-primary btn-sm" @click="store.newGame(store.mode)">New Game</button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useGameStore } from '../stores/gameStore'

const store = useGameStore()
const listEl = ref<HTMLElement | null>(null)

const props = defineProps<{
  hideHeader?: boolean
}>()

const movePairs = computed(() => {
  const pairs = []
  for (let i = 0; i < store.moveHistory.length; i += 2) {
    pairs.push([store.moveHistory[i], store.moveHistory[i + 1]].filter(Boolean))
  }
  return pairs
})

function isActive(index: number) {
  if (store.viewIndex === -1) return index === store.moveHistory.length - 1
  return index === store.viewIndex
}

function goToEnd() {
  store.viewIndex = -1
  if (store.moveHistory.length > 0) {
    store.chess.load(store.moveHistory[store.moveHistory.length - 1].fen)
  }
}

const resultText = computed(() => {
  if (store.isCheckmate) return store.turn === 'w' ? 'Black wins by checkmate' : 'White wins by checkmate'
  if (store.isStalemate) return 'Draw by stalemate'
  if (store.isDraw) return 'Draw'
  return 'Game over'
})

watch(() => store.moveHistory.length, async () => {
  await nextTick()
  if (listEl.value) {
    listEl.value.scrollTop = listEl.value.scrollHeight
  }
})

// Deterministic seed placeholder for future use if needed
// const gameSeed = computed(() => ...)

function getMoveQuality(move: any, index: number) {
  // Priority 1: If the store already has a tag from real analysis, use it
  if (move.tag) {
    const s = move.tag.severity
    if (s === 'blunder') return { label: 'blunder', icon: '??', color: 'var(--rose)' }
    if (s === 'mistake') return { label: 'mistake', icon: '?', color: 'var(--orange)' }
    if (s === 'inaccuracy') return { label: 'inaccuracy', icon: '?!', color: 'var(--gold)' }
  }

  // Priority 2: Use real eval data if available
  const allMoves = store.moveHistory
  if (move.eval !== undefined && index > 0) {
    const prevMove = allMoves[index - 1]
    if (prevMove?.eval !== undefined) {
      const evalDelta = Math.abs(move.eval - prevMove.eval)
      if (evalDelta >= 2.5) return { label: 'blunder', icon: '??', color: 'var(--rose)' }
      if (evalDelta >= 1.0) return { label: 'mistake', icon: '?!', color: 'var(--orange)' }
      if (evalDelta >= 0.4) return { label: 'inaccuracy', icon: '?', color: 'var(--gold)' }
      if (evalDelta <= 0.05) return { label: 'best', icon: '★', color: 'var(--teal)' }
      if (evalDelta <= 0.15) return { label: 'great', icon: '!!', color: 'var(--teal)' }
      if (evalDelta <= 0.3) return { label: 'good', icon: '✓', color: 'var(--accent)' }
      return { label: 'book', icon: '📖', color: 'var(--accent)' }
    }
  }

  // Fallback: No eval data — neutral label
  return { label: 'book', icon: '📖', color: 'var(--accent)' }
}

const accuracy = computed(() => {
  if (store.moveHistory.length < 4) return { white: 0, black: 0 }
  
  const calc = (moves: any[]) => {
    if (moves.length === 0) return 0
    let score = 100
    moves.forEach((m, idx) => {
      const q = getMoveQuality(m, idx * 2)
      if (q.label === 'inaccuracy') score -= 5
      if (q.label === 'mistake') score -= 15
      if (q.label === 'blunder') score -= 30
      if (q.label === 'best' || q.label === 'great') score += 2
    })
    return Math.min(100, Math.max(0, Math.round(score)))
  }
  
  const whiteMoves = store.moveHistory.filter((_, i) => i % 2 === 0)
  const blackMoves = store.moveHistory.filter((_, i) => i % 2 !== 0)
  
  return {
    white: calc(whiteMoves),
    black: calc(blackMoves)
  }
})

function formatEval(ev: number | undefined) {
  if (ev === undefined) return ''
  const sign = ev > 0 ? '+' : ''
  return `${sign}${ev.toFixed(1)}`
}

function getEvalColor(move: any) {
  const ev = move.eval
  if (ev === undefined) return ''
  if (ev > 1.5) return 'winning'
  if (ev < -1.5) return 'losing'
  return 'equal'
}
</script>

<style scoped>
.move-history {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: var(--space-4);
}
.header-main {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex: 1;
}

.accuracy-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  background: var(--bg-elevated);
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
}
.accuracy-summary .divider { opacity: 0.3; }
.accuracy-summary .w { color: var(--text-primary); }
.accuracy-summary .b { color: var(--text-muted); }

.nav-controls { display: flex; gap: 2px; }

.moves-list {
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.empty-state {
  padding: var(--space-6) 0;
  text-align: center;
  font-size: 0.85rem;
}

.move-pair {
  display: grid;
  grid-template-columns: 28px 1fr 1fr;
  gap: 4px;
  align-items: center;
}

.move-num {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: right;
}

.move-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
  text-align: left;
}
.move-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }
.move-btn.active { background: var(--accent-dim); color: var(--accent-bright); font-weight: 700; }

/* Move Quality Colors */
.move-btn.great .quality-icon { color: var(--teal); font-weight: 900; background: rgba(16, 185, 129, 0.2); }
.move-btn.best .quality-icon { color: var(--teal); background: rgba(16, 185, 129, 0.1); }
.move-btn.inaccuracy .quality-icon { color: var(--gold); background: rgba(245, 158, 11, 0.1); }
.move-btn.mistake .quality-icon { color: var(--orange); background: rgba(249, 115, 22, 0.1); }
.move-btn.blunder .quality-icon { color: var(--rose); font-weight: 900; background: rgba(244, 63, 94, 0.2); }

.move-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.quality-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 900;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.move-eval {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  padding: 1px 4px;
  border-radius: 3px;
  min-width: 32px;
  text-align: center;
  background: var(--bg-elevated);
}
.move-eval.winning { color: var(--teal); background: rgba(16, 185, 129, 0.1); }
.move-eval.losing { color: var(--rose); background: rgba(244, 63, 94, 0.1); }
.move-eval.equal { color: var(--text-muted); }

.cap-dot { color: var(--rose); font-weight: 700; font-size: 0.9rem; }
.check-badge { color: var(--gold); font-weight: 800; }

.game-result {
  padding: var(--space-4);
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  text-align: center;
  flex-shrink: 0;
}
.result-badge {
  font-size: 1.5rem;
  font-weight: 800;
  font-family: var(--font-mono);
  background: linear-gradient(135deg, var(--gold), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.result-text { font-size: 0.85rem; color: var(--text-secondary); }

.fade-up-enter-active, .fade-up-leave-active { transition: all 0.3s ease; }
.fade-up-enter-from { opacity: 0; transform: translateY(8px); }
</style>
