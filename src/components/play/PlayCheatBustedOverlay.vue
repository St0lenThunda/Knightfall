<script setup lang="ts">
/**
 * Play Cheat Busted Overlay
 * 
 * Displays detailed "forensic" data when a user is flagged for cheating.
 * Part of the "Warden's Shield" transparency initiative.
 */
defineProps<{
  roboticScore: number
  correlationScore: number
  blurCount: number
  suspicionScore: number
}>()

defineEmits(['accept'])
</script>

<template>
  <div class="game-over-overlay cheat-busted glass">
    <div class="cheat-header">
      <span class="cheat-icon">⚠️</span>
      <h3 class="cheat-title">Anti-Cheat Triggered</h3>
    </div>
    
    <p class="mb-2 font-semibold">Suspicious behavior detected.</p>
    
    <div class="cheat-forensics glass-sm">
      <div class="forensic-item">
        <span class="label">Robotic Rhythm:</span>
        <span class="value" :style="{ color: roboticScore > 50 ? 'var(--rose)' : 'inherit' }">
          {{ roboticScore.toFixed(0) }}%
        </span>
      </div>
      <div class="forensic-item">
        <span class="label">Engine Correlation:</span>
        <span class="value" :style="{ color: correlationScore > 50 ? 'var(--rose)' : 'inherit' }">
          {{ correlationScore.toFixed(0) }}%
        </span>
      </div>
      <div class="forensic-item">
        <span class="label">Window Blurs:</span>
        <span class="value">{{ blurCount }}</span>
      </div>
      <div class="forensic-item">
        <span class="label">Total Suspicion:</span>
        <span class="value suspicion-final">{{ suspicionScore.toFixed(0) }}%</span>
      </div>
    </div>
    
    <p class="legal-text">
      Knightfall uses statistical analysis to ensure fair play. Robotic move times or tab switching during play will trigger this lock.
    </p>
    
    <button class="btn btn-danger mt-4" @click="$emit('accept')">Accept Defeat</button>
  </div>
</template>

<style scoped>
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

.cheat-header { 
  display: flex; 
  align-items: center; 
  gap: var(--space-3); 
  margin-bottom: var(--space-2); 
}

.cheat-icon { 
  font-size: 2rem; 
  animation: pulse-red 2s infinite; 
}

.cheat-title {
  color: var(--rose); 
  font-size: 1.5rem; 
  text-transform: uppercase;
}

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

.suspicion-final {
  color: var(--rose); 
  font-weight: 800;
}

.legal-text {
  color: var(--text-muted);
  font-size: 0.75rem; 
  margin-top: var(--space-3); 
  max-width: 280px;
}

.mb-2 { margin-bottom: var(--space-2); }
.mt-4 { margin-top: var(--space-4); }
.font-semibold { font-weight: 600; }

@keyframes pulse-red {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}
</style>
