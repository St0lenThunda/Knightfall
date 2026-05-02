<template>
  <div class="admin-full-row mt-12 mb-12">
    <div class="system-header">
      <div class="system-line"></div>
      <div class="system-label glass-sm">
        <span class="pulse-dot"></span>
        SYSTEM INTELLIGENCE
      </div>
      <div class="system-line"></div>
    </div>

    <!-- High-Fidelity Intel Deck -->
    <div 
      class="intel-deck glass-floating mt-8" 
      :class="{ 
        'is-active': libraryStore.isBulkAnalyzing, 
        'is-finished': libraryStore.analysisProgress === 100 && !libraryStore.isBulkAnalyzing && libraryStore.totalMovesProcessed > 0 
      }"
    >
      <div class="deck-content">
        <!-- Identity Section -->
        <div class="deck-identity">
          <div class="intel-avatar">
            <div class="avatar-glow"></div>
            <span class="avatar-icon">{{ libraryStore.analysisProgress === 100 && !libraryStore.isBulkAnalyzing ? '✅' : '🧠' }}</span>
          </div>
          <div class="intel-meta">
            <h3 class="text-glow">{{ libraryStore.analysisProgress === 100 && !libraryStore.isBulkAnalyzing ? 'Synthesis Complete' : 'Bulk Intelligence Synthesis' }}</h3>
            <p class="muted font-mono">{{ intelStatusText }}</p>
          </div>
        </div>

        <!-- Warden's Briefing (Fabric Bridge) -->
        <Transition name="fade-slide">
          <div v-if="libraryStore.wardenReport" class="warden-briefing-module glass-sm">
            <div class="briefing-header">
              <div class="header-left">
                <span class="status-indicator" :class="libraryStore.wardenReport.status.toLowerCase()"></span>
                <span class="label">WARDEN_BRIEFING_v{{ libraryStore.wardenReport.version || '1.0' }}</span>
              </div>
              <span class="timestamp">{{ new Date(libraryStore.wardenReport.timestamp).toLocaleString() }}</span>
            </div>
            <div class="briefing-body">
              <pre class="briefing-text">{{ libraryStore.wardenReport.briefing }}</pre>
            </div>
            <div class="briefing-footer">
              <div class="metric">
                <span class="m-label">FILES_SCANNED:</span>
                <span class="m-val">{{ libraryStore.wardenReport.metrics.files_scanned }}</span>
              </div>
              <div class="metric">
                <span class="m-label">INTEGRITY:</span>
                <span class="m-val">{{ libraryStore.wardenReport.metrics.integrity_score }}%</span>
              </div>
            </div>
          </div>
        </Transition>
        
        <!-- Telemetry / Stats Section -->
        <div class="deck-telemetry">
          <!-- Active Telemetry -->
          <Transition name="fade-slide">
            <div v-if="libraryStore.isBulkAnalyzing" class="telemetry-grid glass-sm">
              <div class="tele-item">
                <span class="label">ENGINE_NPS</span>
                <span class="val">{{ Math.round(libraryStore.engineNodesPerSecond / 1000) }}k</span>
              </div>
              <div class="tele-item">
                <span class="label text-rose">BLUNDERS</span>
                <span class="val">{{ libraryStore.blundersFound }}</span>
              </div>
              <div class="tele-item">
                <span class="label text-orange">MISTAKES</span>
                <span class="val">{{ libraryStore.mistakesFound }}</span>
              </div>
              <div class="tele-item">
                <span class="label text-gold">INACCURACY</span>
                <span class="val">{{ libraryStore.inaccuraciesFound }}</span>
              </div>
              <div class="tele-item">
                <span class="label text-teal">BRILLIANT</span>
                <span class="val">{{ libraryStore.brilliantMovesFound }}</span>
              </div>
            </div>
          </Transition>

          <!-- Finished Summary -->
          <Transition name="fade-slide">
            <div v-if="libraryStore.analysisProgress === 100 && !libraryStore.isBulkAnalyzing && libraryStore.totalMovesProcessed > 0" class="summary-grid glass-sm">
              <div class="sum-item">
                <span class="val">{{ libraryStore.totalMovesProcessed }}</span>
                <span class="label">MOVES_PROCESSED</span>
              </div>
              <div class="sum-item">
                <span class="val text-rose">{{ libraryStore.blundersFound }}</span>
                <span class="label">BLUNDERS</span>
              </div>
              <div class="sum-item">
                <span class="val text-orange">{{ libraryStore.mistakesFound }}</span>
                <span class="label">MISTAKES</span>
              </div>
              <div class="sum-item">
                <span class="val text-gold">{{ libraryStore.inaccuraciesFound }}</span>
                <span class="label">INACCURACIES</span>
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
.admin-full-row { grid-column: span 3; }

