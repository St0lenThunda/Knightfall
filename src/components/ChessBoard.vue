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
                
                <!-- Move Quality Badge -->
                <div v-if="getQualityBadge(rowIdx, colIdx)" 
                     class="quality-badge animated-pop-in"
                     :style="{ backgroundColor: getQualityBadge(rowIdx, colIdx)?.color }"
                >
                  {{ getQualityBadge(rowIdx, colIdx)?.icon }}
                </div>
              </div>
            </div>

            <!-- Pieces Layer (Animated) -->
            <div class="pieces-layer">
              <TransitionGroup name="piece-move">
                <div
                  v-for="p in animatedPieces"
                  :key="p.id"
                  class="piece-wrapper"
                  :style="{ 
                    left: p.left + '%', 
                    top: p.top + '%',
                  }"
                  :class="{ 'no-interact': !isInteractive || isThinking }"
                  :draggable="isInteractive && !isThinking && p.color === turn"
                  @dragstart="handleDragStartPiece(p.sq, $event)"
                >
                  <img :src="getPieceUrl(p)" :alt="p.type" class="piece-img" />
                </div>
              </TransitionGroup>
            </div>

            <!-- Overlays -->
            <div class="thinking-overlay" v-if="isThinking">
              <div class="thinking-text">Thinking...</div>
            </div>
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
import { logger } from '../utils/logger'
import type { Square } from 'chess.js'
import type { MoveQuality } from '../utils/analysisUtils'

const store = useGameStore()
const { selectedSquare, legalMoveSquares, lastMove, isCheck, turn, isThinking } = toRefs(store)
const props = withDefaults(defineProps<{
  flipped?: boolean;
  interactive?: boolean;
  moveQuality?: MoveQuality | null;
}>(), {
  flipped: false,
  interactive: true,
  moveQuality: null
})

const isInteractive = computed(() => props.interactive)

const PIECE_IMAGES: Record<string, string> = {
  wP: '/pieces/classic/wp.png', wN: '/pieces/classic/wn.png', wB: '/pieces/classic/wb.png',
  wR: '/pieces/classic/wr.png', wQ: '/pieces/classic/wq.png', wK: '/pieces/classic/wk.png',
  bP: '/pieces/classic/bp.png', bN: '/pieces/classic/bn.png', bB: '/pieces/classic/bb.png',
  bR: '/pieces/classic/br.png', bQ: '/pieces/classic/bq.png', bK: '/pieces/classic/bk.png',
}
const files = ['a','b','c','d','e','f','g','h']
const ranks = ['8','7','6','5','4','3','2','1']

const displayRanks = computed(() => props.flipped ? [...ranks].reverse() : ranks)
const displayFiles  = computed(() => props.flipped ? [...files].reverse()  : files)
const displayBoard = computed(() => {
  const b = store.board
  if (!props.flipped) return b
  // Reverse rows (ranks) and reverse each row (files)
  return [...b].reverse().map(row => [...row].reverse())
})

/**
 * STATEFUL PIECE TRACKING
 * 
 * To ensure "natural" animations, we maintain a persistent list of pieces.
 * When the FEN changes, we diff the board to identify which pieces moved,
 * which were captured, and which were added (promotions).
 */
const internalPieces = ref<any[]>([])

watch(() => [store.fen, props.flipped], () => {
  const board = displayBoard.value
  const currentIdx = store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex
  const last = store.lastMove || (currentIdx >= 0 ? store.moveHistory[currentIdx] : null)
  
  // 1. Flatten the current board state
  const targetPieces: any[] = []
  board.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell) {
        targetPieces.push({
          type: cell.type,
          color: cell.color,
          sq: squareId(r, c),
          r, c
        })
      }
    })
  })

  const newList: any[] = []
  const usedOldIds = new Set<string>()

  // 2. Handle the Moving Piece (The most important for "natural" feel)
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
      // Remove from target list so we don't process it again
      targetPieces.splice(targetPieces.indexOf(targetAtTo), 1)
    }
  }

  // 3. Match remaining pieces by exact square (static pieces)
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

  // 4. Handle remaining (new pieces, promotions, or lost track)
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
  if (!f || !r) {
    logger.warn(`[ChessBoard] Invalid squareId lookup: r=${rowIdx}, c=${colIdx}`)
    return 'a1' as Square // Fallback
  }
  return `${f}${r}` as Square
}

function getPieceUrl(cell: { type: string; color: string }) {
  const key = `${cell.color}${cell.type.toUpperCase()}`
  return PIECE_IMAGES[key] || ''
}

function handleDragStartPiece(sq: Square, event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('sourceSquare', sq)
    event.dataTransfer.effectAllowed = 'move'
    store.selectSquare(sq)
  }
}


