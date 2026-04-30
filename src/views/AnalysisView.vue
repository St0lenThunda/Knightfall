<template>
  <div class="page analysis-page">
    <AnalysisHeader 
      :isAuthenticated="userStore.isAuthenticated"
      @loadDemo="loadDemo"
      @importPgn="importPgn"
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
          <AnalysisEmptyState @importPgn="importPgn" />
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
                :isPlaying="isPlaying"
                :pauseReason="pauseReason"
                :selectedMoveLabel="selectedMoveLabel"
                :suggestedMove="engineStore.suggestedMove"
                :evalNum="evalNum"
                :multiPvs="engineStore.multiPvs"
                @deepScan="deepCloudScan"
                @togglePlayback="togglePlayback"
                @firstMove="store.goToMove(0)"
                @prevMove="store.stepBack()"
                @nextMove="store.stepForward()"
                @lastMove="goToEnd()"
              />

              <!-- Scrollable Body -->
              <div class="sidebar-scrollable-content neon-scroll">
                <CoachPanel @update:tag="handleTagUpdate" />
                <div class="history-integration mt-4">
                  <div class="label px-4 mb-2">GAME HISTORY</div>
                  <MoveHistory hideHeader />
                </div>
              </div>
            </div>

            <!-- TAB 2: REVIEW -->
            <div v-else class="tab-pane-content">
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
import { useUiStore } from '../stores/uiStore'
import { useSettingsStore } from '../stores/settingsStore'
import { getMoveQuality } from '../utils/analysisUtils'
import { usePositionalHealth } from '../composables/usePositionalHealth'
import { useAnalysisSession } from '../composables/useAnalysisSession'
import { useAnalysisPlayers } from '../composables/useAnalysisPlayers'
import type { TaggedMistake } from '../services/taggingService'

// Sub-components
import ChessBoard from '../components/ChessBoard.vue'
import CoachPanel from '../components/CoachPanel.vue'
import MoveHistory from '../components/MoveHistory.vue'
import GameAnalysisTable from '../components/GameAnalysisTable.vue'
import EvaluationHeader from '../components/analysis/EvaluationHeader.vue'
import AnalysisSidebar from '../components/analysis/AnalysisSidebar.vue'
import AnalysisControls from '../components/analysis/AnalysisControls.vue'
import OracleInsightModal from '../components/analysis/OracleInsightModal.vue'
import HealthLegendModal from '../components/analysis/HealthLegendModal.vue'
import AnalysisEmptyState from '../components/analysis/AnalysisEmptyState.vue'
import AnalysisLoadingOverlay from '../components/analysis/AnalysisLoadingOverlay.vue'
import AnalysisHeader from '../components/analysis/AnalysisHeader.vue'

// Board Arrow Definition
import { type ArrowDef } from '../components/board/ArrowLayer.vue'

const store = useGameStore()
const engineStore = useEngineStore()
const userStore = useUserStore()
const uiStore = useUiStore()
const settings = useSettingsStore()

const isLoading = ref(true)
const showHealthLegend = ref(false)
const isSidebarCollapsed = ref(false)

// Composables
const { metrics, diagnosis } = usePositionalHealth(() => store.fen, () => engineStore.evalNumber)
const { resolvedPlayers, playerNames } = useAnalysisPlayers()
const { isPlaying, pauseReason, togglePlayback, initializeSession } = useAnalysisSession()


const showTagPopup = ref(false)
const currentTag = ref<TaggedMistake | null>(null)

function handleTagUpdate(tag: TaggedMistake | null) {
  currentTag.value = tag
}

function handleBadgeClick() {
  // The deterministicTag is already stored in currentTag via CoachPanel updates
  if (currentTag.value) {
    showTagPopup.value = true
  }
}

// Close popup when moving to a different position
watch(() => store.viewIndex, () => {
  showTagPopup.value = false
})




// Deterministic seed placeholder
// const gameSeed = computed(() => ...)

