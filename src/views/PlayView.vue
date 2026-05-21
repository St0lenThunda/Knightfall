<template>
  <div class="page play-page">
    <div class="play-header">
      <div>
        <h2>Direct Combat</h2>
        <p class="muted subtitle">{{ modeLabel }} · {{ selectedTc.label }}</p>
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
      <!-- Main Board Area -->
      <div class="board-area" ref="boardAreaRef">
        <!-- Opponent info -->
        <PlayerBar
          v-if="!showSetup"
          :name="opponentName"
          :rating="opponentRating"
          :avatar="opponentAvatar"
          :time="flipped ? store.whiteTime : store.blackTime"
          :active="store.turn === (flipped ? 'w' : 'b') && store.gameActive"
          :color="flipped ? 'white' : 'black'"
          :isBot="store.mode === 'vs-computer'"
        />

        <!-- Thinking indicator -->
        <Transition name="fade-up">
          <PlayThinkingIndicator v-if="store.isThinking" />
        </Transition>

        <div class="board-wrapper">
          <div class="board-main-container" :class="{ 'blurred': showSetup }">
            <ChessBoard :flipped="flipped" />
          </div>

          <!-- Setup Overlay (when no game active) -->
          <div v-if="showSetup" class="setup-overlay">
            <div class="setup-cta">
              <h1 class="text-glow mb-2">READY FOR BATTLE?</h1>
              <p class="muted mb-8">Select your adversary and prepare for tactical engagement.</p>
              <button class="btn btn-primary btn-lg px-12" @click="showNewGameModal = true">
                ⚔️ START NEW GAME
              </button>
            </div>
          </div>

          <!-- Overlays -->
          <Transition name="fade-up">
            <PlayGameOverOverlay 
              v-if="store.isGameOver && !store.isCheaterBusted"
              :result="store.gameResult"
              :reason="store.gameOverReason"
              :isReviewing="isReviewing"
              @newGame="showNewGameModal = true"
              @review="reviewGame()"
            />
          </Transition>

          <!-- Anti-Cheat Warning -->
          <Transition name="fade-up">
            <div class="anti-cheat-warning glass-sm" v-if="store.suspicionScore >= 60 && !store.isCheaterBusted">
              <span class="warning-icon">⚠️</span>
              <div class="warning-content">
                <div class="warning-title">Security Alert</div>
                <div class="warning-text">Suspicious behavior detected ({{ store.suspicionScore.toFixed(0) }}%). <b>Fair play is monitored.</b></div>
              </div>
            </div>
          </Transition>

          <!-- Busted Overlay -->
          <Transition name="fade-up">
            <PlayCheatBustedOverlay 
              v-if="store.isCheaterBusted"
              :roboticScore="store.antiCheat.roboticScore"
              :correlationScore="(store.antiCheat.engineMatches / (store.antiCheat.totalAnalyzedMoves || 1)) * 100"
              :blurCount="store.antiCheat.blurCount"
              :suspicionScore="store.suspicionScore"
              @accept="showNewGameModal = true"
            />
          </Transition>
        </div>

        <!-- Player info -->
        <PlayerBar
          v-if="!showSetup"
          :name="playerName"
          :rating="playerRating"
          :avatar="playerAvatar"
          :time="flipped ? store.blackTime : store.whiteTime"
          :active="store.turn === (flipped ? 'b' : 'w') && store.gameActive"
          :color="flipped ? 'black' : 'white'"
          :isBot="false"
        />
      </div>

      <!-- Right Side Panel -->
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

    <!-- New Game Modal -->
    <NewGameModal 
      :show="showNewGameModal" 
      @close="showNewGameModal = false"
      @start="handleStartGame"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch, nextTick } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useEngineStore } from '../stores/engineStore'

// Pillar Components
import ChessBoard from '../components/ChessBoard.vue'
import MoveHistory from '../components/MoveHistory.vue'
import PlayerBar from '../components/PlayerBar.vue'
import TacticalPulse from '../components/TacticalPulse.vue'
import PlayGameOverOverlay from '../components/play/PlayGameOverOverlay.vue'
import PlayCheatBustedOverlay from '../components/play/PlayCheatBustedOverlay.vue'
import PlayThinkingIndicator from '../components/play/PlayThinkingIndicator.vue'
import NewGameModal from '../components/play/NewGameModal.vue'

