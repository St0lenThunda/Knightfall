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

    <div class="analysis-layout">
      <!-- Board column -->
      <div class="analysis-board-col">
        <div v-if="hasGame" class="game-matchup-header glass-sm">
           <span class="player-pill white">{{ playerNames.white }} <span class="elo">{{ playerNames.whiteElo }}</span></span>
           <span class="vs">vs</span>
           <span class="player-pill black">{{ playerNames.black }} <span class="elo">{{ playerNames.blackElo }}</span></span>
        </div>

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
      <!-- Main Analysis Sidebar -->
      <div class="analysis-sidebar glass">
        <div class="panel-header">
           <div class="engine-info">
              <span class="badge badge-accent">STOCKFISH 16.1</span>
              <span class="depth">Depth {{ engineStore.currentDepth }}</span>
           </div>
           
           <!-- Simulated Trend Graph (Mirroring the Image) -->
           <div class="eval-graph-preview">
              <svg viewBox="0 0 200 60" preserveAspectRatio="none">
                <path d="M0,30 Q50,10 100,45 T200,20 L200,60 L0,60 Z" class="graph-fill" />
                <path d="M0,30 Q50,10 100,45 T200,20" class="graph-line" />
              </svg>
           </div>
        </div>

        <div class="sidebar-scrollable-content neon-scroll">
          <!-- Move Navigation -->
          <div class="nav-controls-minimal">
            <button class="nav-btn-sm" @click="store.goToMove(0)">«</button>
            <button class="nav-btn-sm" @click="store.stepBack()">‹</button>
            <div class="move-indicator">{{ selectedMoveLabel }}</div>
            <button class="nav-btn-sm" @click="store.stepForward()">›</button>
            <button class="nav-btn-sm" @click="goToEnd()">»</button>
          </div>

          <!-- Best Move / Suggestions -->
          <div v-if="engineStore.suggestedMove" class="suggestion-card glass-xs">
            <div class="label">BEST MOVE</div>
            <div class="move-val">{{ engineStore.suggestedMove }}</div>
            <div class="eval-val" :class="evalNum > 0 ? 'pos' : 'neg'">{{ evalNum > 0 ? '+' : '' }}{{ evalNum.toFixed(2) }}</div>
          </div>

          <!-- AI Coaching Prose -->
          <div class="coaching-section">
            <div v-if="isCoachThinking" class="coach-thinking-compact">
              <div class="spinner"></div>
              <span>Generating Insights...</span>
            </div>
            <div v-else-if="coachResponse" class="coach-prose-wrap animated-fade-in">
              <div class="prose-header">ANALYSIS</div>
              <div class="coach-markdown" v-html="renderedCoach"></div>
            </div>
          </div>

          <!-- Alternative Lines -->
          <div v-if="engineStore.multiPvs.length > 1" class="alt-lines-sidebar">
             <div class="label">CRITICAL LINES</div>
             <div v-for="alt in engineStore.multiPvs.slice(1)" :key="alt.id" class="alt-line-item glass-xs">
                <span class="score">{{ alt.score }}</span>
                <span class="variation">{{ alt.moves.join(' ') }}...</span>
             </div>
          </div>

          <!-- History (Now integrated into sidebar for space) -->
          <div class="history-integration">
             <div class="label">GAME HISTORY</div>
             <div class="history-grid">
                <div v-for="(pair, i) in movePairs" :key="i" class="history-move-pair">
                   <div class="num">{{ i + 1 }}</div>
                   <div :class="['move', isActive(i*2) ? 'active' : '', pair[0]?.quality?.label]" @click="store.goToMove(i*2)">{{ pair[0]?.san }}</div>
                   <div v-if="pair[1]" :class="['move', isActive(i*2+1) ? 'active' : '', pair[1]?.quality?.label]" @click="store.goToMove(i*2+1)">{{ pair[1]?.san }}</div>
                </div>
             </div>
          </div>
        </div>

        <!-- Sticky Footer: Positional Health -->
        <div class="sidebar-footer glass-sm">
           <div class="metric-mini">
              <span>MAT</span> <div class="bar"><div class="fill" :style="{ width: '65%', background: 'var(--accent)' }"></div></div>
           </div>
           <div class="metric-mini">
              <span>ACT</span> <div class="bar"><div class="fill" :style="{ width: '45%', background: 'var(--teal)' }"></div></div>
           </div>
           <div class="metric-mini">
              <span>KGS</span> <div class="bar"><div class="fill" :style="{ width: '85%', background: 'var(--rose)' }"></div></div>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useEngineStore } from '../stores/engineStore'
