<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import MoveTrailCanvas from '../board/MoveTrailCanvas.vue'

/**
 * Interface definition for BoardTheme configuration objects.
 */
interface BoardThemeConfig {
  id: string
  label: string
  color: string
  minLevel: number
  rank: string
}

/**
 * Interface definition for PieceTheme configuration objects.
 */
interface PieceThemeConfig {
  id: string
  label: string
  minLevel: number
  rank: string
}

/**
 * Component Props
 */
const props = defineProps<{
  /** Controls the modal visibility state */
  show: boolean
  /** Current active board theme in the settings store */
  boardTheme: string
  /** Current active piece set theme in the settings store */
  pieceTheme: string
  /** Current active outlines toggle in the settings store */
  showPieceOutlines: boolean
  /** Current active move animation trail effect in settings store */
  moveAnimationEffect: string
  /** Current active move animation trail density in settings store */
  moveAnimationDensity: 'low' | 'medium' | 'high'
  /** Current active move animation trail length in settings store */
  moveAnimationLength: 'short' | 'normal' | 'long'
}>()

/**
 * Component Emits
 */
const emit = defineEmits<{
  (e: 'close'): void
  /** Emitted when the user commits the changes by clicking 'Apply' */
  (e: 'save', selections: { 
    boardTheme: string; 
    pieceTheme: string; 
    showPieceOutlines: boolean; 
    moveAnimationEffect: string;
    moveAnimationDensity: 'low' | 'medium' | 'high';
    moveAnimationLength: 'short' | 'normal' | 'long';
  }): void
}>()

// Local selection states that update the preview board in real-time without committing to the store.
const localBoardTheme = ref(props.boardTheme)
const localPieceTheme = ref(props.pieceTheme)
const localShowPieceOutlines = ref(props.showPieceOutlines)
const localMoveAnimationDensity = ref(props.moveAnimationDensity)
const localMoveAnimationLength = ref(props.moveAnimationLength)

// Reactive matrix representing the piece layout on the board.
const localLayout = ref<Array<Array<string | null>>>([])

// Click-to-move selected square state
const selectedSquare = ref<{ r: number; c: number } | null>(null)

// Drag source square state
const dragSource = ref<{ r: number; c: number } | null>(null)

// Tracks the last move made locally inside the preview board to feed the Canvas overlay
const localLastMove = ref<{ from: string; to: string; captured?: boolean } | null>(null)

// Chess board coordinates definition mapping rows and columns
const files = ['a','b','c','d','e','f','g','h']
const ranks = ['8','7','6','5','4','3','2','1']

const displayRanks = computed(() => flipped.value ? [...ranks].reverse() : ranks)
const displayFiles  = computed(() => flipped.value ? [...files].reverse()  : files)

/**
 * Component Props
 * Flipped is currently set to false for preview board, but we define it to conform to board API.
 */
const flipped = ref(false)

// Watch for changes in props to synchronize local preview state if the modal gets reset/opened.
watch(() => props.show, (isVisible) => {
  if (isVisible) {
    localBoardTheme.value = props.boardTheme
    localPieceTheme.value = props.pieceTheme
    localShowPieceOutlines.value = props.showPieceOutlines
    localMoveAnimationDensity.value = props.moveAnimationDensity
    localMoveAnimationLength.value = props.moveAnimationLength
    localLastMove.value = null
    
    // Deep copy static layout mapping to initialize starting position
    localLayout.value = [
      ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
      ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
      ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
    ]
    selectedSquare.value = null
    dragSource.value = null
  }
})

// Board theme configurations matching the application settings.
const boardThemes: BoardThemeConfig[] = [
  { id: 'classic', label: 'Classic', color: '#8ca2ad', minLevel: 1, rank: 'Aspirant' },
  { id: 'wood', label: 'Wood', color: '#b58863', minLevel: 1, rank: 'Aspirant' },
  { id: 'echoes', label: 'Echoes', color: '#2d264d', minLevel: 1, rank: 'Aspirant' },
  { id: 'obsidian', label: 'Obsidian', color: '#1a1a26', minLevel: 1, rank: 'Aspirant' },
  { id: 'magma', label: 'Magma', color: '#554d4d', minLevel: 1, rank: 'Aspirant' },
  { id: 'abyss', label: 'Abyss', color: '#205060', minLevel: 1, rank: 'Aspirant' },
  { id: 'aether', label: 'Aether', color: '#f1f5f9', minLevel: 1, rank: 'Aspirant' },
]

