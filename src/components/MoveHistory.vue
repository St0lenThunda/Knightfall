<template>
  <div class="move-history">
    <div class="history-header">
      <span class="label">Move History</span>
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
        <button
          class="move-btn"
          :class="{ active: isActive(i * 2) }"
          @click="store.goToMove(i * 2)"
        >
          <span v-if="pair[0].isCapture" class="cap-dot">×</span>
          {{ pair[0].san }}
          <span v-if="pair[0].isCheck" class="check-badge">+</span>
        </button>
        <button
          v-if="pair[1]"
          class="move-btn"
          :class="{ active: isActive(i * 2 + 1) }"
          @click="store.goToMove(i * 2 + 1)"
        >
          <span v-if="pair[1].isCapture" class="cap-dot">×</span>
          {{ pair[1].san }}
          <span v-if="pair[1].isCheck" class="check-badge">+</span>
        </button>
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
}
.nav-controls { display: flex; gap: 2px; }

.moves-list {
  flex: 1;
  overflow-y: auto;
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
