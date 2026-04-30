<template>
  <div class="page analysis-page">
      <div class="analysis-compact-header">
        <div>
          <h2 class="title-sm">🔬 Oracle's Review</h2>
          <p class="muted" style="font-size: 0.75rem;">AI-powered coaching, not just engine numbers</p>
        </div>

        <div style="display:flex; gap: var(--space-2); align-items: center;">
          <!-- Guest-only onboarding -->
          <button v-if="!userStore.isAuthenticated" class="btn btn-primary btn-sm" @click="loadDemo">
            🚀 Load Demo
          </button>
          
          <!-- Authenticated: Go to Library -->
          <router-link v-else to="/profile?tab=vault" class="btn btn-primary btn-sm">
            🏛 Go to Vault
          </router-link>

          <!-- Always available: External Import -->
          <button class="btn btn-ghost btn-sm" @click="importPgn" title="Analyze an external PGN string">
            📂 Import PGN
          </button>
        </div>
      </div>

    <!-- Loading overlay -->
    <Transition name="fade-out">
      <div class="analysis-loading-overlay" v-if="isLoading">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <div class="loading-text">Initializing Analysis Engine</div>
          <div class="loading-sub muted">Preparing Stockfish and loading game data...</div>
        </div>
      </div>
    </Transition>

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
          <div class="analysis-instructional-state">
            <div class="instructional-card glass-card">
              <div class="pulse-icon">🔮</div>
              <h2>The Oracle Awaits</h2>
              <p class="instruction-text">
                Upload a match from your history or paste a PGN to begin a deep analytical review. 
                I will reveal your tactical DNA and find the hidden winning stratagems.
              </p>
              <div class="instruction-actions">
                <router-link to="/profile?tab=vault" class="btn btn-primary btn-glow">
                  🏛 Browse Vault
                </router-link>
                <button class="btn btn-ghost" @click="importPgn">
                  📂 Paste PGN
                </button>
              </div>
            </div>
          </div>
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
              <div class="panel-header">
                <div class="engine-info">
                  <span class="badge badge-accent">STOCKFISH 16.1</span>
                  
                  <!-- <div v-if="currentMoveQuality" class="quality-badge-mini animated-pop-in" :style="{ '--q-color': currentMoveQuality.color }">
                    <span class="q-icon">{{ currentMoveQuality.icon }}</span>
                    <span class="q-label">{{ currentMoveQuality.label }}</span>
                  </div> -->

                  <span class="depth">Depth {{ engineStore.currentDepth }}</span>
                  <button 
                    class="btn btn-xs btn-outline ml-auto" 
                    @click="deepCloudScan" 
                    :disabled="isCloudScanning"
                    title="Fetch high-depth Cloud Evaluation for this position"
                  >
                    {{ isCloudScanning ? 'Scanning...' : '☁️ Deep Scan' }}
                  </button>
               </div>

               <div class="nav-controls-minimal mt-4">
                 <button class="nav-btn-sm" @click="store.goToMove(0)" title="First Move">«</button>
                 <button class="nav-btn-sm" @click="store.stepBack()" title="Previous Move">‹</button>
                 
                 <button class="nav-btn-sm btn-play-highlights" :class="{ 'is-playing': isPlaying }" @click="togglePlayback" :title="isPlaying ? 'Stop' : 'Play Highlights'">
                    {{ isPlaying ? '⏹' : '▶' }}
                 </button>

                 <Transition name="fade">
                   <div v-if="!isPlaying && pauseReason" class="pause-indicator-badge" :style="{ background: pauseReason.color }">
                      <span class="icon">{{ pauseReason.icon }}</span>
                      <span class="label">{{ pauseReason.label.toUpperCase() }}</span>
                   </div>
                 </Transition>

                 <div class="move-indicator">{{ selectedMoveLabel }}</div>
                 <button class="nav-btn-sm" @click="store.stepForward()" title="Next Move">›</button>
                 <button class="nav-btn-sm" @click="goToEnd()" title="Last Move">»</button>
               </div>

               <div class="sticky-analysis-metrics mt-4">
                 <div v-if="engineStore.suggestedMove" class="suggestion-card-compact glass-xs">
                   <div class="label">BEST</div>
                   <div class="val">{{ engineStore.suggestedMove }}</div>
                   <div class="eval" :class="evalNum > 0 ? 'pos' : 'neg'">
                     {{ evalNum > 0 ? '+' : '' }}{{ evalNum.toFixed(2) }}
                   </div>
                 </div>

                 <div v-if="engineStore.multiPvs.length > 1" class="alt-lines-compact glass-xs">
                   <div class="label">CRITICAL LINES</div>
                   <div class="lines">
                     <div v-for="alt in engineStore.multiPvs.slice(1, 3)" :key="alt.id" class="mini-line">
                       <span class="score">{{ alt.score }}</span>
                       <span class="moves">{{ alt.moves.slice(0, 3).join(' ') }}...</span>
                     </div>
                   </div>
                 </div>
               </div>
              </div>

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
        <Teleport to="body">
          <Transition name="modal">
            <div v-if="showHealthLegend" class="modal-overlay" @click.self="showHealthLegend = false">
              <div class="modal-content glass-heavy health-legend-modal animated-scale-in">
                <header class="modal-header">
                  <div class="title-group">
                    <span class="badge badge-accent">HEURISTICS_V1</span>
                    <h2>Positional Health Index</h2>
                    <p class="muted">Understanding the engine's structural evaluation</p>
                  </div>
                  <button class="btn-close" @click="showHealthLegend = false">✕</button>
                </header>
                <div class="modal-body">
                   <!-- Contextual Diagnosis Section -->
                   <div class="contextual-diagnosis glass-xs">
                      <div class="diagnosis-header">
                        <span class="dot-pulse"></span>
                        <h4>LIVE DIAGNOSIS</h4>
                      </div>
                      <div class="diagnosis-grid">
                        <div class="diag-cell">
                          <label>MAT</label>
                          <p>{{ diagnosis.material }}</p>
                        </div>
                        <div class="diag-cell">
                          <label>ACT</label>
                          <p>{{ diagnosis.activity }}</p>
                        </div>
                        <div class="diag-cell">
                          <label>KGS</label>
                          <p>{{ diagnosis.safety }}</p>
                        </div>
                      </div>
                   </div>

                   <div class="legend-items">
                    <div class="legend-item">
                      <div class="icon-wrap" style="background: var(--accent-dim);">MAT</div>
                      <div class="content">
                        <h3>Material Balance (MAT)</h3>
                        <p>Calculates the sum of piece values for White vs Black. Weighted for positional compensation (e.g., bishops are slightly higher than knights in open positions).</p>
                      </div>
                    </div>
                    <div class="legend-item">
                      <div class="icon-wrap" style="background: var(--teal-dim);">ACT</div>
                      <div class="content">
                        <h3>Piece Activity (ACT)</h3>
                        <p>Measures "Mobility & Space". Tracks how many legal moves are available and how much of the board your pieces control compared to your opponent.</p>
                      </div>
                    </div>
                    <div class="legend-item">
                      <div class="icon-wrap" style="background: var(--rose-dim);">KGS</div>
                      <div class="content">
                        <h3>King Safety (KGS)</h3>
                        <p>A composite score of pawn shelter, enemy proximity, and tactical exposure. Drops sharply if you are in check or if enemy pieces are swarming your king.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <footer class="modal-footer">
                  <button class="btn btn-primary" @click="showHealthLegend = false">Understood</button>
                </footer>
              </div>
            </div>
          </Transition>
        </Teleport>

        <!-- Deterministic Tag Popup (Oracle's Insight) -->
        <Teleport to="body">
          <Transition name="modal">
            <div v-if="showTagPopup && currentTag" class="modal-overlay" @click.self="showTagPopup = false">
              <div class="tag-popup-modal glass-heavy animated-scale-in" :class="currentTag.severity">
                <div class="popup-accent-bar"></div>
                
                <header class="popup-header">
                  <div class="severity-badge">
                    {{ currentTag.severity.toUpperCase() }}
                  </div>
                  <button class="btn-close" @click="showTagPopup = false">✕</button>
                </header>

                <div class="popup-body">
                  <div class="tag-main-info">
                    <span class="tag-icon">{{ currentTag.category === 'tactics' ? '⚡' : currentTag.category === 'opening' ? '📖' : currentTag.category === 'missed_win' ? '🎯' : '🧱' }}</span>
                    <div class="tag-title-group">
                      <h3>{{ currentTag.theme }}</h3>
                      <p class="eval-drop">Evaluation drop: <strong>{{ currentTag.evalDrop.toFixed(1) }}</strong> pawns</p>
                    </div>
                  </div>

                  <div class="tag-explanation-box glass-xs" v-html="renderedExplanation"></div>

                  <div v-if="engineStore.suggestedMove" class="better-move-suggestion">
                    <label>ORACLE'S SUGGESTION</label>
                    <div class="suggestion-line">
                      <span class="move-arrow">➜</span>
                      <span class="suggested-move">{{ engineStore.suggestedMove }}</span>
                      <span class="suggestion-reason">was significantly stronger in this position.</span>
                    </div>
                  </div>
                </div>

                <footer class="popup-footer">
                  <button class="btn btn-primary btn-glow" @click="showTagPopup = false">Understood</button>
                </footer>
              </div>
            </div>
          </Transition>
        </Teleport>
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
import { renderMarkdown } from '../utils/markdown'
import { useAnalysisSession } from '../composables/useAnalysisSession'
import { useAnalysisPlayers } from '../composables/useAnalysisPlayers'
import type { TaggedMistake } from '../services/taggingService'

// Sub-components
import ChessBoard from '../components/ChessBoard.vue'
import CoachPanel from '../components/CoachPanel.vue'
import MoveHistory from '../components/MoveHistory.vue'
import GameAnalysisTable from '../components/GameAnalysisTable.vue'
import EvaluationHeader from '../components/EvaluationHeader.vue'
import AnalysisSidebar from '../components/AnalysisSidebar.vue'

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

const renderedExplanation = computed(() => renderMarkdown(currentTag.value?.explanation || null))


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

.analysis-compact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-6);
  background: rgba(0,0,0,0.2);
  border-bottom: 1px solid var(--border);
}

