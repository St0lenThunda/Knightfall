<script setup lang="ts">
import { useGameStore } from '../../stores/gameStore'

const gameStore = useGameStore()
</script>

<template>
  <div class="stats-grid">
    <div class="stat-group glass-xs">
      <div class="group-label">🎮 Game Orchestrator Health</div>
      <div class="main-metric">
        <span class="val" :class="gameStore.gameActive ? 'text-green' : 'text-rose'">
          {{ gameStore.gameActive ? 'NOMINAL' : 'INACTIVE' }}
        </span>
        <span class="label">Engine Vital State</span>
      </div>
      <div class="sub-metrics">
        <div class="sub-item">
          <span>Active Mode</span>
          <span class="text-accent">{{ gameStore.mode.toUpperCase() }}</span>
        </div>
        <div class="sub-item">
          <span>Current Turn</span>
          <span :class="gameStore.boardLogic.turn === 'w' ? 'text-white' : 'text-muted'">
            {{ gameStore.boardLogic.turn === 'w' ? 'WHITE' : 'BLACK' }}
          </span>
        </div>
        <div class="sub-item">
          <span>Player Color</span>
          <span :class="gameStore.playerColor === 'w' ? 'text-white' : 'text-muted'">
            {{ gameStore.playerColor === 'w' ? 'WHITE' : 'BLACK' }}
          </span>
        </div>
      </div>
    </div>

    <div class="stat-group glass-xs">
      <div class="group-label">⚡ Emergency Resuscitation</div>
      <div class="rescue-actions">
        <p class="muted" style="font-size: 0.75rem; margin-bottom: var(--space-4);">
          If the board locks up due to a state desync, use these tools to force a re-activation of the engine logic.
        </p>
        <button 
          class="btn btn-sm btn-critical w-full"
          @click="gameStore.startMatch()"
          style="width: 100%; justify-content: center; background: var(--rose-dim); border: 1px solid var(--rose);"
        >
          ☢️ FORCE_RESUSCITATE
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: var(--space-6);
}

.stat-group {
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.01);
}

.group-label {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  margin-bottom: var(--space-4);
}

.main-metric {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--space-6);
}

.main-metric .val {
  font-size: 2.2rem;
  font-weight: 800;
  font-family: var(--font-mono);
  line-height: 1;
  color: white;
}

.main-metric .label {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 6px;
  font-weight: 600;
}

.sub-metrics {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: var(--space-4);
}

.sub-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: 600;
}

.w-full { width: 100%; }
</style>
