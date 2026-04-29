<template>
  <div class="page play-page">
    <div class="play-header">
      <div>
        <h2>Direct Combat</h2>
        <p class="muted" style="font-size: 0.9rem;">{{ modeLabel }}</p>
      </div>
      <div class="play-header-actions">
        <button class="btn btn-ghost btn-sm" @click="showHistory = !showHistory" :class="{ active: showHistory }">
          {{ showHistory ? '📋 Hide Intel' : '📋 Show Intel' }}
        </button>
        <button class="btn btn-ghost btn-sm" @click="store.undoMove()" :disabled="store.moveHistory.length === 0">
          ↩ Undo
        </button>
        <button class="btn btn-ghost btn-sm" @click="flipped = !flipped">
          ⇄ Flip
        </button>
        <button class="btn btn-danger btn-sm" @click="resign" v-if="!showSetup">
          ✕ Resign
        </button>
      </div>
    </div>

    <div class="play-layout" :class="{ 'game-active': !showSetup, 'history-open': showHistory }">
      <!-- Left: setup panel (shown when no game started) -->
      <Transition name="slide-right">
        <div class="setup-panel glass" v-if="showSetup">
          <h3 style="margin-bottom: var(--space-5);">New Game</h3>

          <!-- Mode select -->
          <div class="setup-section">
            <div class="label" style="margin-bottom: var(--space-3);">Game Mode</div>
            <div class="mode-grid">
              <button
                v-for="m in modes" :key="m.id"
                class="mode-btn"
                :class="{ active: selectedMode === m.id }"
                @click="selectedMode = m.id"
              >
                <span class="mode-icon">{{ m.icon }}</span>
                <span class="mode-label">{{ m.label }}</span>
              </button>
            </div>
          </div>

          <!-- Color select (vs computer) -->
          <Transition name="fade-up">
            <div class="vs-computer-settings" v-if="selectedMode === 'vs-computer'">
              <div class="setup-section">
                <div class="label" style="margin-bottom: var(--space-3);">Choose Opponent</div>
                <div class="bot-list">
                  <div
                    v-for="bot in BOTS" :key="bot.id"
                    class="bot-card glass-sm"
                    :class="{ active: store.activeBot.id === bot.id }"
                    @click="store.activeBot = bot"
                  >
                    <img :src="bot.avatar" class="bot-avatar" />
                    <div class="bot-info">
                      <div class="bot-name">{{ bot.name }} <span class="badge badge-accent">{{ bot.rating }}</span></div>
                      <div class="bot-desc muted">{{ bot.description }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="setup-section">
                <div class="label" style="margin-bottom: var(--space-3);">Play as</div>
                <div class="color-picker">
                  <button
                    v-for="c in colors" :key="c.value"
                    class="color-btn"
                    :class="{ active: selectedColor === c.value }"
                    @click="selectedColor = c.value"
                  >
                    {{ c.icon }} {{ c.label }}
                  </button>
                </div>
              </div>
            </div>
          </Transition>

          <!-- Time control -->
          <div class="setup-section">
            <div class="label" style="margin-bottom: var(--space-3);">Time Control</div>
            <div class="tc-grid">
              <button
                v-for="tc in TIME_CONTROLS" :key="tc.label"
                class="tc-btn"
                :class="{ active: selectedTc.label === tc.label }"
                @click="selectedTc = tc"
              >
                {{ tc.label }}
              </button>
            </div>
          </div>

          <button class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: var(--space-4);"
            @click="startGame" id="start-game-btn">
            ♟ Start Game
          </button>
        </div>
      </Transition>

      <!-- Board area -->
      <div class="board-area">
        <!-- Player info top -->
        <PlayerBar
          :name="opponentName"
          :rating="opponentRating"
          :avatar="opponentAvatar"
          :time="flipped ? store.whiteTime : store.blackTime"
          :active="store.turn === (flipped ? 'w' : 'b') && store.gameActive"
          :color="flipped ? 'white' : 'black'"
        />

        <!-- Thinking indicator -->
        <Transition name="fade-up">
          <div class="thinking-bar" v-if="store.isThinking">
            <div class="thinking-dots">
              <span></span><span></span><span></span>
            </div>
            Engine is thinking…
          </div>
        </Transition>

        <div class="board-wrapper">
          <ChessBoard :flipped="flipped" />

          <!-- Overlays -->
          <Transition name="fade-up">
            <div class="game-over-overlay glass" v-if="store.isGameOver && !store.isCheaterBusted">
              <h3 style="color: var(--accent-bright);">Game Over</h3>
              <p style="font-weight: 600; font-size: 1.1rem; margin-bottom: var(--space-2);">{{ store.gameResult }}</p>
              <div style="display: flex; gap: var(--space-2); justify-content: center;">
                <button class="btn btn-primary" @click="triggerNewGame">New Game</button>
                <button class="btn btn-ghost" @click="reviewGame" :disabled="isReviewing">
                  <span v-if="isReviewing" class="spinner-sm" style="margin-right:4px"></span>
                  {{ isReviewing ? 'Loading...' : 'Review Game' }}
                </button>
              </div>
            </div>
          </Transition>

          <!-- Anti-Cheat Warning (Yellow Card) -->
          <Transition name="fade-up">
            <div class="anti-cheat-warning glass-sm" v-if="store.suspicionScore >= 60 && !store.isCheaterBusted">
              <span class="warning-icon">⚠️</span>
              <div class="warning-content">
                <div class="warning-title">Security Alert</div>
                <div class="warning-text">Suspicious behavior detected ({{ store.suspicionScore.toFixed(0) }}%). <b>Fair play is monitored.</b></div>
              </div>
            </div>
          </Transition>

          <Transition name="fade-up">
            <div class="game-over-overlay cheat-busted glass" v-if="store.isCheaterBusted">
              <div class="cheat-header">
                <span class="cheat-icon">⚠️</span>
                <h3 style="color: var(--rose); font-size: 1.5rem; text-transform: uppercase;">Anti-Cheat Triggered</h3>
              </div>
              <p style="font-weight: 600; font-size: 1rem; margin-bottom: var(--space-2);">Suspicious behavior detected.</p>
              
              <div class="cheat-forensics glass-sm">
                <div class="forensic-item">
                  <span class="label">Robotic Rhythm:</span>
                  <span class="value" :style="{ color: store.antiCheat.roboticScore > 50 ? 'var(--rose)' : 'inherit' }">
                    {{ store.antiCheat.roboticScore.toFixed(0) }}%
                  </span>
                </div>
                <div class="forensic-item">
                  <span class="label">Engine Correlation:</span>
                  <span class="value" :style="{ color: store.antiCheat.correlationScore > 50 ? 'var(--rose)' : 'inherit' }">
                    {{ ((store.antiCheat.engineMatches / (store.antiCheat.totalAnalyzedMoves || 1)) * 100).toFixed(0) }}%
                  </span>
                </div>
                <div class="forensic-item">
                  <span class="label">Window Blurs:</span>
                  <span class="value">{{ store.antiCheat.blurCount }}</span>
                </div>
                <div class="forensic-item">
                  <span class="label">Total Suspicion:</span>
                  <span class="value" style="color: var(--rose); font-weight: 800;">{{ store.suspicionScore.toFixed(0) }}%</span>
                </div>
              </div>
              
              <p class="muted" style="font-size: 0.75rem; margin-top: var(--space-3); max-width: 280px;">
                Knightfall uses statistical analysis to ensure fair play. Robotic move times or tab switching during play will trigger this lock.
              </p>
              
              <button class="btn btn-danger" style="margin-top: var(--space-4);" @click="triggerNewGame">Accept Defeat</button>
            </div>
          </Transition>
        </div>

        <!-- Player info bottom -->
        <PlayerBar
          :name="playerName"
          :rating="playerRating"
          :avatar="playerAvatar"
          :time="flipped ? store.blackTime : store.whiteTime"
          :active="store.turn === (flipped ? 'b' : 'w') && store.gameActive"
          :color="flipped ? 'black' : 'white'"
        />
      </div>

      <!-- Right: move history + eval + Tactical Pulse -->
      <Transition name="slide-left">
        <div class="side-panel glass" v-if="showHistory">
          <!-- Eval bar -->
          <div class="eval-section" v-if="store.mode === 'vs-computer'">
            <div class="eval-bar-vertical">
              <div class="eval-white-fill" :style="{ height: evalPercent + '%' }"></div>
            </div>
            <div class="eval-info">
              <div class="eval-score" :class="evalNumber > 0 ? 'positive' : 'negative'">
                {{ evalNumber > 0 ? '+' : '' }}{{ evalNumber.toFixed(1) }}
              </div>
              <div class="label" style="font-size: 0.65rem;">EVAL</div>
            </div>
          </div>
          <div class="divider" v-if="store.mode === 'vs-computer'"></div>

          <!-- TACTICAL PULSE -->
          <TacticalPulse />
          <div class="divider" v-if="store.mode === 'vs-computer' && store.gameActive"></div>

          <MoveHistory />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore, TIME_CONTROLS, BOTS } from '../stores/gameStore'
