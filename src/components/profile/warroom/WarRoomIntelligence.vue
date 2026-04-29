<script setup lang="ts">
import { computed } from 'vue'
import { useLibraryStore } from '../../../stores/libraryStore'

const libraryStore = useLibraryStore()

const intelStatusText = computed(() => {
  if (libraryStore.isBulkAnalyzing) return `Analyzing game ${libraryStore.liveAnalyzedCount} of ${libraryStore.games.length}...`
  if (libraryStore.analysisProgress === 100) return 'Vault intelligence fully synthesized.'
  return `${libraryStore.games.length - libraryStore.analyzedGamesCount} games awaiting deep synthesis.`
})

defineEmits(['toggleIntel'])
</script>

<template>
  <div class="admin-full-row mt-10 mb-10">
    <div class="admin-separator">
      <span class="admin-title">System Intelligence</span>
      <div class="admin-line"></div>
    </div>

    <div class="intel-center-bottom glass mt-6" :class="{ 'is-active': libraryStore.isBulkAnalyzing, 'is-finished': libraryStore.analysisProgress === 100 && !libraryStore.isBulkAnalyzing && libraryStore.totalMovesProcessed > 0 }">
      <div class="intel-content">
        <div class="intel-info">
          <span class="intel-icon">{{ libraryStore.analysisProgress === 100 && !libraryStore.isBulkAnalyzing ? '✅' : '🧠' }}</span>
          <div class="intel-text">
            <h3>{{ libraryStore.analysisProgress === 100 && !libraryStore.isBulkAnalyzing ? 'Synthesis Complete' : 'Bulk Intelligence & Pattern Synthesis' }}</h3>
            <p class="muted">{{ intelStatusText }}</p>
          </div>
        </div>
        
        <div class="intel-actions">
          <div v-if="libraryStore.isBulkAnalyzing" class="intel-telemetry-active">
            <div class="telemetry-item">
              <span class="label">NPS</span>
              <span class="val">{{ Math.round(libraryStore.engineNodesPerSecond / 1000) }}k</span>
            </div>
            <div class="telemetry-item">
              <span class="label text-rose">Blunders</span>
              <span class="val">{{ libraryStore.blundersFound }}</span>
            </div>
            <div class="telemetry-item">
              <span class="label" style="color: #fb923c;">Mistakes</span>
              <span class="val">{{ libraryStore.mistakesFound }}</span>
            </div>
            <div class="telemetry-item">
              <span class="label text-gold">Inaccuracy</span>
              <span class="val">{{ libraryStore.inaccuraciesFound }}</span>
            </div>
            <div class="telemetry-item">
              <span class="label text-teal">Brilliant</span>
              <span class="val">{{ libraryStore.brilliantMovesFound }}</span>
            </div>
          </div>

          <div v-if="libraryStore.analysisProgress === 100 && !libraryStore.isBulkAnalyzing && libraryStore.totalMovesProcessed > 0" class="intel-summary-finish">
            <div class="summary-stat">
              <span class="val">{{ libraryStore.totalMovesProcessed }}</span>
              <span class="label">Moves Processed</span>
            </div>
            <div class="summary-stat">
              <span class="val text-rose">{{ libraryStore.blundersFound }}</span>
              <span class="label">Blunders</span>
            </div>
            <div class="summary-stat">
              <span class="val" style="color: #fb923c;">{{ libraryStore.mistakesFound }}</span>
              <span class="label">Mistakes</span>
            </div>
            <div class="summary-stat">
              <span class="val text-gold">{{ libraryStore.inaccuraciesFound }}</span>
              <span class="label">Inaccuracies</span>
            </div>
          </div>

          <div class="intel-main-action" :class="{ 'is-analyzing': libraryStore.isBulkAnalyzing }">
            <div v-if="libraryStore.isBulkAnalyzing" class="intel-progress-container-v2">
              <div class="intel-progress-bar-v2">
                <div class="intel-progress-fill-v2" :style="{ width: libraryStore.analysisProgress + '%' }"></div>
              </div>
              <div class="intel-progress-meta">
                <span class="muted">{{ Math.round(libraryStore.analysisProgress) }}% Complete</span>
                <span class="text-accent">ETA: {{ libraryStore.estimatedTimeRemaining || '--:--' }}</span>
              </div>
            </div>
            <button @click="$emit('toggleIntel')" class="btn" :class="libraryStore.isBulkAnalyzing ? 'btn-ghost' : 'btn-primary'">
              {{ libraryStore.isBulkAnalyzing ? 'Pause Analysis' : (libraryStore.analysisProgress === 100 ? 'Restart Synthesis' : 'Start Synthesis') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-full-row { grid-column: span 3; }
.admin-separator { position: relative; display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-6); }
.admin-title { position: absolute; background: var(--bg-surface); padding: 0 var(--space-4); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; color: var(--text-muted); z-index: 2; }
.admin-line { width: 100%; height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); }

.intel-center-bottom {
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(45, 212, 191, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.intel-center-bottom.is-active { border-color: var(--accent); box-shadow: 0 0 32px rgba(139, 92, 246, 0.2); }
.intel-content { display: flex; justify-content: space-between; align-items: center; gap: var(--space-8); }
.intel-info { display: flex; align-items: center; gap: var(--space-5); }
.intel-icon { font-size: 3rem; }
.intel-actions { display: flex; align-items: center; gap: var(--space-8); flex: 1; justify-content: flex-end; }

.intel-telemetry-active { display: flex; gap: var(--space-6); padding: var(--space-3) var(--space-6); background: rgba(0,0,0,0.2); border-radius: var(--radius-md); }
.telemetry-item { display: flex; flex-direction: column; align-items: center; }
.telemetry-item .label { font-size: 0.55rem; font-weight: 800; opacity: 0.6; }
.telemetry-item .val { font-family: var(--font-mono); font-weight: 800; }

.intel-summary-finish { display: flex; gap: var(--space-8); }
.summary-stat { display: flex; flex-direction: column; align-items: center; }
.summary-stat .label { font-size: 0.55rem; font-weight: 800; opacity: 0.6; }
.summary-stat .val { font-family: var(--font-mono); font-weight: 800; font-size: 1.1rem; }

.intel-main-action { display: flex; align-items: center; gap: var(--space-6); min-width: 240px; }
.intel-main-action.is-analyzing { flex-direction: column; align-items: flex-end; gap: var(--space-3); }

.intel-progress-container-v2 { width: 100%; }
.intel-progress-bar-v2 { height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
.intel-progress-fill-v2 { height: 100%; background: var(--accent-gradient); transition: width 0.4s ease; }
.intel-progress-meta { display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.75rem; font-family: var(--font-mono); font-weight: 700; }

</style>
