<script setup lang="ts">
import { ref } from 'vue'
import BoardCustomizerModal from './BoardCustomizerModal.vue'

/**
 * Settings Board Tab
 * 
 * Customizes the visual representation of the chessboard and pieces.
 */
const props = defineProps<{
  boardTheme: string
  pieceTheme: string
  showBestMoveArrow: boolean
  showThreatArrow: boolean
  showCoordinates: boolean
  showPieceOutlines: boolean
  moveAnimationEffect: string
  moveAnimationDensity: 'low' | 'medium' | 'high'
  moveAnimationLength: 'short' | 'normal' | 'long'
}>()

const emit = defineEmits([
  'update:boardTheme', 
  'update:pieceTheme', 
  'update:showBestMoveArrow', 
  'update:showThreatArrow',
  'update:showCoordinates',
  'update:showPieceOutlines',
  'update:moveAnimationEffect',
  'update:moveAnimationDensity',
  'update:moveAnimationLength'
])

// Controlled state to manage modal visibility
const showCustomizer = ref(false)

// Board theme definitions for labels mapping
const boardThemes = [
  { id: 'classic', label: 'Classic' },
  { id: 'wood', label: 'Wood' },
  { id: 'echoes', label: 'Echoes' },
  { id: 'obsidian', label: 'Obsidian' },
  { id: 'magma', label: 'Magma' },
  { id: 'abyss', label: 'Abyss' },
  { id: 'aether', label: 'Aether' },
]

// Piece theme definitions for labels mapping
const pieceThemes = [
  { id: 'classic', label: 'Classic' },
  { id: 'neo', label: 'Neo-Obsidian' },
  { id: 'glass', label: 'Holographic Glass' },
  { id: 'runic', label: 'Runic Stone' },
  { id: 'neon', label: 'Cyber-Neon' },
  { id: 'void', label: 'Void Phantoms' },
]

/**
 * Returns the human-readable label of the active board theme.
 */
function getBoardLabel(id: string): string {
  return boardThemes.find(b => b.id === id)?.label || id
}

/**
 * Returns the human-readable label of the active piece set.
 */
function getPieceLabel(id: string): string {
  return pieceThemes.find(p => p.id === id)?.label || id
}

/**
 * Saves selections emitted from the BoardCustomizerModal and updates settings store.
 */
function handleSaveSelections(selections: { 
  boardTheme: string; 
  pieceTheme: string; 
  showPieceOutlines: boolean; 
  moveAnimationEffect: string;
  moveAnimationDensity: 'low' | 'medium' | 'high';
  moveAnimationLength: 'short' | 'normal' | 'long';
}) {
  emit('update:boardTheme', selections.boardTheme)
  emit('update:pieceTheme', selections.pieceTheme)
  emit('update:showPieceOutlines', selections.showPieceOutlines)
  emit('update:moveAnimationEffect', selections.moveAnimationEffect)
  emit('update:moveAnimationDensity', selections.moveAnimationDensity)
  emit('update:moveAnimationLength', selections.moveAnimationLength)
}
</script>

<template>
  <div class="settings-group">
    <h3>Aesthetics</h3>
    
    <!-- Workshop Customizer Launcher Card -->
    <div class="workshop-card glass-sm">
      <div class="workshop-preview" :data-board-theme="boardTheme">
        <div class="mini-board">
          <!-- Render a small 3x3 grid subset showing a piece centered as visual preview -->
          <div v-for="r in 3" :key="r" class="mini-row">
            <div v-for="c in 3" :key="c" 
              class="mini-square" 
              :class="(r + c) % 2 === 0 ? 'sq-light' : 'sq-dark'">
              <img v-if="r === 2 && c === 2" 
                :src="`/pieces/${pieceTheme}/wn.png`" 
                class="mini-piece" 
                alt="White Knight Preview" 
              />
            </div>
          </div>
        </div>
      </div>

      <div class="workshop-info">
        <h4 class="workshop-title">Aesthetic Workshop</h4>
        <p class="workshop-desc">
          Pair chess piece archetypes with board materials and preview combinations on a full interactive board in real-time.
        </p>
        <div class="workshop-details">
          <span class="selection-badge">Board: {{ getBoardLabel(boardTheme) }}</span>
          <span class="selection-badge">Pieces: {{ getPieceLabel(pieceTheme) }}</span>
        </div>
        <button class="btn btn-primary btn-workshop" @click="showCustomizer = true">
          🎨 Customize Board & Pieces
        </button>
      </div>
    </div>

    <!-- Board Customizer Teleport Modal -->
    <BoardCustomizerModal 
      :show="showCustomizer"
      :boardTheme="boardTheme"
      :pieceTheme="pieceTheme"
      :showPieceOutlines="showPieceOutlines"
      :moveAnimationEffect="moveAnimationEffect"
      :moveAnimationDensity="moveAnimationDensity"
      :moveAnimationLength="moveAnimationLength"
      @close="showCustomizer = false"
      @save="handleSaveSelections"
    />
    
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
          id="toggle-best-move-arrow"
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
          id="toggle-threat-arrow"
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
          id="toggle-coordinates"
        />
      </div>
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <div class="label">Piece Contrast Outlines</div>
        <div class="desc">Show a subtle light or dark outline around pieces to improve readability against board squares</div>
      </div>
      <div class="setting-action">
        <input 
          type="checkbox" 
          :checked="showPieceOutlines" 
          @change="emit('update:showPieceOutlines', ($event.target as HTMLInputElement).checked)"
          class="toggle-switch" 
          id="toggle-piece-outlines"
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

/* Workshop Customizer Card Styling */
.workshop-card {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  margin-bottom: var(--space-4);
}

.workshop-preview {
  width: 96px;
  height: 96px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.mini-board {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.mini-row {
  display: flex;
  flex: 1;
  width: 100%;
}

.mini-square {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-square.sq-light { background: var(--sq-light, #ecd9b9); }
.mini-square.sq-dark { background: var(--sq-dark, #b58863); }

.mini-piece {
  width: 80%;
  height: 80%;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}

.workshop-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.workshop-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.workshop-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin: 0;
}

.workshop-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.selection-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: var(--accent-bright);
}

.btn-workshop {
  align-self: flex-start;
  margin-top: var(--space-2);
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
