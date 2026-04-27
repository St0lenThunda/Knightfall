<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLibraryStore } from '../../../stores/libraryStore'

const libraryStore = useLibraryStore()

// Rating Chart Logic
const chartW = 500, chartH = 120
const chartFilter = ref('ALL')

const filteredRatingHistory = computed(() => {
  const full = libraryStore.performanceHistory
  if (chartFilter.value === 'ALL') return full
  
  const now = new Date()
  const limit = new Date()
  if (chartFilter.value === '1M') limit.setMonth(now.getMonth() - 1)
  else if (chartFilter.value === '3M') limit.setMonth(now.getMonth() - 3)
  else if (chartFilter.value === '1Y') limit.setFullYear(now.getFullYear() - 1)
  
  const filtered = full.filter(h => h.date && new Date(h.date) >= limit)
  
  const before = full.filter(h => h.date && new Date(h.date) < limit)
  if (before.length > 0) {
    const startValue = before[before.length - 1].rating
    return [{ date: limit.toISOString(), rating: startValue }, ...filtered]
  }
  return filtered
})

const ratingData = computed(() => {
  const result = filteredRatingHistory.value.map(h => h.rating)
  if (result.length === 0) return [1200, 1200]
  if (result.length === 1) return [result[0], result[0]]
  return result
})

const minR = computed(() => {
  const min = Math.min(...ratingData.value)
  return isNaN(min) ? 1100 : min - 50 
})

const maxR = computed(() => {
  const max = Math.max(...ratingData.value)
  return isNaN(max) ? 1300 : max + 50
})

const chartPoints = computed(() => ratingData.value.map((r, i) => ({
  x: (i / (Math.max(1, ratingData.value.length - 1))) * chartW,
  y: chartH - ((r - minR.value) / (Math.max(1, maxR.value - minR.value))) * chartH,
})))

const linePath = computed(() => chartPoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' '))
const areaPath = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ''
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  return `${line} L${chartW},${chartH} L0,${chartH} Z`
})
</script>