// Piece set configurations matching the application settings.
const pieceThemes: PieceThemeConfig[] = [
  { id: 'classic', label: 'Classic', minLevel: 1, rank: 'Aspirant' },
  { id: 'neo', label: 'Neo-Obsidian', minLevel: 1, rank: 'Aspirant' },
  { id: 'glass', label: 'Holographic Glass', minLevel: 1, rank: 'Aspirant' },
  { id: 'runic', label: 'Runic Stone', minLevel: 1, rank: 'Aspirant' },
  { id: 'neon', label: 'Cyber-Neon', minLevel: 1, rank: 'Aspirant' },
  { id: 'void', label: 'Void Phantoms', minLevel: 1, rank: 'Aspirant' },
]

/**
 * Automatically resolves the active move trail animation effect based on the currently
 * selected board and piece styles in the preview modal.
 * 
 * @returns string - The resolved move trail effect ID
 */
const resolvedMoveTrailEffect = computed(() => {
  const board = localBoardTheme.value
  const piece = localPieceTheme.value
  
  // Tie specific piece archetypes to their appropriate move trails
  if (piece === 'void') return 'chrono' // Void Phantoms (phantom) -> Echoes
  if (piece === 'neon') return 'cyber' // Cyber-Neon -> Cyber
  if (piece === 'neo' || piece === 'runic') return 'lightning' // Neo/Runic -> Lightning
  
  // Tie specific board materials to their appropriate move trails
  if (board === 'magma') return 'fire' // Volcanic Magma -> Flames
  if (board === 'wood') return 'leaves' // Wood -> Leaves
  if (board === 'abyss' || board === 'echoes') return 'ice' // Abyss/Echoes -> Ice
  
  return 'none'
})

// Move trail density options.
const densityOptions = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' }
] as const

// Move trail length options.
const lengthOptions = [
  { id: 'short', label: 'Short' },
  { id: 'normal', label: 'Normal' },
  { id: 'long', label: 'Long' }
] as const

/**
 * Computed config object for the currently active board theme selection.
 */
const currentBoardThemeConfig = computed(() => {
  return boardThemes.find(b => b.id === localBoardTheme.value) || boardThemes[0]
})

/**
 * Computed config object for the currently active piece theme selection.
 */
const currentPieceThemeConfig = computed(() => {
  return pieceThemes.find(p => p.id === localPieceTheme.value) || pieceThemes[0]
})



/**
 * Computed config object for the currently active move animation density selection.
 */
const currentDensityConfig = computed(() => {
  return densityOptions.find(d => d.id === localMoveAnimationDensity.value) || densityOptions[1]
})

/**
 * Computed config object for the currently active move animation length selection.
 */
const currentLengthConfig = computed(() => {
  return lengthOptions.find(l => l.id === localMoveAnimationLength.value) || lengthOptions[1]
})

/**
 * Returns the human-readable label of the current board theme ID.
 */
function getBoardLabel(id: string): string {
  return boardThemes.find(b => b.id === id)?.label || id
}

/**
 * Returns the human-readable label of the current piece theme ID.
 */
function getPieceLabel(id: string): string {
  return pieceThemes.find(p => p.id === id)?.label || id
}

/**
 * Formats row and column indices to standard chess square labels (e.g. 'e2').
 */
function getSquareName(r: number, c: number): string {
  return `${displayFiles.value[c]}${displayRanks.value[r]}`
}

/**
 * Cycle to the next board theme in the options list.
 */
function nextBoardTheme() {
  const currentIdx = boardThemes.findIndex(b => b.id === localBoardTheme.value)
  const nextIdx = (currentIdx + 1) % boardThemes.length
  localBoardTheme.value = boardThemes[nextIdx].id
}

/**
 * Cycle to the previous board theme in the options list.
 */
function prevBoardTheme() {
  const currentIdx = boardThemes.findIndex(b => b.id === localBoardTheme.value)
  const prevIdx = (currentIdx - 1 + boardThemes.length) % boardThemes.length
  localBoardTheme.value = boardThemes[prevIdx].id
}

