<script setup lang="ts">
/**
 * ModeStep.vue
 * 
 * Step 1 of the New Game workflow.
 * Allows the user to select between Local Pass & Play or vs Computer.
 */
import type { GameMode } from '../../../stores/gameStore'

defineProps<{
  selectedMode: GameMode
  modes: { id: GameMode; icon: string; label: string; desc: string }[]
}>()

defineEmits(['select'])
</script>

<template>
  <div class="step-content mode-selection">
    <div class="mode-grid">
      <div 
        v-for="m in modes" 
        :key="m.id"
        class="mode-card glass-sm"
        :class="{ active: selectedMode === m.id }"
        @click="$emit('select', m.id)"
      >
        <span class="mode-icon">{{ m.icon }}</span>
        <div class="mode-info">
          <div class="mode-label">{{ m.label }}</div>
          <div class="mode-desc muted">{{ m.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mode-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 500px;
  margin: 0 auto;
}

.mode-card {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-5) var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-card:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

.mode-card.active {
  border-color: var(--accent-bright);
  background: var(--accent-dim);
}

.mode-icon {
  font-size: 2.5rem;
}

.mode-label {
  font-size: 1.2rem;
  font-weight: 800;
  margin-bottom: 2px;
}

.mode-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
}
</style>
