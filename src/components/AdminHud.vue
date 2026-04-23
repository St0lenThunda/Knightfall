<template>
  <Transition name="slide-up">
    <div v-if="userStore.isAdmin" class="admin-hud-wrapper" :class="{ expanded: !isCollapsed }">
      <!-- Toggle Tab -->
      <button class="hud-toggle glass-sm" @click="isCollapsed = !isCollapsed" :title="isCollapsed ? 'Open Diagnostics' : 'Minimize Terminal'">
        <span class="pulse-icon" :class="{ active: !isCollapsed }"></span>
      </button>

      <!-- Main Panel (The Console) -->
      <Transition name="hud-expand">
        <div v-if="!isCollapsed" class="admin-hud glass-heavy">
          <header class="console-header">
            <div class="header-left">
              <span class="title">GHOSTLY TERMINAL</span>
              <span class="version">v0.13.0.STABLE</span>
            </div>
            <div class="header-right">
              <span class="uptime">UPTIME: {{ uptime }}</span>
              <button class="refresh-btn" @click="adminStore.fetchCacheCount" :class="{ spinning: adminStore.isFetching }">
                ↻
              </button>
            </div>
          </header>

          <div class="console-grid">
            <!-- Card 1: AI INTELLIGENCE -->
            <div class="telemetry-card glass-xs" title="Tracks the global cache of coached positions. High hit rates indicate the system is successfully reusing existing AI logic, minimizing latency and API costs.">
              <div class="card-label">AI INTELLIGENCE (L2/L3)</div>
              <div class="card-main">
                <div class="big-metric">
                  <span class="val">{{ adminStore.cacheCount.toLocaleString() }}</span>
                  <span class="unit">ROWS</span>
                </div>
                <div class="metric-row" title="The percentage of coaching requests served from local or cloud cache without needing a fresh LLM call.">
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
            <div class="telemetry-card glass-xs" title="Measures the performance of Stockfish 16.1 (WASM) running in your browser. Higher NPS indicates more thorough move validation.">
              <div class="card-label">ENGINE PHYSIOLOGY (STOCKFISH 16.1)</div>
              <div class="card-main">
                <div class="big-metric">
                  <span class="val">{{ formatNps(adminStore.engineNps) }}</span>
                  <span class="unit">NPS</span>
                </div>
                <div class="metric-row" title="The number of CPU threads allocated to the chess engine worker.">
                  <span>THREADS</span>
                  <span class="val-pill">{{ adminStore.engineThreads }}</span>
                </div>
                <div class="metric-row" title="The current depth of the engine's search tree for the active position.">
                  <span>DEPTH</span>
                  <span class="val-pill">{{ engineStore.currentDepth }}</span>
                </div>
                <div class="visual-wave">
                  <div v-for="i in 12" :key="i" class="wave-bar" :style="{ height: getWaveHeight(i) }"></div>
                </div>
              </div>
            </div>

            <!-- Card 3: FINANCIALS & LATENCY -->
            <div class="telemetry-card glass-xs" title="Live tracking of AI API costs and network performance. Token costs are calculated based on Gemini 2.0 Flash pricing models.">
              <div class="card-label">API INFRASTRUCTURE (GEMINI 2.0)</div>
              <div class="card-main">
                <div class="big-metric">
                  <span class="val">${{ adminStore.estimatedCost.toFixed(4) }}</span>
                  <span class="unit">USD</span>
                </div>
                <div class="metric-row" title="The round-trip time for the last AI request, including network latency and model inference.">
                  <span>LATENCY</span>
                  <span class="val-pill" :class="adminStore.lastApiLatency > 2000 ? 'warn' : ''">{{ adminStore.lastApiLatency }}ms</span>
                </div>
                <div class="metric-row" title="The total cumulative tokens consumed in this session for coaching explanations.">
                  <span>TOKENS</span>
                  <span class="val-pill">{{ formatTokens(adminStore.totalTokensUsed) }}</span>
                </div>
                <div class="metric-row muted">
                  <span>TIER</span>
                  <span>FLASH-2.0</span>
                </div>
              </div>
            </div>

            <!-- Card 4: ARCHIVE VOLUME -->
            <div class="telemetry-card glass-xs" title="The total volume of games indexed in your local IndexedDB Vault. This data powers the Constellation and Weakness DNA engines.">
              <div class="card-label">ARCHIVE VOLUME (VAULT)</div>
              <div class="card-main">
                <div class="big-metric">
                  <span class="val">{{ libraryStore.games.length.toLocaleString() }}</span>
                  <span class="unit">GAMES</span>
                </div>
                <div class="metric-row" title="High-quality PGNs imported from the Knightfall curated collection.">
                  <span>CURATED</span>
                  <span class="val-pill">{{ libraryStore.games.filter(g => g.isCurated).length }}</span>
                </div>
                <div class="metric-row" title="The number of unique opening variations detected in your library.">
                  <span>OPENINGS</span>
                  <span class="val-pill">{{ ecoCount }}</span>
                </div>
                <div class="metric-row muted">
                  <span>LOCAL DB</span>
                  <span>INDEXED_DB_V2</span>
                </div>
              </div>
            </div>
          </div>

          <footer class="console-footer">
            <div class="status-left">
              <span class="dot"></span> SYSTEM_NOMINAL
            </div>
            <div class="status-right">
              NODE_24.11.0 // {{ lastSyncTime }}
            </div>
          </footer>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { useUserStore } from '../stores/userStore'