import { useEngineStore } from '../stores/engineStore'
import { useUserStore } from '../stores/userStore'
import type { GameMode, TimeControl } from '../stores/gameStore'
import type { Color } from 'chess.js'
import ChessBoard from '../components/ChessBoard.vue'
import MoveHistory from '../components/MoveHistory.vue'
import PlayerBar from '../components/PlayerBar.vue'
import TacticalPulse from '../components/TacticalPulse.vue'

const store = useGameStore()
const engineStore = useEngineStore()
engineStore.init()

const flipped = ref(false)
const showSetup = ref(true)
const showHistory = ref(false) // Hidden by default

const router = useRouter()
const isReviewing = ref(false)

function triggerNewGame() {
  store.newGame(selectedMode.value, selectedColor.value, selectedTc.value)
  showSetup.value = true
}

function reviewGame() {
  isReviewing.value = true
  const isWhite = store.playerColor === 'w'
  const pName = userStore.profile?.username || 'Guest'
  const oName = selectedMode.value === 'vs-computer' ? store.activeBot.name : 'Player 2'
  const headers: Record<string, string> = {
    'Event': selectedMode.value === 'vs-computer' ? `Match vs ${oName}` : 'Local Match',
    'Site': 'Knightfall',
    'Date': new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    'White': (selectedMode.value === 'local' || isWhite) ? pName : oName,
    'Black': (selectedMode.value === 'local' || isWhite) ? oName : pName,
    'Result': store.gameResult || '*',
    'WhiteElo': String((selectedMode.value === 'local' || isWhite) ? (userStore.profile?.rating || 1200) : store.activeBot.rating),
    'BlackElo': String((selectedMode.value === 'local' || isWhite) ? store.activeBot.rating : (userStore.profile?.rating || 1200)),
  }
  Object.entries(headers).forEach(([k, v]) => store.chess.setHeader(k, v))
  store.mode = 'analysis'
  store.viewIndex = -1
  router.push('/analysis')
}

