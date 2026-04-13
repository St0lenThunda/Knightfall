<template>
  <div class="static-board" :style="{ width: size + 'px', height: size + 'px' }">
    <div v-for="(row, rIdx) in board" :key="rIdx" class="row">
      <div 
        v-for="(cell, cIdx) in row" 
        :key="cIdx" 
        class="sq" 
        :class="(rIdx + cIdx) % 2 === 0 ? 'light' : 'dark'"
      >
        <span v-if="cell" class="p" :class="cell.color">
          {{ pieceUnicode(cell) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Chess } from 'chess.js'

const props = defineProps<{
  fen: string
  size?: number
}>()

const size = props.size || 200

const PIECE_UNICODE: Record<string, string> = {
  wK: '♚', wQ: '♛', wR: '♜', wB: '♝', wN: '♞', wP: '♟',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
}

const board = computed(() => {
    try {
        const c = new Chess(props.fen)
        return c.board()
    } catch {
        return new Chess().board()
    }
})

function pieceUnicode(cell: any) {
    return PIECE_UNICODE[`${cell.color}${cell.type.toUpperCase()}`] || ''
}
</script>

<style scoped>
.static-board {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-sm);
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.row { display: flex; flex: 1; }
.sq {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}
.light { background: #e2e8f0; }
.dark { background: #475569; }

.p.w { color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }
.p.b { color: #0f172a; }
</style>
