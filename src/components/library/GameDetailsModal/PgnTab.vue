<template>
  <div class="pgn-tab" v-if="game.pgn">
    <pre class="pgn-text">{{ game.pgn }}</pre>
    <button class="btn btn-ghost" @click="copyPgn">
      {{ copied ? 'Copied!' : 'Copy PGN' }}
    </button>
  </div>
  <div v-else class="pgn-tab empty">
    <p class="muted">No PGN data available for this game.</p>
  </div>
</template>

<script setup lang="ts">
/**
 * PgnTab – displays the raw PGN string for a game and offers a copy button.
 * This component is deliberately lightweight to keep the parent modal under
 * the 500‑line limit and to promote reusability across other views.
 */
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{ game: any; copied: boolean }>()
const emit = defineEmits(['copy-pgn'])

function copyPgn() {
  emit('copy-pgn')
}
</script>

<style scoped>
.pgn-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.pgn-text {
  background: rgba(0, 0, 0, 0.25);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  max-height: 300px;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  line-height: 1.4;
}
.empty {
  text-align: center;
  color: var(--text-muted);
}
</style>