<template>
  <div class="stats-group">
    <!-- PERFORMANCE RATIO -->
    <div class="glass card-v3 mb-6">
      <div class="card-header" style="flex-direction: column; align-items: flex-start; gap: 4px;">
        <h4 style="margin: 0;">Performance Ratio</h4>
        <div class="wld-stats-summary" style="opacity: 0.6; font-size: 0.8rem;">
          Total DNA Games: {{ libraryStore.libraryWldStats.total }}
        </div>
      </div>
      <div class="wld-layout-v2 mt-4">
        <div class="wld-ring-container-v2">
          <svg viewBox="0 0 100 100" class="wld-ring">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12"/>
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--green)" stroke-width="12" 
                    :stroke-dasharray="`${(libraryStore.libraryWldStats.winPct / 100) * 251.3} 251.3`" 
                    stroke-dashoffset="0" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--rose)" stroke-width="12" 
                    :stroke-dasharray="`${(libraryStore.libraryWldStats.lossPct / 100) * 251.3} 251.3`" 
                    :stroke-dashoffset="-((libraryStore.libraryWldStats.winPct / 100) * 251.3)" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--gold)" stroke-width="12" 
                    :stroke-dasharray="`${(libraryStore.libraryWldStats.drawPct / 100) * 251.3} 251.3`" 
                    :stroke-dashoffset="-(((libraryStore.libraryWldStats.winPct + libraryStore.libraryWldStats.lossPct) / 100) * 251.3)" />
          </svg>
          <div class="wld-center">
            <div class="wld-pct">{{ Math.round(libraryStore.libraryWldStats.winPct) }}%</div>
            <div class="label">Win Rate</div>
          </div>
        </div>
        <div class="wld-breakdown-v2">
          <div class="breakdown-row">
            <div class="dot bg-green"></div>
            <span class="label">Wins</span>
            <span class="val">{{ libraryStore.libraryWldStats.win }}</span>
            <span class="pct muted">{{ Math.round(libraryStore.libraryWldStats.winPct) }}%</span>
          </div>
          <div class="breakdown-row">
            <div class="dot bg-rose"></div>
            <span class="label">Losses</span>
            <span class="val">{{ libraryStore.libraryWldStats.loss }}</span>
            <span class="pct muted">{{ Math.round(libraryStore.libraryWldStats.lossPct) }}%</span>
          </div>
          <div class="breakdown-row">
            <div class="dot bg-gold"></div>
            <span class="label">Draws</span>
            <span class="val">{{ libraryStore.libraryWldStats.draw }}</span>
            <span class="pct muted">{{ Math.round(libraryStore.libraryWldStats.drawPct) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- PERFORMANCE HISTORY -->
    <div class="glass card-v3 mb-6">
      <div class="card-header">
        <h4>Performance History</h4>
        <div class="chart-filters-container">
          <div class="chart-legend-mini">
            <span class="dot bg-accent"></span>
            <span class="muted">Rating DNA</span>
          </div>
          <div class="chart-filters">
            <button v-for="f in ['1M', '3M', '1Y', 'ALL']" :key="f" 
                    @click="chartFilter = f" 
                    class="btn-filter" :class="{ active: chartFilter === f }">
              {{ f }}
            </button>
          </div>
        </div>
      </div>
      <div class="perf-history-container mt-4">
        <div class="y-axis">
          <span>{{ maxR }}</span>
          <span>{{ Math.round((maxR + minR) / 2) }}</span>
          <span>{{ minR }}</span>
        </div>
        <div class="chart-main">
          <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="rating-svg-full" preserveAspectRatio="none">
            <path :d="areaPath" fill="rgba(139,92,246,0.1)"/>
            <path :d="linePath" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
          </svg>
          <div class="x-axis" style="margin-top: var(--space-4);">
            <span>{{ chartFilter === 'ALL' ? 'Vault Start' : new Date(filteredRatingHistory[0]?.date || Date.now()).toLocaleDateString() }}</span>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-v3 { padding: var(--space-6); border-radius: var(--radius-xl); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }

.wld-layout-v2 { display: flex; align-items: center; gap: var(--space-10); }
.wld-ring-container-v2 { position: relative; width: 120px; height: 120px; }
.wld-ring { transform: rotate(-90deg); }
.wld-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.wld-center .label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; }
.wld-pct { font-size: 1.5rem; font-weight: 900; margin-bottom: 4px; }

.wld-breakdown-v2 { flex: 1; display: flex; flex-direction: column; gap: var(--space-3); }
.breakdown-row { 
  display: grid; grid-template-columns: 8px 1fr 40px 45px; align-items: center; gap: var(--space-4); 
  padding: var(--space-2) var(--space-4); background: rgba(255, 255, 255, 0.02); border-radius: var(--radius-md); 
}
.dot { width: 8px; height: 8px; border-radius: 50%; }
.bg-green { background: var(--green); box-shadow: 0 0 8px var(--green); }
.bg-rose { background: var(--rose); box-shadow: 0 0 8px var(--rose); }
.bg-gold { background: var(--gold); box-shadow: 0 0 8px var(--gold); }
.bg-accent { background: var(--accent); box-shadow: 0 0 8px var(--accent); }
.breakdown-row .label { font-weight: 600; font-size: 0.85rem; }
.breakdown-row .val { font-weight: 800; text-align: right; }
.breakdown-row .pct { font-size: 0.75rem; text-align: right; }

.chart-filters-container { display: flex; align-items: center; gap: var(--space-6); }
.chart-legend-mini { display: flex; align-items: center; gap: var(--space-2); font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.chart-filters { display: flex; gap: 4px; background: rgba(255,255,255,0.03); padding: 2px; border-radius: var(--radius-md); }
.btn-filter { padding: 4px 10px; font-size: 0.65rem; font-weight: 800; border: none; background: transparent; color: var(--text-muted); cursor: pointer; border-radius: 4px; transition: all 0.2s; }
.btn-filter.active { background: var(--accent); color: white; box-shadow: 0 0 8px var(--accent); }
.btn-filter:hover:not(.active) { background: rgba(255,255,255,0.05); }

.perf-history-container { display: flex; gap: var(--space-4); height: 140px; margin-bottom: var(--space-8); padding: 0 var(--space-4); }
.y-axis { display: flex; flex-direction: column; justify-content: space-between; color: var(--text-muted); font-size: 0.65rem; font-family: var(--font-mono); padding: 4px 0; }
.chart-main { flex: 1; position: relative; display: flex; flex-direction: column; }
.rating-svg-full { flex: 1; width: 100%; overflow: visible; }
.x-axis { display: flex; justify-content: space-between; color: var(--text-muted); font-size: 0.65rem; margin-top: var(--space-4); }
</style>
