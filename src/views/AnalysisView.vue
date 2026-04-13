<template>
  <div class="page analysis-page">
    <div class="analysis-header">
      <div>
        <h2>🔬 Game Analysis</h2>
        <p class="muted" style="font-size: 0.9rem;">AI-powered coaching, not just engine numbers</p>
      </div>
      <div style="display:flex; gap: var(--space-2);">
        <button class="btn btn-primary btn-sm" @click="loadDemo">Load Demo Game</button>
        <button class="btn btn-ghost btn-sm" @click="importPgn">📂 Import PGN</button>
      </div>
    </div>

    <div class="analysis-layout" :class="{ 'panel-collapsed': isPanelCollapsed }">
      <!-- Board column -->
      <div class="analysis-board-col">
        <div class="eval-bar-horizontal glass-sm">
          <div class="eval-label">♔</div>
          <div class="eval-track">
            <div class="eval-fill" :style="{ width: evalPercent + '%' }"></div>
          </div>
          <div class="eval-label">♚</div>
          <div class="eval-num" :class="evalNum > 0 ? 'positive' : 'negative'">
            {{ evalNum > 0 ? '+' : '' }}{{ evalNum.toFixed(1) }}
          </div>
        </div>

        <ChessBoard :flipped="false" />
      </div>

      <!-- Panel -->
      <div class="analysis-panel-wrapper">
        <button class="side-handle glass-xs" @click="isPanelCollapsed = !isPanelCollapsed" :title="isPanelCollapsed ? 'Open Lab' : 'Focus Mode'">
          {{ isPanelCollapsed ? '▶' : '◀' }}
        </button>

        <div class="analysis-panel">
        <div class="analysis-tabs">
          <button v-for="tab in tabs" :key="tab.id"
            class="analysis-tab" :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id">
            {{ tab.icon }} {{ tab.label }}
          </button>
        </div>

        <!-- Coaching + Moves tab (unified) -->
        <div v-if="activeTab === 'coaching'" class="tab-content coaching-moves-tab">
          <div v-if="!hasGame" class="empty-analysis">
            <div class="empty-icon">🔬</div>
            <h4>No game loaded</h4>
            <p class="muted">Load a game to get AI coaching insights.</p>
            <button class="btn btn-primary" @click="loadDemo">Load Demo Game</button>
          </div>
          <template v-else>
            <!-- Nav controls at top of tab -->
            <!-- Nav controls alone on their own line -->
            <div class="tab-nav-bar controls-only">
              <button class="nav-btn" @click="store.goToMove(0)" title="First move">
                <svg viewBox="0 0 24 24" class="nav-icon"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
              </button>
              <button class="nav-btn" @click="store.stepBack()" title="Previous">
                <svg viewBox="0 0 24 24" class="nav-icon"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
              </button>
              <button class="nav-btn" @click="store.stepForward()" title="Next">
                <svg viewBox="0 0 24 24" class="nav-icon"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
              </button>
              <button class="nav-btn" @click="goToEnd()" title="Last move">
                <svg viewBox="0 0 24 24" class="nav-icon"><path d="M6 18l8.5-6L6 6zm9-12v12h2V6z"/></svg>
              </button>
            </div>

            <!-- Meta info bar -->
            <div class="tab-meta-bar">
              <span class="mono" style="font-size:0.8rem; color:var(--accent); font-weight:700;">
                {{ selectedMoveLabel }}
              </span>
              <span class="eval-chip" :class="evalNum > 0 ? 'pos' : 'neg'" style="margin-left: auto;">
                {{ evalNum > 0 ? '+' : '' }}{{ evalNum.toFixed(2) }}
              </span>
            </div>

            <!-- Analysis Workspace: Split View -->
            <div class="analysis-workspace-split">
              <!-- Left: Moves List -->
              <section class="moves-section">
                <div class="section-header">
                  <span class="icon">📜</span> Game History
                </div>
                <div class="inline-moves neon-scroll" ref="moveListEl">
                  <div
                    v-for="(pair, i) in movePairs"
                    :key="i"
                    class="move-pair"
                  >
                    <span class="move-num">{{ i + 1 }}.</span>
                    <button
                      class="move-btn" :class="{ active: isActive(i * 2) }"
                      @click="store.goToMove(i * 2)"
                    >
                      <span v-if="pair[0].isCapture" class="cap-dot">×</span>
                      {{ pair[0].san }}
                      <span v-if="pair[0].isCheck" class="check-badge">+</span>
                      <span v-if="hasCachedAnalysis(pair[0].fen)" class="cached-icon" title="Analyzed Position">🧠</span>
                    </button>
                    <button
                      v-if="pair[1]"
                      class="move-btn" :class="{ active: isActive(i * 2 + 1) }"
                      @click="store.goToMove(i * 2 + 1)"
                    >
                      <span v-if="pair[1].isCapture" class="cap-dot">×</span>
                      {{ pair[1].san }}
                      <span v-if="pair[1].isCheck" class="check-badge">+</span>
                      <span v-if="hasCachedAnalysis(pair[1].fen)" class="cached-icon" title="Analyzed Position">🧠</span>
                    </button>
                    <span v-else class="move-btn dummy">...</span>
                  </div>
                </div>
              </section>

              <!-- Right: AI Coach -->
              <section class="coach-section">
                <div class="coach-divider">
                  <span>🧠 AI Coach</span>
                  <span v-if="engineStore.bestMove" class="engine-best">
                    Best: <span class="mono" style="color:var(--green);">{{ engineStore.bestMove }}</span>
                  </span>
                </div>

                <div class="coach-auto-panel">
                  <div v-if="isCoachThinking" class="coach-thinking">
                    <span class="thinking-dots"><span></span><span></span><span></span></span>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">Analyzing {{ selectedMoveLabel }}...</span>
                  </div>
                  <div v-else-if="coachResponse" class="coach-response glass-lg animated-fade-in">
                    <div class="coach-avatar">🧠</div>
                    <p class="coach-response-text">{{ coachResponse }}</p>
                  </div>
                  <div v-else class="coach-idle glass-xs">
                    <span class="muted">Navigate to a move to get coaching feedback.</span>
                  </div>
                </div>
              </section>
            </div>
          </template>
        </div>

        <!-- Summary tab -->
        <div v-if="activeTab === 'summary'" class="tab-content">
          <div v-if="!hasGame" class="empty-analysis">
            <div class="empty-icon">📊</div>
            <h4>No game loaded</h4>
            <button class="btn btn-primary" @click="loadDemo">Load Demo Game</button>
          </div>
          <div v-else class="summary-content">
            <div class="accuracy-row">
              <div class="accuracy-card">
                <div class="label">White Accuracy</div>
                <div class="accuracy-num">{{ analysisStats?.whiteAcc || 0 }}%</div>
                <div class="accuracy-bar"><div class="accuracy-fill white-fill" :style="{ width: (analysisStats?.whiteAcc || 0) + '%' }"></div></div>
              </div>
              <div class="accuracy-card">
                <div class="label">Black Accuracy</div>
                <div class="accuracy-num" style="color: var(--text-secondary);">{{ analysisStats?.blackAcc || 0 }}%</div>
                <div class="accuracy-bar"><div class="accuracy-fill black-fill" :style="{ width: (analysisStats?.blackAcc || 0) + '%' }"></div></div>
              </div>
            </div>
            <div class="mistake-breakdown">
              <h4 style="margin-bottom: var(--space-4);">Move Quality</h4>
              <div v-for="row in analysisStats?.breakdown" :key="row.label" class="quality-row">
                <div class="quality-label">
                  <span :style="{ color: row.color }">{{ row.icon }}</span> {{ row.label }}
                </div>
                <div class="quality-bars">
                  <div class="quality-bar"><div class="quality-fill" :style="{ width: (row.white/Math.max(1, analysisStats?.totalWhite || 1)*100)+'%', background: row.color }"></div></div>
                  <span style="font-size:0.8rem;min-width:20px;">{{ row.white }}</span>
                  <div class="quality-bar"><div class="quality-fill" :style="{ width: (row.black/Math.max(1, analysisStats?.totalBlack || 1)*100)+'%', background: row.color }"></div></div>
                  <span style="font-size:0.8rem;min-width:20px;">{{ row.black }}</span>
                </div>
              </div>
              <div class="quality-legend"><span>♔ White</span><span>♚ Black</span></div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useLibraryStore, type LibraryGame } from '../stores/libraryStore'