/**
 * Cycle to the next piece set in the options list.
 */
function nextPieceTheme() {
  const currentIdx = pieceThemes.findIndex(p => p.id === localPieceTheme.value)
  const nextIdx = (currentIdx + 1) % pieceThemes.length
  localPieceTheme.value = pieceThemes[nextIdx].id
}

/**
 * Cycle to the previous piece set in the options list.
 */
function prevPieceTheme() {
  const currentIdx = pieceThemes.findIndex(p => p.id === localPieceTheme.value)
  const prevIdx = (currentIdx - 1 + pieceThemes.length) % pieceThemes.length
  localPieceTheme.value = pieceThemes[prevIdx].id
}



/**
 * Cycle to the next move animation trail density in the options list.
 */
function nextDensity() {
  const currentIdx = densityOptions.findIndex(d => d.id === localMoveAnimationDensity.value)
  const nextIdx = (currentIdx + 1) % densityOptions.length
  localMoveAnimationDensity.value = densityOptions[nextIdx].id
}

/**
 * Cycle to the previous move animation trail density in the options list.
 */
function prevDensity() {
  const currentIdx = densityOptions.findIndex(d => d.id === localMoveAnimationDensity.value)
  const prevIdx = (currentIdx - 1 + densityOptions.length) % densityOptions.length
  localMoveAnimationDensity.value = densityOptions[prevIdx].id
}

/**
 * Cycle to the next move animation trail length in the options list.
 */
function nextLength() {
  const currentIdx = lengthOptions.findIndex(l => l.id === localMoveAnimationLength.value)
  const nextIdx = (currentIdx + 1) % lengthOptions.length
  localMoveAnimationLength.value = lengthOptions[nextIdx].id
}

/**
 * Cycle to the previous move animation trail length in the options list.
 */
function prevLength() {
  const currentIdx = lengthOptions.findIndex(l => l.id === localMoveAnimationLength.value)
  const prevIdx = (currentIdx - 1 + lengthOptions.length) % lengthOptions.length
  localMoveAnimationLength.value = lengthOptions[prevIdx].id
}

/**
 * Handles select/move actions when clicking squares (click-to-move setup for mobile/accessibility).
 */
function handleSquareClick(r: number, c: number) {
  const clickedPiece = localLayout.value[r][c]
  
  if (selectedSquare.value) {
    const { r: srcR, c: srcC } = selectedSquare.value
    
    // Re-click same square to deselect
    if (srcR === r && srcC === c) {
      selectedSquare.value = null
      return
    }
    
    // Set active move coordinates locally to trigger particle emitter
    const isCapture = !!localLayout.value[r][c]
    localLastMove.value = {
      from: getSquareName(srcR, srcC),
      to: getSquareName(r, c),
      captured: isCapture
    }

    // Move piece inside local matrix representation
    const piece = localLayout.value[srcR][srcC]
    localLayout.value[srcR][srcC] = null
    localLayout.value[r][c] = piece
    selectedSquare.value = null
  } else {
    // Only select if a piece exists on the square
    if (clickedPiece) {
      selectedSquare.value = { r, c }
    }
  }
}

/**
 * Handles dragstart events by setting drag source state.
 */
