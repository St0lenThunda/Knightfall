<template>
  <div class="game-row glass-sm" @click="$emit('click')">
    <!-- 1. Result Indicator -->
    <div class="col-result">
      <div class="result-dot" :class="resultClass"></div>
      <span class="result-text">{{ game.result }}</span>
    </div>

    <!-- 2. Date -->
    <div class="col-date muted">
      {{ game.date }}
    </div>

    <!-- 3. Players -->
    <div class="col-players">
      <div class="player">
        <span class="color-dot white"></span>
        <span class="name">{{ game.white }}</span>
        <span class="rating" v-if="game.whiteElo">({{ game.whiteElo }})</span>
      </div>
      <div class="player">
        <span class="color-dot black"></span>
        <span class="name">{{ game.black }}</span>
        <span class="rating" v-if="game.blackElo">({{ game.blackElo }})</span>
      </div>
    </div>

    <!-- 4. Opening / ECO -->
    <div class="col-opening">
      <span class="eco">{{ game.eco }}</span>
      <span class="opening-name muted">{{ openingName }}</span>
    </div>

    <!-- 5. Moves -->
    <div class="col-moves">
      <span class="count">{{ game.movesCount }}</span>
      <span class="label muted">moves</span>
    </div>

    <!-- 6. Source/Tags -->
    <div class="col-tags">
      <span v-for="tag in game.tags?.slice(0, 2)" :key="tag" class="row-tag">
        {{ tag }}
      </span>
    </div>

    <!-- 7. Actions -->
    <div class="col-actions">
      <button class="row-btn" @click.stop="$emit('analyze')" title="Analyze">🔬</button>
      <button class="row-btn delete-btn" @click.stop="$emit('delete')" title="Delete Game">🗑️</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  game: any
}>()

defineEmits(['click', 'analyze', 'delete'])

const resultClass = computed(() => {
    if (props.game.result === '1-0') return 'win'
    if (props.game.result === '0-1') return 'loss'
    return 'draw'
})

const openingName = computed(() => {
    // If event contains opening name, use it, else generic
    return props.game.event || 'Standard Game'
})
</script>

<style scoped>
.game-row {
  display: flex;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  gap: var(--space-4);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.3s var(--ease);
  border: 1px solid transparent;
  min-height: 72px;
}

.game-row:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(139, 92, 246, 0.2);
  transform: translateX(6px);
  box-shadow: var(--glow-accent);
}

/* Columns */
.col-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 64px;
  gap: 4px;
}
.result-dot { width: 10px; height: 10px; border-radius: 50%; }
.result-dot.win { background: var(--green); box-shadow: var(--glow-green); }
.result-dot.loss { background: var(--rose); box-shadow: var(--glow-rose); }
.result-dot.draw { background: var(--gold); box-shadow: var(--glow-gold); }
.result-text { font-size: 0.75rem; font-weight: 800; font-family: var(--font-mono); opacity: 0.9; }

.col-date {
  min-width: 90px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.col-players {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 160px;
}
.player { display: flex; align-items: center; gap: 10px; font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
.color-dot { width: 8px; height: 8px; border-radius: 2px; }
.color-dot.white { background: #fff; box-shadow: 0 0 8px rgba(255,255,255,0.2); }
.color-dot.black { background: #000; outline: 1px solid rgba(255,255,255,0.3); }
.rating { font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono); font-weight: 500; }

.col-opening {
  flex: 3;
  display: flex;
  flex-direction: column;
  min-width: 220px;
  gap: 2px;
}
.eco { font-size: 0.85rem; font-weight: 800; color: var(--accent-bright); font-family: var(--font-mono); text-shadow: 0 0 10px var(--accent-dim); }
.opening-name { font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 320px; font-weight: 500; }

.col-moves {
  min-width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.count { font-size: 1rem; font-weight: 800; color: var(--text-primary); }
.label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; }

.col-tags {
  flex: 1;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 120px;
}
.row-tag {
  font-size: 0.65rem;
  font-weight: 700;
  background: var(--bg-elevated);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.col-actions { min-width: 60px; display: flex; gap: var(--space-2); justify-content: flex-end; }
.row-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-elevated); border: 1px solid var(--border); font-size: 1rem;
  border-radius: var(--radius-sm);
  cursor: pointer; opacity: 0; transition: all 0.2s;
}
.game-row:hover .row-btn { opacity: 1; }
.row-btn:hover { border-color: var(--accent); background: var(--accent-dim); transform: scale(1.1); }
.delete-btn:hover { border-color: var(--rose); background: var(--rose-dim); }

@media (max-width: 900px) {
  .game-row { padding: var(--space-4); }
  .col-opening, .col-tags, .col-date, .col-moves { display: none; }
  .col-players { min-width: 0; flex: 1; }
  .row-btn { opacity: 1; }
}
</style>