.title-sm {
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  margin: 0;
}

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

/* Loading overlay */
.analysis-loading-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--bg);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Empty State / Instructional UI */
.analysis-instructional-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: var(--space-8);
  background: radial-gradient(circle at center, rgba(var(--accent-rgb), 0.1) 0%, transparent 70%);
}

.instructional-card {
  max-width: 500px;
  text-align: center;
  padding: var(--space-10);
  border: 1px solid rgba(var(--accent-rgb), 0.2);
  box-shadow: 0 0 50px rgba(0,0,0,0.5);
  animation: float 6s ease-in-out infinite;
}

.pulse-icon {
  font-size: 4rem;
  margin-bottom: var(--space-6);
  filter: drop-shadow(0 0 15px var(--accent));
  animation: pulse-glow 3s infinite;
}

.instruction-text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text-muted);
  margin-bottom: var(--space-8);
}

.instruction-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
}

.btn-glow {
  box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.4);
}

/* Entry Animations */
.board-entry-enter-active {
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.board-entry-enter-from {
  opacity: 0;
  transform: translateX(-50px) scale(0.95);
}

.sidebar-entry-enter-active {
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 0.2s; /* Staggered entry */
}
.sidebar-entry-enter-from {
  opacity: 0;
  transform: translateX(50px);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse-glow {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px var(--accent)); }
  50% { transform: scale(1.05); filter: drop-shadow(0 0 30px var(--accent)); }
}

