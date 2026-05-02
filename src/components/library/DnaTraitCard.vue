<script setup lang="ts">
/**
 * DNA Trait Card
 * 
 * A specialized card component for displaying a behavioral trait 
 * (e.g., Aggression, Stability) with a progress bar.
 */
defineProps<{
  trait: {
    label: string
    val: number
    color: string
    icon: string
    desc: string
  }
}>()
</script>

<template>
  <div class="trait-card glass-sm" :title="trait.desc">
    <div class="trait-header">
      <span class="trait-icon">{{ trait.icon }}</span>
      <span class="trait-val">{{ trait.val }}%</span>
    </div>
    <div class="trait-label">{{ trait.label }}</div>
    <div class="trait-progress">
      <div 
        class="trait-fill" 
        :style="{ width: trait.val + '%', background: trait.color }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.trait-card {
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  transition: transform 0.2s ease;
}

.trait-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.04);
}

.trait-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.trait-val { 
  font-size: 1.2rem; 
  font-weight: 800; 
}

.trait-label { 
  font-size: 0.75rem; 
  font-weight: 700; 
  color: var(--text-muted); 
  margin-bottom: 12px; 
}

.trait-progress { 
  height: 4px; 
  background: rgba(255, 255, 255, 0.05); 
  border-radius: 2px; 
}

.trait-fill { 
  height: 100%; 
  border-radius: 2px; 
  transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1); 
}
</style>
