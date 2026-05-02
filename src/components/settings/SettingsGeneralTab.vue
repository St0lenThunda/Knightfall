<script setup lang="ts">
/**
 * Settings General Tab
 * 
 * Manages system-level configurations like sound and animations.
 */
const settings = defineProps<{
  soundEnabled: boolean
  animationSpeed: string
}>()

defineEmits(['update:soundEnabled', 'update:animationSpeed'])
</script>

<template>
  <div class="settings-group">
    <h3>System</h3>
    <div class="setting-row">
      <div class="setting-info">
        <div class="label">Sound Effects</div>
        <div class="desc">Enable move sounds and notifications</div>
      </div>
      <div class="setting-action">
        <input 
          type="checkbox" 
          :checked="soundEnabled" 
          @change="$emit('update:soundEnabled', ($event.target as HTMLInputElement).checked)"
          class="toggle-switch" 
        />
      </div>
    </div>

    <h3>Animations</h3>
    <div class="setting-row">
      <div class="setting-info">
        <div class="label">Movement Speed</div>
        <div class="desc">Control the velocity of pieces on the board</div>
      </div>
      <div class="setting-action">
        <select 
          :value="animationSpeed" 
          @change="$emit('update:animationSpeed', ($event.target as HTMLSelectElement).value)"
          class="custom-select"
        >
          <option value="instant">Instant</option>
          <option value="fast">Fast</option>
          <option value="normal">Standard</option>
          <option value="slow">Cinematic</option>
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

.toggle-switch {
  width: 44px;
  height: 22px;
  appearance: none;
  background: #3f3f46;
  border-radius: 11px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}
.toggle-switch:checked { background: var(--accent); }
.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px; left: 2px;
  width: 18px; height: 18px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}
.toggle-switch:checked::after { transform: translateX(22px); }
</style>