.sidebar-placeholder {
  background: rgba(0,0,0,0.1);
  border-left: 1px solid var(--border);
}

.empty-board {
  display: flex;
  align-items: center;
  justify-content: center;
}

.analysis-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: var(--bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}
.loading-spinner {
  width: 44px; height: 44px;
  border: 3px solid rgba(139,92,246,0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: loading-spin 0.9s linear infinite;
}
@keyframes loading-spin { to { transform: rotate(360deg); } }
.loading-text {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: 0.02em;
}
.loading-sub { font-size: 0.85rem; }

.fade-out-leave-active { transition: opacity 0.4s ease; }
.fade-out-leave-to { opacity: 0; }


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


.sticky-analysis-metrics {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.suggestion-card-compact {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: 8px 12px;
  border: 1px solid var(--accent-dim);
  background: rgba(139, 92, 246, 0.05);
}
.suggestion-card-compact .label { font-size: 0.6rem; font-weight: 800; color: var(--text-muted); }
.suggestion-card-compact .val { font-size: 1.2rem; font-weight: 900; color: white; }
.suggestion-card-compact .eval { font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700; margin-left: auto; }

.alt-lines-compact {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.alt-lines-compact .label { font-size: 0.6rem; font-weight: 800; color: var(--text-muted); margin-bottom: 2px; }
.alt-lines-compact .lines { display: flex; flex-direction: column; gap: 2px; }
.alt-lines-compact .mini-line { display: flex; justify-content: space-between; font-size: 0.75rem; font-family: var(--font-mono); }
.alt-lines-compact .score { color: var(--accent-bright); font-weight: 700; width: 40px; }
.alt-lines-compact .moves { color: var(--text-secondary); flex: 1; text-align: right; }

.history-integration .label {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}


/* Legend Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.health-legend-modal {
  max-width: 500px;
  width: 90%;
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  max-height: 90vh;
  overflow-y: auto;
  background: rgba(10, 10, 15, 0.4);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.modal-header {
  margin-bottom: var(--space-6);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.btn-close {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.8rem;
  margin-top: -10px;
  margin-right: -10px;
}
.btn-close:hover {
  background: var(--rose-dim);
  color: var(--rose);
  border-color: var(--rose-dim);
}

.modal-footer {
  margin-top: var(--space-8);
  display: flex;
  justify-content: flex-end;
}

.contextual-diagnosis {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-8);
  border: 1px solid var(--accent-dim);
}

.diagnosis-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.diagnosis-header h4 {
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: var(--accent-bright);
}

.dot-pulse {
  width: 6px;
  height: 6px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--accent);
  animation: pulse 1.5s infinite;
}

.diagnosis-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.diag-cell label {
  font-size: 0.6rem;
  font-weight: 800;
  color: var(--text-muted);
  display: block;
  margin-bottom: 2px;
}

.diag-cell p {
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.4;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  margin-top: var(--space-6);
}

.legend-item {
  display: flex;
  gap: var(--space-4);
}

.icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  flex-shrink: 0;
  color: white;
}

.legend-item h3 {
  font-size: 0.95rem;
  font-weight: 800;
  margin-bottom: 4px;
}

.legend-item p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}


.eval-chip {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 800;
  font-family: var(--font-mono);
}
.eval-chip.pos { background: rgba(16,185,129,0.15); color: #10b981; }
.eval-chip.neg { background: rgba(244,63,94,0.15); color: #f43f5e; }


/* Summary Tab Styles */
.summary-content {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.accuracy-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.accuracy-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  text-align: center;
}

.accuracy-card .label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: var(--space-2);
}

.accuracy-num {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.accuracy-bar {
  height: 6px;
  background: rgba(0,0,0,0.3);
  border-radius: var(--radius-full);
  margin-top: var(--space-4);
  overflow: hidden;
}

.accuracy-fill {
  height: 100%;
  border-radius: var(--radius-full);
}

.accuracy-fill.white-fill { background: #fff; box-shadow: 0 0 10px rgba(255,255,255,0.3); }
.accuracy-fill.black-fill { background: var(--text-secondary); }

.mistake-breakdown {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.quality-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.quality-label {
  min-width: 100px;
  font-size: 0.85rem;
}

.quality-bars {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 24px 1fr 24px;
  align-items: center;
  gap: var(--space-2);
}

.quality-bar {
  height: 8px;
  background: rgba(0,0,0,0.2);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.quality-fill {
  height: 100%;
}

.quality-legend {
  display: flex;
  justify-content: center;
  gap: var(--space-6);
  margin-top: var(--space-6);
  font-size: 0.8rem;
  color: var(--text-muted);
}

.review-entry-card {
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  border-left: 3px solid var(--rose);
}
.review-content {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-2);
}
.review-content .icon { font-size: 1.5rem; }
.review-content .text strong { display: block; font-size: 0.9rem; }
.review-content .text p { font-size: 0.75rem; color: var(--text-muted); line-height: 1.2; margin-top: 2px; }

.sidebar-inner-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

/* ─── ANALYSIS TABS ─── */
.analysis-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px;
  border-bottom: 1px solid var(--border);
}

.analysis-tab-btn {
  flex: 1;
  padding: 10px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.analysis-tab-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.05);
}

.analysis-tab-btn.active {
  background: var(--bg-surface);
  color: var(--accent-bright);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.tab-pane-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.panel-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(17, 17, 24, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: var(--space-4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.sidebar-scrollable-content {
  padding: var(--space-4);
}

.review-pane-padding {
  padding: var(--space-2);
  padding-bottom: var(--space-12);
}

.mt-6 { margin-top: var(--space-6); }
.p-4 { padding: var(--space-4); }
.mb-2 { margin-bottom: var(--space-2); }
.font-bold { font-weight: 700; }

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.engine-info {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
}

.engine-info .depth {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* ─── TAG POPUP STYLES ─── */
.tag-popup-modal {
  width: 90%;
  max-width: 480px;
  background: rgba(13, 13, 20, 0.9);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  overflow: hidden;
  position: relative;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

.popup-accent-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--accent-bright); /* Fallback */
}

/* Severity specific colors for accent bar and badge */
.tag-popup-modal.inaccuracy .popup-accent-bar,
.tag-popup-modal.inaccuracy .severity-badge {
  background: #f59e0b !important;
}

.tag-popup-modal.mistake .popup-accent-bar,
.tag-popup-modal.mistake .severity-badge {
  background: #f97316 !important;
}

.tag-popup-modal.blunder .popup-accent-bar,
.tag-popup-modal.blunder .severity-badge {
  background: #f43f5e !important;
}

.popup-header {
  padding: var(--space-5) var(--space-6);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.severity-badge {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: white;
}

.popup-body {
  padding: 0 var(--space-6) var(--space-6);
}

.tag-main-info {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  margin-bottom: var(--space-5);
}

.tag-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.tag-title-group h3 {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
  color: white;
}

.eval-drop {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.eval-drop strong {
  color: var(--rose-bright);
}

.tag-explanation-box {
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: var(--space-6);
}

.tag-explanation-box :deep(p) {
  margin-bottom: var(--space-3);
}

.tag-explanation-box :deep(p:last-child) {
  margin-bottom: 0;
}

.tag-explanation-box :deep(strong) {
  color: white;
  font-weight: 700;
}

.better-move-suggestion {
  padding-top: var(--space-4);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.better-move-suggestion label {
  display: block;
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--accent-bright);
  letter-spacing: 0.1em;
  margin-bottom: var(--space-2);
}

.suggestion-line {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.9rem;
}

.move-arrow {
  color: var(--teal-bright);
}

.suggested-move {
  font-family: var(--font-mono);
  font-weight: 800;
  color: white;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.suggestion-reason {
  color: var(--text-muted);
}

.popup-footer {
  padding: var(--space-4) var(--space-6);
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: flex-end;
}

</style>