import { useAdminStore } from '../stores/adminStore'
import { useEngineStore } from '../stores/engineStore'
import { useLibraryStore } from '../stores/libraryStore'

const userStore = useUserStore()
const adminStore = useAdminStore()
const engineStore = useEngineStore()
const libraryStore = useLibraryStore()

const isCollapsed = ref(true)
const startTime = Date.now()
const uptime = ref('00:00:00')

const ecoCount = computed(() => new Set(libraryStore.games.map(g => g.eco)).size)

const getHitRateClass = computed(() => {
  if (adminStore.hitRate > 80) return 'success'
  if (adminStore.hitRate > 50) return 'warn'
  return ''
})

const lastSyncTime = computed(() => {
  if (!adminStore.lastUpdated) return 'NO_SYNC'
  return adminStore.lastUpdated.toLocaleTimeString([], { hour12: false })
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

let timer: any = null
let poll: any = null

const startTelemetry = () => {
  if (timer || poll) return
  adminStore.fetchCacheCount()
  timer = setInterval(() => {
    const diff = Math.floor((Date.now() - startTime) / 1000)
    const h = Math.floor(diff / 3600).toString().padStart(2, '0')
    const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0')
    const s = (diff % 60).toString().padStart(2, '0')
    uptime.value = `${h}:${m}:${s}`
  }, 1000)
  poll = setInterval(() => adminStore.fetchCacheCount(), 120000)
}

watch(() => userStore.isAdmin, (val) => { if (val) startTelemetry() }, { immediate: true })
onUnmounted(() => { clearInterval(timer); clearInterval(poll); })
</script>

<style scoped>
.admin-hud-wrapper {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-3);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.admin-hud-wrapper.expanded {
  width: 60vw;
  height: 50vh;
}

.hud-toggle {
  background: rgba(10, 10, 12, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: all;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.hud-toggle:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: var(--accent);
  transform: scale(1.1);
}

.toggle-label {
  font-size: 0.7rem;
  font-weight: 900;
  color: var(--text-muted);
  letter-spacing: 0.2em;
}

.admin-hud {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(10, 10, 12, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 30px 100px rgba(0,0,0,0.8);
  pointer-events: all;
}

.console-header {
  padding: var(--space-4) var(--space-6);
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-left { display: flex; align-items: center; gap: 12px; }
.header-left .title { font-weight: 900; font-size: 0.8rem; letter-spacing: 0.3em; color: var(--accent); }
.header-left .version { font-size: 0.6rem; color: var(--text-muted); }

.header-right { display: flex; align-items: center; gap: 16px; font-size: 0.7rem; color: var(--text-muted); }

.console-grid {
  flex: 1;
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

.console-footer {
  padding: var(--space-3) var(--space-6);
  background: rgba(0,0,0,0.3);
  display: flex;
  justify-content: space-between;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.status-left { display: flex; align-items: center; gap: 8px; }
.status-left .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); }

.pulse-icon {
  width: 8px; height: 8px; background: var(--accent); border-radius: 50%;
  box-shadow: 0 0 12px var(--accent);
}
.pulse-icon.active { animation: pulse 2s infinite; }

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

.refresh-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 1rem; }
.refresh-btn.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.hud-expand-enter-active, .hud-expand-leave-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.hud-expand-enter-from, .hud-expand-leave-to { transform: translateY(40px) scale(0.9); opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(20px); opacity: 0; }
</style>
