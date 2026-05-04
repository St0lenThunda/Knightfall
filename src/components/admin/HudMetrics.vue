<script setup lang="ts">
import { computed } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import { useEngineStore } from '../../stores/engineStore'
import { useLibraryStore } from '../../stores/libraryStore'

const adminStore = useAdminStore()
const engineStore = useEngineStore()
const libraryStore = useLibraryStore()

const ecoCount = computed(() => new Set(libraryStore.games.map(g => g.eco)).size)

const getHitRateClass = computed(() => {
  if (adminStore.hitRate > 80) return 'success'
  if (adminStore.hitRate > 50) return 'warn'
  return ''
})

const formatNps = (nps: number) => {
  if (nps > 1000000) return (nps / 1000000).toFixed(1) + 'M'
  if (nps > 1000) return (nps / 1000).toFixed(0) + 'K'
  return nps
}

const formatTokens = (t: number) => {
  if (t > 1000) return (t / 1000).toFixed(1) + 'k'
  return t
}

const getWaveHeight = (i: number) => {
  if (!engineStore.isAnalyzing) return '2px'
  const seed = Date.now() / 200 + i
  return (Math.sin(seed) * 10 + 15) + 'px'
}

const formatTime = (ts: string) => {
  if (!ts) return '?'
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="console-grid">
    <!-- Card 1: AI INTELLIGENCE -->
    <div class="telemetry-card glass-xs" title="Coaching cache hits vs misses.">
      <div class="card-label">AI INTELLIGENCE (L2/L3)</div>
      <div class="card-main">
        <div class="big-metric">
          <span class="val">{{ adminStore.cacheCount.toLocaleString() }}</span>
          <span class="unit">ROWS</span>
        </div>
        <div class="metric-row">
          <span>HIT RATE</span>
          <span class="val-pill" :class="getHitRateClass">{{ adminStore.hitRate }}%</span>
        </div>
        <div class="progress-mini">
          <div class="fill" :style="{ width: adminStore.hitRate + '%' }"></div>
        </div>
        <div class="metric-row muted">
          <span>CACHE MISSES</span>
          <span>{{ adminStore.cacheMisses }}</span>
        </div>
      </div>
    </div>

    <!-- Card 2: ENGINE PHYSIOLOGY -->
    <div class="telemetry-card glass-xs" title="Stockfish 16.1 WASM performance.">
      <div class="card-label">ENGINE PHYSIOLOGY</div>
      <div class="card-main">
        <div class="big-metric">
          <span class="val">{{ formatNps(adminStore.engineNps) }}</span>
          <span class="unit">NPS</span>
        </div>
        <div class="metric-row">
          <span>THREADS</span>
          <span class="val-pill">{{ adminStore.engineThreads }}</span>
        </div>
        <div class="metric-row">
          <span>DEPTH</span>
          <span class="val-pill">{{ engineStore.currentDepth }}</span>
        </div>
        <div class="visual-wave">
          <div v-for="i in 12" :key="i" class="wave-bar" :style="{ height: getWaveHeight(i) }"></div>
        </div>
      </div>
    </div>

    <!-- Card 3: FINANCIALS -->
    <div class="telemetry-card glass-xs" title="Gemini 2.0 cost tracking.">
      <div class="card-label">API INFRASTRUCTURE</div>
      <div class="card-main">
        <div class="big-metric">
          <span class="val">${{ adminStore.estimatedCost.toFixed(4) }}</span>
          <span class="unit">USD</span>
        </div>
        <div class="metric-row">
          <span>LATENCY</span>
          <span class="val-pill" :class="adminStore.lastApiLatency > 2000 ? 'warn' : ''">{{ adminStore.lastApiLatency }}ms</span>
        </div>
        <div class="metric-row">
          <span>TOKENS</span>
          <span class="val-pill">{{ formatTokens(adminStore.totalTokensUsed) }}</span>
        </div>
      </div>
    </div>

    <!-- Card 4: ARCHIVE VOLUME -->
    <div class="telemetry-card glass-xs" title="Local IndexedDB storage volume.">
      <div class="card-label">ARCHIVE VOLUME (VAULT)</div>
      <div class="card-main">
        <div class="big-metric">
          <span class="val">{{ libraryStore.games.length.toLocaleString() }}</span>
          <span class="unit">GAMES</span>
        </div>
        <div class="metric-row">
          <span>CURATED</span>
          <span class="val-pill">{{ libraryStore.games.filter(g => g.isCurated).length }}</span>
        </div>
        <div class="metric-row">
          <span>OPENINGS</span>
          <span class="val-pill">{{ ecoCount }}</span>
        </div>
      </div>
    </div>

    <!-- Card 5: WARDEN'S INTELLIGENCE -->
    <div class="telemetry-card glass-xs span-2" title="Architectural intelligence via Warden's Shield.">
      <div class="card-label">WARDEN'S SHIELD</div>
      <div v-if="libraryStore.wardenReport" class="card-main">
        <div class="big-metric">
          <span class="val">{{ libraryStore.wardenReport.metrics.integrity_score }}%</span>
          <span class="unit">INTEGRITY</span>
        </div>
        <div class="briefing-container glass-sm">
          <div class="briefing-header">
            <span class="status-indicator" :class="libraryStore.wardenReport.status.toLowerCase()"></span>
            <span class="ts">{{ formatTime(libraryStore.wardenReport.timestamp) }}</span>
          </div>
          <pre class="briefing-preview">{{ libraryStore.wardenReport.briefing || 'SYSTEM_STABLE' }}</pre>
        </div>
      </div>
      <div v-else class="card-main empty-state">
        <div class="loading-pulse"></div>
        <span class="muted">AWAITING_SYNTHESIS...</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.console-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
  padding: var(--space-6);
  overflow-y: auto;
}

