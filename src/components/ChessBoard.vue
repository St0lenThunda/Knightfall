<template>
  <div class="board-wrapper">
    <div class="board-inner">
      <!-- Rank labels left -->
      <div class="rank-labels">
        <span v-for="r in displayRanks" :key="r">{{ r }}</span>
      </div>

      <div class="board-container">
        <!-- Squares -->
        <div class="chess-board">
          <div
            v-for="(row, rowIdx) in displayBoard"
            :key="rowIdx"
            class="board-row"
          >
            <div
              v-for="(cell, colIdx) in row"
              :key="colIdx"
              class="board-square"
              :class="squareClasses(rowIdx, colIdx)"
              :data-square="squareId(rowIdx, colIdx)"
              @click="handleSquareClick(rowIdx, colIdx)"
              @dragover.prevent
              @drop="handleDrop(rowIdx, colIdx)"
            >
              <!-- Last move / selected highlight -->
              <div class="sq-highlight" v-if="isLastMove(rowIdx, colIdx)" style="background: var(--sq-last); opacity: 0.6;"></div>
              <div class="sq-highlight" v-if="isSelected(rowIdx, colIdx)" style="background: rgba(103,232,249,0.3);"></div>
              <div class="sq-check" v-if="isKingInCheck(rowIdx, colIdx)"></div>

              <!-- Legal move dot -->
              <div v-if="isLegalMove(rowIdx, colIdx)" class="legal-dot" :class="{ 'legal-capture': !!cell }"></div>

              <!-- Hint Highlights -->
              <div class="sq-highlight" v-if="(highlights || []).includes(squareId(rowIdx, colIdx))" style="background: rgba(251,191,36,0.4); border: 2px solid var(--gold);"></div>

              <!-- Piece: Image mode -->
              <div
                v-if="cell && useImages"
                class="piece piece-img-wrap"
                :class="{ 'piece-dragging': dragFrom === squareId(rowIdx, colIdx) }"
                draggable="true"
                @dragstart="handleDragStart(rowIdx, colIdx)"
                @dragend="handleDragEnd"
              >
                <img :src="pieceImgSrc(cell)" class="piece-img" draggable="false" />
              </div>

              <!-- Piece: Unicode mode (fast default) -->
              <div
                v-else-if="cell"
                class="piece"
                :class="['piece-' + cell.color, { 'piece-dragging': dragFrom === squareId(rowIdx, colIdx) }]"
                draggable="true"
                @dragstart="handleDragStart(rowIdx, colIdx)"
                @dragend="handleDragEnd"
              >
                {{ pieceUnicode(cell) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Arrow Overlay -->
        <svg v-if="arrows && arrows.length > 0" class="board-arrows" viewBox="0 0 80 80">
          <defs>
            <marker id="arrowhead-default" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
              <polygon points="0 0, 4 2, 0 4" fill="rgba(251,191,36,0.8)" />
            </marker>
            <marker id="arrowhead-suggestion" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
              <polygon points="0 0, 4 2, 0 4" fill="rgba(16, 185, 129, 0.8)" />
            </marker>
            <marker id="arrowhead-suggestion-alt" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
              <polygon points="0 0, 4 2, 0 4" fill="rgba(16, 185, 129, 0.3)" />
            </marker>
            <marker id="arrowhead-threat" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
              <polygon points="0 0, 4 2, 0 4" fill="rgba(244, 63, 94, 0.8)" />
            </marker>
          </defs>
          <line v-for="(arr, i) in arrows" :key="i"
                :x1="getCoords(arr.from).x" :y1="getCoords(arr.from).y"
                :x2="getCoords(arr.to).x"   :y2="getCoords(arr.to).y"
                :stroke="getArrowColor(arr.type)" stroke-width="1.5"
                :marker-end="getArrowMarker(arr.type)" stroke-linecap="round" />
        </svg>

        <!-- Promotion dialog -->
        <Transition name="fade-up">
          <div class="promotion-overlay" v-if="store.promotionPending">
            <div class="promotion-dialog glass">
              <div class="label" style="margin-bottom: 8px;">Promote pawn</div>
              <div class="promo-pieces">
                <button
                  v-for="p in promotionPieces"
                  :key="p.symbol"
                  class="promo-btn"
                  @click="store.completePromotion(p.symbol)"
                >
                  <img v-if="useImages" :src="promoImgSrc(p.symbol)" class="piece-img" style="width: 40px; height: 40px;" />
                  <span v-else>{{ p.unicode }}</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- File labels bottom -->
    <div class="file-labels-row">
      <span v-for="f in displayFiles" :key="f">{{ f }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { PieceSymbol, Color } from 'chess.js'
import type { Square } from 'chess.js'

const store = useGameStore()
const settings = useSettingsStore()

export interface ArrowDef {
  from: string
  to: string
  type?: 'suggestion' | 'suggestion-alt' | 'threat' | 'default'
}

const props = defineProps<{
  flipped?: boolean
  arrows?: ArrowDef[]
  highlights?: string[]
}>()

const dragFrom = ref<string | null>(null)

// Use image-based pieces when theme is NOT 'classic' (unicode default)
const useImages = computed(() => settings.pieceTheme !== 'classic')

// Preload all 12 piece images for the active theme on mount
const preloaded = ref(false)
onMounted(() => {
  if (useImages.value) {
    const theme = settings.pieceTheme
    const pieces = ['wp','wr','wn','wb','wq','wk','bp','br','bn','bb','bq','bk']
    let loaded = 0
    pieces.forEach(p => {
      const img = new Image()
      img.src = `/pieces/${theme}/${p}.png`
      img.onload = () => { if (++loaded === pieces.length) preloaded.value = true }
    })
  }
})

function getCoords(sq: string) {
  const file = sq[0]; const rank = sq[1]
  let col = file.charCodeAt(0) - 97
  let row = 8 - parseInt(rank)
  if (props.flipped) { col = 7 - col; row = 7 - row }
  return { x: col * 10 + 5, y: row * 10 + 5 }
}

function getArrowColor(type?: string) {
  if (type === 'suggestion') return 'rgba(16, 185, 129, 0.8)'
  if (type === 'suggestion-alt') return 'rgba(16, 185, 129, 0.3)'
  if (type === 'threat') return 'rgba(244, 63, 94, 0.8)'
  return 'rgba(251, 191, 36, 0.8)'
}

function getArrowMarker(type?: string) {
  if (type === 'suggestion') return 'url(#arrowhead-suggestion)'
  if (type === 'suggestion-alt') return 'url(#arrowhead-suggestion-alt)'
  if (type === 'threat') return 'url(#arrowhead-threat)'
  return 'url(#arrowhead-default)'
}

const PIECE_UNICODE: Record<string, string> = {
  wK: '♚', wQ: '♛', wR: '♜', wB: '♝', wN: '♞', wP: '♟',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
}

const files = ['a','b','c','d','e','f','g','h']
const ranks = ['8','7','6','5','4','3','2','1']

const displayRanks = computed(() => props.flipped ? [...ranks].reverse() : ranks)
const displayFiles  = computed(() => props.flipped ? [...files].reverse()  : files)

const displayBoard = computed(() => {
  const b = store.board
  return props.flipped ? [...b].reverse().map(row => [...row].reverse()) : b
})

function squareId(rowIdx: number, colIdx: number): Square {
  const f = displayFiles.value[colIdx]
  const r = displayRanks.value[rowIdx]
  return `${f}${r}` as Square
}

function pieceUnicode(cell: { type: PieceSymbol; color: Color } | null) {
  if (!cell) return ''
  return PIECE_UNICODE[`${cell.color}${cell.type.toUpperCase()}`] || ''
}

function pieceImgSrc(cell: { type: string; color: string }) {
  return `/pieces/${settings.pieceTheme}/${cell.color}${cell.type}.png`
}

function promoImgSrc(symbol: string) {
  return `/pieces/${settings.pieceTheme}/${store.turn}${symbol}.png`
}

function squareClasses(rowIdx: number, colIdx: number) {
  const light = (rowIdx + colIdx) % 2 === 0
  return {
    'sq-light': light,
    'sq-dark': !light,
    'sq-selected': isSelected(rowIdx, colIdx),
  }
}

function isSelected(rowIdx: number, colIdx: number) {
  return store.selectedSquare === squareId(rowIdx, colIdx)
}

function isLegalMove(rowIdx: number, colIdx: number) {
  return store.legalMoveSquares.includes(squareId(rowIdx, colIdx))
}

function isLastMove(rowIdx: number, colIdx: number) {
  if (!store.lastMove) return false
  const sq = squareId(rowIdx, colIdx)
  return sq === store.lastMove.from || sq === store.lastMove.to
}

function isKingInCheck(rowIdx: number, colIdx: number) {
  if (!store.isCheck) return false
  const cell = displayBoard.value[rowIdx][colIdx]
  if (!cell || cell.type !== 'k') return false
  return cell.color === store.turn
}

function handleSquareClick(rowIdx: number, colIdx: number) {
  if (store.isThinking) return
  store.selectSquare(squareId(rowIdx, colIdx))
  if (store.mode === 'vs-computer' && store.turn !== store.playerColor && !store.isGameOver) {
    store.computerMove()
  }
}

function handleDragStart(rowIdx: number, colIdx: number) {
  const sq = squareId(rowIdx, colIdx)
  const cell = displayBoard.value[rowIdx][colIdx]
  if (!cell) return
  dragFrom.value = sq
  store.selectedSquare = sq
  store.legalMoveSquares = store.chess.moves({ square: sq, verbose: true }).map(m => m.to as Square)
}

function handleDragEnd() {
  dragFrom.value = null
}

function handleDrop(rowIdx: number, colIdx: number) {
  if (!dragFrom.value) return
  const to = squareId(rowIdx, colIdx)
  store.selectSquare(to)
  if (store.mode === 'vs-computer' && store.turn !== store.playerColor && !store.isGameOver) {
    store.computerMove()
  }
  dragFrom.value = null
}

const promotionPieces: { symbol: PieceSymbol; unicode: string }[] = [
  { symbol: 'q', unicode: '♛' },
  { symbol: 'r', unicode: '♜' },
  { symbol: 'b', unicode: '♝' },
  { symbol: 'n', unicode: '♞' },
]
</script>

<style scoped>
.board-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  user-select: none;
  padding: 10px;
}

.board-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rank-labels {
  display: flex;
  flex-direction: column;
  height: min(480px, 90vw);
  justify-content: space-around;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.board-container {
  position: relative;
}

.chess-board {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0,0,0,0.7), 0 0 0 3px rgba(255,255,255,0.07);
  width: min(480px, 90vw);
  aspect-ratio: 1;
}

.board-row {
  display: flex;
  flex: 1;
}

.board-square {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: filter 0.1s ease;
}
.board-square:hover .piece { transform: scale(1.08); }

.sq-light { background: var(--sq-light); }
.sq-dark  { background: var(--sq-dark); }
.sq-selected { filter: brightness(1.15); outline: 3px solid rgba(103,232,249,0.5); outline-offset: -3px; }

.sq-highlight {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sq-check {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(220,20,60,0.8) 0%, rgba(220,20,60,0) 70%);
  pointer-events: none;
}

.legal-dot {
  position: absolute;
  width: 28%;
  height: 28%;
  background: rgba(0,0,0,0.25);
  border-radius: 50%;
  pointer-events: none;
  z-index: 2;
}
.legal-capture {
  width: 100%;
  height: 100%;
  background: transparent;
  border-radius: 0;
  border: 4px solid rgba(0,0,0,0.22);
  border-radius: 50%;
}

.piece {
  font-size: clamp(1.6rem, 5vw, 2.4rem);
  line-height: 1;
  z-index: 3;
  position: relative;
  cursor: grab;
  transition: transform 0.1s ease, filter 0.1s ease;
}
.piece-img-wrap {
  width: 85%;
  height: 85%;
  font-size: unset;
  display: flex;
  align-items: center;
  justify-content: center;
}
.piece-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}
.piece-w {
  color: #fff;
  text-shadow: 0 2px 5px rgba(0,0,0,0.6);
}
.piece-b {
  color: #1e1e2e;
  text-shadow: 0 1px 2px rgba(255,255,255,0.3);
}
.piece:active { cursor: grabbing; }
.piece-dragging { opacity: 0.3; }

.file-label {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 0.6rem;
  font-weight: 700;
  color: rgba(0,0,0,0.35);
  pointer-events: none;
}
.sq-dark .file-label { color: rgba(255,255,255,0.25); }

.file-labels-row {
  display: flex;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  font-family: var(--font-mono);
  width: min(480px, 90vw);
  justify-content: space-around;
  padding-left: 36px;
}

.file-labels-row span {
  flex: 1;
  text-align: center;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Promotion modal */
.promotion-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(4px);
}
.promotion-dialog {
  padding: var(--space-6);
  text-align: center;
}

.board-arrows {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 10;
}
.promo-pieces {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-3);
}
.promo-btn {
  font-size: 2.5rem;
  background: var(--bg-elevated);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--text-primary);
}
.promo-btn:hover { background: var(--accent-dim); border-color: var(--accent); transform: scale(1.1); }

.fade-up-enter-active, .fade-up-leave-active { transition: all 0.2s ease; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: scale(0.95); }
</style>