function handleDragStart(r: number, c: number, event: DragEvent) {
  dragSource.value = { r, c }
  selectedSquare.value = null // Cancel click selections when dragging starts
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

/**
 * Handles drop actions to complete the piece movement.
 */
function handleDrop(r: number, c: number) {
  if (!dragSource.value) return
  const { r: srcR, c: srcC } = dragSource.value
  
  // Set active move coordinates locally to trigger particle emitter
  const isCapture = !!localLayout.value[r][c]
  localLastMove.value = {
    from: getSquareName(srcR, srcC),
    to: getSquareName(r, c),
    captured: isCapture
  }

  const piece = localLayout.value[srcR][srcC]
  localLayout.value[srcR][srcC] = null
  localLayout.value[r][c] = piece
  dragSource.value = null
}

/**
 * Commits the selections by saving them to the global store settings and closes the modal.
 */
function handleApply() {
  emit('save', {
    boardTheme: localBoardTheme.value,
    pieceTheme: localPieceTheme.value,
    showPieceOutlines: localShowPieceOutlines.value,
    moveAnimationEffect: resolvedMoveTrailEffect.value,
    moveAnimationDensity: localMoveAnimationDensity.value,
    moveAnimationLength: localMoveAnimationLength.value
  })
  emit('close')
}

/**
 * Resets the local chess board representation back to the standard starting position
 * and clears any active move trajectories or highlighting.
 */
function resetBoard() {
  localLayout.value = [
    ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
    ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
    ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
  ]
  localLastMove.value = null
  selectedSquare.value = null
  dragSource.value = null
}

/**
 * Discards selections and reverts back to the original theme options.
 */
function handleCancel() {
  emit('close')
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="handleCancel">
      <div class="customizer-modal glass-floating fade-in">
        <div class="modal-header">
          <div>
            <h2 class="text-gradient mb-1">Aesthetic Customizer</h2>
            <p class="muted text-sm">Visualize, toggle outline contrast, and test piece movement on the interactive board in real-time.</p>
          </div>
          <button class="btn-close" @click="handleCancel" aria-label="Close modal">×</button>
        </div>

        <div class="modal-body customizer-layout">
          <!-- Left Column: Real-time Interactive Board Preview -->
          <div class="preview-column">
            <!-- Apply data-board-theme and data-piece-outlines locally to reflect theme and outline selection reactively -->
            <div class="preview-board-container" :data-board-theme="localBoardTheme" :data-piece-outlines="localShowPieceOutlines ? 'true' : 'false'">
              <div class="chess-board-preview">
                <!-- Canvas Move Trail Overlay inside preview board context -->
                <MoveTrailCanvas 
                  :lastMove="localLastMove" 
                  :flipped="flipped" 
                  :effect="resolvedMoveTrailEffect" 
                  :density="localMoveAnimationDensity"
                  :length="localMoveAnimationLength"
                />

                <div v-for="(row, rowIdx) in localLayout" :key="'row-'+rowIdx" class="board-row">
                  <div v-for="(cell, colIdx) in row" :key="'sq-'+colIdx" 
                    class="board-square" 
                    :class="{
                      'sq-light': (rowIdx + colIdx) % 2 === 0,
                      'sq-dark': (rowIdx + colIdx) % 2 !== 0,
                      'sq-selected': selectedSquare && selectedSquare.r === rowIdx && selectedSquare.c === colIdx
                    }"
                    @click="handleSquareClick(rowIdx, colIdx)"
                    @dragover.prevent
                    @drop="handleDrop(rowIdx, colIdx)"
                  >
                    <!-- Render piece image dynamically, making it draggable and clickable -->
                    <img v-if="cell" 
                      :src="`/pieces/${localPieceTheme}/${cell}.png`" 
                      class="preview-piece-img" 
                      :alt="cell"
                      draggable="true"
                      @dragstart="handleDragStart(rowIdx, colIdx, $event)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Reset Board Action Button -->
            <div class="board-actions">
              <button class="reset-btn" @click="resetBoard">
                <span class="reset-icon">🔄</span> Reset Board Position
              </button>
            </div>
            
            <div class="preview-caption glass-sm">
              <div class="caption-item">
                <span class="label">Board:</span>
                <span class="value text-gradient">{{ getBoardLabel(localBoardTheme) }}</span>
              </div>
              <div class="caption-item">
                <span class="label">Pieces:</span>
                <span class="value text-gradient">{{ getPieceLabel(localPieceTheme) }}</span>
              </div>
            </div>
          </div>

          <!-- Right Column: Options Sidebar (Mini-Carousels & Toggle) -->
          <aside class="options-sidebar">
            <!-- Board Material Mini-Carousel -->
            <div class="options-section">
              <h4 class="section-title">Board Material</h4>
              <div class="carousel-selector glass-sm">
                <button class="carousel-arrow" @click="prevBoardTheme" aria-label="Previous board theme">◀</button>
                <div class="carousel-content">
                  <div class="theme-color-badge" :style="{ background: currentBoardThemeConfig.color }"></div>
                  <div class="carousel-info">
                    <span class="carousel-name">{{ currentBoardThemeConfig.label }}</span>
                    <span class="carousel-sub">Active Theme</span>
                  </div>
                </div>
                <button class="carousel-arrow" @click="nextBoardTheme" aria-label="Next board theme">▶</button>
              </div>
            </div>

            <!-- Piece Archetype Mini-Carousel -->
            <div class="options-section">
              <h4 class="section-title">Piece Archetype</h4>
              <div class="carousel-selector glass-sm">
                <button class="carousel-arrow" @click="prevPieceTheme" aria-label="Previous piece set">◀</button>
                <div class="carousel-content">
                  <div class="piece-thumb-badge">
                    <!-- High-res preview thumbnail of a White Knight -->
                    <img :src="`/pieces/${currentPieceThemeConfig.id}/wn.png`" class="piece-thumb-badge-img" alt="White Knight" />
                  </div>
                  <div class="carousel-info">
                    <span class="carousel-name">{{ currentPieceThemeConfig.label }}</span>
                    <span class="carousel-sub">Active Style</span>
                  </div>
                </div>
                <button class="carousel-arrow" @click="nextPieceTheme" aria-label="Next piece set">▶</button>
              </div>
            </div>

            <!-- Move Trail Density & Length side-by-side row -->
            <div class="trail-options-row" v-if="resolvedMoveTrailEffect !== 'none'">
              <!-- Move Trail Density Mini-Carousel -->
              <div class="options-section">
                <h4 class="section-title">Trail Density</h4>
                <div class="carousel-selector glass-sm compact-carousel">
                  <button class="carousel-arrow compact-arrow" @click="prevDensity" aria-label="Previous trail density">◀</button>
                  <div class="carousel-content compact-content">
                    <div class="carousel-info compact-info">
                      <span class="carousel-name compact-name">{{ currentDensityConfig.label }}</span>
                    </div>
                  </div>
                  <button class="carousel-arrow compact-arrow" @click="nextDensity" aria-label="Next trail density">▶</button>
                </div>
              </div>

              <!-- Move Trail Length Mini-Carousel -->
              <div class="options-section">
                <h4 class="section-title">Trail Length</h4>
                <div class="carousel-selector glass-sm compact-carousel">
                  <button class="carousel-arrow compact-arrow" @click="prevLength" aria-label="Previous trail length">◀</button>
                  <div class="carousel-content compact-content">
                    <div class="carousel-info compact-info">
                      <span class="carousel-name compact-name">{{ currentLengthConfig.label }}</span>
                    </div>
                  </div>
                  <button class="carousel-arrow compact-arrow" @click="nextLength" aria-label="Next trail length">▶</button>
                </div>
              </div>
            </div>

            <!-- Piece Contrast Outlines toggler inside Modal options -->
            <div class="options-section">
              <h4 class="section-title">Visual Assistance</h4>
              <div class="carousel-selector glass-sm toggle-row">
                <div class="toggle-info">
                  <span class="carousel-name" style="font-size: 0.85rem;">Piece Outlines</span>
                  <span class="carousel-sub">Enhance piece readability</span>
                </div>
                <input 
                  type="checkbox" 
                  v-model="localShowPieceOutlines"
                  class="toggle-switch" 
                  id="modal-toggle-outlines"
                />
              </div>
            </div>
          </aside>
        </div>

        <div class="modal-footer flex justify-end gap-3">
          <button class="btn btn-ghost" @click="handleCancel">Cancel</button>
          <button class="btn btn-primary btn-lg" @click="handleApply">Apply Changes</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.customizer-modal {
  width: 95%;
  max-width: 880px;
  display: flex;
  flex-direction: column;
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  background: rgba(15, 15, 25, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.6);
}

.customizer-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-8);
  align-items: center;
  min-height: 400px;
}

