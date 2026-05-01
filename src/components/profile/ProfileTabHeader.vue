<template>
  <header class="tab-header glass-xs">
    <div class="header-info">
      <h2>{{ title }}</h2>
      <div class="header-stats">
        <slot name="stats"></slot>
      </div>
    </div>
    <div class="header-actions">
      <slot name="actions"></slot>
    </div>
  </header>
</template>

<script setup lang="ts">
/**
 * ProfileTabHeader
 * 
 * Standardized header for profile tabs (Vault, DNA, Constellation).
 */
defineProps<{
  title: string;
}>()
</script>

<style scoped>
.tab-header {
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-info {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}
.header-stats {
  display: flex;
  gap: var(--space-2);
}
.header-actions {
  display: flex;
  gap: var(--space-2);
}
</style>
