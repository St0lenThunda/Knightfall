<template>
  <div class="page analysis-page">
    <div class="analysis-header">
      <div>
        <h2>🔬 Oracle's Review</h2>
        <p class="muted" style="font-size: 0.9rem;">AI-powered coaching, not just engine numbers</p>
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

        <ChessBoard :flipped="false" :arrows="engineArrows" :moveQuality="currentMoveQuality" />
      </div>

      <!-- Panel -->
      <!-- Main Analysis Sidebar -->
      <div class="analysis-sidebar glass" :class="{ 'collapsed': isSidebarCollapsed }">
        <button class="btn-sidebar-toggle" @click="isSidebarCollapsed = !isSidebarCollapsed">
          {{ isSidebarCollapsed ? '»' : '«' }}
        </button>
        
        <div class="sidebar-inner-wrap" v-if="!isSidebarCollapsed">
          <!-- TAB SWITCHER -->
          <div class="analysis-tabs">
            <button class="analysis-tab-btn" :class="{ active: activeSidebarTab === 'insights' }" @click="activeSidebarTab = 'insights'">
              <span class="icon">🔮</span> Insights
            </button>
            <button class="analysis-tab-btn" :class="{ active: activeSidebarTab === 'review' }" @click="activeSidebarTab = 'review'">
              <span class="icon">📊</span> Review
            </button>
          </div>

          <Transition name="fade-slide" mode="out-in">
            <!-- TAB 1: INSIGHTS (The current sidebar as-is) -->
            <div v-if="activeSidebarTab === 'insights'" class="tab-pane-content">
              <!-- Fixed Header -->
              <div class="panel-header">
               <div class="engine-info">
                  <span class="badge badge-accent">STOCKFISH 16.1</span>
                  <span class="depth">Depth {{ engineStore.currentDepth }}</span>
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
                <CoachPanel />
                <div class="history-integration mt-4">
                  <div class="label px-4 mb-2">GAME HISTORY</div>
                  <MoveHistory hideHeader />
                </div>
              </div>

              <!-- Fixed Footer -->
              <div class="sidebar-footer glass-sm">
                 <div class="footer-title">
                   <span>POSITIONAL HEALTH</span>
                   <button class="btn-help-circle" @click="showHealthLegend = true" title="What are these?">ⓘ</button>
                 </div>
                 <div class="metric-mini" title="Material Balance">
                    <span>MAT</span> 
                    <div class="bar">
                      <div class="fill" :style="{ width: positionalHealth.material + '%', background: 'var(--accent)' }"></div>
                    </div>
                    <span class="val">{{ Math.round(positionalHealth.material) }}%</span>
                 </div>
                 <div class="metric-mini" title="Piece Activity">
                    <span>ACT</span> 
                    <div class="bar">
                      <div class="fill" :style="{ width: positionalHealth.activity + '%', background: 'var(--teal)' }"></div>
                    </div>
                    <span class="val">{{ Math.round(positionalHealth.activity) }}%</span>
                 </div>
                 <div class="metric-mini" title="King Safety">
                    <span>KGS</span> 
                    <div class="bar">
                      <div class="fill" :style="{ width: positionalHealth.safety + '%', background: 'var(--rose)' }"></div>
                    </div>
                    <span class="val">{{ Math.round(positionalHealth.safety) }}%</span>
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
                    :gameSeed="gameSeed"
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
        </div>
      </div>
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
                          <p>{{ healthDiagnosis.matDesc }}</p>
                        </div>
                        <div class="diag-cell">
                          <label>ACT</label>
                          <p>{{ healthDiagnosis.actDesc }}</p>
                        </div>
                        <div class="diag-cell">
                          <label>KGS</label>
                          <p>{{ healthDiagnosis.kgsDesc }}</p>
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
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useGameStore, BOTS } from '../stores/gameStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useEngineStore } from '../stores/engineStore'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'
import { useSettingsStore } from '../stores/settingsStore'
import { Chess } from 'chess.js'
import ChessBoard from '../components/ChessBoard.vue'
import CoachPanel from '../components/CoachPanel.vue'
import MoveHistory from '../components/MoveHistory.vue'
import GameAnalysisTable from '../components/GameAnalysisTable.vue'
import { getMoveQuality } from '../utils/analysisUtils'
import { logger } from '../utils/logger'

// Board Arrow Definition
export interface ArrowDef {
  from: string
  to: string
  type?: 'suggestion' | 'suggestion-alt' | 'threat'
}

