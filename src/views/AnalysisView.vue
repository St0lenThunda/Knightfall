<template>
  <div class="page analysis-page">
    <AnalysisHeader 
      :isAuthenticated="userStore.isAuthenticated"
      @loadDemo="loadDemo"
      @importPgn="showImportModal = true"
      @editInfo="showMetadataEditor = true"
    />

    <!-- Loading overlay -->
    <AnalysisLoadingOverlay :show="isLoading" />

    <div class="analysis-layout" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <!-- Board column -->
      <Transition name="board-entry" appear>
        <div v-if="hasGame" class="board-container" key="active-board">
          <EvaluationHeader 
            :playerNames="playerNames"
            :evalNum="evalNum"
            :evalPercent="evalPercent"
            :hasGame="hasGame"
            :moveQuality="currentMoveQuality"
            @badge-click="handleBadgeClick"
          />

          <ChessBoard 
            :flipped="isUserBlack" 
            :interactive="false"
            :arrows="engineArrows" 
            :moveQuality="currentMoveQuality"
            :lastMove="currentViewedMove" 
            @badge-click="handleBadgeClick"
          />
        </div>
        <div v-else class="board-container empty-board" key="empty-board">
          <AnalysisEmptyState @importPgn="showImportModal = true" />
        </div>
      </Transition>

      <!-- Desktop Sidebar -->
      <Transition name="sidebar-entry" appear v-if="!isMobile">
        <AnalysisSidebar 
          v-if="hasGame"
          v-model:isCollapsed="isSidebarCollapsed"
          :metrics="metrics"
          :diagnosis="diagnosis"
          @showLegend="showHealthLegend = true"
        >
        <template #default="{ activeTab }">
          <Transition name="fade-slide" mode="out-in">
            <!-- TAB 1: INSIGHTS -->
            <div v-if="activeTab === 'insights'" class="tab-pane-content">
              <AnalysisControls 
                :currentDepth="engineStore.currentDepth"
                :isCloudScanning="isCloudScanning"
                :hasCloudData="hasCloudData"
                :isPlaying="isPlaying"
                :pauseReason="pauseReason"
                :selectedMoveLabel="selectedMoveLabel"
                :suggestedMove="engineStore.suggestedMove"
                :evalNum="evalNum"
                :multiPvs="engineStore.multiPvs"
                @deepScan="deepCloudScan"
                @togglePlayback="togglePlayback"
                @firstMove="store.goToMove(-1)"
                @prevMove="store.stepBack()"
                @nextMove="store.stepForward()"
                @lastMove="goToEnd()"
              />

              <!-- Scrollable Body -->
              <div class="sidebar-scrollable-content neon-scroll">
                <div class="sticky-coach-wrap glass-sm">
                  <CoachPanel @update:tag="handleTagUpdate" />
                </div>

                <div class="analysis-details-wrap p-4">
                  <CriticalLines :multiPvs="engineStore.multiPvs" />
                </div>
                
                <div class="analysis-details-wrap p-4">
                  <div class="history-integration">
                    <div class="label mb-2">GAME HISTORY</div>
                    <MoveHistory hideHeader />
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB 2: REVIEW -->
            <div v-else-if="activeTab === 'review'" class="tab-pane-content">
              <div class="sidebar-scrollable-content neon-scroll">
                <div class="review-pane-padding">
                  <GameAnalysisTable 
                    :moves="store.moveHistory"
                    :whitePlayer="resolvedPlayers.white"
                    :blackPlayer="resolvedPlayers.black"
                  />
                  
                  <div class="review-tips mt-6 glass-xs p-4">
                    <h4 class="text-accent mb-2">💡 Oracle's Tip</h4>
                    <p class="muted" style="font-size: 0.85rem;">
                      Focus on eliminating your <span class="text-rose font-bold">Blunders</span> first. A game with zero blunders is often more effective than one with multiple brilliant moves.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB 3: MORTAL -->
            <div v-else class="tab-pane-content">
              <div class="sidebar-scrollable-content neon-scroll p-4">
                <MortalGraph :topMoves="engineStore.multiPvs" />
                
                <div class="mortal-explanation mt-6 glass-xs p-4 border-t border-glass">
                  <h4 class="text-xs font-bold mb-2 opacity-50">HOW TO READ</h4>
                  <p class="muted text-xs leading-relaxed">
                    Higher bars indicate moves that are <span class="text-accent">Psychologically Natural</span> for that archetype. Engine-only moves will show high eval but low probability across all archetypes.
                  </p>
                </div>
              </div>
            </div>
          </Transition>
        </template>
        </AnalysisSidebar>
        <div v-else class="sidebar-placeholder"></div>
      </Transition>

      <!-- Mobile Bottom Sheet -->
      <BottomSheet v-else-if="hasGame" title="Analysis" :peekHeight="80" defaultPosition="peek">
        <template #peek>
          <div class="mobile-peek-bar">
            <!-- Mobile Playback navigation buttons in peek bar -->
            <div class="mobile-playback-controls">
              <button class="btn btn-ghost btn-xs" @click.stop="store.goToMove(-1)">⏮</button>
              <button class="btn btn-ghost btn-xs" @click.stop="store.stepBack()">⏪</button>
              <button class="btn btn-ghost btn-xs" @click.stop="togglePlayback()">
                {{ isPlaying ? '⏸' : '▶' }}
              </button>
              <button class="btn btn-ghost btn-xs" @click.stop="store.stepForward()">⏩</button>
              <button class="btn btn-ghost btn-xs" @click.stop="goToEnd()">⏭</button>
            </div>
            <span class="eval-badge" :class="evalNum > 0 ? 'positive' : 'negative'">
              {{ evalNum > 0 ? '+' : '' }}{{ evalNum.toFixed(1) }}
            </span>
          </div>
        </template>

        <div class="mobile-analysis-sheet-content">
          <!-- Mobile Tabs Navigation -->
          <nav class="mobile-tabs">
            <button 
              class="tab-btn" 
              :class="{ active: activeMobileTab === 'insights' }" 
              @click="activeMobileTab = 'insights'"
            >
              🧠 Insights
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeMobileTab === 'review' }" 
              @click="activeMobileTab = 'review'"
            >
              📊 Review
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeMobileTab === 'mortal' }" 
              @click="activeMobileTab = 'mortal'"
            >
              👤 Mortal
            </button>
          </nav>

          <div class="mobile-tab-pane mt-4">
            <!-- TAB 1: INSIGHTS -->
            <div v-if="activeMobileTab === 'insights'" class="tab-pane-content">
              <AnalysisControls 
                :currentDepth="engineStore.currentDepth"
                :isCloudScanning="isCloudScanning"
                :hasCloudData="hasCloudData"
                :isPlaying="isPlaying"
                :pauseReason="pauseReason"
                :selectedMoveLabel="selectedMoveLabel"
                :suggestedMove="engineStore.suggestedMove"
                :evalNum="evalNum"
                :multiPvs="engineStore.multiPvs"
                @deepScan="deepCloudScan"
                @togglePlayback="togglePlayback"
                @firstMove="store.goToMove(-1)"
                @prevMove="store.stepBack()"
                @nextMove="store.stepForward()"
                @lastMove="goToEnd()"
              />

              <div class="sticky-coach-wrap glass-sm mt-3">
                <CoachPanel @update:tag="handleTagUpdate" />
              </div>

              <div class="analysis-details-wrap p-2 mt-3">
                <CriticalLines :multiPvs="engineStore.multiPvs" />
              </div>
              
              <div class="analysis-details-wrap p-2 mt-3">
                <div class="history-integration">
                  <div class="label mb-2">GAME HISTORY</div>
                  <MoveHistory hideHeader />
                </div>
              </div>
            </div>

            <!-- TAB 2: REVIEW -->
            <div v-else-if="activeMobileTab === 'review'" class="tab-pane-content">
              <GameAnalysisTable 
                :moves="store.moveHistory"
                :whitePlayer="resolvedPlayers.white"
                :blackPlayer="resolvedPlayers.black"
              />
              <div class="review-tips mt-4 glass-xs p-4">
                <h4 class="text-accent mb-2">💡 Oracle's Tip</h4>
                <p class="muted" style="font-size: 0.85rem;">
                  Focus on eliminating your <span class="text-rose font-bold">Blunders</span> first.
                </p>
              </div>
            </div>

            <!-- TAB 3: MORTAL -->
            <div v-else-if="activeMobileTab === 'mortal'" class="tab-pane-content">
              <MortalGraph :topMoves="engineStore.multiPvs" />
              <div class="mortal-explanation mt-4 glass-xs p-4 border-t border-glass">
                <h4 class="text-xs font-bold mb-2 opacity-50">HOW TO READ</h4>
                <p class="muted text-xs leading-relaxed">
                  Higher bars indicate moves that are <span class="text-accent">Psychologically Natural</span> for that archetype.
                </p>
              </div>
            </div>
          </div>

          <!-- Positional Health Footer inside bottom sheet -->
          <footer class="mobile-sheet-footer glass-sm mt-6">
            <div class="footer-header" @click="showHealthLegend = true">
              <span class="title">POSITIONAL HEALTH</span>
              <span class="info-icon">ⓘ</span>
            </div>
            
            <div class="health-bars">
              <div class="health-item" :title="diagnosis.material">
                <div class="label">MAT</div>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: metrics.material + '%', background: 'var(--accent-bright)' }"></div>
                </div>
              </div>
              <div class="health-item" :title="diagnosis.activity">
                <div class="label">ACT</div>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: metrics.activity + '%', background: 'var(--teal)' }"></div>
                </div>
              </div>
              <div class="health-item" :title="diagnosis.safety">
                <div class="label">KGS</div>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: metrics.safety + '%', background: 'var(--rose)' }"></div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </BottomSheet>
    </div>

    <!-- Health Legend Modal -->
    <HealthLegendModal 
      :show="showHealthLegend"
      :diagnosis="diagnosis"
      @close="showHealthLegend = false"
    />

    <!-- Metadata Editor Modal -->
    <MetadataEditorModal 
      :show="showMetadataEditor"
      @close="showMetadataEditor = false"
    />

    <!-- Import PGN Modal -->
    <ImportPgnModal 
      :show="showImportModal"
      @close="showImportModal = false"
      @import="importPgnStr"
    />

    <!-- Deterministic Tag Popup (Oracle's Insight) -->
    <OracleInsightModal 
      :show="showTagPopup"
      :tag="currentTag"
      :suggestedMove="engineStore.suggestedMove"
      @close="showTagPopup = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useEngineStore } from '../stores/engineStore'
import { useUserStore } from '../stores/userStore'
import { usePositionalHealth } from '../composables/usePositionalHealth'
import { useMobileDetect } from '../composables/useMobileDetect'
import BottomSheet from '../components/common/BottomSheet.vue'
import { useAnalysisSession } from '../composables/useAnalysisSession'
import { useAnalysisPlayers } from '../composables/useAnalysisPlayers'
import type { TaggedMistake } from '../services/taggingService'

// Pillar Components
import ChessBoard from '../components/ChessBoard.vue'
import CoachPanel from '../components/CoachPanel.vue'
import MoveHistory from '../components/MoveHistory.vue'
import GameAnalysisTable from '../components/GameAnalysisTable.vue'
import EvaluationHeader from '../components/analysis/EvaluationHeader.vue'
import AnalysisSidebar from '../components/analysis/AnalysisSidebar.vue'
import AnalysisControls from '../components/analysis/AnalysisControls.vue'
import MortalGraph from '../components/analysis/MortalGraph.vue'
import OracleInsightModal from '../components/analysis/OracleInsightModal.vue'
import HealthLegendModal from '../components/analysis/HealthLegendModal.vue'
import AnalysisEmptyState from '../components/analysis/AnalysisEmptyState.vue'
import CriticalLines from '../components/analysis/CriticalLines.vue'
import AnalysisLoadingOverlay from '../components/analysis/AnalysisLoadingOverlay.vue'
import AnalysisHeader from '../components/analysis/AnalysisHeader.vue'
import MetadataEditorModal from '../components/analysis/MetadataEditorModal.vue'
import ImportPgnModal from '../components/analysis/ImportPgnModal.vue'

// Pillar Composables
import { useAnalysisArrows } from '../composables/analysis/useAnalysisArrows'
import { useAnalysisCloud } from '../composables/analysis/useAnalysisCloud'
import { useAnalysisMoveContext } from '../composables/analysis/useAnalysisMoveContext'
import { useAnalysisControls } from '../composables/analysis/useAnalysisControls'

// Core Stores
const store = useGameStore()
const engineStore = useEngineStore()
const userStore = useUserStore()

// Base UI State
const isLoading = ref(true)
const showHealthLegend = ref(false)
const showMetadataEditor = ref(false)
const showImportModal = ref(false)
const isSidebarCollapsed = ref(false)
const showTagPopup = ref(false)
const currentTag = ref<TaggedMistake | null>(null)

const { isMobile } = useMobileDetect()
const activeMobileTab = ref('insights')

// Initialize Pillar Logic
const { engineArrows } = useAnalysisArrows()
const { isCloudScanning, hasCloudData, deepCloudScan, checkAvailability } = useAnalysisCloud()
const { currentViewedMove, currentMoveQuality, selectedMoveLabel } = useAnalysisMoveContext()
const { goToEnd, importPgnStr, loadDemo } = useAnalysisControls()

// Domain Logic Composables
const { metrics, diagnosis } = usePositionalHealth(() => store.fen, () => engineStore.evalNumber)
const { resolvedPlayers, playerNames, isUserBlack } = useAnalysisPlayers()
const { isPlaying, pauseReason, togglePlayback, initializeSession } = useAnalysisSession()

// Watch for FEN changes to update cloud availability
watch(() => store.fen, () => {
  checkAvailability()
}, { immediate: true })

// Derived Data: In analysis, we always show the board if a session is initialized
const hasGame = computed(() => store.moveHistory.length > 0 || store.mode === 'analysis')
const evalNum = computed(() => engineStore.evalNumber)
const evalPercent = computed(() => engineStore.evalPercent)

/**
 * Event Handlers
 */
function handleTagUpdate(tag: TaggedMistake | null) {
  currentTag.value = tag
}

function handleBadgeClick() {
  if (currentTag.value) {
    showTagPopup.value = true
  }
}

// Close popup when moving to a different position
watch(() => store.viewIndex, () => {
  showTagPopup.value = false
})

onMounted(async () => {
  await initializeSession()
  isLoading.value = false
})

onUnmounted(() => {
  engineStore.stop()
})
</script>

<style scoped>
.analysis-layout {
  display: flex;
  justify-content: center;
  gap: var(--space-8);
  align-items: center;
  padding: var(--space-4);
  max-width: 100%;
  margin: 0 auto;
  height: calc(100vh - 100px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.analysis-layout.sidebar-collapsed { gap: 0; padding: var(--space-2); }

.board-container {
  flex: 1;
  width: 100%;
  max-width: 75vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar-collapsed .board-container { max-width: 90vh; }

.history-integration { margin-top: var(--space-4); }
.history-integration .label { padding: 0 var(--space-4); margin-bottom: var(--space-2); font-size: 0.65rem; color: var(--text-muted); font-weight: 800; }

.tab-pane-content { height: 100%; display: flex; flex-direction: column; }
.sidebar-scrollable-content { flex: 1; overflow-y: auto; position: relative; }

.sticky-coach-wrap {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: var(--space-4);
  background: rgba(10, 10, 12, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--glass-border);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.analysis-details-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.review-pane-padding { padding: var(--space-4); }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-10px); }

@media (max-width: 768px) {
  .analysis-layout {
    flex-direction: column;
    height: auto;
    overflow: visible;
    padding: var(--space-2);
    padding-bottom: 90px;
    gap: var(--space-4);
  }

  .board-container {
    max-width: 100vw;
  }
}

/* ─── MOBILE ANALYSIS SHEET TABS ─── */
.mobile-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  padding: 2px;
  margin-bottom: var(--space-4);
}

.mobile-tabs .tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: var(--space-2) 0;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s var(--ease);
}

.mobile-tabs .tab-btn.active {
  background: rgba(255, 255, 255, 0.07);
  color: var(--accent-bright);
  text-shadow: var(--shadow-glow);
}

.mobile-playback-controls {
  display: flex;
  gap: var(--space-1);
}

.mobile-playback-controls .btn {
  min-width: unset;
  min-height: unset;
  padding: var(--space-1) var(--space-2);
  font-size: 0.9rem;
}

.eval-badge {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 700;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.05);
}

.eval-badge.positive {
  color: var(--accent-bright);
}

.eval-badge.negative {
  color: var(--text-muted);
}

.mobile-sheet-footer {
  padding: var(--space-4);
  border-radius: var(--radius-md);
}

.mobile-sheet-footer .footer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-muted);
  cursor: pointer;
  margin-bottom: var(--space-3);
}

.mobile-sheet-footer .health-bars {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.mobile-sheet-footer .health-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.mobile-sheet-footer .health-item .label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 800;
  width: 28px;
}

.mobile-sheet-footer .bar-track {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.mobile-sheet-footer .bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s var(--ease);
}
</style>
