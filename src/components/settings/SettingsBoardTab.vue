<script setup lang="ts">
/**
 * Settings Board Tab
 * 
 * Customizes the visual representation of the chessboard and pieces.
 */
defineProps<{
  boardTheme: string
  pieceTheme: string
  showBestMoveArrow: boolean
  showThreatArrow: boolean
  showCoordinates: boolean
}>()

const emit = defineEmits([
  'update:boardTheme', 
  'update:pieceTheme', 
  'update:showBestMoveArrow', 
  'update:showThreatArrow',
  'update:showCoordinates'
])

const boardThemes = [
  { id: 'classic', label: 'Classic', color: '#8ca2ad' },
  { id: 'wood', label: 'Wood', color: '#b58863' },
  { id: 'obsidian', label: 'Obsidian', color: '#2a2a2a' },
]
</script>

<template>
  <div class="settings-group">
    <h3>Aesthetics</h3>
    <div class="setting-row">
      <div class="setting-info">
        <div class="label">Board Theme</div>
        <div class="desc">Select the visual material for the 64 squares</div>
      </div>
      <div class="setting-action">
        <div class="theme-grid">
          <div v-for="t in boardThemes" :key="t.id" 
            class="theme-thumb" :class="{ active: boardTheme === t.id }"
            @click="emit('update:boardTheme', t.id)">
            <div class="thumb-preview" :style="{ background: t.color }"></div>
            <span>{{ t.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <div class="label">Piece Set</div>
        <div class="desc">Classic uses fast unicode glyphs. Neo and Glass use high-res local image assets.</div>
      </div>
      <div class="setting-action">
        <select 
          :value="pieceTheme" 
          @change="emit('update:pieceTheme', ($event.target as HTMLSelectElement).value)"
          class="custom-select"
        >
          <option value="classic">Classic (Unicode)</option>
          <option value="neo">Neo-Obsidian (HD)</option>
          <option value="glass">Holographic Glass (HD)</option>
        </select>
      </div>
    </div>
    
    <h3>Visual Aids</h3>
    <div class="setting-row">
      <div class="setting-info">
        <div class="label">Engine Best Move Arrow</div>
        <div class="desc">Show a glowing green prediction arrow indicating the top AI recommendation</div>
      </div>
      <div class="setting-action">
        <input 
          type="checkbox" 
          :checked="showBestMoveArrow" 
          @change="emit('update:showBestMoveArrow', ($event.target as HTMLInputElement).checked)"
          class="toggle-switch" 
        />
      </div>
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <div class="label">Engine Threat Arrow</div>
        <div class="desc">Show a red arrow indicating the opponent's strongest expected counter-response</div>
      </div>
      <div class="setting-action">
        <input 
          type="checkbox" 
          :checked="showThreatArrow" 
          @change="emit('update:showThreatArrow', ($event.target as HTMLInputElement).checked)"
          class="toggle-switch" 
        />
      </div>
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <div class="label">Coordinate Assistant</div>
        <div class="desc">Show a popup toast revealing the exact rank and file of any square you tap</div>
      </div>
      <div class="setting-action">
        <input 
          type="checkbox" 
          :checked="showCoordinates" 
          @change="emit('update:showCoordinates', ($event.target as HTMLInputElement).checked)"
          class="toggle-switch" 
        />
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

.theme-grid { display: flex; gap: var(--space-3); }
.theme-thumb { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; }
.thumb-preview { width: 60px; height: 40px; border-radius: 6px; border: 2px solid transparent; transition: all 0.2s; }
.theme-thumb.active .thumb-preview { border-color: var(--accent); scale: 1.05; }
.theme-thumb span { font-size: 0.75rem; color: var(--text-muted); }

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
