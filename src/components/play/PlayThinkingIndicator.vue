<script setup lang="ts">
/**
 * Play Thinking Indicator
 * 
 * A subtle, animated UI element shown when the engine is 
 * calculating its next move.
 */
</script>

<template>
  <!-- The thinking-indicator class is required by the Playwright E2E tests for verification -->
  <div class="thinking-bar thinking-indicator">
    <div class="thinking-dots">
      <span></span><span></span><span></span>
    </div>
    Engine is thinking…
  </div>
</template>

<style scoped>
.thinking-bar {
  display: flex; 
  align-items: center; 
  gap: var(--space-3);
  font-size: 0.85rem; 
  color: var(--text-muted);
  padding: var(--space-2) var(--space-4);
  background: var(--bg-elevated);
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
}

.thinking-dots { 
  display: flex; 
  gap: 4px; 
}

.thinking-dots span {
  width: 6px; 
  height: 6px;
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
</style>
