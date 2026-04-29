<script setup lang="ts">
/**
 * EVALUATION HEADER
 * 
 * Displays the player matchup and the real-time engine evaluation bar.
 * This component is a pure UI layer that reacts to engine and game state.
 */
import { computed } from 'vue'

interface PlayerNames {
  white: string
  whiteElo: string
  black: string
  blackElo: string
}
const props = defineProps<{
  playerNames: PlayerNames
  evalNum: number
  evalPercent: number
  hasGame: boolean
  moveQuality: any | null
}>()

// Determine if White or Black is leading for color coding the number
const evalColorClass = computed(() => props.evalNum >= 0 ? 'positive' : 'negative')
const formattedEval = computed(() => {
  const sign = props.evalNum > 0 ? '+' : ''
  // For extreme evals (mates), we might want to show #
  if (Math.abs(props.evalNum) >= 90) return props.evalNum > 0 ? 'M+' : 'M-'
  return `${sign}${props.evalNum.toFixed(1)}`
})
</script>

<template>
  <header class="evaluation-header">
    <!-- Matchup & Quality Row -->
    <div class="header-top-row">
      <div v-if="hasGame" class="game-matchup-header glass-sm">
         <span class="player-pill white">
           {{ playerNames.white }} <span class="elo">{{ playerNames.whiteElo }}</span>
         </span>
         <span class="vs">vs</span>
         <span class="player-pill black">
           {{ playerNames.black }} <span class="elo">{{ playerNames.blackElo }}</span>
         </span>
      </div>

      <!-- Quality Indicator (High Visibility) -->
      <div v-if="moveQuality" class="quality-badge animated-pop-in" :style="{ '--q-color': moveQuality.color }">
          <span class="q-icon">{{ moveQuality.icon }}</span>
          <span class="q-label">{{ moveQuality.label }}</span>
      </div>
    </div>

    <!-- Evaluation Bar Control -->
    <div class="eval-bar-horizontal glass-sm">
      <div class="eval-label">♔</div>
      <div class="eval-track">
        <div class="eval-fill" :style="{ width: evalPercent + '%' }"></div>
      </div>
      <div class="eval-label">♚</div>
      <div class="eval-num" :class="evalColorClass">
        {{ formattedEval }}
      </div>
    </div>
  </header>
</template>

<style scoped>
.evaluation-header {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.header-top-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  width: 100%;
}

.game-matchup-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.player-pill {
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.player-pill.white { color: #fff; }
.player-pill.black { color: var(--text-muted); }
.elo { opacity: 0.5; font-weight: 400; font-size: 0.7rem; margin-left: 4px; }
.vs { opacity: 0.3; font-style: italic; font-weight: 400; }

.eval-bar-horizontal {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
  width: 100%;
  max-width: 600px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
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

/* High Visibility Quality Badge */
.quality-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.4);
  padding: 4px 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--q-color);
  box-shadow: 0 0 15px var(--q-color);
  animation: pulse-glow-quality 2s infinite;
}

.quality-badge .q-icon {
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--q-color);
  text-shadow: 0 0 15px var(--q-color);
}

.quality-badge .q-label {
  font-size: 1rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: white;
}

@keyframes pulse-glow-quality {
  0% { box-shadow: 0 0 10px var(--q-color); }
  50% { box-shadow: 0 0 25px var(--q-color), inset 0 0 15px var(--q-color); }
  100% { box-shadow: 0 0 10px var(--q-color); }
}

@keyframes animated-pop-in {
  from { opacity: 0; transform: scale(0.8) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.animated-pop-in {
  animation: animated-pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