const store = useGameStore()
const libraryStore = useLibraryStore()
const engineStore = useEngineStore()
const userStore = useUserStore()
const uiStore = useUiStore()
const settings = useSettingsStore()
const isLoading = ref(true)
const showHealthLegend = ref(false)
const isSidebarCollapsed = ref(false)
const activeSidebarTab = ref('insights')

/**
 * POSITIONAL HEALTH HEURISTICS
 * 
 * Calculates real-time metrics for the "Health Bars" in the sidebar footer.
 * - Material: Balance of piece values (P=1, N/B=3, R=5, Q=9)
 * - Activity: Mobility based on legal moves and engine pressure
 * - King Safety: Proximity of threats and pawn shelter
 */
const positionalHealth = computed(() => {
  try {
    // Fallback to start FEN if store.fen is invalid
    const chess = new Chess(store.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    const board = chess.board()
    
    // 1. MATERIAL BALANCE
    let wMat = 0, bMat = 0
    const vals: Record<string, number> = { p: 1, n: 3, b: 3.25, r: 5, q: 9, k: 0 }
    board.flat().forEach(c => {
      if (!c) return
      if (c.color === 'w') wMat += vals[c.type]
      else bMat += vals[c.type]
    })
    
    // Normalize around 50%. A +3 advantage is roughly +15% shift.
    const matPct = 50 + (wMat - bMat) * 5

    // 2. ACTIVITY (Mobility & Space)
    const mobility = chess.moves().length || 20 // Default to 20 moves worth of activity
    const actPct = Math.min(95, Math.max(5, (mobility / 40) * 100))

    // 3. KING SAFETY (Based on Engine Eval & Structure)
    const evalAbs = Math.abs(engineStore.evalNumber || 0)
    let kgsPct = 90 - (evalAbs * 8) // Slightly more lenient drop
    if (chess.isCheck()) kgsPct -= 20
    
    return {
      material: Math.min(100, Math.max(0, matPct || 50)),
      activity: Math.min(100, Math.max(0, actPct || 50)),
      safety: Math.min(100, Math.max(0, kgsPct || 90))
    }
  } catch (e) {
    logger.warn('[AnalysisView] Error calculating positional health', e)
    return { material: 50, activity: 50, safety: 90 }
  }
})

const healthDiagnosis = computed(() => {
  const h = positionalHealth.value
  let matDesc = "Material is balanced."
  if (h.material > 60) matDesc = "You have a significant material advantage."
  else if (h.material < 40) matDesc = "You are down material. Look for counterplay."
  
  let actDesc = "Pieces are normally active."
  if (h.activity > 70) actDesc = "Your pieces dominate the board. Press the attack!"
  else if (h.activity < 30) actDesc = "Your pieces are cramped. Try to simplify or break open the center."
  
  let kgsDesc = "Kings are relatively safe."
  if (h.safety < 50) kgsDesc = "King safety is critical! Secure your perimeter immediately."
  
  return { matDesc, actDesc, kgsDesc }
})


const gameSeed = computed(() => {
    if (!store.loadedGameId) return 0
    return store.loadedGameId.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)
})

const engineArrows = computed<ArrowDef[]>(() => {
  const arrows: ArrowDef[] = []
  if (!engineStore.pv || engineStore.pv.length === 0) return arrows
  
  if (settings.showBestMoveArrow && engineStore.multiPvs) {
    engineStore.multiPvs.forEach((alt, idx) => {
      if (alt && alt.moves && alt.moves.length > 0) {
        const uci = alt.moves[0]
        if (uci && uci.length >= 4) {
          arrows.push({
            from: uci.slice(0, 2),
            to: uci.slice(2, 4),
            type: idx === 0 ? 'suggestion' : 'suggestion-alt'
          })
        }
      }
    })
  }

  if (settings.showThreatArrow && engineStore.pv.length > 1) {
    const threatUci = engineStore.pv[1]
    if (threatUci && threatUci.length >= 4) {
      arrows.push({
        from: threatUci.slice(0, 2),
        to: threatUci.slice(2, 4),
        type: 'threat'
      })
    }
  }

  return arrows
})

