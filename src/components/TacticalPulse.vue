<template>
  <!--
    TacticalPulse: Real-time coaching feedback during live play.
    
    Three phases of feedback:
    1. Mood Orb - A glowing indicator of your position health
    2. Blunder Alert - Automated detection of significant evaluation drops  
    3. Explain Position - On-demand AI analysis of the current board state

    This component was extracted from PlayView.vue to follow the 
    Single Responsibility Principle — it only handles coaching UI.
  -->
  <div class="tactical-pulse" v-if="store.mode === 'vs-computer' && store.gameActive">
    <!-- Phase 1: Mood Orb -->
    <div class="pulse-header">
      <div class="mood-orb" :class="moodState.class">
        <div class="orb-glow"></div>
        <div class="orb-core">{{ moodState.icon }}</div>
      </div>
      <div class="mood-info">
        <div class="mood-label">{{ moodState.label }}</div>
        <div class="mood-desc">{{ moodState.desc }}</div>
      </div>
    </div>

    <!-- Phase 2: Blunder Alert -->
    <Transition name="blunder-slide">
      <div class="blunder-alert" v-if="blunderText">
        <div class="blunder-badge">⚠ BLUNDER</div>
        <div class="blunder-prose" v-html="renderedBlunder"></div>
        <button class="blunder-dismiss" @click="blunderText = null">✕</button>
      </div>
    </Transition>

    <!-- Phase 3: Explain Button -->
    <button class="explain-btn" @click="handleExplain" :disabled="isExplaining">
      <span v-if="isExplaining" class="spinner-sm"></span>
      <span v-else>🔍</span>
      {{ isExplaining ? 'Analyzing...' : 'Explain Position' }}
    </button>

    <!-- Explain Panel -->
    <Transition name="fade-up">
      <div class="explain-panel" v-if="explainText">
        <div class="explain-header">
          <span class="label">POSITION INSIGHT</span>
          <button class="blunder-dismiss" @click="dismissExplain">✕</button>
        </div>
        <div class="explain-prose" v-html="renderedExplain"></div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * TacticalPulse.vue — Live coaching feedback component.
 * 
 * Responsibilities:
 * - Displays the Mood Orb (Phase 1) based on engine evaluation
 * - Shows Blunder Alerts (Phase 2) when evaluation drops significantly
 * - Provides an "Explain Position" button (Phase 3) for on-demand AI analysis
 * 
 * This component is a "display + interaction" layer only.
 * All engine state comes from engineStore, game state from gameStore.
 */
import { ref, computed, watch } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useEngineStore } from '../stores/engineStore'
import { generateBlunderAlert, generatePositionExplain } from '../api/llmApi'
import { renderMarkdown } from '../utils/markdown'

const store = useGameStore()
const engineStore = useEngineStore()

// ═══ PHASE 1: MOOD ORB ═══
// Maps the engine evaluation to a human-readable mood state.
// The thresholds (2.0, 0.5, -0.5, -2.0) are standard chess evaluation brackets.

/**
 * Computes the current positional mood based on engine evaluation.
 * We flip the eval if the player is Black so the orb always
 * reflects the player's perspective, not White's.
 */
const moodState = computed(() => {
  const ev = engineStore.evalNumber
  // Flip evaluation to player's perspective
  const playerIsWhite = store.playerColor === 'w'
  const playerEval = playerIsWhite ? ev : -ev

  // Thresholds based on standard chess evaluation theory:
  // > +2.0 = winning (dominant), > +0.5 = better (comfortable), etc.
  if (playerEval > 2.0) return { class: 'mood-dominant', icon: '🟢', label: 'Dominant', desc: 'You have a commanding advantage' }
  if (playerEval > 0.5) return { class: 'mood-comfortable', icon: '🔵', label: 'Comfortable', desc: 'Position is in your favor' }
  if (playerEval > -0.5) return { class: 'mood-balanced', icon: '⚪', label: 'Balanced', desc: 'Equal chances for both sides' }
  if (playerEval > -2.0) return { class: 'mood-pressure', icon: '🟡', label: 'Under Pressure', desc: 'Your opponent has the initiative' }
  return { class: 'mood-critical', icon: '🔴', label: 'Critical', desc: 'Danger — fight for survival' }
})

// ═══ PHASE 2: BLUNDER ALERT ═══
const blunderText = ref<string | null>(null)
const prevEval = ref<number>(0)

/** Renders blunder alert markdown safely using the shared utility */
const renderedBlunder = computed(() => renderMarkdown(blunderText.value))

// Watch FEN changes to detect blunders when the position updates
watch(() => store.fen, (newFen) => {
  if (!store.gameActive || store.mode !== 'vs-computer') return

  const evalBefore = prevEval.value
  engineStore.analyze(newFen, 14) // 14 depth for quick live analysis

  // Wait 1.5 seconds for the engine to reach a reasonable depth
  // before comparing evaluations to detect blunders
  setTimeout(() => {
    const evalAfter = engineStore.evalNumber
    const playerIsWhite = store.playerColor === 'w'

    // Calculate evaluation drop from the PLAYER's perspective
    const dropFromPlayer = playerIsWhite
      ? (evalBefore - evalAfter)
      : (evalAfter - evalBefore)

    // Only alert on the player's own moves (not the bot's)
    const lastMoveIdx = store.moveHistory.length - 1
    const isPlayerMove = lastMoveIdx >= 0 && (lastMoveIdx % 2 === (playerIsWhite ? 0 : 1))

    // 1.5 pawn drop threshold = a significant mistake worth alerting on
    if (isPlayerMove && dropFromPlayer > 1.5 && store.moveHistory.length > 2) {
      const lastMove = store.moveHistory[lastMoveIdx]
      generateBlunderAlert(newFen, lastMove.san, evalBefore, evalAfter, engineStore.bestMove)
        .then(text => { blunderText.value = text })
    }

    prevEval.value = evalAfter
  }, 1500)
})

