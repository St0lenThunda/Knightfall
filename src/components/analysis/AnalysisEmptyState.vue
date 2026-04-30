<template>
  <div class="analysis-instructional-state">
    <div class="instructional-card glass-card">
      <div class="pulse-icon">🔮</div>
      <h2>The Oracle Awaits</h2>
      <p class="instruction-text">
        Upload a match from your history or paste a PGN to begin a deep analytical review. 
        I will reveal your tactical DNA and find the hidden winning stratagems.
      </p>
      <div class="instruction-actions">
        <router-link to="/profile?tab=vault" class="btn btn-primary btn-glow">
          🏛 Browse Vault
        </router-link>
        <button class="btn btn-ghost" @click="$emit('importPgn')">
          📂 Paste PGN
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AnalysisEmptyState Component
 * 
 * Logic: Displays the initial instructional state when no game is loaded.
 * Why: Keeps the heavy instructional markup out of the main orchestrator.
 */

defineEmits<{
  (e: 'importPgn'): void
}>()
</script>

<style scoped>
.analysis-instructional-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: var(--space-8);
  background: radial-gradient(circle at center, rgba(var(--accent-rgb), 0.1) 0%, transparent 70%);
}

.instructional-card {
  max-width: 500px;
  text-align: center;
  padding: var(--space-10);
  border: 1px solid rgba(var(--accent-rgb), 0.2);
  box-shadow: 0 0 50px rgba(0,0,0,0.5);
  animation: float 6s ease-in-out infinite;
}

.pulse-icon {
  font-size: 4rem;
  margin-bottom: var(--space-6);
  filter: drop-shadow(0 0 15px var(--accent));
  animation: pulse-glow 3s infinite;
}

.instruction-text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text-muted);
  margin-bottom: var(--space-8);
}

.instruction-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
}

.btn-glow {
  box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.4);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse-glow {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px var(--accent)); }
  50% { transform: scale(1.05); filter: drop-shadow(0 0 30px var(--accent)); }
}
</style>
