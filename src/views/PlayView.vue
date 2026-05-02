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
      <!-- Left: setup panel (shown when no game started) -->
      <Transition name="slide-right">
        <PlaySetupPanel 
          v-if="showSetup"
          v-model:selectedMode="selectedMode"
          v-model:selectedColor="selectedColor"
          v-model:selectedTc="selectedTc"
          :activeBotId="store.activeBot.id"
          @selectBot="store.activeBot = $event"
          @start="startGame(selectedMode, selectedColor, selectedTc)"
        />
      </Transition>

      <!-- Board area -->
      <div class="board-area">
        <!-- Opponent info -->
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
          <PlayThinkingIndicator v-if="store.isThinking" />
        </Transition>

        <div class="board-wrapper">
          <ChessBoard :flipped="flipped" />

          <!-- Overlays -->
          <Transition name="fade-up">
            <PlayGameOverOverlay 
              v-if="store.isGameOver && !store.isCheaterBusted"
              :result="store.gameResult"
              :isReviewing="isReviewing"
              @newGame="triggerNewGame(selectedMode, selectedColor, selectedTc)"
              @review="reviewGame(selectedMode)"
            />
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

          <!-- Cheat Busted Overlay -->
          <Transition name="fade-up">
            <PlayCheatBustedOverlay 
              v-if="store.isCheaterBusted"
              :roboticScore="store.antiCheat.roboticScore"
              :correlationScore="(store.antiCheat.engineMatches / (store.antiCheat.totalAnalyzedMoves || 1)) * 100"
              :blurCount="store.antiCheat.blurCount"
              :suspicionScore="store.suspicionScore"
              @accept="triggerNewGame(selectedMode, selectedColor, selectedTc)"
            />
          </Transition>
        </div>

        <!-- Player info -->
        <PlayerBar
          :name="playerName"
          :rating="playerRating"
          :avatar="playerAvatar"
          :time="flipped ? store.blackTime : store.whiteTime"
          :active="store.turn === (flipped ? 'b' : 'w') && store.gameActive"
          :color="flipped ? 'black' : 'white'"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useEngineStore } from '../stores/engineStore'

// Pillar Components
import ChessBoard from '../components/ChessBoard.vue'
import MoveHistory from '../components/MoveHistory.vue'
import PlayerBar from '../components/PlayerBar.vue'
import TacticalPulse from '../components/TacticalPulse.vue'
import PlaySetupPanel from '../components/play/PlaySetupPanel.vue'
import PlayGameOverOverlay from '../components/play/PlayGameOverOverlay.vue'
import PlayCheatBustedOverlay from '../components/play/PlayCheatBustedOverlay.vue'
import PlayThinkingIndicator from '../components/play/PlayThinkingIndicator.vue'

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

// Initialize Pillar Logic
const { selectedMode, selectedColor, selectedTc } = usePlaySetup()
const { playerName, playerRating, playerAvatar, opponentName, opponentRating, opponentAvatar, modeLabel } = usePlayOpponent(selectedMode)
const { isReviewing, triggerNewGame, startGame, resign, reviewGame } = usePlayOrchestration(showSetup, flipped)
usePlayAntiCheat()

// Derived Eval Data
const evalNumber = computed(() => engineStore.evalNumber)
const evalPercent = computed(() => engineStore.evalPercent)

/**
 * Handle turn-based flipping for local games.
 */
watch(() => store.fen, () => {
  if (store.gameActive && store.mode === 'local') {
    flipped.value = store.turn === 'b'
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
}

.board-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
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
