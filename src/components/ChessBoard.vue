<template>
  <div class="board-wrapper">
    <div class="main-board-area">
      <div class="board-row-wrap">
        <div class="rank-labels">
          <span v-for="r in displayRanks" :key="r">{{ r }}</span>
        </div>

        <div class="board-container">
          <div class="chess-board">
            <!-- Grid Layer (Squares & Highlights) -->
            <div v-for="(row, rowIdx) in displayBoard" :key="'row-'+rowIdx" class="board-row">
              <div
                v-for="(_cell, colIdx) in row"
                :key="'sq-'+colIdx"
                class="board-square"
                :class="squareClasses(rowIdx, colIdx)"
                :data-square="squareId(rowIdx, colIdx)"
                @click="handleSquareClick(rowIdx, colIdx)"
                @dragover.prevent
                @drop="handleDrop(rowIdx, colIdx, $event)"
              >
                <div v-if="isSelected(rowIdx, colIdx)" class="sq-highlight sq-selected"></div>
                <div v-if="isLastMove(rowIdx, colIdx)" class="sq-highlight sq-last"></div>
                <div v-if="isKingInCheck(rowIdx, colIdx)" class="sq-highlight sq-check"></div>
                <div v-if="isLegalMove(rowIdx, colIdx)" class="legal-dot"></div>
              </div>
            </div>

            <!-- Pieces Layer -->
            <PieceLayer 
              :pieces="animatedPieces" 
              :turn="turn"
              :theme="pieceTheme"
              :isInteractive="isInteractive"
              :isThinking="isThinking"
              :hintSquares="hintSquares"
              @dragstart="({ sq, event }) => handleDragStartPiece(sq, event)"
              @square-click="(sq) => store.selectSquare(sq)"
              @piece-drop="({ sq, event }) => handleDropOnPiece(sq, event)"
            />

            <!-- Overlays -->
            <div class="thinking-overlay" v-if="isThinking">
              <div class="thinking-text">Thinking...</div>
            </div>

            <!-- Badges Layer (Above Pieces) -->
            <BadgeLayer 
              :quality="moveQuality"
              :lastMove="resolvedLastMove"
              :flipped="flipped"
              @badge-click="$emit('badge-click')"
            />

            <!-- Arrows Layer -->
            <ArrowLayer 
              :arrows="allArrows"
              :flipped="flipped"
            />

            <!-- Dev Debug Tool (Inside Board) -->
            <button v-if="isDev" class="dev-debug-btn" @click.stop="exportDebugInfo" title="Export Board State (FEN/PGN)">
              <span class="debug-icon">🛠️</span>
            </button>
          </div>
        </div>
      </div>
      
      <div class="file-labels-row">
        <span v-for="f in displayFiles" :key="f">{{ f }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs, ref, watch } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useUiStore } from '../stores/uiStore'
import { logger } from '../utils/logger'
import type { Square } from 'chess.js'
import type { MoveQuality } from '../utils/analysisUtils'

import { copySystemSnapshot } from '../utils/debugUtils'

// Sub-Layers
import PieceLayer from './board/PieceLayer.vue'
import BadgeLayer from './board/BadgeLayer.vue'
import ArrowLayer, { type ArrowDef } from './board/ArrowLayer.vue'

const store = useGameStore()
const settings = useSettingsStore()
const { selectedSquare, legalMoveSquares, lastMove, isCheck, turn, isThinking } = toRefs(store)
const { pieceTheme } = toRefs(settings)

const props = withDefaults(defineProps<{
  flipped?: boolean;
  interactive?: boolean;
  moveQuality?: MoveQuality | null;
  arrows?: ArrowDef[];
  lastMove?: { from: string; to: string } | null;
  hintSquares?: string[];
  hintArrows?: ArrowDef[];
  debugData?: Record<string, any>;
}>(), {
  flipped: false,
  interactive: true,
  moveQuality: null,
  arrows: () => [],
  lastMove: null,
  hintSquares: () => [],
  hintArrows: () => [],
  debugData: () => ({})
})

const emit = defineEmits(['square-click', 'drop', 'badge-click'])

const isInteractive = computed(() => props.interactive && store.isPlayersTurn)
const uiStore = useUiStore()
const isDev = import.meta.env.DEV

/**
 * EXPORT DEBUG INFO
 * Uses the global debug utility to copy a forensic snapshot to the clipboard.
 */
