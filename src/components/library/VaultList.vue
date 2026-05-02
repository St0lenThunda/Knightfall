<template>
  <div class="vault-list glass-sm">
    <!-- Header Row -->
    <div class="list-header muted">
      <div class="col-select"></div>
      <div class="col-result" @click="$emit('setSort', 'result')">RESULT</div>
      <div class="col-date" @click="$emit('setSort', 'date')">DATE</div>
      <div class="col-players" @click="$emit('setSort', 'white')">PLAYERS</div>
      <div class="col-opening" @click="$emit('setSort', 'eco')">OPENING</div>
      <div class="col-moves" @click="$emit('setSort', 'movesCount')">MOVES</div>
      <div class="col-tags">TAGS</div>
      <div class="col-actions"></div>
    </div>
    
    <GameRow 
      v-for="game in games" 
      :key="game.id"
      :game="game"
      :selected="selectedIds.has(game.id)"
      @click="$emit('select', game)"
      @analyze="$emit('analyze', game)"
      @delete="$emit('delete', game)"
      @toggleSelect="handleToggleSelect(game.id)"
    />
  </div>
</template>

<script setup lang="ts">
import GameRow from './GameRow.vue'
import type { LibraryGame } from '../../stores/library/types'

const props = defineProps<{
  games: LibraryGame[]
  selectedIds: Set<string>
}>()

const emit = defineEmits(['select', 'analyze', 'delete', 'setSort', 'toggleSelection'])

function handleToggleSelect(id: string) {
  // We emit to the parent (VaultPanel) which maintains the selection set
  emit('toggleSelection', id)
}
</script>

<style scoped>
.vault-list {
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}

.list-header {
  display: flex;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  gap: var(--space-4);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
}

/* Header Columns Alignment */
.col-select { min-width: 32px; }
.col-result { min-width: 64px; cursor: pointer; }
.col-date { min-width: 90px; cursor: pointer; }
.col-players { flex: 2; min-width: 160px; cursor: pointer; }
.col-opening { flex: 3; min-width: 220px; cursor: pointer; }
.col-moves { min-width: 80px; text-align: center; cursor: pointer; }
.col-tags { flex: 1; min-width: 120px; }
.col-actions { min-width: 60px; }

.list-header div:hover { color: var(--accent); }

@media (max-width: 900px) {
  .col-opening, .col-tags, .col-date, .col-moves { display: none; }
}
</style>