const resolvedPlayers = computed(() => {
    const headers = store.chess.header()
    const wHeader = headers.White
    const bHeader = headers.Black
    
    // 1. Initial resolution from headers
    let w = (wHeader && wHeader !== '?') ? wHeader : 'White'
    let b = (bHeader && bHeader !== '?') ? bHeader : 'Black'

    // 2. Prioritize Library Game metadata (from the Vault)
    const libraryGame = store.loadedGameId ? libraryStore.gamesMap.get(store.loadedGameId) : null
    if (libraryGame) {
      if (w === 'White' || w === 'Unknown' || w === '?') w = libraryGame.white
      if (b === 'Black' || b === 'Unknown' || b === '?') b = libraryGame.black
    }

    // 3. Resolve 'White'/'Black' to current user if authenticated
    const myUsername = userStore.profile?.username || userStore.displayName
    if ((w === 'White' || w === 'Unknown') && userStore.isAuthenticated) w = myUsername
    if ((b === 'Black' || b === 'Unknown') && userStore.isAuthenticated) b = myUsername

    // 4. Resolve Ratings & Bot Metadata
    const findBot = (name: string) => BOTS.find(bot => bot.name === name)
    const whiteBot = findBot(w)
    const blackBot = findBot(b)

    const getPlayerRating = (header: any, bot: any, isUser: boolean) => {
      if (isUser && userStore.profile?.rating) return userStore.profile.rating
      if (header && header !== '?' && header !== '0') return header
      return bot?.rating || '1200'
    }

    return {
      white: {
        name: w,
        rating: getPlayerRating(headers.WhiteElo, whiteBot, w === userStore.profile?.username),
        avatar: whiteBot?.avatar || (w === userStore.profile?.username ? userStore.profile?.avatar_url : '/avatars/default.png')
      },
      black: {
        name: b,
        rating: getPlayerRating(headers.BlackElo, blackBot, b === userStore.profile?.username),
        avatar: blackBot?.avatar || (b === userStore.profile?.username ? userStore.profile?.avatar_url : '/avatars/default.png')
      }
    }
})

const currentMoveQuality = computed(() => {
  const idx = store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex
  const move = store.moveHistory[idx]
  if (!move) return null
  return getMoveQuality(move, idx, gameSeed.value)
})

const playerNames = computed(() => {
    const p = resolvedPlayers.value
    return {
        white: p.white.name,
        black: p.black.name,
        whiteElo: p.white.rating ? `(${p.white.rating})` : '',
        blackElo: p.black.rating ? `(${p.black.rating})` : ''
    }
})


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

// askCoach has been extracted to CoachPanel.vue
const hasGame = computed(() => store.moveHistory.length > 0)
const evalNum = computed(() => engineStore.evalNumber)
const evalPercent = computed(() => engineStore.evalPercent)

// Restart engine analysis whenever the selected move changes
let analysisDebounce: any = null
watch(() => [store.viewIndex, store.loadedGameId], () => {
  if (analysisDebounce) clearTimeout(analysisDebounce)
  
  analysisDebounce = setTimeout(() => {
    if (comparisonData.value) {
      engineStore.analyze(comparisonData.value.beforeFen, settings.analysisDepth)
    } else {
      engineStore.analyze(store.fen, settings.analysisDepth)
    }
  }, 100)
}, { deep: false })

watch(() => store.loadedGameId, (newId) => {
  if (newId) {
    // Intelligent Default: Always start analysis at the first move
    nextTick(() => store.goToMove(0))
  }
})

import { useRoute } from 'vue-router'
const route = useRoute()

