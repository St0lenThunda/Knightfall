<script setup lang="ts">
/**
 * ParameterStep.vue
 * 
 * Step 3 of the New Game workflow.
 * Final selection of side (color) and time control.
 */
import type { Color } from 'chess.js'
import type { TimeControl } from '../../../stores/gameStore'

defineProps<{
  selectedColor: Color | 'r'
  colors: { value: Color | 'r'; icon: string; label: string }[]
  selectedTc: TimeControl
  timeControls: TimeControl[]
}>()

defineEmits(['updateColor', 'updateTc'])
</script>

<template>
  <div class="step-content parameter-selection">
    <div class="param-group">
      <label class="section-label">PLAY AS</label>
      <div class="color-picker">
        <button
          v-for="c in colors" :key="c.value"
          class="color-btn glass-sm"
          :class="{ active: selectedColor === c.value }"
          @click="$emit('updateColor', c.value)"
        >
          <span class="c-icon">{{ c.icon }}</span>
          <span class="c-label">{{ c.label }}</span>
        </button>
      </div>
    </div>

    <div class="param-group">
      <label class="section-label">TIME CONTROL</label>
      <div class="tc-grid">
        <button
          v-for="tc in timeControls" :key="tc.label"
          class="tc-btn glass-sm"
          :class="{ active: selectedTc.label === tc.label }"
          @click="$emit('updateTc', tc)"
        >
          {{ tc.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.param-group {
  margin-bottom: var(--space-8);
}

.section-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 950;
  color: var(--accent-bright);
  margin-bottom: var(--space-6);
  letter-spacing: 0.2em;
  text-align: center;
  text-transform: uppercase;
  opacity: 0.8;
}

.color-picker {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
}

.color-btn {
  flex: 1;
  max-width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--text-muted);
}

.color-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.color-btn.active {
  border-color: var(--accent-bright);
  background: var(--accent-dim);
  color: var(--text-primary);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.15);
  transform: translateY(-2px);
}

.c-icon { 
  font-size: 2.5rem;
  filter: drop-shadow(0 0 10px rgba(255,255,255,0.1));
}
.c-label { 
  font-weight: 800; 
  font-size: 1rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.tc-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
}

.tc-btn {
  padding: var(--space-3);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.tc-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.tc-btn.active {
  background: var(--teal-dim);
  border-color: var(--teal);
  color: var(--teal);
  box-shadow: 0 0 15px rgba(20, 184, 166, 0.2);
}

@media (max-width: 768px) {
  .param-group {
    margin-bottom: var(--space-4);
  }
  .section-label {
    margin-bottom: var(--space-3);
  }
  .color-btn {
    padding: var(--space-3);
    gap: var(--space-1);
  }
  .c-icon {
    font-size: 1.8rem;
  }
  .c-label {
    font-size: 0.75rem;
  }
  .tc-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
