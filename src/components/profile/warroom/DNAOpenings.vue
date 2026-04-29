<script setup lang="ts">
/**
 * DNAOpenings: Renders the top openings and their performance bars.
 */
import { computed } from 'vue'
import { useLibraryStore } from '../../../stores/libraryStore'

const libraryStore = useLibraryStore()
const openingStats = computed(() => libraryStore.openingStats)
</script>

<template>
  <div class="glass card-v3 mb-6">
    <div class="card-header">
      <h4>Top Openings</h4>
      <div class="opening-legend-mini">
        <span class="legend-item"><span class="dot-xs bg-green"></span> W</span>
        <span class="legend-item"><span class="dot-xs bg-rose"></span> L</span>
      </div>
    </div>
    <div class="opening-list-merged mt-4">
      <div v-for="o in openingStats.slice(0, 6)" :key="o.name" class="opening-row-merged">
        <div class="opening-info">
          <div class="opening-name">{{ o.name }}</div>
          <div class="opening-meta muted">{{ o.games }} games</div>
        </div>
        <div class="opening-stats">
          <div class="mini-wld">
            <div class="mini-wld-bar" :style="{ width: o.winPct + '%', background: 'var(--green)' }"></div>
            <div class="mini-wld-bar" :style="{ width: o.drawPct + '%', background: 'var(--gold)' }"></div>
            <div class="mini-wld-bar" :style="{ width: o.lossPct + '%', background: 'var(--rose)' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-v3 { padding: var(--space-6); border-radius: var(--radius-xl); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }

.opening-legend-mini { display: flex; gap: var(--space-4); font-size: 0.65rem; font-weight: 800; opacity: 0.6; }
.legend-item { display: flex; align-items: center; gap: 4px; }
.dot-xs { width: 6px; height: 6px; border-radius: 50%; }
.bg-green { background: var(--green); }
.bg-rose { background: var(--rose); }

.opening-list-merged { display: flex; flex-direction: column; gap: 4px; }
.opening-row-merged { display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) var(--space-4); background: rgba(255, 255, 255, 0.02); border-radius: var(--radius-md); }
.opening-name { font-weight: 700; font-size: 0.85rem; }
.mini-wld { display: flex; width: 60px; height: 4px; border-radius: 2px; overflow: hidden; }
.mini-wld-bar { height: 100%; }
</style>
