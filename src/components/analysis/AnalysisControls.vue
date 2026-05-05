<template>
  <div class="analysis-controls">
    <div class="panel-header">
      <div class="engine-info">
        <span class="badge badge-accent">STOCKFISH 16.1</span>
        <span class="depth">Depth {{ currentDepth }}</span>
        
        <div class="header-actions ml-auto">
          <Transition name="fade">
            <button 
              v-if="hasCloudData"
              class="btn btn-xs btn-outline mr-2" 
              @click="$emit('deepScan')" 
              :disabled="isCloudScanning"
              title="Fetch high-depth Cloud Evaluation for this position"
            >
              {{ isCloudScanning ? 'Scanning...' : '☁️ Deep Scan' }}
            </button>
          </Transition>

          <!-- Analysis Visibility Key -->
          <div class="visibility-control-wrap">
            <button 
              class="btn btn-xs btn-square btn-ghost btn-key" 
              :class="{ 'is-active': showVisibilityMenu }"
              @click="showVisibilityMenu = !showVisibilityMenu"
              title="Toggle Analysis Layers"
            >
              🔑
            </button>

            <!-- Click-away overlay -->
            <div v-if="showVisibilityMenu" class="menu-overlay" @click="showVisibilityMenu = false"></div>

            <Transition name="pop-in">
              <div v-if="showVisibilityMenu" class="visibility-menu glass-premium">
                <!-- Caret Arrow -->
                <div class="menu-caret"></div>

                <div class="menu-header">DISPLAY LAYERS</div>
                
                <div class="menu-item">
                  <label class="toggle-row">
                    <span>Suggestions</span>
                    <input type="checkbox" v-model="settings.analysisShowSuggestions" class="toggle toggle-xs">
                  </label>
                </div>

                <div class="menu-item">
                  <label class="toggle-row">
                    <span>Coach's Take</span>
                    <input type="checkbox" v-model="settings.analysisShowCoach" class="toggle toggle-xs">
                  </label>
                </div>

                <div class="menu-item">
                  <label class="toggle-row">
                    <span>Positional Health</span>
                    <input type="checkbox" v-model="settings.analysisShowPositionalHealth" class="toggle toggle-xs">
                  </label>
                </div>

                <div class="menu-item">
                  <label class="toggle-row">
                    <span>Critical Lines</span>
                    <input type="checkbox" v-model="settings.analysisShowCriticalLines" class="toggle toggle-xs">
                  </label>
                </div>

                <div class="menu-divider"></div>

                <div class="menu-item">
                  <label class="toggle-row">
                    <span>Suggestion Arrows</span>
                    <input type="checkbox" v-model="settings.showBestMoveArrow" class="toggle toggle-xs">
                  </label>
                </div>

                <div class="menu-item">
                  <label class="toggle-row">
                    <span>Threat Arrows</span>
                    <input type="checkbox" v-model="settings.showThreatArrow" class="toggle toggle-xs">
                  </label>
                </div>

                <div class="menu-item">
                  <label class="toggle-row">
                    <span>Eval Bar</span>
                    <input type="checkbox" v-model="settings.analysisShowEvalBar" class="toggle toggle-xs">
                  </label>
                </div>
              </div>
            </Transition>
          </div>
        </div>
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
        <div v-if="suggestedMove && settings.analysisShowSuggestions" class="suggestion-card-compact glass-xs">
          <div class="label">BEST</div>
          <div class="val">{{ suggestedMove }}</div>
          <div class="eval" :class="evalNum > 0 ? 'pos' : 'neg'">
            {{ evalNum > 0 ? '+' : '' }}{{ evalNum.toFixed(2) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore'

const settings = useSettingsStore()
const showVisibilityMenu = ref(false)
/**
 * AnalysisControls Component
 * 
 * Logic: Encapsulates the engine status (depth, eval) and game navigation controls.
 * Why: Separates engine/navigation UI from the main analysis orchestrator.
 */

defineProps<{
  currentDepth: number | string
  isCloudScanning: boolean
  hasCloudData: boolean
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

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.visibility-control-wrap {
  position: relative;
}

.btn-key {
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-key.is-active {
  background: var(--accent-main);
  color: white;
  z-index: 102; /* Above overlay */
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: transparent;
  z-index: 100;
}

.visibility-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 210px;
  padding: var(--space-4);
  border-radius: 12px;
  z-index: 101;
  background: rgba(15, 15, 20, 0.9);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(139, 92, 246, 0.1);
}

.menu-caret {
  position: absolute;
  top: -6px;
  right: 12px;
  width: 12px;
  height: 12px;
  background: rgba(15, 15, 20, 0.9);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transform: rotate(45deg);
}

.menu-header {
  font-size: 0.65rem;
  font-weight: 900;
  color: var(--accent-light);
  margin-bottom: var(--space-4);
  letter-spacing: 0.15em;
  opacity: 0.8;
}

.menu-item {
  padding: 6px 0;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: opacity 0.2s;
}

.toggle-row:hover {
  opacity: 0.8;
}

.toggle-row span {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-main);
}

/* Toggle Switch Polish */
.toggle {
  --tglbg: var(--text-muted);
  background-color: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
}

.toggle:checked {
  --tglbg: white;
  background-color: var(--accent-main);
  border-color: var(--accent-light);
}

.menu-divider {
  height: 1px;
  background: var(--glass-border);
  margin: var(--space-2) 0;
}

.pop-in-enter-active,
.pop-in-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.pop-in-enter-from,
.pop-in-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
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