// ═══ PHASE 3: EXPLAIN POSITION ═══
const isExplaining = ref(false)
const explainText = ref<string | null>(null)

/** Renders explain panel markdown safely using the shared utility */
const renderedExplain = computed(() => renderMarkdown(explainText.value))

/**
 * Handles the "Explain Position" button press.
 * Pauses the clock so the player can study without time pressure,
 * then calls the LLM API for a position breakdown.
 */
async function handleExplain() {
  if (isExplaining.value) return
  isExplaining.value = true
  explainText.value = null

  // Pause the clock while studying — uses the centralized store method
  store.pauseClock()

  try {
    const lastSan = store.moveHistory.length > 0
      ? store.moveHistory[store.moveHistory.length - 1].san
      : '...'
    explainText.value = await generatePositionExplain(
      store.fen,
      engineStore.evalNumber,
      engineStore.pv,
      lastSan
    )
  } catch {
    explainText.value = 'Unable to analyze position.'
  }
  isExplaining.value = false
}

/**
 * Dismisses the explain panel and resumes the clock.
 * Uses the centralized store method to prevent ghost clocks.
 */
function dismissExplain() {
  explainText.value = null
  store.resumeClock()
}
</script>

<style scoped>
/* TACTICAL PULSE */
.tactical-pulse {
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Phase 1: Mood Orb */
.pulse-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.mood-orb {
  width: 40px; height: 40px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.orb-glow {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  animation: orb-breathe 2.5s ease-in-out infinite;
  opacity: 0.5;
}
.orb-core { font-size: 1.2rem; z-index: 1; }

.mood-dominant .orb-glow { background: radial-gradient(circle, rgba(34,197,94,0.6), transparent 70%); }
.mood-comfortable .orb-glow { background: radial-gradient(circle, rgba(59,130,246,0.5), transparent 70%); }
.mood-balanced .orb-glow { background: radial-gradient(circle, rgba(200,200,200,0.3), transparent 70%); }
.mood-pressure .orb-glow { background: radial-gradient(circle, rgba(250,204,21,0.5), transparent 70%); }
.mood-critical .orb-glow {
  background: radial-gradient(circle, rgba(239,68,68,0.7), transparent 70%);
  animation: orb-breathe 1s ease-in-out infinite;
}

@keyframes orb-breathe {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.25); opacity: 0.7; }
}

.mood-info { flex: 1; }
.mood-label { font-size: 0.85rem; font-weight: 800; color: var(--text-primary); }
.mood-desc { font-size: 0.72rem; color: var(--text-muted); line-height: 1.4; }

/* Phase 2: Blunder Alert */
.blunder-alert {
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  position: relative;
  animation: blunder-shake 0.4s ease;
}
.blunder-badge {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--rose);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}
.blunder-prose { font-size: 0.82rem; line-height: 1.6; color: var(--text-secondary); }
.blunder-prose :deep(strong) { color: var(--text-primary); }
.blunder-prose :deep(p) { margin: 4px 0; }
.blunder-dismiss {
  position: absolute;
  top: 6px; right: 8px;
  background: none; border: none;
  color: var(--text-muted); cursor: pointer;
  font-size: 0.8rem;
}
.blunder-dismiss:hover { color: var(--text-primary); }

@keyframes blunder-shake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-4px); }
  30% { transform: translateX(4px); }
  45% { transform: translateX(-3px); }
  60% { transform: translateX(3px); }
  75% { transform: translateX(-1px); }
}

.blunder-slide-enter-active { transition: all 0.35s ease; }
.blunder-slide-leave-active { transition: all 0.2s ease; }
.blunder-slide-enter-from { opacity: 0; transform: translateY(-10px) scale(0.95); }
.blunder-slide-leave-to { opacity: 0; transform: translateX(10px); }

/* Phase 3: Explain Button & Panel */
.explain-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 12px;
  background: rgba(139,92,246,0.1);
  border: 1px solid rgba(139,92,246,0.25);
  border-radius: var(--radius-sm);
  color: var(--accent-bright);
  font-size: 0.78rem;
  font-weight: 700;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}
.explain-btn:hover:not(:disabled) { background: rgba(139,92,246,0.2); border-color: var(--accent); }
.explain-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner-sm {
  width: 14px; height: 14px;
  border: 2px solid rgba(139,92,246,0.3);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.explain-panel {
  background: rgba(139,92,246,0.05);
  border: 1px solid rgba(139,92,246,0.15);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  max-height: 200px;
  overflow-y: auto;
}
.explain-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.explain-prose { font-size: 0.82rem; line-height: 1.6; color: var(--text-secondary); }
.explain-prose :deep(h3) { font-size: 0.85rem; color: var(--accent-bright); font-weight: 800; margin: 8px 0 4px; }
.explain-prose :deep(strong) { color: var(--text-primary); }
.explain-prose :deep(p) { margin: 4px 0; }
.explain-prose :deep(ul) { padding-left: 1.2em; margin: 4px 0; }
.explain-prose :deep(li) { margin-bottom: 3px; }

.fade-up-enter-active, .fade-up-leave-active { transition: all 0.25s ease; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(6px); }
</style>
