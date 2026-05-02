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

// Interaction State
const hoveredIndex = ref<number | null>(null)
const mouseX = ref(0)

/**
 * Handles mouse movement over the chart to track the nearest data point.
 */
function handleMouseMove(e: MouseEvent) {
  const svg = e.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const x = e.clientX - rect.left
  const normalizedX = (x / rect.width) * chartW
  
  // Find nearest point index
  const step = chartW / Math.max(1, ratingData.value.length - 1)
  const index = Math.round(normalizedX / step)
  
  if (index >= 0 && index < ratingData.value.length) {
    hoveredIndex.value = index
    mouseX.value = chartPoints.value[index].x
  }
}

const hoveredPoint = computed(() => {
  if (hoveredIndex.value === null) return null
  return {
    ...chartPoints.value[hoveredIndex.value],
    rating: ratingData.value[hoveredIndex.value],
    date: filteredRatingHistory.value[hoveredIndex.value].date
  }
})
</script>

<template>
  <div class="glass card-v3 mb-6">
    <div class="card-header">
      <h4 class="text-glow">Performance History</h4>
      <div class="chart-filters-container">
        <div class="chart-legend-mini">
          <span class="dot glow-accent"></span>
          <span class="muted">Rating DNA</span>
        </div>
        <div class="chart-filters glass-sm">
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
        <span class="muted">{{ Math.round((maxR + minR) / 2) }}</span>
        <span>{{ minR }}</span>
      </div>
      <div class="chart-main">
        <svg 
          :viewBox="`0 0 ${chartW} ${chartH}`" 
          class="rating-svg-full" 
          preserveAspectRatio="none"
          @mousemove="handleMouseMove"
          @mouseleave="hoveredIndex = null"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.2" />
              <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path :d="areaPath" fill="url(#areaGradient)"/>
          <path :d="linePath" fill="none" stroke="var(--accent-bright)" stroke-width="3" stroke-linecap="round" filter="url(#glow)" />
          
          <!-- Interactive Guide Line -->
          <line 
            v-if="hoveredIndex !== null" 
            :x1="mouseX" :y1="0" 
            :x2="mouseX" :y2="chartH" 
            stroke="rgba(255,255,255,0.1)" 
            stroke-width="1" 
            stroke-dasharray="4"
          />
          
          <!-- Hover Point Highlight -->
          <circle 
            v-if="hoveredPoint" 
            :cx="hoveredPoint.x" 
            :cy="hoveredPoint.y" 
            r="6" 
            fill="var(--accent-bright)"
            stroke="white"
            stroke-width="2"
            filter="url(#glow)"
          />
        </svg>

        <!-- Tooltip -->
        <div v-if="hoveredPoint" class="chart-tooltip glass-floating" :style="{ left: (hoveredPoint.x / chartW * 100) + '%' }">
          <div class="tooltip-rating">{{ Math.round(hoveredPoint.rating) }} ELO</div>
          <div class="tooltip-date">{{ new Date(hoveredPoint.date).toLocaleDateString() }}</div>
        </div>

        <div class="x-axis mt-4">
          <span>{{ chartFilter === 'ALL' ? 'Vault Origin' : new Date(filteredRatingHistory[0]?.date || Date.now()).toLocaleDateString() }}</span>
          <span class="active-dot">Today</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-v3 { padding: var(--space-6); border-radius: var(--radius-xl); transition: border-color 0.3s; }
.card-v3:hover { border-color: rgba(139, 92, 246, 0.2); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); flex-wrap: wrap; gap: var(--space-4); }
.card-header h4 { margin: 0; font-size: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }

.chart-filters-container { display: flex; align-items: center; gap: var(--space-6); }
.chart-legend-mini { display: flex; align-items: center; gap: var(--space-2); font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
.chart-filters { display: flex; gap: 2px; padding: 2px; border-radius: var(--radius-md); background: rgba(0,0,0,0.2); }
.btn-filter { padding: 4px 12px; font-size: 0.65rem; font-weight: 900; border: none; background: transparent; color: var(--text-muted); cursor: pointer; border-radius: 4px; transition: all 0.2s; }
.btn-filter.active { background: var(--accent); color: white; box-shadow: var(--glow-accent); }
.btn-filter:hover:not(.active) { background: rgba(255,255,255,0.05); color: var(--text-primary); }

.perf-history-container { display: flex; gap: var(--space-6); height: 160px; margin-bottom: var(--space-6); }
.y-axis { display: flex; flex-direction: column; justify-content: space-between; color: var(--text-muted); font-size: 0.65rem; font-family: var(--font-mono); font-weight: 700; padding: 4px 0; border-right: 1px solid rgba(255,255,255,0.03); padding-right: var(--space-4); }
.chart-main { flex: 1; position: relative; display: flex; flex-direction: column; }
.rating-svg-full { flex: 1; width: 100%; overflow: visible; }

.x-axis { display: flex; justify-content: space-between; align-items: center; color: var(--text-muted); font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.active-dot { color: var(--accent-bright); display: flex; align-items: center; gap: 6px; }
.active-dot::before { content: ''; width: 6px; height: 6px; background: var(--accent-bright); border-radius: 50%; box-shadow: var(--glow-accent); }

.dot { width: 8px; height: 8px; border-radius: 50%; }
.glow-accent { background: var(--accent); box-shadow: var(--glow-accent); }

.chart-tooltip {
  position: absolute;
  top: -70px;
  transform: translateX(-50%);
  padding: var(--space-3) var(--space-4);
  pointer-events: none;
  z-index: 100;
  text-align: center;
  min-width: 120px;
}

.tooltip-rating { font-weight: 900; color: var(--accent-bright); font-size: 1rem; line-height: 1; margin-bottom: 2px; text-shadow: var(--glow-accent); }
.tooltip-date { font-size: 0.6rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }

@media (max-width: 600px) {
  .chart-legend-mini { display: none; }
  .perf-history-container { height: 120px; }
}
</style>
