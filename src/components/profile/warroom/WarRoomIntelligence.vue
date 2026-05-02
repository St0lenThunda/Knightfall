<template>
  <div class="glass-floating card-v4 mt-8">
    <div class="card-header">
      <div class="header-group">
        <span class="icon-glow">🧠</span>
        <div class="title-meta">
          <h4 class="text-glow">War Room Intelligence</h4>
          <p class="muted">Global Synthesis & Bulk Analysis Engine</p>
        </div>
      </div>
    </div>

    <div class="intel-content mt-8">
      <!-- Main Intelligence Hub -->
      <div class="intel-deck glass-sm">
        <div class="deck-inner">
          <div class="telemetry-header">
            <div class="telemetry-id">
              <span class="pulse-dot"></span>
              {{ intelStatusText }}
            </div>
            <div class="telemetry-stats">
              <span class="muted">GAMES_IN_VAULT:</span> 
              <span class="text-accent">{{ libraryStore.games.length }}</span>
            </div>
          </div>

          <!-- Active Synthesis Grid -->
          <Transition name="fade-slide">
            <div v-if="libraryStore.isBulkAnalyzing" class="telemetry-grid mt-6">
              <div class="telemetry-cell glass-xs">
                <span class="cell-label">ANALYZED_GAMES</span>
                <span class="cell-value">{{ libraryStore.liveAnalyzedCount }}</span>
              </div>
              <div class="telemetry-cell glass-xs">
                <span class="cell-label">MOVES_PROCESSED</span>
                <span class="cell-value">{{ libraryStore.totalMovesProcessed.toLocaleString() }}</span>
              </div>
              <div class="telemetry-cell glass-xs">
                <span class="cell-label">NODES_PER_SEC</span>
                <span class="cell-value text-accent">{{ libraryStore.engineNodesPerSecond.toLocaleString() }}</span>
              </div>
              <div class="telemetry-cell glass-xs">
                <span class="cell-label">INACCURACIES</span>
                <span class="cell-value text-yellow">{{ libraryStore.inaccuraciesFound }}</span>
              </div>
              <div class="telemetry-cell glass-xs">
                <span class="cell-label">MISTAKES</span>
                <span class="cell-value text-orange">{{ libraryStore.mistakesFound }}</span>
              </div>
              <div class="telemetry-cell glass-xs">
                <span class="cell-label">BLUNDERS</span>
                <span class="cell-value text-rose">{{ libraryStore.blundersFound }}</span>
              </div>
            </div>
          </Transition>

          <!-- Idle / Intro Section -->
          <Transition name="fade-slide">
            <div v-if="!libraryStore.isBulkAnalyzing && libraryStore.analysisProgress < 100" class="idle-grid glass-sm">
              <div class="idle-copy">
                <span class="label">ENGINE_OBJECTIVE</span>
                <p>Scan your entire local vault for tactical patterns, structural blunders, and opening consistency. Fabric AI will synthesize a global cognitive map of your playstyle.</p>
              </div>
              <div class="idle-stats">
                <div class="stat-group">
                  <span class="label">VAULT STATUS</span>
                  <span class="value" :class="{ 'text-accent': libraryStore.games.length > 0 }">
                    {{ libraryStore.games.length > 0 ? 'ACTIVE' : 'IDLE' }}
                  </span>
                </div>
              </div>
            </div>
          </Transition>

          <!-- Control Section -->
          <div class="deck-controls" :class="{ 'is-analyzing': libraryStore.isBulkAnalyzing }">
            <div v-if="libraryStore.isBulkAnalyzing" class="progress-module">
              <div class="progress-header">
                <span class="muted">{{ Math.round(libraryStore.analysisProgress) }}% SYNTHESIZED</span>
                <span class="text-accent">ETA: {{ libraryStore.estimatedTimeRemaining || '--:--' }}</span>
              </div>
              <div class="progress-track glass-sm">
                <div class="progress-fill" :style="{ width: libraryStore.analysisProgress + '%' }">
                  <div class="fill-shimmer"></div>
                </div>
              </div>
            </div>
            <button 
              @click="$emit('toggleIntel')" 
              class="btn btn-glow" 
              :class="libraryStore.isBulkAnalyzing ? 'btn-ghost' : 'btn-primary'"
            >
              {{ libraryStore.isBulkAnalyzing ? 'PAUSE SYNTHESIS' : (libraryStore.analysisProgress === 100 ? 'RESTART ENGINE' : 'INITIATE SYNTHESIS') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * WarRoomIntelligence: The high-fidelity 'Command Deck' for bulk analysis.
 * Features dynamic telemetry grids and immersive engine-state animations.
 */
import { computed, onMounted } from 'vue'
import { useLibraryStore } from '../../../stores/libraryStore'

const libraryStore = useLibraryStore()

defineEmits(['toggleIntel'])

onMounted(() => {
  libraryStore.fetchWardenReport()
})

/**
 * Generates high-fidelity status text based on engine telemetry.
 */
const intelStatusText = computed(() => {
  if (libraryStore.isBulkAnalyzing) {
    return `SYNTHESIZING_PATTERNS // THREAD_ID: 0x${Math.floor(Math.random() * 100000).toString(16).toUpperCase()}`
  }
  if (libraryStore.analysisProgress === 100) {
    return 'COGNITIVE_MAP_SYNCED // READY_FOR_DEPLOYMENT'
  }
  return 'ENGINE_IDLE // AWAITING_COMMAND'
})
</script>

<style scoped>
.card-v4 { padding: var(--space-8); border-radius: var(--radius-2xl); position: relative; overflow: hidden; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; }
.header-group { display: flex; gap: var(--space-4); align-items: center; }
.icon-glow { font-size: 2rem; filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.4)); }
.title-meta h4 { margin-bottom: 2px; }

