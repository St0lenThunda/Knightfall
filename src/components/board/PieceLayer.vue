<script setup lang="ts">
/**
 * PieceLayer: Manages the animated rendering of chess pieces.
 * Uses TransitionGroup to handle smooth 'slide' animations between FEN states.
 */
import { computed } from 'vue'

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
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'classic'
})
const emit = defineEmits(['dragstart'])

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
        :class="{ 'no-interact': !isInteractive || isThinking }"
        :draggable="isInteractive && !isThinking && p.color === turn"
        @dragstart="onDragStart(p.sq, $event)"
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
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: grab;
  pointer-events: auto;
  z-index: 2;
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
</style>
