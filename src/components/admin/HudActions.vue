<script setup lang="ts">
import { useGameStore } from '../../stores/gameStore'
import { logger } from '../../utils/logger'

const gameStore = useGameStore()

const handleRescue = () => {
  logger.warn('[Admin] Manual rescue triggered. Force-resetting engine state.')
  gameStore.resuscitate()
}
</script>

<template>
  <div class="telemetry-card glass-xs" title="Emergency manual override for the game engine.">
    <div class="card-label">ORCHESTRATION_RESCUE</div>
    <div class="card-main">
      <div class="metric-row">
        <span>STATE</span>
        <span class="val-pill" :class="gameStore.gameActive ? 'success' : 'warn'">
          {{ gameStore.gameActive ? 'ACTIVE' : 'INACTIVE' }}
        </span>
      </div>
      <div class="metric-row">
        <span>MODE</span>
        <span class="val-pill">{{ gameStore.mode.toUpperCase() }}</span>
      </div>
      <div class="metric-row">
        <span>PLAYER</span>
        <span class="val-pill">{{ gameStore.playerColor === 'w' ? 'WHITE' : 'BLACK' }}</span>
      </div>
      <button class="btn btn-primary btn-sm mt-4 w-full" @click="handleRescue">
        <span class="icon">☢️</span> FORCE_RESUSCITATE
      </button>
    </div>
  </div>
</template>

<style scoped>
.telemetry-card {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  border: 1px solid rgba(255, 255, 255, 0.03);
  background: rgba(255, 255, 255, 0.01);
}

.card-label {
  font-size: 0.6rem;
  font-weight: 900;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  opacity: 0.6;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  margin-bottom: 4px;
}

.val-pill {
  background: rgba(255,255,255,0.05);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
}
.val-pill.success { color: var(--green); background: rgba(16, 185, 129, 0.1); }
.val-pill.warn { color: var(--gold); background: rgba(245, 158, 11, 0.1); }

.mt-4 { margin-top: var(--space-4); }
.w-full { width: 100%; }
</style>
