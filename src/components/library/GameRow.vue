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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  game: any
}>()

defineEmits(['click', 'analyze'])

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
  padding: var(--space-2) var(--space-4);
  gap: var(--space-4);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  border: 1px solid transparent;
  min-height: 56px;
}

.game-row:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--border);
  transform: translateX(4px);
}

/* Columns */
.col-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
  gap: 2px;
}
.result-dot { width: 8px; height: 8px; border-radius: 50%; }
.result-dot.win { background: var(--green); box-shadow: 0 0 8px var(--green); }
.result-dot.loss { background: var(--rose); box-shadow: 0 0 8px var(--rose); }
.result-dot.draw { background: var(--gold); box-shadow: 0 0 8px var(--gold); }
.result-text { font-size: 0.7rem; font-weight: 800; font-family: var(--font-mono); }

.col-date {
  min-width: 90px;
  font-size: 0.8rem;
  font-weight: 500;
}

.col-players {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 150px;
}
.player { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 600; }
.color-dot { width: 6px; height: 6px; border-radius: 1px; }
.color-dot.white { background: #eee; }
.color-dot.black { background: #333; outline: 1px solid rgba(255,255,255,0.2); }
.rating { font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono); }

.col-opening {
  flex: 3;
  display: flex;
  flex-direction: column;
  min-width: 200px;
}
.eco { font-size: 0.8rem; font-weight: 800; color: var(--accent-bright); font-family: var(--font-mono); }
.opening-name { font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px; }

.col-moves {
  min-width: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.count { font-size: 0.9rem; font-weight: 800; }
.label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; }

.col-tags {
  flex: 1;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  min-width: 100px;
}
.row-tag {
  font-size: 0.6rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid var(--border);
  color: var(--text-muted);
}

.col-actions { min-width: 40px; }
.row-btn {
  background: transparent; border: none; font-size: 1.1rem;
  cursor: pointer; opacity: 0.3; transition: all 0.2s;
}
.game-row:hover .row-btn { opacity: 1; }
.row-btn:hover { transform: scale(1.2); }

@media (max-width: 900px) {
  .col-opening, .col-tags, .col-date { display: none; }
}
</style>