const selectedMode = ref<GameMode>('local')
const selectedColor = ref<Color>('w')
const selectedTc = ref<TimeControl>(TIME_CONTROLS[3])

const modes: { id: GameMode; icon: string; label: string }[] = [
  { id: 'local',       icon: '🤝', label: 'Pass & Play' },
  { id: 'vs-computer', icon: '🤖', label: 'vs Computer' },
]

const colors: { value: Color; icon: string; label: string }[] = [
  { value: 'b', icon: '♚', label: 'Black side' },
  { value: 'w', icon: '♔', label: 'White side' },
]

const userStore = useUserStore()
const playerName    = computed(() => userStore.profile?.username || 'Guest')
const playerRating  = computed(() => userStore.profile?.rating || 1200)
const playerAvatar  = computed(() => userStore.profile?.username?.charAt(0).toUpperCase() || '?')
const opponentName  = computed(() => selectedMode.value === 'vs-computer' ? store.activeBot.name : 'Player 2')
const opponentRating= computed(() => selectedMode.value === 'vs-computer' ? store.activeBot.rating : 1500)
const opponentAvatar = computed(() => selectedMode.value === 'vs-computer' ? store.activeBot.avatar : '👤')

const modeLabel = computed(() => {
  if (selectedMode.value === 'vs-computer') return 'You vs Computer · ' + selectedTc.value.label
  return 'Local · Pass & Play · ' + selectedTc.value.label
})