// Pillar Composables
import { usePlaySetup } from '../composables/play/usePlaySetup'
import { usePlayOpponent } from '../composables/play/usePlayOpponent'
import { usePlayOrchestration } from '../composables/play/usePlayOrchestration'
import { usePlayAntiCheat } from '../composables/play/usePlayAntiCheat'

// Core Stores
const store = useGameStore()
const engineStore = useEngineStore()
engineStore.init()

// Base UI State
const flipped = ref(false)
const showSetup = ref(true)
const showHistory = ref(false)
const showNewGameModal = ref(false)
const boardAreaRef = ref<HTMLElement | null>(null)

// Initialize Pillar Logic
const { selectedMode, selectedColor, selectedTc } = usePlaySetup()
const { playerName, playerRating, playerAvatar, opponentName, opponentRating, opponentAvatar, modeLabel } = usePlayOpponent(selectedMode)
const { isReviewing, startGame, resign, reviewGame } = usePlayOrchestration(showSetup, flipped)
usePlayAntiCheat()

// Derived Eval Data
const evalNumber = computed(() => engineStore.evalNumber)
const evalPercent = computed(() => engineStore.evalPercent)

/**
 * Handle game start from the modal.
 */
function handleStartGame(params: any) {
  showNewGameModal.value = false
  showSetup.value = false
  
  // Sync the setup values to the composables/store
  selectedMode.value = params.mode
  selectedColor.value = params.color
  selectedTc.value = params.tc
  store.activeBot = params.bot
  
  startGame(params.mode, params.color, params.tc)
}

/**
 * Handle turn-based flipping for local games.
 */
watch(() => store.fen, () => {
  if (store.gameActive && store.mode === 'local') {
    flipped.value = store.turn === 'b'
  }
})

/**
 * Focus the board when the setup is dismissed (game starts).
 */
watch(showSetup, (isSetup) => {
  if (!isSetup) {
    nextTick(() => {
      boardAreaRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
})

onUnmounted(() => { 
  store.stopClock()
  engineStore.stop()
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

.subtitle { font-size: 0.9rem; }
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

.play-layout.game-active { grid-template-columns: 1fr; }
.play-layout.history-open { grid-template-columns: 280px 1fr 320px; }
.play-layout.game-active.history-open { grid-template-columns: 1fr 320px; }

@media (max-width: 1200px) {
  .play-layout { grid-template-columns: 1fr 260px; }
  .play-layout.game-active { grid-template-columns: 1fr; }
}

@media (max-width: 760px) {
  .play-layout { grid-template-columns: 1fr; }
  .side-panel { display: none; }
}

.board-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: center;
  width: 100%;
  position: relative;
}

.setup-overlay {
  position: fixed;
  top: 0;
  left: var(--sidebar-width, 240px);
  width: calc(100vw - var(--sidebar-width, 240px));
  height: 100vh;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: rgba(0, 0, 0, 0.4); /* Slightly lighter to feel more integrated */
  backdrop-filter: blur(16px);
  pointer-events: all;
  transition: all var(--duration) var(--ease);
}

@media (max-width: 1024px) {
  .setup-overlay {
    left: 0;
    width: 100vw;
  }
}

.setup-cta {
  max-width: 800px;
  padding: var(--space-12);
  animation: setupScaleIn 0.5s var(--ease-out);
}

@keyframes setupScaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.setup-cta h1 {
  font-size: 4.5rem;
  font-weight: 950;
  color: #fff;
  text-shadow: 0 0 30px rgba(255,255,255,0.2);
  letter-spacing: -0.02em;
}

.board-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.board-main-container {
  width: 100%;
  height: 100%;
  transition: filter 0.5s var(--ease);
}

.board-main-container.blurred {
  filter: blur(15px) grayscale(0.8);
  pointer-events: none;
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

.slide-right-enter-active, .slide-right-leave-active { transition: all 0.3s var(--ease); }
.slide-right-enter-from, .slide-right-leave-to { opacity: 0; transform: translateX(-20px); }

.slide-left-enter-active, .slide-left-leave-active { transition: all 0.3s var(--ease); }
.slide-left-enter-from, .slide-left-leave-to { opacity: 0; transform: translateX(20px); }

.fade-up-enter-active, .fade-up-leave-active { transition: all 0.25s ease; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(6px); }
</style>