/* System Header */
.system-header { display: flex; align-items: center; gap: var(--space-4); opacity: 0.6; }
.system-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); }
.system-label { 
  display: flex; align-items: center; gap: var(--space-2); 
  padding: var(--space-1) var(--space-4); border-radius: 100px; 
  font-size: 0.65rem; font-weight: 800; letter-spacing: 0.2em; 
}

/* Intel Deck */
.intel-deck { padding: var(--space-8); border-radius: var(--radius-2xl); transition: all 0.5s var(--ease); }
.intel-deck.is-active { border-color: var(--accent); box-shadow: 0 0 50px rgba(139, 92, 246, 0.15); }
.deck-content { display: flex; flex-direction: column; gap: var(--space-8); }

/* Identity */
.deck-identity { display: flex; align-items: center; gap: var(--space-6); }
.intel-avatar { 
  position: relative; width: 64px; height: 64px; 
  display: flex; align-items: center; justify-content: center; 
  background: rgba(139, 92, 246, 0.1); border-radius: var(--radius-lg);
  border: 1px solid rgba(139, 92, 246, 0.2);
}
.avatar-glow { position: absolute; inset: -10px; background: var(--accent); opacity: 0.2; filter: blur(20px); border-radius: 50%; }
.avatar-icon { font-size: 2rem; z-index: 2; }
.intel-meta h3 { font-size: 1.5rem; letter-spacing: -0.02em; }
.intel-meta p { font-size: 0.75rem; letter-spacing: 0.05em; }

/* Telemetry & Summary */
.deck-telemetry { display: flex; justify-content: space-between; align-items: center; gap: var(--space-10); }
.telemetry-grid, .summary-grid { 
  display: flex; gap: var(--space-8); padding: var(--space-4) var(--space-8); 
  border-radius: var(--radius-xl); border: 1px solid rgba(255,255,255,0.05);
}

.tele-item, .sum-item { display: flex; flex-direction: column; align-items: center; }
.tele-item .label, .sum-item .label { font-size: 0.5rem; font-weight: 900; opacity: 0.5; letter-spacing: 0.1em; }
.tele-item .val, .sum-item .val { font-family: var(--font-mono); font-weight: 800; font-size: 1.1rem; }

/* Controls */
.deck-controls { display: flex; align-items: center; gap: var(--space-8); flex: 1; justify-content: flex-end; }
.deck-controls.is-analyzing { flex-direction: column; align-items: stretch; gap: var(--space-4); max-width: 400px; }

.progress-module { width: 100%; }
.progress-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.7rem; font-weight: 800; font-family: var(--font-mono); }
.progress-track { height: 8px; border-radius: 4px; overflow: hidden; background: rgba(0,0,0,0.3); }
.progress-fill { position: relative; height: 100%; background: var(--accent-gradient); transition: width 0.4s var(--ease); }
.fill-shimmer { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); animation: shimmer 2s infinite; }

.btn-glow { padding: var(--space-3) var(--space-8); font-weight: 800; letter-spacing: 0.1em; }

/* Animations */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.4s var(--ease); }
.fade-slide-enter-from { opacity: 0; transform: translateX(-20px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(20px); }

/* Warden's Briefing */
.warden-briefing-module {
  padding: var(--space-6); border-radius: var(--radius-xl);
  background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.03);
}
.briefing-header { display: flex; justify-content: space-between; margin-bottom: var(--space-4); opacity: 0.8; }
.header-left { display: flex; align-items: center; gap: var(--space-2); }
.status-indicator { width: 8px; height: 8px; border-radius: 50%; background: var(--text-muted); }
.status-indicator.validated { background: var(--teal); box-shadow: 0 0 10px var(--teal); }
.briefing-header .label { font-size: 0.6rem; font-weight: 900; letter-spacing: 0.1em; font-family: var(--font-mono); }
.timestamp { font-size: 0.6rem; font-family: var(--font-mono); opacity: 0.5; }

.briefing-body { 
  max-height: 200px; overflow-y: auto; padding: var(--space-4); 
  background: rgba(0,0,0,0.3); border-radius: var(--radius-md); 
  border: 1px solid rgba(255,255,255,0.02);
}
.briefing-text { 
  white-space: pre-wrap; font-family: var(--font-mono); font-size: 0.8rem; 
  line-height: 1.6; color: rgba(255,255,255,0.8); margin: 0;
}

.briefing-footer { display: flex; gap: var(--space-6); margin-top: var(--space-4); opacity: 0.6; }
.metric { display: flex; align-items: center; gap: var(--space-2); font-family: var(--font-mono); font-size: 0.6rem; }
.m-label { font-weight: 900; }
.m-val { color: var(--accent-bright); font-weight: 800; }

@media (max-width: 1100px) {
  .deck-telemetry { flex-direction: column; align-items: stretch; }
  .telemetry-grid, .summary-grid { justify-content: space-around; }
  .deck-controls { justify-content: center; }
}
</style>
