<script setup lang="ts">
/**
 * WarRoomDNA: Orchestrates the Coach Insights and DNA Mapping module.
 * Decomposed into Clinic, Weakness, Openings, and Badges sub-components.
 * 
 * DESIGN PATTERN: Orchestrator
 * Following the Anti-God Component rule by delegating section rendering
 * to specialized components.
 */
import DNAClinic from './DNAClinic.vue'
import DNAWeakness from './DNAWeakness.vue'
import DNAOpenings from './DNAOpenings.vue'
import DNABadges from './DNABadges.vue'

defineEmits(['showBadgeModal', 'switchTab'])
</script>

<template>
  <div class="dna-group">
    <!-- THE CLINIC (Mini-Prescriptions) -->
    <DNAClinic />

    <!-- WEAKNESS DNA (Radar Score Mapping) -->
    <DNAWeakness @switchTab="$emit('switchTab', $event)" />

    <!-- TOP OPENINGS (Performance Metrics) -->
    <DNAOpenings />

    <!-- EARNED BADGES (Achievement Preview) -->
    <DNABadges @showBadgeModal="$emit('showBadgeModal')" />
  </div>
</template>

<style scoped>
.dna-group {
  display: flex;
  flex-direction: column;
}
</style>