.preview-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.03);
  padding: var(--space-6);
  height: 100%;
}

.preview-board-container {
  width: 100%;
  max-width: 360px;
  aspect-ratio: 1 / 1;
  position: relative;
}

.chess-board-preview {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.board-row {
  display: flex;
  flex: 1;
  width: 100%;
}

.board-square {
  flex: 1;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.board-square.sq-selected {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
  background: rgba(139, 92, 246, 0.2) !important;
}

.sq-light { background: var(--sq-light, #ecd9b9); }
.sq-dark  { background: var(--sq-dark, #b58863); }

.preview-piece-img {
  width: 85%;
  height: 85%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35)) var(--piece-outline, drop-shadow(1px 0 0 rgba(0,0,0,0.25)) drop-shadow(-1px 0 0 rgba(0,0,0,0.25)) drop-shadow(0 1px 0 rgba(0,0,0,0.25)) drop-shadow(0 -1px 0 rgba(0,0,0,0.25)));
  cursor: grab;
  transition: transform 0.2s ease;
  z-index: 10; /* Make sure pieces are above canvas trail */
}

.preview-piece-img:active {
  cursor: grabbing;
  transform: scale(1.08);
}

.preview-caption {
  display: flex;
  gap: var(--space-6);
  padding: 8px 24px;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.caption-item {
  display: flex;
  gap: 8px;
}

.caption-item .label {
  color: var(--text-muted);
}

.caption-item .value {
  font-weight: 700;
}

.options-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-3); /* Reduced from space-6 to prevent scrolling */
  padding: 0;
}

.options-section {
  display: flex;
  flex-direction: column;
  gap: 6px; /* Reduced from space-3 (12px) to 6px */
}

.section-title {
  font-size: 0.7rem; /* Slightly smaller text */
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent-bright);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 4px;
  margin: 0;
}

/* Premium Carousel Selector Design */
.carousel-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px; /* Reduced padding from 12px 16px */
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.carousel-selector:hover {
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.03);
}

.carousel-arrow {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  width: 26px; /* Reduced from 32px */
  height: 26px; /* Reduced from 32px */
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem; /* Shorter text */
  transition: all 0.2s ease;
  user-select: none;
}

.carousel-arrow:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-color: var(--accent);
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
  transform: scale(1.05);
}