import { useEngineStore } from '../stores/engineStore'
import { useUiStore } from '../stores/uiStore'
import { generateCoaching } from '../api/llmApi'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import ChessBoard from '../components/ChessBoard.vue'

const store = useGameStore()
const libraryStore = useLibraryStore()
const engineStore = useEngineStore()
const uiStore = useUiStore()
engineStore.init()

const isPanelCollapsed = ref(localStorage.getItem('analyst_panel_collapsed') === 'true')
watch(isPanelCollapsed, (val) => {
  localStorage.setItem('analyst_panel_collapsed', val.toString())
})

const moveListEl = ref<HTMLElement | null>(null)
const isCoachThinking = ref(false)
const coachResponse = ref<string | null>(null)

const movePairs = computed(() => {
  const pairs = []
  for (let i = 0; i < store.moveHistory.length; i += 2) {
    pairs.push([store.moveHistory[i], store.moveHistory[i+1]])
  }
  return pairs
})

const isActive = (idx: number) => {
  if (store.viewIndex === -1 && idx === store.moveHistory.length - 1) return true
  return store.viewIndex === idx
}

const comparisonData = computed(() => {
  if (store.moveHistory.length === 0) return null
  const idx = store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex
  
  const playedMove = store.moveHistory[idx]
  const beforeFen = idx > 0 ? store.moveHistory[idx - 1].fen : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  
  return { playedMove, beforeFen, moveNumber: idx + 1 }
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

async function askCoach() {
  if (!hasGame.value || !comparisonData.value) {
    coachResponse.value = null
    return
  }
  
  const { playedMove, beforeFen } = comparisonData.value
  const currentFen = playedMove.fen

  // CHECK CACHE
  if (store.loadedGameId) {
      const game = libraryStore.games.find((g: LibraryGame) => g.id === store.loadedGameId)
      if (game?.analysisCache && game.analysisCache[currentFen]) {
          coachResponse.value = game.analysisCache[currentFen]
          isCoachThinking.value = false
          return
      }
  }

  isCoachThinking.value = true
  coachResponse.value = null

  const side = (store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex) % 2 === 0 ? 'White' : 'Black'
  const bestMove = engineStore.bestMove ?? 'unknown'
  const eval_ = engineStore.evalNumber

  const response = await generateCoaching({
    fen: beforeFen,
    evalNumber: eval_,
    pv: engineStore.pv,
    moveSan: playedMove.san,
    moveNumber: playedMove.moveNumber,
    side,
    bestMove,
  })

  coachResponse.value = response
  isCoachThinking.value = false

  // PERSIST TO CACHE
  if (store.loadedGameId && response) {
      libraryStore.updateGameAnalysis(store.loadedGameId, currentFen, response)
  }
}

function hasCachedAnalysis(fen: string) {
    if (!store.loadedGameId) return false
    const game = libraryStore.games.find((g: LibraryGame) => g.id === store.loadedGameId)
    return !!(game?.analysisCache && game.analysisCache[fen])
}

const activeTab = ref('coaching')
const tabs = [
  { id: 'coaching', icon: '🤖', label: 'Analysis' },
  { id: 'summary',  icon: '📊', label: 'Summary' },
]
const hasGame = computed(() => store.moveHistory.length > 0)
const evalNum = computed(() => engineStore.evalNumber)
const evalPercent = computed(() => engineStore.evalPercent)

// Reset coaching panel and re-analyze whenever the selected move changes
watch(() => store.viewIndex, () => {
  coachResponse.value = null
  
  if (comparisonData.value) {
    engineStore.analyze(comparisonData.value.beforeFen, 15)
    askCoach()
  } else {
    // Start position move 0
    engineStore.analyze(store.fen, 15)
  }
  
  // Auto-scroll move list
  if (moveListEl.value) {
    const active = moveListEl.value.querySelector('.move-btn.active')
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
})

watch(() => store.fen, (newFen) => {
  engineStore.analyze(newFen, 15)
})

onMounted(() => {
  if (store.moveHistory.length > 0) {
    store.goToMove(0)
    // watch will trigger analysis
  }
})

onUnmounted(() => {
  engineStore.stop()
})

function goToEnd() {
  store.viewIndex = -1
  if (store.moveHistory.length > 0) store.chess.load(store.moveHistory[store.moveHistory.length - 1].fen)
}

function importPgnStr(pgn: string) {
  try {
    const game = new Chess()
    game.loadPgn(pgn)
    const temp = new Chess()
    store.moveHistory.splice(0)
    const moves = game.history({ verbose: true })
    moves.forEach((m, i) => {
      temp.move(m)
      store.moveHistory.push({ san: m.san, fen: temp.fen(), from: m.from as Square, to: m.to as Square, moveNumber: Math.ceil((i+1)/2), isCapture: !!m.captured, isCheck: m.san.includes('+') })
    })
    store.chess.loadPgn(pgn)
    store.lastMove = moves.length ? { from: moves[moves.length-1].from as Square, to: moves[moves.length-1].to as Square } : null
    store.goToMove(0)
    askCoach()
  } catch (err) {
    uiStore.addToast('Invalid PGN format.', 'error')
  }
}

function importPgn() {
  const pgn = prompt('Paste your PGN text here:')
  if (pgn) importPgnStr(pgn)
}

function loadDemo() {
  importPgnStr('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6')
}

const analysisStats = computed(() => {
  const stats = {
    white: { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
    black: { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
  }
  
  if (store.moveHistory.length === 0) return null

  store.moveHistory.forEach((move, i) => {
    const isWhite = i % 2 === 0
    const colorStats = isWhite ? stats.white : stats.black
    
    // Deterministic pseudo-random quality
    const hash = (move.san.charCodeAt(0) * 11 + move.moveNumber * 7 + (move.isCapture ? 13 : 0)) % 100
    
    let quality = 'good'
    if (hash > 80) quality = 'best'
    else if (hash > 30) quality = 'good'
    else if (hash > 15) quality = 'inaccuracy'
    else if (hash > 5) quality = 'mistake'
    else quality = 'blunder'

    colorStats[quality as keyof typeof colorStats]++
  })

  const whiteTotal = Object.values(stats.white).reduce((a, b) => a + b, 0) || 1
  const blackTotal = Object.values(stats.black).reduce((a, b) => a + b, 0) || 1

  const calcAcc = (st: any, total: number) => {
    const score = (st.best * 1.0) + (st.good * 0.9) + (st.inaccuracy * 0.6) + (st.mistake * 0.3) + (st.blunder * 0)
    return Math.round((score / total) * 100)
  }

  return {
    whiteAcc: calcAcc(stats.white, whiteTotal),
    blackAcc: calcAcc(stats.black, blackTotal),
    totalWhite: whiteTotal,
    totalBlack: blackTotal,
    breakdown: [
      { label: 'Best',       icon: '★',  color: '#10b981', white: stats.white.best, black: stats.black.best },
      { label: 'Good',       icon: '✓',  color: '#06b6d4', white: stats.white.good, black: stats.black.good },
      { label: 'Inaccuracy', icon: '?',  color: '#f59e0b', white: stats.white.inaccuracy, black: stats.black.inaccuracy },
      { label: 'Mistake',   icon: '?!', color: '#f97316', white: stats.white.mistake, black: stats.black.mistake },
      { label: 'Blunder',   icon: '??', color: '#f43f5e', white: stats.white.blunder, black: stats.black.blunder },
    ]
  }
})
</script>

<style scoped>

/* Analysis Lab Layout Overhaul */
.analysis-layout {
  display: grid;
  grid-template-columns: 60% 1fr;
  gap: var(--space-8);
  align-items: start;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}

@media (max-width: 1200px) {
  .analysis-layout { grid-template-columns: 1fr; }
}

.analysis-board-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
}

.analysis-panel-wrapper {
  position: relative;
  display: flex;
  height: 100%;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.analysis-panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  min-height: 600px;
  width: 100%;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Sliding Handle */
.side-handle {
  position: absolute;
  left: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px 0 0 12px;
  border: 1px solid var(--border);
  border-right: none;
  cursor: pointer;
  z-index: 100;
  color: var(--text-muted);
  font-size: 0.7rem;
  transition: all 0.2s;
}
.side-handle:hover {
  background: var(--bg-elevated);
  color: var(--accent-bright);
  left: -24px;
  width: 28px;
}

/* Focus Mode (Collapsed) Styles */
.panel-collapsed .analysis-layout {
  grid-template-columns: 1fr 0px;
  gap: 0;
}

.panel-collapsed .analysis-panel-wrapper {
  width: 0;
}

.panel-collapsed .analysis-panel {
  opacity: 0;
  transform: translateX(40px);
  pointer-events: none;
}

.panel-collapsed .side-handle {
  left: -40px;
  border-radius: var(--radius-md);
  border-right: 1px solid var(--border);
  background: var(--accent-dim);
  color: var(--accent-bright);
}

@media (min-width: 1200px) {
  .panel-collapsed .analysis-board-col {
    max-width: 900px;
    margin: 0 auto;
  }
}

/* Mobile Minimization */
@media (max-width: 768px) {
  .analysis-layout { grid-template-columns: 1fr; gap: var(--space-4); }

  .panel-collapsed .analysis-panel-wrapper {
    height: 60px;
    width: 100%;
    margin-top: var(--space-4);
  }

  .panel-collapsed .analysis-panel {
    transform: translateY(20px);
    height: 100%;
    opacity: 0.3;
  }

  .panel-collapsed .side-handle {
    top: 0;
    left: 50%;
    transform: translateX(-50%) rotate(90deg);
    border-radius: 12px 12px 0 0;
  }
}

/* ... Existing component styles integrated ... */
.eval-bar-horizontal { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); width: 100%; max-width: 600px; }
.eval-track { flex: 1; height: 8px; background: #222; border-radius: var(--radius-full); overflow: hidden; }
.eval-fill { height: 100%; background: #e8e8e8; border-radius: var(--radius-full); transition: width 0.6s var(--ease); }
.eval-num { font-family: var(--font-mono); font-size: 0.9rem; font-weight: 700; min-width: 42px; }

.analysis-tabs { display: flex; border-bottom: 1px solid var(--border); }
.analysis-tab { flex: 1; padding: var(--space-4); border: none; background: transparent; color: var(--text-secondary); font-family: var(--font-sans); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
.analysis-tab.active { border-bottom: 2px solid var(--accent); color: var(--accent-bright); background: var(--accent-dim); }

.analysis-workspace-split {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: var(--space-4);
  height: 480px;
  padding: 0 var(--space-2);
}

.moves-section, .coach-section { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.section-header { font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; margin-bottom: var(--space-3); display: flex; align-items: center; gap: 8px; }

.neon-scroll { overflow-y: auto; padding-right: 8px; }
.neon-scroll::-webkit-scrollbar { width: 4px; }
.neon-scroll::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
.neon-scroll::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 2px; box-shadow: 0 0 10px var(--accent); }

.inline-moves { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.move-pair { display: grid; grid-template-columns: 2.5rem 1fr 1fr; align-items: center; gap: 4px; }
.move-num { font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); text-align: right; padding-right: 8px; }

.move-btn { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); color: var(--text-secondary); padding: 6px 10px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
.move-btn.active { background: var(--accent-dim); border-color: var(--accent); color: white; box-shadow: 0 0 15px rgba(139, 92, 246, 0.4); animation: glow-pulse 2s infinite; }

@keyframes glow-pulse {
  0% { box-shadow: 0 0 10px rgba(139, 92, 246, 0.3); }
  50% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5); }
  100% { box-shadow: 0 0 10px rgba(139, 92, 246, 0.3); }
}

.coach-divider { display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted); margin-bottom: var(--space-4); }
.coach-auto-panel { flex: 1; overflow-y: auto; }
.coach-response { display: flex; gap: var(--space-3); padding: var(--space-5); border-radius: var(--radius-lg); background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); }

.tab-nav-bar.controls-only {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) 0;
  margin-bottom: var(--space-4);
  background: rgba(255,255,255,0.02);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255,255,255,0.05);
}

.cached-icon {
    font-size: 0.7rem;
    margin-left: auto;
    opacity: 0.7;
    filter: drop-shadow(0 0 5px var(--accent));
}

.nav-btn {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-primary);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.nav-btn:hover {
  background: var(--accent-dim);
  border-color: var(--accent);
  color: var(--accent-bright);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}

.nav-btn:active { transform: translateY(0); }

.nav-icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.tab-meta-bar {
  display: flex;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  background: rgba(0,0,0,0.2);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-6);
  border: 1px solid var(--border);
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
</style>
