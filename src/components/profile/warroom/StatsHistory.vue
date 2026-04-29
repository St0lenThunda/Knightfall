<script setup lang="ts">
/**
 * StatsHistory: Renders the Rating DNA line chart with time filters.
 * Part of the modular WarRoomStats decomposition.
 */
import { ref, computed } from 'vue'
import { useLibraryStore } from '../../../stores/libraryStore'

const libraryStore = useLibraryStore()

// Chart Dimensions
const chartW = 500, chartH = 120
const chartFilter = ref('ALL')

/**
 * Filters rating history based on the selected timeframe (1M, 3M, 1Y, ALL).
 */
const filteredRatingHistory = computed(() => {
  const full = libraryStore.performanceHistory
  if (chartFilter.value === 'ALL') return full
  
  const now = new Date()
  const limit = new Date()
  if (chartFilter.value === '1M') limit.setMonth(now.getMonth() - 1)
  else if (chartFilter.value === '3M') limit.setMonth(now.getMonth() - 3)
  else if (chartFilter.value === '1Y') limit.setFullYear(now.getFullYear() - 1)
  
  const filtered = full.filter(h => h.date && new Date(h.date) >= limit)
  
  // Inject a starting point to prevent the line from jumping from zero
  const before = full.filter(h => h.date && new Date(h.date) < limit)
  if (before.length > 0) {
    const startValue = before[before.length - 1].rating
    return [{ date: limit.toISOString(), rating: startValue }, ...filtered]
  }
  return filtered
})

/**
 * Extracts raw rating numbers for coordinate calculation.
 */
const ratingData = computed(() => {
  const result = filteredRatingHistory.value.map(h => h.rating)
  if (result.length === 0) return [1200, 1200]
  if (result.length === 1) return [result[0], result[0]]
  return result
})

/**
 * Dynamic Y-Axis scale calculation with padding.
 */
const minR = computed(() => {
  const min = Math.min(...ratingData.value)
  return isNaN(min) ? 1100 : min - 50 
})

const maxR = computed(() => {
  const max = Math.max(...ratingData.value)
  return isNaN(max) ? 1300 : max + 50
})

/**
 * Maps rating values to SVG coordinates.
 */
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
</template>

<style scoped>
.card-v3 { padding: var(--space-6); border-radius: var(--radius-xl); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }

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

.dot { width: 8px; height: 8px; border-radius: 50%; }
.bg-accent { background: var(--accent); box-shadow: 0 0 8px var(--accent); }
</style>