async function exportDebugInfo() {
  if (!isDev) return;
  try {
    await copySystemSnapshot({
      gameId: store.loadedGameId || 'N/A (unsaved)',
      mode: store.mode,
      gameActive: store.gameActive,
      turn: store.turn,
      viewIdx: store.viewIndex,
      moveCount: store.moveHistory?.length || 0,
      fen: store.fen,
      pgn: store.pgn,
      whiteTime: store.whiteTime,
      blackTime: store.blackTime,
      suspicionScore: store.suspicionScore,
      suspicionBreakdown: store.suspicionBreakdown,
      lastMoveDuration: store.lastMoveDuration,
      sessionDuration: store.sessionDuration,
      engine: {
        evalNumber: store.engine.evalNumber,
        suggestedMove: store.engine.suggestedMove,
        currentDepth: store.engine.currentDepth
      },
      currentDrill: store.currentDrill,
      drillIndex: store.drillIndex,
      debugData: props.debugData
    })
    
    uiStore.addToast('Full system snapshot copied to clipboard!', 'success')
  } catch (err) {
    logger.error('Failed to copy snapshot', err)
    uiStore.addToast('Snapshot export failed', 'error')
  }
}

// Use prop lastMove if provided, else fallback to store's lastMove
const allArrows = computed(() => [...(props.arrows || []), ...(props.hintArrows || [])])
const resolvedLastMove = computed(() => props.lastMove || lastMove.value)

const files = ['a','b','c','d','e','f','g','h']
const ranks = ['8','7','6','5','4','3','2','1']

const displayRanks = computed(() => props.flipped ? [...ranks].reverse() : ranks)
const displayFiles  = computed(() => props.flipped ? [...files].reverse()  : files)
const displayBoard = computed(() => {
  const b = store.board
  if (!props.flipped) return b
  return [...b].reverse().map(row => [...row].reverse())
})

/**
 * STATEFUL PIECE TRACKING
 */
const internalPieces = ref<any[]>([])

watch(() => [store.fen, props.flipped, resolvedLastMove.value], () => {
  const board = displayBoard.value
  const last = resolvedLastMove.value
  
  const targetPieces: any[] = []
  board.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell) {
        const sq = squareId(r, c)
        // Skip dummy kings so they are completely hidden on the UI
        if (store.dummyKingSquares.includes(sq)) return

        targetPieces.push({
          type: cell.type,
          color: cell.color,
          sq,
          r, c
        })
      }
    })
  })

  const newList: any[] = []
  const usedOldIds = new Set<string>()

  if (last) {
    const movingPiece = internalPieces.value.find(p => p.sq === last.from)
    const targetAtTo = targetPieces.find(p => p.sq === last.to)
    
    if (movingPiece && targetAtTo) {
      newList.push({
        ...targetAtTo,
        id: movingPiece.id,
        left: targetAtTo.c * 12.5,
        top: targetAtTo.r * 12.5
      })
      usedOldIds.add(movingPiece.id)
      targetPieces.splice(targetPieces.indexOf(targetAtTo), 1)
      
      // If we found the moving piece, let's also remove it from the 'old pieces' search pool
      // so it doesn't get picked up by the 'staying in place' loop
      const oldIdx = internalPieces.value.indexOf(movingPiece)
      if (oldIdx > -1) {
         // We can't splice here easily since we are looping later, 
         // but usedOldIds handles the filtering.
      }
    }
  }

  for (let i = targetPieces.length - 1; i >= 0; i--) {
    const tp = targetPieces[i]
    const existing = internalPieces.value.find(p => p.sq === tp.sq && p.type === tp.type && p.color === tp.color && !usedOldIds.has(p.id))
    if (existing) {
      newList.push({
        ...tp,
        id: existing.id,
        left: tp.c * 12.5,
        top: tp.r * 12.5
      })
      usedOldIds.add(existing.id)
      targetPieces.splice(i, 1)
    }
  }

  targetPieces.forEach(tp => {
    newList.push({
      ...tp,
      id: `piece-${Math.random().toString(36).substr(2, 5)}`,
      left: tp.c * 12.5,
      top: tp.r * 12.5
    })
  })

  internalPieces.value = newList
}, { immediate: true })

const animatedPieces = computed(() => internalPieces.value)

function squareId(rowIdx: number, colIdx: number): Square {
  const f = displayFiles.value[colIdx]
  const r = displayRanks.value[rowIdx]
  return `${f}${r}` as Square
}

function handleSquareClick(rowIdx: number, colIdx: number) {
  const sq = squareId(rowIdx, colIdx)
  // Disable selecting dummy king squares to prevent unexpected behavior
  if (store.dummyKingSquares.includes(sq)) return
  if (!isInteractive.value || isThinking.value) return
  store.selectSquare(sq)
}