const engineArrows = computed<ArrowDef[]>(() => {
  const arrows: ArrowDef[] = []
  if (settings.showBestMoveArrow && engineStore.suggestedMove) {
    const sm = engineStore.suggestedMove
    if (sm && sm.length >= 4) {
      arrows.push({ from: sm.slice(0, 2), to: sm.slice(2, 4), type: 'suggestion' })
    }
  }
  if (settings.showBestMoveArrow && engineStore.multiPvs.length > 1) {
    engineStore.multiPvs.slice(1, 3).forEach(alt => {
      if (alt?.moves?.[0]?.length >= 4) {
        arrows.push({ from: alt.moves[0].slice(0, 2), to: alt.moves[0].slice(2, 4), type: 'suggestion-alt' })
      }
    })
  }
  if (settings.showThreatArrow && engineStore.pv.length > 1) {
    const threatUci = engineStore.pv[1]
    if (threatUci?.length >= 4) {
      arrows.push({ from: threatUci.slice(0, 2), to: threatUci.slice(2, 4), type: 'threat' })
    }
  }
  return arrows
})

/**
 * Resolved Move Context for ChessBoard.
 * We pass the viewed move as the 'lastMove' to the board so indicators match the history position.
 */
const currentViewedMove = computed(() => {
  const idx = store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex
  return store.moveHistory[idx] || null
})

const currentMoveQuality = computed(() => {
  const idx = store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex
  const move = store.moveHistory[idx]
  if (!move) return null
  return getMoveQuality(move, idx, store.moveHistory)
})



const selectedMove = computed(() => {
  if (!hasGame.value) return null
  const idx = store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex
  return store.moveHistory[idx] ?? null
})

const selectedMoveLabel = computed(() => {
  if (!selectedMove.value) return 'Start Position'
  const m = selectedMove.value
  return `${m.moveNumber}${m.moveNumber % 1 === 0 ? '.' : '...'} ${m.san}`
})

// askCoach has been extracted to CoachPanel.vue
const hasGame = computed(() => store.moveHistory.length > 0)
const evalNum = computed(() => engineStore.evalNumber)
const evalPercent = computed(() => engineStore.evalPercent)

onMounted(async () => {
  await initializeSession()
  isLoading.value = false
})


onUnmounted(() => {
  engineStore.stop()
})

function goToEnd() {
  store.viewIndex = -1
  if (store.moveHistory.length > 0) store.chess.load(store.moveHistory[store.moveHistory.length - 1].fen)
}

function importPgnStr(pgn: string) {
  store.loadPgn(pgn, 'analysis')
}

function importPgn() {
  const pgn = prompt('Paste your PGN text here:')
  if (pgn) importPgnStr(pgn)
}

function loadDemo() {
  importPgnStr('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6')
}


import { fetchCloudEval } from '../api/lichessApi'

const isCloudScanning = ref(false)

async function deepCloudScan() {
  if (isCloudScanning.value) return
  isCloudScanning.value = true
  uiStore.addToast('Initiating Deep Cloud Scan...', 'info')
  
  try {
    const fen = store.fen
    const cloudData = await fetchCloudEval(fen)
    
    if (cloudData && cloudData.pvs && cloudData.pvs.length > 0) {
      engineStore.stop() // Stop local calculation
      
      const topPv = cloudData.pvs[0]
      // Inject cloud accuracy directly into the engine's reactive state
      engineStore.evalScoreCp = topPv.cp || 0
      engineStore.evalMate = topPv.mate || null
      engineStore.currentDepth = cloudData.depth || 40
      engineStore.bestMove = topPv.moves?.split(' ')[0] || ''
      engineStore.pv = topPv.moves?.split(' ') || []
      engineStore.isAnalyzing = false
      
      uiStore.addToast(`Cloud Scan Complete: Depth ${cloudData.depth} evaluation injected.`, 'success')
    } else {
      uiStore.addToast('No Cloud Eval found for this position.', 'warning')
    }
  } catch (err) {
    uiStore.addToast('Deep Scan aborted (Lichess Rate Limit).', 'error')
  } finally {
    isCloudScanning.value = false
  }
}