.intel-deck { padding: var(--space-6); border-radius: var(--radius-xl); border: 1px solid rgba(255,255,255,0.05); background: rgba(10, 10, 15, 0.4); }
.telemetry-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: var(--space-4); border-bottom: 1px solid rgba(255,255,255,0.05); }

.telemetry-id { display: flex; align-items: center; gap: var(--space-3); font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.1em; color: var(--text-muted); }
.pulse-dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 10px var(--accent); }

.telemetry-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); }
.telemetry-cell { padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-1); border: 1px solid rgba(255,255,255,0.02); }
.cell-label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.cell-value { font-family: var(--font-mono); font-size: 1.25rem; font-weight: 800; color: white; }

.idle-grid { display: grid; grid-template-columns: 1fr 200px; gap: var(--space-8); padding: var(--space-6); margin-top: var(--space-6); align-items: center; }
.idle-copy .label { display: block; font-size: 0.7rem; font-weight: 900; color: var(--accent-bright); margin-bottom: var(--space-2); letter-spacing: 0.1em; }
.idle-copy p { font-size: 0.95rem; line-height: 1.6; color: var(--text-muted); }

.stat-group { display: flex; flex-direction: column; gap: var(--space-1); text-align: right; }
.stat-group .label { font-size: 0.65rem; color: var(--text-muted); }
.stat-group .value { font-family: var(--font-mono); font-size: 1.5rem; font-weight: 800; }

.deck-controls { margin-top: var(--space-8); display: flex; flex-direction: column; gap: var(--space-6); }
.deck-controls.is-analyzing { gap: var(--space-4); }

.progress-module { display: flex; flex-direction: column; gap: var(--space-2); }
.progress-header { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.7rem; font-weight: 800; }
.progress-track { height: 8px; border-radius: 4px; overflow: hidden; position: relative; }
.progress-fill { height: 100%; background: var(--accent-gradient); transition: width 0.3s ease; }
.fill-shimmer { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); animation: shimmer 2s infinite; }

.btn-glow { width: 100%; padding: var(--space-4); font-size: 0.9rem; letter-spacing: 0.1em; }

@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.4s var(--ease); }
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
