<script setup lang="ts">
import { useDnaStats } from '../../composables/library/useDnaStats'

/**
 * DNA Intelligence Bar
 * 
 * Displays the top-level personal metrics in a horizontal glassmorphism bar.
 */
const { personalStats } = useDnaStats()
</script>

<template>
  <div class="dna-intel-bar glass-sm mb-6">
    <div 
      v-for="s in personalStats" 
      :key="s.label" 
      class="intel-stat-pill" 
      :title="s.desc"
    >
      <span class="icon">{{ s.icon }}</span>
      <div class="intel-content">
        <span class="val">{{ s.val }}</span>
        <span class="label">{{ s.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dna-intel-bar {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-8);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow-x: auto;
}

.intel-stat-pill {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: 0 var(--space-4);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.intel-stat-pill:last-child { 
  border-right: none; 
}

.intel-stat-pill .icon { 
  font-size: 1.2rem; 
  opacity: 0.7; 
}

.intel-content { 
  display: flex; 
  flex-direction: column; 
}

.intel-content .val { 
  font-family: var(--font-mono); 
  font-size: 1.1rem; 
  font-weight: 800; 
  color: var(--text-primary); 
  line-height: 1; 
}

.intel-content .label { 
  font-size: 0.55rem; 
  text-transform: uppercase; 
  color: var(--text-muted); 
  font-weight: 800; 
  letter-spacing: 0.05em; 
  margin-top: 4px; 
}
</style>
