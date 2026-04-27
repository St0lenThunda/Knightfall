<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '../../../stores/coachStore'
import { useLibraryStore } from '../../../stores/libraryStore'

const router = useRouter()
const coachStore = useCoachStore()
const libraryStore = useLibraryStore()

const miniRx = computed(() => coachStore.dnaPrescriptions.slice(0, 3))

const weaknesses = computed(() => {
  const report = coachStore.archetypeReport
  return [
    { label: 'Opening Accuracy', pct: Math.round(report.radarScores.opening * 100), icon: '📖', color: 'var(--teal)' },
    { label: 'Tactical Awareness', pct: Math.round(report.radarScores.tactics * 100), icon: '🧩', color: 'var(--accent)' },
    { label: 'Endgame Precision', pct: Math.round(report.radarScores.endgame * 100), icon: '🏁', color: 'var(--gold)' }
  ]
})

const openingStats = computed(() => libraryStore.openingStats)

defineEmits(['showBadgeModal', 'switchTab'])
</script>

<template>
  <div class="dna-group">
    <!-- THE CLINIC -->
    <div v-if="miniRx.length > 0" class="glass card-v3 mb-6">
      <div class="card-header">
        <h4>📋 The Clinic</h4>
      </div>
      <div class="mini-prescriptions mt-4">
        <div v-for="rx in miniRx" :key="rx.id" class="mini-rx-item" :class="rx.severity">
          <span class="rx-icon">{{ rx.icon }}</span>
          <div class="rx-info">
            <div class="rx-title">{{ rx.title }}</div>
            <button @click="router.push(rx.link)" class="btn btn-xs btn-primary mt-2">{{ rx.linkText }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- WEAKNESS DNA -->
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

    <!-- TOP OPENINGS -->
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

    <!-- EARNED BADGES -->
    <div class="glass card-v3">
      <div class="card-header">
        <h4>Earned Badges</h4>
        <button @click="$emit('showBadgeModal')" class="btn-cleanup-text">VIEW ALL →</button>
      </div>
      <div class="badges-mini-grid mt-4">
        <div v-for="b in coachStore.achievements.badges.filter(x => x.earned).slice(0, 3)" :key="b.id" class="badge-mini-card glass-sm">
          <div class="badge-icon-wrapper">{{ b.icon }}</div>
          <div class="badge-content">
            <div class="badge-label">{{ b.label }}</div>
            <div class="badge-description muted">{{ b.description }}</div>
          </div>
        </div>
        <div v-if="coachStore.achievements.badges.filter(x => x.earned).length === 0" class="muted p-4 italic" style="font-size: 0.85rem;">
          No badges earned yet. Solve puzzles or win games to unlock them!
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-v3 { padding: var(--space-6); border-radius: var(--radius-xl); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }

.mini-rx-item {
  display: flex; gap: var(--space-4); padding: var(--space-4); border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03); margin-bottom: var(--space-3); border-left: 4px solid var(--accent);
}
.mini-rx-item.critical { border-left-color: var(--rose); }
.mini-rx-item.warning { border-left-color: var(--gold); }
.rx-title { font-weight: 700; font-size: 0.9rem; }

.weakness-items { display: flex; flex-direction: column; gap: var(--space-4); }
.weakness-label { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; }
.progress-bar { height: 6px; background: rgba(255, 255, 255, 0.05); border-radius: 3px; }
.progress-bar-fill { height: 100%; border-radius: 3px; transition: width 1s ease; }

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

.badges-mini-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-4); }
.badge-mini-card { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s var(--ease); }
.badge-mini-card:hover { background: rgba(139, 92, 246, 0.1); border-color: var(--accent); transform: translateY(-2px); }
.badge-icon-wrapper { font-size: 1.8rem; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border-radius: 12px; }
.badge-label { font-weight: 800; font-size: 0.9rem; }
.badge-description { font-size: 0.75rem; line-height: 1.3; margin-top: 2px; }

.btn-cleanup-text { background: none; border: none; color: var(--accent); font-size: 0.75rem; font-weight: 800; cursor: pointer; }
</style>