function handleDragStartPiece(sq: Square, event: DragEvent) {
  // Prevent dragging any dummy piece
  if (store.dummyKingSquares.includes(sq)) return
  if (!isInteractive.value || isThinking.value) return
  if (event.dataTransfer) {
    event.dataTransfer.setData('sourceSquare', sq)
    event.dataTransfer.effectAllowed = 'move'
    store.selectSquare(sq)
  }
}

function handleDrop(rowIdx: number, colIdx: number, event: DragEvent) {
  const toSq = squareId(rowIdx, colIdx)
  // Prevent placing/dropping pieces onto squares designated for dummy kings
  if (store.dummyKingSquares.includes(toSq)) return
  const fromSq = event.dataTransfer?.getData('sourceSquare') as Square
  if (fromSq && fromSq !== toSq) {
    store.makeMove(fromSq, toSq)
  }
}

function handleDropOnPiece(toSq: Square, event: DragEvent) {
  // Prevent placing/dropping pieces onto squares designated for dummy kings
  if (store.dummyKingSquares.includes(toSq)) return
  const fromSq = event.dataTransfer?.getData('sourceSquare') as Square
  if (fromSq && fromSq !== toSq) {
    store.makeMove(fromSq, toSq)
  }
}

function squareClasses(rowIdx: number, colIdx: number) {
  return {
    'sq-light': (rowIdx + colIdx) % 2 === 0,
    'sq-dark': (rowIdx + colIdx) % 2 !== 0,
  }
}
function isSelected(rowIdx: number, colIdx: number) {
  return selectedSquare.value === squareId(rowIdx, colIdx)
}
function isLegalMove(rowIdx: number, colIdx: number) {
  return legalMoveSquares.value.includes(squareId(rowIdx, colIdx))
}
function isLastMove(rowIdx: number, colIdx: number) {
  if (!lastMove.value) return false
  const sq = squareId(rowIdx, colIdx)
  return sq === lastMove.value.from || sq === lastMove.value.to
}
function isKingInCheck(rowIdx: number, colIdx: number) {
  if (!isCheck.value) return false
  const cell = displayBoard.value[rowIdx][colIdx]
  return cell?.type === 'k' && cell?.color === turn.value
}
</script>

<style scoped>
.board-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
}

.main-board-area {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: min(800px, 72vh); /* Optimized for all-onscreen layout */
  margin: 0 auto;
}

.board-row-wrap {
  display: flex;
  width: 100%;
  position: relative;
}

.rank-labels {
  display: flex;
  flex-direction: column;
  width: 28px;
  margin-right: 8px;
}

.rank-labels span {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.board-container {
  flex: 1;
  position: relative;
  aspect-ratio: 1 / 1;
  min-width: 0;
}

.chess-board {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 12px 64px rgba(0,0,0,0.8);
  background: var(--bg-elevated);
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

.file-labels-row {
  display: flex;
  width: 100%;
  padding-left: 36px;
  height: 32px;
  margin-top: 8px;
}

.file-labels-row span {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.sq-light { background: var(--sq-light, #ecd9b9); }
.sq-dark  { background: var(--sq-dark, #b58863); }
.sq-selected { outline: 3px solid var(--accent); outline-offset: -3px; }
.sq-highlight { position: absolute; inset: 0; pointer-events: none; }
.sq-check { position: absolute; inset: 0; background: radial-gradient(circle, rgba(220,20,60,0.8) 0%, rgba(220,20,60,0) 70%); pointer-events: none; }
.legal-dot { position: absolute; width: 28%; height: 28%; background: rgba(0,0,0,0.25); border-radius: 50%; pointer-events: none; z-index: 2; }

.thinking-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center; z-index: 100;
  backdrop-filter: blur(2px); pointer-events: none;
}

.thinking-text {
  background: var(--bg-card, #1e1e1e); padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full); border: 1px solid var(--border);
  font-size: 0.8rem; font-weight: 700; color: var(--accent);
}

.dev-debug-btn {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.15;
  transition: all 0.2s ease;
  z-index: 150; /* Above pieces and thinking overlay */
}

.dev-debug-btn:hover {
  opacity: 1;
  background: var(--bg-elevated);
  border-color: var(--accent);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

.debug-icon {
  font-size: 0.8rem;
  filter: grayscale(1);
}

.dev-debug-btn:hover .debug-icon {
  filter: grayscale(0);
}

@media (max-width: 800px) {
  .dev-debug-btn {
    opacity: 0.4; /* More visible on mobile */
  }
}
</style>
