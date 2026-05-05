<template>
  <div v-if="multiPvs.length > 1 && settings.analysisShowCriticalLines" class="alt-lines-compact glass-xs animated-fade-in">
    <div class="label">CRITICAL LINES</div>
    <div class="lines">
      <div v-for="alt in multiPvs.slice(1, 3)" :key="alt.id" class="mini-line">
        <span class="score">{{ alt.score }}</span>
        <span class="moves">{{ alt.moves.slice(0, 3).join(' ') }}...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from '../../stores/settingsStore'

const settings = useSettingsStore()
/**
 * CriticalLines Component
 * 
 * Logic: Displays alternative engine lines (Multi-PV) for deep analysis.
 * Why: Separated from AnalysisControls to allow flexible layout positioning.
 */

defineProps<{
  multiPvs: any[]
}>()
</script>

<style scoped>
.alt-lines-compact {
  padding: 12px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--glass-border);
  margin-bottom: var(--space-4);
}

.alt-lines-compact .label {
  font-size: 0.6rem;
  font-weight: 900;
  color: var(--text-muted);
  margin-bottom: var(--space-3);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.lines {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.mini-line {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  align-items: center;
}

.mini-line .score {
  font-weight: 800;
  color: var(--accent-bright);
  min-width: 40px;
}

.mini-line .moves {
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.animated-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
