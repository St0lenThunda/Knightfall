<template>
  <Transition name="fade-out">
    <div class="analysis-loading-overlay" v-if="show">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">Initializing Analysis Engine</div>
        <div class="loading-sub muted">Preparing Stockfish and loading game data...</div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * AnalysisLoadingOverlay Component
 * 
 * Logic: Displays a fullscreen loading state during engine initialization.
 * Why: Moves non-critical layout markup to a dedicated component.
 */

defineProps<{
  show: boolean
}>()
</script>

<style scoped>
.analysis-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: var(--bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
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

.loading-sub { 
  font-size: 0.85rem; 
  color: var(--text-muted);
}

.fade-out-leave-active { transition: opacity 0.4s ease; }
.fade-out-leave-to { opacity: 0; }
</style>