onMounted(async () => {
  // Let the page render before starting heavy engine work
  await nextTick()
  
  // Ensure library is loaded before we try to find games by ID
  if (libraryStore.games.length === 0) {
    await libraryStore.loadGames()
  }

  engineStore.init()
  isLoading.value = false
  
  const queryId = route.query.id as string
  let gameLoaded = false

  // 1. Check for specific ID in query params (from Vault/Archives)
  if (queryId) {
    const targetGame = libraryStore.gamesMap.get(queryId)
    if (targetGame) {
      store.loadPgn(targetGame.pgn, 'analysis', targetGame.id)
      logger.info(`[Analysis] Loaded requested game: ${queryId}`)
      gameLoaded = true
    } else {
      logger.warn(`[Analysis] Could not find queryId ${queryId} in library map.`)
    }
  } 
  
  // 2. Persistent State: Check localStorage for last active session if no ID or ID not found
  if (!gameLoaded && localStorage.getItem('kf_last_analysis_pgn')) {
    const savedPgn = localStorage.getItem('kf_last_analysis_pgn')!
    const savedId = localStorage.getItem('kf_last_analysis_id')
    store.loadPgn(savedPgn, 'analysis', savedId || undefined)
    logger.info(`[Analysis] Restored session from localStorage.`)
    gameLoaded = true
  }
  
  // 3. Fallback: If still empty, try latest from library
  if (!gameLoaded && store.moveHistory.length === 0) {
    const games = libraryStore.games
    if (games.length > 0) {
      const latest = games[games.length - 1]
      store.loadPgn(latest.pgn, 'analysis', latest.id)
      gameLoaded = true
    }
  }

  // Final check: Start from move 0 if we just loaded something
  if (gameLoaded && store.viewIndex === -1) {
    store.goToMove(0)
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
  store.loadPgn(pgn, 'analysis')
}

function importPgn() {
  const pgn = prompt('Paste your PGN text here:')
  if (pgn) importPgnStr(pgn)
}

function loadDemo() {
  importPgnStr('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6')
}

const isPlaying = ref(false)
const pauseReason = ref<any>(null)
let playTimeout: any = null

function togglePlayback() {
  if (isPlaying.value) {
    isPlaying.value = false
    if (playTimeout) clearTimeout(playTimeout)
  } else {
    isPlaying.value = true
    pauseReason.value = null // Clear reason when resuming
    runHighlightPace()
  }
}

// Clear pause reason if user manually navigates
watch(() => store.viewIndex, () => {
  if (!isPlaying.value) pauseReason.value = null
})

function runHighlightPace() {
  if (!isPlaying.value) return

  const currentIdx = store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex
  const nextIdx = currentIdx + 1

  if (nextIdx >= store.moveHistory.length) {
    isPlaying.value = false
    pauseReason.value = null
    uiStore.addToast('End of game reached.', 'info')
    return
  }

  const nextMove = store.moveHistory[nextIdx]
  const quality = getMoveQuality(nextMove, nextIdx, gameSeed.value)
  
  store.goToMove(nextIdx)

  // INTERACTIVE PAUSE:
  // If we hit a major instructional moment, stop the reel so the user can study.
  if (quality.label === 'blunder' || quality.label === 'mistake') {
    isPlaying.value = false
    pauseReason.value = quality // Store the reason for the UI
    uiStore.addToast(`Oracle Intervention: Paused at ${quality.label.toUpperCase()}.`, 'warning')
    return
  }

  // DYNAMIC TEMPO:
  // Inaccuracies = 1.8s (Brief moment to notice)
  // Best/Good = 0.8s (Standard flow)
  let delay = 800
  if (quality.label === 'inaccuracy') delay = 1800

  playTimeout = setTimeout(runHighlightPace, delay)
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
  gap: var(--space-8);
  align-items: flex-start;
  padding: var(--space-4);
  max-width: 1600px;
  margin: 0 auto;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.analysis-layout.sidebar-collapsed {
  gap: 0;
  max-width: 100%;
}

.analysis-board-col {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0; /* Allow shrinking */
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.analysis-sidebar {
  width: 420px;
  height: calc(100vh - 160px);
  max-height: 900px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.6);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 100px; /* Offset for global header */
  flex-shrink: 0;
}

.panel-header {
  padding: var(--space-4);
  background: linear-gradient(to bottom, rgba(139,92,246,0.1), transparent);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.engine-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
.engine-info .depth { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }

.sidebar-scrollable-content {
  flex: 1;
  min-height: 0; /* Fix for flexbox scrolling clipping */
  overflow-y: auto;
  padding: var(--space-4);
  padding-bottom: var(--space-8); /* Buffer for last item */
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
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

.sidebar-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: rgba(10, 10, 12, 0.4);
  flex-shrink: 0;
  backdrop-filter: blur(10px);
}

.live-insights-summary {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--border);
}
.live-insights-summary .label { 
  font-size: 0.65rem; 
  font-weight: 800; 
  color: var(--text-muted); 
  letter-spacing: 0.05em;
  margin-bottom: var(--space-3);
}
.insight-row {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
  font-size: 0.8rem;
  line-height: 1.4;
}
.insight-row .icon { opacity: 0.7; }
.insight-row p { margin: 0; color: var(--text-secondary); }

.metric-mini .val {
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
  width: 35px;
  text-align: right;
}

.footer-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.footer-title span {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}
.btn-help-circle {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 0.9rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}
.btn-help-circle:hover { opacity: 1; }

.metric-mini {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: 0.7rem;
  font-weight: 800;
  font-family: var(--font-mono);
  color: var(--text-secondary);
}
.metric-mini span { width: 32px; }
.metric-mini .bar {
  flex: 1;
  height: 4px;
  background: rgba(255,255,255,0.05);
  border-radius: 2px;
  overflow: hidden;
}
.metric-mini .fill {
  height: 100%;
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
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
  overflow: hidden;
}

.review-pane-padding {
  padding: var(--space-6);
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
</style>
