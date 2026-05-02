<script setup lang="ts">
/**
 * Settings Engine Tab
 * 
 * Configures the performance and personality of the Stockfish engine.
 */
defineProps<{
  engineMultiPv: number
  analysisDepth: number
  coachPersonality: string
}>()

const emit = defineEmits([
  'update:engineMultiPv', 
  'update:analysisDepth', 
  'update:coachPersonality'
])
</script>

<template>
  <div class="settings-group">
    <h3>Computational Power</h3>
    <div class="setting-row">
      <div class="setting-info">
        <div class="label">Multi-PV Mode</div>
        <div class="desc">Number of alternative lines Stockfish calculates simultaneously</div>
      </div>
      <div class="setting-action">
        <div class="number-stepper">
           <button @click="emit('update:engineMultiPv', Math.max(1, engineMultiPv - 1))">-</button>
           <span>{{ engineMultiPv }}</span>
           <button @click="emit('update:engineMultiPv', Math.min(5, engineMultiPv + 1))">+</button>
        </div>
      </div>
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <div class="label">Target Analysis Depth</div>
        <div class="desc">The default depth the AI Coach waits for before giving feedback</div>
      </div>
      <div class="setting-action">
        <select 
          :value="analysisDepth" 
          @change="emit('update:analysisDepth', Number(($event.target as HTMLSelectElement).value))"
          class="custom-select"
        >
          <option :value="10">Depth 10 (Fastest)</option>
          <option :value="15">Depth 15 (Balanced)</option>
          <option :value="20">Depth 20 (Deep)</option>
          <option :value="24">Depth 24 (Grandmaster)</option>
        </select>
      </div>
    </div>

    <h3>AI Coaching Personality</h3>
    <div class="setting-row">
      <div class="setting-info">
        <div class="label">Coach Archetype</div>
        <div class="desc">Affects the tone and style of analysis feedback</div>
      </div>
      <div class="setting-action">
        <select 
          :value="coachPersonality" 
          @change="emit('update:coachPersonality', ($event.target as HTMLSelectElement).value)"
          class="custom-select"
        >
          <option value="encouraging">Encouraging (Standard)</option>
          <option value="strict">Strict (Direct)</option>
          <option value="socratic">Socratic (Questioning)</option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-group { display: flex; flex-direction: column; gap: var(--space-6); }

.settings-group h3 {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent-bright);
  margin-bottom: var(--space-2);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 8px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-10);
}

.setting-info { flex: 1; }
.setting-info .label { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.setting-info .desc { font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }

.custom-select {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  outline: none;
  min-width: 220px;
}

.number-stepper {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--bg-elevated);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}
.number-stepper button {
  width: 24px; height: 24px;
  background: rgba(255,255,255,0.05);
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}
.number-stepper span { font-weight: 700; min-width: 20px; text-align: center; }
</style>