function startGame() {
  store.newGame(selectedMode.value, selectedColor.value, selectedTc.value)
  store.gameStarted = true
  showSetup.value = false
  store.startClock()
  
  if (selectedMode.value === 'vs-computer') {
    engineStore.analyze(store.fen, 14)
    if (selectedColor.value === 'b') {
      flipped.value = true
      store.computerMove()
    } else {
      flipped.value = false
    }
  } else {
    flipped.value = false
  }
}

function resign() {
  store.resign(flipped.value ? 'b' : 'w')
  store.stopClock()
}

watch(() => store.fen, () => {
  if (store.gameActive && store.mode === 'local') {
    flipped.value = store.turn === 'b'
  }
})

const evalNumber = computed(() => engineStore.evalNumber)
const evalPercent = computed(() => engineStore.evalPercent)

function handleWindowBlur() {
  store.registerBlur()
}

onMounted(() => {
  window.addEventListener('blur', handleWindowBlur)
  if (!!(window as any).Playwright || navigator.userAgent.includes('Playwright')) {
    (window as any).gameStore = store
  }
})

onUnmounted(() => { 
  window.removeEventListener('blur', handleWindowBlur)
  store.stopClock()
  engineStore.stop()
})

watch(() => store.isCheaterBusted, (busted) => {
  if (busted && !store.isGameOver) {
    store.resign(store.playerColor)
  }
})
</script>

<style scoped>
.play-page { padding: var(--space-2) var(--space-6); }

.play-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
  gap: var(--space-3);
}
.play-header-actions { display: flex; gap: var(--space-2); }

.play-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-8);
  align-items: start;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  width: 100%;
}

/* When game is active, we hide the left setup panel and center the board */
.play-layout.game-active {
  grid-template-columns: 1fr;
}

/* If history is open, we add a third column on the right */
.play-layout.history-open {
  grid-template-columns: 280px 1fr 320px;
}

.play-layout.game-active.history-open {
  grid-template-columns: 1fr 320px;
}

@media (max-width: 1200px) {
  .play-layout { grid-template-columns: 1fr 260px; }
  .play-layout.game-active { grid-template-columns: 1fr; }
  .setup-panel { position: absolute; top: 0; left: 0; z-index: 50; width: 300px; height: 100%; }
}
@media (max-width: 760px) {
  .play-layout { grid-template-columns: 1fr; }
  .side-panel { display: none; }
}

.setup-panel { padding: var(--space-6); overflow-y: auto; max-height: 100%; }
.setup-section { margin-bottom: var(--space-5); }
.mode-grid { display: flex; flex-direction: column; gap: var(--space-2); }
.mode-btn {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 0.9rem;
}
.mode-btn:hover { background: var(--bg-card); color: var(--text-primary); }
.mode-btn.active { border-color: var(--accent); background: var(--accent-dim); color: var(--accent-bright); }
.mode-icon { font-size: 1.3rem; }