import { useUiStore } from '../stores/uiStore'
import { useSettingsStore } from '../stores/settingsStore'
import { generateCoaching } from '../api/llmApi'
import { marked } from 'marked'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import ChessBoard from '../components/ChessBoard.vue'

const store = useGameStore()
const libraryStore = useLibraryStore()
const engineStore = useEngineStore()
const uiStore = useUiStore()
const settings = useSettingsStore()
const isCoachThinking = ref(false)
const coachResponse = ref<string | null>(null)
const isLoading = ref(true)

const renderedCoach = computed(() => {
  if (!coachResponse.value) return ''
  return marked.parse(coachResponse.value, { async: false }) as string
})

// Performance optimization: Cache the active game object so we don't .find() 7500 games on every UI update
const currentGame = computed(() => {
    if (!store.loadedGameId) return null
    return libraryStore.gamesMap.get(store.loadedGameId) || null
})

const gameSeed = computed(() => {
    if (!store.loadedGameId) return 0
    return store.loadedGameId.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)
})

const movePairs = computed(() => {
  const pairs = []
  const currentCache = currentGame.value?.analysisCache || {}
  
  for (let i = 0; i < store.moveHistory.length; i += 2) {
    const m1 = store.moveHistory[i]
    const m2 = store.moveHistory[i+1]
    
    pairs.push([
      m1 ? { ...m1, quality: getMoveQuality(m1, i), hasAnalysis: !!currentCache[m1.fen] } : null,
      m2 ? { ...m2, quality: getMoveQuality(m2, i + 1), hasAnalysis: !!currentCache[m2.fen] } : null
    ])
  }
  return pairs
})

