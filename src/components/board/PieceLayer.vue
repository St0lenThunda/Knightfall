<script setup lang="ts">
import { toRefs } from 'vue'
import { useGameStore } from '../../stores/gameStore'

/**
 * PieceLayer: Manages the animated rendering of chess pieces.
 * Uses TransitionGroup to handle smooth 'slide' animations between FEN states.
 */

interface Piece {
  id: string
  type: string
  color: string
  sq: string
  left: number
  top: number
}

interface Props {
  pieces: Piece[]
  turn: string
  isInteractive: boolean
  isThinking: boolean
  theme?: string
  hintSquares?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'classic',
  hintSquares: () => []
})
const emit = defineEmits(['dragstart', 'square-click', 'piece-drop'])
const store = useGameStore()
const { mode, playerColor } = toRefs(store)

/**
 * HANDLE PIECE DROP (CAPTURE)
 * Allows dropping a piece onto another piece to trigger a capture.
 */
function onDrop(sq: string, event: DragEvent) {
  emit('piece-drop', { sq, event })
}

/**
 * TRIGGER SQUARE SELECTION
 * Allows capture/selection by clicking directly on pieces.
 */
function onPieceClick(sq: string) {
  if (!props.isInteractive || props.isThinking) return
  emit('square-click', sq)
}

/**
 * Maps piece types to visual assets (e.g. /pieces/classic/wn.png)
 */
function getPieceUrl(p: Piece) {
  const filename = `${p.color}${p.type}`.toLowerCase() + '.png'
  return `/pieces/${props.theme}/${filename}`
}

function onDragStart(sq: string, event: DragEvent) {
  emit('dragstart', { sq, event })
}
</script>

<template>
  <div class="pieces-layer">
    <TransitionGroup name="piece-move">
      <div
        v-for="p in pieces"
        :key="p.id"
        class="piece-wrapper"
        :style="{ 
          left: p.left + '%', 
          top: p.top + '%',
        }"
        :class="{ 
          'no-interact': !isInteractive || isThinking,
          'is-hinted': hintSquares.includes(p.sq)
        }"
        :draggable="isInteractive && !isThinking && p.color === turn && (mode !== 'vs-computer' || p.color === playerColor)"
        @dragstart="onDragStart(p.sq, $event)"
        @dragover.prevent
        @drop="onDrop(p.sq, $event)"
        @click="onPieceClick(p.sq)"
      >
        <img :src="getPieceUrl(p)" :alt="p.type" class="piece-img" />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.pieces-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: var(--z-pieces, 10);
}

.piece-wrapper {
  position: absolute;
  width: 12.5%;
  height: 12.5%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  z-index: 10;
  transition: left 0.75s cubic-bezier(0.4, 0, 0.2, 1), top 0.75s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: left, top;
  pointer-events: auto;
}

.piece-wrapper.no-interact {
  cursor: default;
  pointer-events: none;
}

.piece-img {
  width: 90%;
  height: 90%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
}

/* Animations */
.piece-move-move {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.piece-move-enter-active,
.piece-move-leave-active {
  transition: all 0.2s ease;
}

.piece-move-enter-from,
.piece-move-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* Hint Animation */
.piece-wrapper.is-hinted {
  z-index: 20;
}

.piece-wrapper.is-hinted .piece-img {
  animation: hint-pulse 1.5s infinite ease-in-out;
  filter: drop-shadow(0 0 12px var(--accent)) drop-shadow(0 4px 8px rgba(0,0,0,0.5));
}

@keyframes hint-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}
</style>