</script>

<style scoped>



/* Sidebar Quality Mini Badge */
.quality-badge-mini {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0,0,0,0.3);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  border: 1px solid var(--q-color);
}
.quality-badge-mini .q-icon { font-size: 0.7rem; font-weight: 900; color: var(--q-color); }
.quality-badge-mini .q-label { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; color: white; }




/* ─── ANALYSIS LAB LAYOUT (AD-MIRROR) ─── */
.analysis-layout {
  display: flex;
  justify-content: center;
  gap: var(--space-8);
  align-items: center; /* Center vertically for better balance */
  padding: var(--space-4);
  max-width: 100%;
  margin: 0 auto;
  height: calc(100vh - 100px); /* Fixed height to prevent page scrolling */
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
.analysis-layout.sidebar-collapsed {
  gap: 0;
  padding: var(--space-2);
}

.board-container {
  flex: 1;
  width: 100%;
  max-width: 75vh; /* Limit size based on viewport height to prevent scrolling */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar-collapsed .board-container {
  max-width: 90vh; /* Allow larger board when sidebar is gone */
}


.nav-controls-minimal {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  background: rgba(0,0,0,0.2);
  padding: 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.nav-btn-sm {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-primary);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.nav-btn-sm:hover { 
  background: var(--accent); 
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}
.btn-play-highlights {
  background: rgba(139, 92, 246, 0.1);
  color: var(--accent);
  border-color: var(--accent-dim);
  font-size: 0.9rem;
}
.btn-play-highlights.is-playing {
  background: var(--accent);
  color: white;
  animation: pulse-glow 2s infinite;
}
@keyframes pulse-glow {
  0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
}

.pause-indicator-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 0.65rem;
  font-weight: 900;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.2);
  white-space: nowrap;
  animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.pause-indicator-badge .icon { font-size: 0.8rem; }

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
}

.move-indicator { 
  font-family: var(--font-mono); 
  font-size: 0.8rem; 
  font-weight: 800; 
  color: var(--accent-bright); 
  min-width: 90px; 
  text-align: center; 
  letter-spacing: 0.05em;
}

/* Floating Training Slide-out */
.training-slide-out-wrapper {
  position: absolute;
  right: 0;
  top: 150px;
  z-index: 50;
  display: flex;
  justify-content: flex-end;
  pointer-events: none;
}

.training-indicator-pill {
  pointer-events: auto;
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-right: none;
  padding: 8px 12px;
  border-radius: 24px 0 0 24px;
  box-shadow: -10px 0 30px rgba(0,0,0,0.4);
  backdrop-filter: blur(12px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  max-width: 44px;
}

.training-indicator-pill:hover {
  max-width: 300px;
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(139,92,246,0.1) 100%);
  border-color: var(--accent-dim);
}

.training-indicator-pill .icon {
  font-size: 1.2rem;
  min-width: 24px;
}

.slide-content {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-left: var(--space-3);
  opacity: 0;
  transform: translateX(20px);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.training-indicator-pill:hover .slide-content {
  opacity: 1;
  transform: translateX(0);
}

.slide-content .text {
  display: flex;
  flex-direction: column;
}

.slide-content .text strong {
  font-size: 0.8rem;
  color: var(--rose);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.slide-content .text span {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.suggestion-card {
  padding: var(--space-5);
  border-radius: var(--radius-md);
  text-align: center;
  border: 1px solid var(--accent-dim);
  background: rgba(139,92,246,0.03);
}
.suggestion-card .label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); margin-bottom: 4px; }
.suggestion-card .move-val { font-size: 1.8rem; font-weight: 900; color: white; letter-spacing: 1px; }
.suggestion-card .eval-val { font-family: var(--font-mono); font-weight: 700; margin-top: 4px; }
.eval-val.pos { color: var(--green); }
.eval-val.neg { color: var(--rose); }


/* Summary Tab Styles */
.summary-content {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

</style>
