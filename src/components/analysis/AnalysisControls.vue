<template>
  <div class="analysis-controls">
    <div class="panel-header">
      <div class="engine-info">
        <span class="badge badge-accent">STOCKFISH 16.1</span>
        <span class="depth">Depth {{ currentDepth }}</span>
        <button 
          class="btn btn-xs btn-outline ml-auto" 
          @click="$emit('deepScan')" 
          :disabled="isCloudScanning"
          title="Fetch high-depth Cloud Evaluation for this position"
        >
          {{ isCloudScanning ? 'Scanning...' : '☁️ Deep Scan' }}
        </button>
      </div>

      <div class="nav-controls-minimal mt-4">
        <button class="nav-btn-sm" @click="goToFirst" title="First Move">«</button>
        <button class="nav-btn-sm" @click="stepBack" title="Previous Move">‹</button>
        
        <button 
          class="nav-btn-sm btn-play-highlights" 
          :class="{ 'is-playing': isPlaying }" 
          @click="$emit('togglePlayback')" 
          :title="isPlaying ? 'Stop' : 'Play Highlights'"
        >
          {{ isPlaying ? '⏹' : '▶' }}
        </button>

        <Transition name="fade">
          <div v-if="!isPlaying && pauseReason" class="pause-indicator-badge" :style="{ background: pauseReason.color }">
            <span class="icon">{{ pauseReason.icon }}</span>
            <span class="label">{{ pauseReason.label.toUpperCase() }}</span>
          </div>
        </Transition>

        <div class="move-indicator">{{ selectedMoveLabel }}</div>
        <button class="nav-btn-sm" @click="stepForward()" title="Next Move">›</button>
        <button class="nav-btn-sm" @click="goToLast()" title="Last Move">»</button>
      </div>

      <div class="sticky-analysis-metrics mt-4">
        <div v-if="suggestedMove" class="suggestion-card-compact glass-xs">
          <div class="label">BEST</div>
          <div class="val">{{ suggestedMove }}</div>
          <div class="eval" :class="evalNum > 0 ? 'pos' : 'neg'">
            {{ evalNum > 0 ? '+' : '' }}{{ evalNum.toFixed(2) }}
          </div>
        </div>

        <div v-if="multiPvs.length > 1" class="alt-lines-compact glass-xs">
          <div class="label">CRITICAL LINES</div>
          <div class="lines">
            <div v-for="alt in multiPvs.slice(1, 3)" :key="alt.id" class="mini-line">
              <span class="score">{{ alt.score }}</span>
              <span class="moves">{{ alt.moves.slice(0, 3).join(' ') }}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AnalysisControls Component
 * 
 * Logic: Encapsulates the engine status (depth, eval) and game navigation controls.
 * Why: Separates engine/navigation UI from the main analysis orchestrator.
 */

defineProps<{
  currentDepth: number | string
  isCloudScanning: boolean
  isPlaying: boolean
  pauseReason: any | null
  selectedMoveLabel: string
  suggestedMove: string | null
  evalNum: number
  multiPvs: any[]
}>()

const emit = defineEmits<{
  (e: 'deepScan'): void
  (e: 'togglePlayback'): void
  (e: 'firstMove'): void
  (e: 'prevMove'): void
  (e: 'nextMove'): void
  (e: 'lastMove'): void
}>()

const goToFirst = () => emit('firstMove')
const stepBack = () => emit('prevMove')
const stepForward = () => emit('nextMove')
const goToLast = () => emit('lastMove')

</script>

<style scoped>
.analysis-controls {
  width: 100%;
}

.panel-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--glass-border);
}

.engine-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
}

.nav-controls-minimal {
  display: flex;
  gap: var(--space-1);
  align-items: center;
}

.nav-btn-sm {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: var(--text-main);
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.nav-btn-sm:hover {
  background: var(--glass-hover);
  border-color: var(--accent-main);
}

.btn-play-highlights.is-playing {
  background: var(--accent-main);
  color: white;
  animation: pulse-glow 2s infinite;
}

.pause-indicator-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 800;
  color: white;
}

.move-indicator {
  flex: 1;
  text-align: center;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--accent-light);
}

.sticky-analysis-metrics {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.suggestion-card-compact {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  gap: 12px;
}

.suggestion-card-compact .label {
  font-size: 0.6rem;
  font-weight: 800;
  color: var(--accent-main);
  letter-spacing: 1px;
}

.suggestion-card-compact .val {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 1rem;
}

.suggestion-card-compact .eval {
  margin-left: auto;
  font-weight: 800;
  font-size: 0.85rem;
}

.pos { color: var(--teal); }
.neg { color: var(--rose); }

.alt-lines-compact {
  padding: 8px 12px;
  border-radius: 8px;
}

.alt-lines-compact .label {
  font-size: 0.6rem;
  font-weight: 800;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.mini-line {
  display: flex;
  gap: 8px;
  font-size: 0.75rem;
  font-family: 'Inter', sans-serif;
}

.mini-line .score {
  font-weight: 700;
  color: var(--accent-light);
  min-width: 30px;
}

.mini-line .moves {
  color: var(--text-muted);
}

@keyframes pulse-glow {
  0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(124, 58, 237, 0); }
  100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
}
</style>