.carousel-content {
  display: flex;
  align-items: center;
  gap: 12px; /* Reduced from 16px */
  flex: 1;
  justify-content: center;
  padding: 0 var(--space-1);
}

.carousel-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 120px;
}

.carousel-name {
  font-size: 0.85rem; /* Reduced from 0.95rem */
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.carousel-sub {
  font-size: 0.68rem; /* Reduced from 0.72rem */
  color: var(--text-muted);
  margin-top: 1px;
}

.theme-color-badge {
  width: 24px; /* Reduced from 32px */
  height: 24px; /* Reduced from 32px */
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.piece-thumb-badge {
  width: 24px; /* Reduced from 32px */
  height: 24px; /* Reduced from 32px */
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.piece-thumb-badge-img {
  width: 20px; /* Reduced from 26px */
  height: 20px; /* Reduced from 26px */
  object-fit: contain;
}

/* Side-by-side trail settings layout styles */
.trail-options-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  width: 100%;
}

.compact-carousel {
  padding: 6px 8px; /* Extra compact padding */
}

.compact-arrow {
  width: 20px;
  height: 20px;
  font-size: 0.55rem;
}

.compact-content {
  gap: 0px;
  padding: 0;
}

.compact-info {
  align-items: center;
  min-width: 0;
}

.compact-name {
  font-size: 0.78rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Reset board action styles */
.board-actions {
  display: flex;
  justify-content: center;
  margin-top: 4px;
  margin-bottom: 2px;
}

.reset-btn {
  font-size: 0.78rem;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--accent);
  color: var(--text-primary);
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.15);
}

.reset-icon {
  font-size: 0.85rem;
}

/* Sidebar Toggle custom styles */
.toggle-row {
  justify-content: space-between;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.toggle-switch {
  width: 40px;
  height: 20px;
  appearance: none;
  background: #3f3f46;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-switch:checked {
  background: var(--accent);
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.toggle-switch:checked::after {
  transform: translateX(20px);
}

/* Modal Transition override for specific classes */
.modal-enter-active, .modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .customizer-modal, .modal-leave-to .customizer-modal {
  transform: scale(0.95) translateY(10px);
}

@media (max-width: 800px) {
  .customizer-layout {
    grid-template-columns: 1fr;
    height: auto;
    max-height: 60vh;
    overflow-y: auto;
  }
}
</style>
