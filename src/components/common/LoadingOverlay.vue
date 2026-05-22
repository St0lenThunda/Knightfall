<template>
  <div v-if="isLoading" class="loading-overlay glass-card">
    <div class="spinner-wrap">
      <div class="spinner" />
      <div class="spinner-center">{{ Math.round(progress ?? 0) }}%</div>
    </div>
    <h3 class="title-sm">{{ stage }}</h3>
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * Shared loading overlay used by multiple top‑level views.
 * @param isLoading – Show/hide the overlay.
 * @param stage – Human‑readable description of the current step.
 * @param progress – Optional numeric progress (0‑100). If omitted the spinner shows only the animation.
 */
defineProps<{ isLoading: boolean; stage: string; progress?: number }>()
</script>

<style scoped>
.loading-overlay {
  max-width: 600px;
  margin: var(--space-12) auto;
  padding: var(--space-12);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}
.spinner-wrap { position: relative; width: 80px; height: 80px; }
.spinner {
  width: 100%;
  height: 100%;
  border: 4px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.spinner-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-family: var(--font-mono);
  font-size: 1.1rem;
  color: var(--accent-bright);
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
