<script setup lang="ts">
/**
 * WarRoomStats: Orchestrates the performance visualization module.
 * Decomposed into StatsRatio (WLD) and StatsHistory (Rating Chart).
 * 
 * DESIGN PATTERN: Orchestrator
 * This component handles the layout of performance sub-modules,
 * following the Anti-God Component rule.
 */
import StatsRatio from './StatsRatio.vue'
import StatsHistory from './StatsHistory.vue'
</script>

<template>
  <div class="stats-group">
    <!-- PERFORMANCE RATIO (Donut & Breakdown) -->
    <StatsRatio />

    <!-- PERFORMANCE HISTORY (Rating DNA Chart) -->
    <StatsHistory />
  </div>
</template>

<style scoped>
/**
 * Stats group container provides spacing between sub-modules.
 */
.stats-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2); /* Maintaining tight layout for dash columns */
}
</style>