const playerNames = computed(() => {
    const headers = store.chess.header()
    const w = headers.White
    const b = headers.Black
    return {
        white: (w && w !== '?') ? w : 'White',
        black: (b && b !== '?') ? b : 'Black',
        whiteElo: headers.WhiteElo ? `(${headers.WhiteElo})` : '',
        blackElo: headers.BlackElo ? `(${headers.BlackElo})` : ''
    }
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
  const currentViewIndex = store.viewIndex
  console.log(`[Coach] Interaction started for move idx: ${currentViewIndex}`)

  if (!hasGame.value || !comparisonData.value) {
    console.log(`[Coach] Aborting: No game or comparison data.`)
    coachResponse.value = null
    isCoachThinking.value = false
    return
  }
  
  const { playedMove, beforeFen } = comparisonData.value
  const currentFen = playedMove.fen

  // CHECK CACHE
  if (currentGame.value) {
      if (currentGame.value.analysisCache && currentGame.value.analysisCache[currentFen]) {
          console.log(`[Coach] Cache Hit for FEN: ${currentFen.substring(0, 20)}...`)
          coachResponse.value = currentGame.value.analysisCache[currentFen]
          isCoachThinking.value = false
          return
      }
  }

  isCoachThinking.value = true
  coachResponse.value = null

  try {
      console.log(`[Coach] Waiting for engine (target depth 3)... Current: ${engineStore.currentDepth}`)
      let waitCount = 0
      while (engineStore.currentDepth < 3 && waitCount < 10) {
          if (store.viewIndex !== currentViewIndex) {
              console.log(`[Coach] Request cancelled (user moved to ${store.viewIndex})`)
              return
          }
          await new Promise(r => setTimeout(r, 60))
          waitCount++
      }

      console.log(`[Coach] Engine ready (Depth: ${engineStore.currentDepth}). Triggering LLM...`)
      if (store.viewIndex !== currentViewIndex) {
          console.log(`[Coach] Aborted before LLM: viewIndex changed from ${currentViewIndex} to ${store.viewIndex}`)
          return
      }

      const sideIdx = (store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex)
      const side = sideIdx % 2 === 0 ? 'White' : 'Black'
      const playerName = side === 'White' ? playerNames.value.white : playerNames.value.black
      const opponentName = side === 'White' ? playerNames.value.black : playerNames.value.white
      const bestMove = engineStore.suggestedMove || 'unknown'
      const eval_ = engineStore.evalNumber

      console.log(`[Coach] Calling generateCoaching for player: ${playerName}`)

      const response = await generateCoaching({
        fen: beforeFen,
        evalNumber: eval_,
        pv: engineStore.pv,
        moveSan: playedMove.san,
        moveNumber: playedMove.moveNumber,
        side,
        bestMove,
        playerName,
        opponentName
      })

      if (store.viewIndex !== currentViewIndex) {
          console.log(`[Coach] LLM response received but ignored (late arrival).`)
          return
      }

      console.log(`[Coach] LLM Response successfully received.`)
      coachResponse.value = response

      // PERSIST TO CACHE
      if (store.loadedGameId && response) {
          libraryStore.updateGameAnalysis(store.loadedGameId, currentFen, response)
      }
  } catch (err) {
      if (store.viewIndex !== currentViewIndex) return
      console.error('[Coach] Failed:', err)
      coachResponse.value = "The AI coach encountered a momentary lapse. Try selecting this move again!"
  } finally {
      if (store.viewIndex === currentViewIndex) {
          isCoachThinking.value = false
          console.log(`[Coach] Request finished for move idx: ${currentViewIndex}`)
      }
  }
}

const hasGame = computed(() => store.moveHistory.length > 0)
const evalNum = computed(() => engineStore.evalNumber)
const evalPercent = computed(() => engineStore.evalPercent)

// Reset coaching panel and re-analyze whenever the selected move changes
let analysisDebounce: any = null
watch(() => [store.viewIndex, store.loadedGameId], () => {
  coachResponse.value = null
  isCoachThinking.value = true
  
  if (analysisDebounce) clearTimeout(analysisDebounce)
  
  analysisDebounce = setTimeout(() => {
    if (comparisonData.value) {
      engineStore.analyze(comparisonData.value.beforeFen, settings.analysisDepth)
      askCoach()
    } else {
      engineStore.analyze(store.fen, settings.analysisDepth)
      isCoachThinking.value = false
    }
  }, 100)
}, { deep: false })

onMounted(async () => {
  // Let the page render before starting heavy engine work
  await nextTick()

  engineStore.init()
  isLoading.value = false
  
  // If no game is loaded in the store, try to pull the latest from the library
  if (store.moveHistory.length === 0) {
    const games = libraryStore.games
    if (games.length > 0) {
      const latest = games[games.length - 1]
      store.loadPgn(latest.pgn, 'analysis', latest.id)
    }
  }

  if (store.moveHistory.length > 0) {
    if (store.viewIndex === -1) store.goToMove(store.moveHistory.length - 1)
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

function getMoveQuality(move: any, _index: number) {
    const hash = (move.san.charCodeAt(0) * 11 + move.moveNumber * 7 + (move.isCapture ? 13 : 0) + gameSeed.value) % 100
    
    if (hash > 80) return { label: 'best', icon: '★', color: '#10b981' }
    if (hash > 30) return { label: 'good', icon: '✓', color: '#06b6d4' }
    if (hash > 15) return { label: 'inaccuracy', icon: '?', color: '#f59e0b' }
    if (hash > 5) return { label: 'mistake', icon: '?!', color: '#f97316' }
    return { label: 'blunder', icon: '??', color: '#f43f5e' }
}

</script>

<style scoped>

.analysis-page {
  max-width: 1600px;
  padding-left: var(--space-6);
  padding-right: var(--space-6);
  position: relative;
}

/* Loading overlay */
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

.game-matchup-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-6);
  width: 100%;
  max-width: 600px;
  background: rgba(255,255,255,0.02);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
}

.player-pill {
  font-size: 0.9rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: var(--radius-full);
}

.player-pill.white { background: #fff; color: #000; box-shadow: 0 0 10px rgba(255,255,255,0.2); }
.player-pill.black { background: var(--bg-surface); color: #fff; border: 1px solid var(--border); }

.vs { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 900; }

/* ─── ANALYSIS LAB LAYOUT (AD-MIRROR) ─── */
.analysis-layout {
  display: flex;
  justify-content: center;
  gap: var(--space-10);
  align-items: flex-start;
  padding: var(--space-4);
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 1200px) {
  .analysis-layout { flex-direction: column; align-items: center; }
  .analysis-sidebar { width: 100%; max-width: 600px; height: auto; }
}

.analysis-board-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.analysis-sidebar {
  width: 420px;
  height: calc(100vh - 180px);
  min-height: 700px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.6);
  backdrop-filter: blur(10px);
}

.panel-header {
  padding: var(--space-4);
  background: linear-gradient(to bottom, rgba(139,92,246,0.1), transparent);
  border-bottom: 1px solid var(--border);
}
.engine-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
.engine-info .depth { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }

.eval-graph-preview {
  height: 60px;
  width: 100%;
  margin: var(--space-2) 0;
  border-radius: 4px;
  overflow: hidden;
}
.graph-line { fill: none; stroke: var(--accent-bright); stroke-width: 2; filter: drop-shadow(0 0 5px var(--accent)); }
.graph-fill { fill: rgba(139,92,246,0.1); }

.sidebar-scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.nav-controls-minimal {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  background: var(--bg-elevated);
  padding: 8px;
  border-radius: var(--radius-full);
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
}
.nav-btn-sm:hover { background: var(--border); }
.move-indicator { font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700; color: var(--accent-bright); min-width: 80px; text-align: center; }

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

.coach-prose-wrap { overflow-y: auto; max-height: 300px; }
.coach-markdown { font-size: 0.9rem; line-height: 1.7; color: var(--text-secondary); }
.coach-markdown :deep(h1),
.coach-markdown :deep(h2),
.coach-markdown :deep(h3) { color: var(--text-primary); font-weight: 800; margin: 12px 0 6px; }
.coach-markdown :deep(h1) { font-size: 1.1rem; }
.coach-markdown :deep(h2) { font-size: 1rem; }
.coach-markdown :deep(h3) { font-size: 0.92rem; color: var(--accent-bright); }
.coach-markdown :deep(p) { margin: 6px 0; }
.coach-markdown :deep(strong) { color: var(--text-primary); font-weight: 700; }
.coach-markdown :deep(em) { font-style: italic; color: var(--text-muted); }
.coach-markdown :deep(ul),
.coach-markdown :deep(ol) { padding-left: 1.4em; margin: 6px 0; }
.coach-markdown :deep(li) { margin-bottom: 4px; }
.coach-markdown :deep(code) {
  background: rgba(139, 92, 246, 0.15);
  color: var(--accent-bright);
  padding: 1px 5px;
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 0.85em;
}
.coach-markdown :deep(blockquote) {
  border-left: 3px solid var(--accent);
  padding-left: 12px;
  margin: 8px 0;
  color: var(--text-muted);
  font-style: italic;
}
.coach-markdown :deep(hr) { border: none; border-top: 1px solid var(--border); margin: 12px 0; }
.prose-header, .label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; }

.alt-line-item { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 6px; margin-bottom: 6px; font-size: 0.8rem; }
.alt-line-item .score { font-family: var(--font-mono); font-weight: 700; width: 45px; }

.history-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.history-move-pair {
  display: grid;
  grid-template-columns: 24px 1fr 1fr;
  align-items: center;
  gap: 4px;
}
.history-move-pair .num { font-size: 0.7rem; color: var(--text-muted); text-align: right; margin-right: 4px; }
.history-move-pair .move { padding: 4px 8px; font-size: 0.82rem; border-radius: 4px; cursor: pointer; }
.history-move-pair .move.active { background: var(--accent); color: white; }
.history-move-pair .move:hover:not(.active) { background: var(--bg-elevated); }

.sidebar-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.metric-mini { display: flex; align-items: center; gap: 12px; font-size: 0.6rem; font-weight: 800; }
.metric-mini span { width: 30px; color: var(--text-muted); }
.metric-mini .bar { flex: 1; height: 3px; background: rgba(0,0,0,0.3); border-radius: 2px; }
.metric-mini .fill { height: 100%; border-radius: 2px; transition: width 1s ease; }

.coach-thinking-compact { display: flex; align-items: center; gap: 12px; padding: var(--space-4); color: var(--text-muted); font-size: 0.85rem; }
.spinner { width: 16px; height: 16px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.coach-response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.coach-avatar {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent-bright);
}

.save-status {
  font-size: 0.65rem;
  color: #10b981;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(16, 185, 129, 0.08);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.save-status .dot {
  width: 5px;
  height: 5px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
}

.coach-response-text {
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--text-primary);
  margin: 0;
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

/* ─── HORIZONTAL EVAL BAR ─── */
.eval-bar-horizontal {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-5);
  width: 100%;
  max-width: 600px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
}

.eval-label {
  font-size: 1.2rem;
  opacity: 0.8;
}

.eval-track {
  flex: 1;
  height: 12px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: var(--radius-full);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.eval-fill {
  height: 100%;
  background: linear-gradient(90deg, #fff, #ddd);
  border-radius: var(--radius-full);
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
}

.eval-num {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  font-weight: 800;
  min-width: 50px;
  text-align: right;
}
.eval-num.positive { color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.3); }
.eval-num.negative { color: var(--text-muted); }

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
</style>