.color-picker { display: flex; gap: var(--space-2); }
.color-btn {
  flex: 1; padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.15s ease;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.color-btn.active { border-color: var(--accent); background: var(--accent-dim); color: var(--accent-bright); }

.bot-list { display: flex; flex-direction: column; gap: var(--space-2); }
.bot-card { width: 100%; display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border); cursor: pointer; transition: all 0.2s ease; background: var(--bg-elevated); }
.bot-card:hover { border-color: rgba(255,255,255,0.2); }
.bot-card.active { border-color: var(--accent); background: var(--accent-dim); }
.bot-avatar { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; }
.bot-info { flex: 1; text-align: left; }
.bot-name { font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: var(--space-2); margin-bottom: 2px; }
.bot-desc { font-size: 0.75rem; line-height: 1.3; }

.tc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-2); }
.tc-btn {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 600;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.tc-btn:hover { background: var(--bg-card); }
.tc-btn.active { border-color: var(--teal); background: var(--teal-dim); color: var(--teal); }

.board-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: center;
  width: 100%;
}

.board-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.game-over-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  padding: var(--space-6) var(--space-8);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  min-width: 300px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  border: 1px solid var(--border);
  backdrop-filter: blur(12px);
}

.cheat-busted {
  border-color: rgba(244,63,94,0.6) !important;
  background: rgba(15,8,10,0.9) !important;
}

.thinking-bar {
  display: flex; align-items: center; gap: var(--space-3);
  font-size: 0.85rem; color: var(--text-muted);
  padding: var(--space-2) var(--space-4);
  background: var(--bg-elevated);
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
}
.thinking-dots { display: flex; gap: 4px; }
.thinking-dots span {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: bounce 1.2s infinite;
}
.thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-5px); }
}

.side-panel {
  display: flex;
  flex-direction: column;
  height: 560px;
  min-height: 0;
}

.eval-section {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
}
.eval-bar-vertical {
  width: 10px; height: 52px;
  background: #2a2a2a;
  border-radius: 5px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column-reverse;
}
.eval-white-fill {
  width: 100%;
  background: #f0f0f0;
  border-radius: 5px;
  transition: height 0.6s var(--ease);
}
.eval-score {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 700;
}
.eval-score.positive { color: var(--text-primary); }
.eval-score.negative { color: var(--text-muted); }

.slide-right-enter-active, .slide-right-leave-active { transition: all 0.3s var(--ease); }
.slide-right-enter-from { opacity: 0; transform: translateX(-20px); }
.slide-right-leave-to  { opacity: 0; transform: translateX(-20px); }

.slide-left-enter-active, .slide-left-leave-active { transition: all 0.3s var(--ease); }
.slide-left-enter-from { opacity: 0; transform: translateX(20px); }
.slide-left-leave-to  { opacity: 0; transform: translateX(20px); }

.fade-up-enter-active, .fade-up-leave-active { transition: all 0.25s ease; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(6px); }

.cheat-header { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-2); }
.cheat-icon { font-size: 2rem; animation: pulse-red 2s infinite; }
.cheat-forensics {
  width: 100%;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: var(--space-3) 0;
  border: 1px solid rgba(244,63,94,0.3);
  text-align: left;
}
.forensic-item {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.85rem;
}
.forensic-item .label { color: var(--text-muted); }
.forensic-item .value { font-weight: 700; }

@keyframes pulse-red {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.anti-cheat-warning {
  position: absolute;
  top: var(--space-4);
  left: 50%;
  transform: translateX(-50%);
  z-index: 110;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  border: 1px solid rgba(245,158,11,0.5);
  background: rgba(20,15,5,0.9);
  color: #f59e0b;
  border-radius: var(--radius-md);
  box-shadow: 0 10px 30px rgba(0,0,0,0.4), 0 0 15px rgba(245,158,11,0.2);
  min-width: 280px;
  backdrop-filter: blur(8px);
}
.warning-icon { font-size: 1.2rem; }
.warning-title { font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
.warning-text { font-size: 0.85rem; }

</style>
