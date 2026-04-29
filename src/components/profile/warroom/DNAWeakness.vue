<script setup lang="ts">
/**
 * DNAWeakness: Renders the radar chart mapping of player weaknesses.
 */
import { computed } from 'vue'
import { useCoachStore } from '../../../stores/coachStore'

const coachStore = useCoachStore()

const weaknesses = computed(() => {
  const report = coachStore.archetypeReport
  return [
    { label: 'Opening Accuracy', pct: Math.round(report.radarScores.opening * 100), icon: '📖', color: 'var(--teal)' },
    { label: 'Tactical Awareness', pct: Math.round(report.radarScores.tactics * 100), icon: '🧩', color: 'var(--accent)' },
    { label: 'Endgame Precision', pct: Math.round(report.radarScores.endgame * 100), icon: '🏁', color: 'var(--gold)' }
  ]
})

defineEmits(['switchTab'])
</script>

<template>
  <div class="glass card-v3 mb-6">
    <div class="card-header">
      <h4>🧬 Weakness DNA</h4>
    </div>
    <div class="weakness-items mt-4">
      <div v-for="w in weaknesses" :key="w.label" class="weakness-item">
        <div class="weakness-label">
          <span>{{ w.icon }} {{ w.label }}</span>
          <span class="muted">{{ w.pct }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill" :style="{ width: w.pct + '%', background: w.color }"></div>
        </div>
      </div>
    </div>
    <button @click="$emit('switchTab', 'dna')" class="btn btn-ghost btn-xs w-full mt-4">Full Lab →</button>
  </div>
</template>

<style scoped>
.card-v3 { padding: var(--space-6); border-radius: var(--radius-xl); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }

.weakness-items { display: flex; flex-direction: column; gap: var(--space-4); }
.weakness-label { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; }
.progress-bar { height: 6px; background: rgba(255, 255, 255, 0.05); border-radius: 3px; }
.progress-bar-fill { height: 100%; border-radius: 3px; transition: width 1s ease; }
</style>
