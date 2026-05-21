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
            :flipped="false" 
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

      <!-- Main Analysis Sidebar -->
      <Transition name="sidebar-entry" appear>
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

// Initialize Pillar Logic
const { engineArrows } = useAnalysisArrows()
const { isCloudScanning, hasCloudData, deepCloudScan, checkAvailability } = useAnalysisCloud()
const { currentViewedMove, currentMoveQuality, selectedMoveLabel } = useAnalysisMoveContext()
const { goToEnd, importPgnStr, loadDemo } = useAnalysisControls()

// Domain Logic Composables
const { metrics, diagnosis } = usePositionalHealth(() => store.fen, () => engineStore.evalNumber)
const { resolvedPlayers, playerNames } = useAnalysisPlayers()
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
</style>