function handleDrop(rowIdx: number, colIdx: number, event: DragEvent) {
  const toSq = squareId(rowIdx, colIdx)
  const fromSq = event.dataTransfer?.getData('sourceSquare') as Square
  
  if (fromSq && fromSq !== toSq) {
    logger.info(`[ChessBoard] Drag-Drop: ${fromSq} -> ${toSq}`)
    store.makeMove(fromSq, toSq)
  }
}

function squareClasses(rowIdx: number, colIdx: number) {
  const sq = squareId(rowIdx, colIdx)
  return {
    'sq-light': (rowIdx + colIdx) % 2 === 0,
    'sq-dark': (rowIdx + colIdx) % 2 !== 0,
    'sq-selected': selectedSquare.value === sq,
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

/**
 * Returns the quality badge for a specific square if applicable.
 */
function getQualityBadge(rowIdx: number, colIdx: number) {
  if (!props.moveQuality || props.moveQuality.id === 'good') return null
  if (!lastMove.value) return null
  
  const sq = squareId(rowIdx, colIdx)
  // Badge only appears on the 'to' square of the move just made
  if (sq === lastMove.value.to) {
    return props.moveQuality
  }
  return null
}

function handleSquareClick(rowIdx: number, colIdx: number) {
  const sq = squareId(rowIdx, colIdx)
  logger.info(`[ChessBoard] Clicked ${sq} | Interactive: ${isInteractive.value} | Thinking: ${isThinking.value}`)
  
  if (!isInteractive.value || isThinking.value) {
    logger.warn(`[ChessBoard] Click on ${sq} ignored: Interactive=${isInteractive.value}, Thinking=${isThinking.value}`)
    return
  }
  store.selectSquare(sq)
}
</script>

<style scoped>
.board-wrapper { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 8px; user-select: none; }
.board-inner { width: 100%; display: flex; align-items: flex-start; justify-content: center; gap: 12px; }

.main-board-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: min(800px, 85vh);
  width: 100%;
}

.board-row-wrap {
  display: flex;
  align-items: stretch;
  gap: 12px;
  width: 100%;
}

.rank-labels { 
  display: flex; 
  flex-direction: column; 
  justify-content: space-around; 
  font-size: 0.9rem; 
  font-weight: 800; 
  color: var(--text-muted); 
  font-family: var(--font-mono); 
  opacity: 0.9;
  width: 20px;
}

.board-container { flex: 1; position: relative; }

.file-labels-row {
  display: flex;
  width: 100%;
  padding-left: 32px; /* Offset for rank labels */
  justify-content: space-around;
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-muted);
  font-family: var(--font-mono);
}
.chess-board { 
  display: flex; 
  flex-direction: column; 
  border-radius: var(--radius-md); 
  overflow: hidden; 
  box-shadow: 0 12px 48px rgba(0,0,0,0.7); 
  width: 100%; 
  min-width: 320px;
  aspect-ratio: 1; 
  margin: 0 auto;
}
.board-row { display: flex; flex: 1; }
.board-square { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.sq-light { background: var(--sq-light); }
.sq-dark  { background: var(--sq-dark); }
.sq-selected { outline: 3px solid var(--accent); outline-offset: -3px; }
.sq-highlight { position: absolute; inset: 0; pointer-events: none; }
.sq-check { position: absolute; inset: 0; background: radial-gradient(circle, rgba(220,20,60,0.8) 0%, rgba(220,20,60,0) 70%); pointer-events: none; }
.legal-dot { position: absolute; width: 28%; height: 28%; background: rgba(0,0,0,0.25); border-radius: 50%; pointer-events: none; z-index: 2; }
.legal-capture { width: 100%; height: 100%; border: 4px solid rgba(0,0,0,0.2); border-radius: 50%; background: transparent; }
.piece { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 3; position: relative; }
.piece-img { width: 90%; height: 90%; object-fit: contain; pointer-events: none; }
.no-interact { opacity: 0.6; pointer-events: none; }

/* Animated Pieces Layer */
.pieces-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}

.piece-wrapper {
  position: absolute;
  width: 12.5%;
  height: 12.5%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  cursor: grab;
  transition: top 0.4s cubic-bezier(0.16, 1, 0.3, 1), left 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.1s ease;
}

/* Vue TransitionGroup Move Class */
.piece-move-move {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Enter/Leave animations (Captures) */
.piece-move-enter-active,
.piece-move-leave-active {
  transition: all 0.3s ease;
}
.piece-move-enter-from,
.piece-move-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

.thinking-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(2px);
  pointer-events: none;
}
.thinking-text {
  background: var(--bg-card);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--accent);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

/* Quality Badge Styles */
.quality-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 900;
  color: white;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

.animated-pop-in {
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