.telemetry-card {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  border: 1px solid rgba(255, 255, 255, 0.03);
  background: rgba(255, 255, 255, 0.01);
}

.card-label {
  font-size: 0.6rem;
  font-weight: 900;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  opacity: 0.6;
}

.big-metric {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: var(--space-2);
}
.big-metric .val { font-size: 2.2rem; font-weight: 900; color: #fff; line-height: 1; }
.big-metric .unit { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); }

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  margin-bottom: 4px;
}
.metric-row.muted { color: var(--text-muted); }

.val-pill {
  background: rgba(255,255,255,0.05);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
}
.val-pill.success { color: var(--green); background: rgba(16, 185, 129, 0.1); }
.val-pill.warn { color: var(--gold); background: rgba(245, 158, 11, 0.1); }

.progress-mini {
  height: 3px;
  background: rgba(255,255,255,0.05);
  border-radius: 2px;
  margin: 8px 0;
  overflow: hidden;
}
.progress-mini .fill {
  height: 100%;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent);
  transition: width 1s ease;
}

.visual-wave {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  margin-top: 8px;
}

.wave-bar {
  flex: 1;
  background: var(--accent);
  border-radius: 1px;
  opacity: 0.4;
  transition: height 0.1s linear;
}

.telemetry-card.span-2 {
  grid-column: span 2;
}

.briefing-container {
  margin-top: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.02);
}

.briefing-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.6rem;
  font-family: var(--font-mono);
  opacity: 0.6;
  margin-bottom: 8px;
}

.status-indicator {
  width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted);
}
.status-indicator.validated { background: var(--teal); box-shadow: 0 0 8px var(--teal); }

.briefing-preview {
  white-space: pre-wrap;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.5;
  color: rgba(255,255,255,0.7);
  max-height: 120px;
  overflow-y: auto;
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: var(--space-8) 0;
}

.loading-pulse {
  width: 32px; height: 32px; background: var(--accent); border-radius: 50%; opacity: 0.2;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
