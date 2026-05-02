<script setup lang="ts">
/**
 * Vault List
 * 
 * Modularizes the database/list view for the Vault.
 */
import { useLibraryStore, type LibraryGame } from '../../stores/libraryStore'
import GameRow from './GameRow.vue'

const libraryStore = useLibraryStore()

defineProps<{
  games: LibraryGame[]
}>()

const emit = defineEmits(['select', 'analyze', 'delete', 'setSort'])
</script>

<template>
  <div class="vault-list">
    <div class="list-header muted">
      <div class="col-result">Result</div>
      <div class="col-date sortable" @click="emit('setSort', 'date')" :class="{ active: libraryStore.sortBy === 'date' }">
        Date <span v-if="libraryStore.sortBy === 'date'">{{ libraryStore.sortOrder === 'asc' ? '↑' : '↓' }}</span>
      </div>
      <div class="col-players sortable" @click="emit('setSort', 'player')" :class="{ active: libraryStore.sortBy === 'player' }">
        Players <span v-if="libraryStore.sortBy === 'player'">{{ libraryStore.sortOrder === 'asc' ? '↑' : '↓' }}</span>
      </div>
      <div class="col-opening sortable" @click="emit('setSort', 'opening')" :class="{ active: libraryStore.sortBy === 'opening' }">
        Opening / Event <span v-if="libraryStore.sortBy === 'opening'">{{ libraryStore.sortOrder === 'asc' ? '↑' : '↓' }}</span>
      </div>
      <div class="col-moves sortable" @click="emit('setSort', 'movesCount')" :class="{ active: libraryStore.sortBy === 'movesCount' }">
        Moves <span v-if="libraryStore.sortBy === 'movesCount'">{{ libraryStore.sortOrder === 'asc' ? '↑' : '↓' }}</span>
      </div>
      <div class="col-tags">Source</div>
      <div class="col-actions"></div>
    </div>
    
    <GameRow
      v-for="(game, index) in games"
      :key="game.id + '-' + index"
      v-memo="[game.id, game.tags?.length]"
      :game="game"
      @click="emit('select', game)"
      @analyze="emit('analyze', game)"
      @delete="emit('delete', game)"
    />
  </div>
</template>

<style scoped>
.vault-list { display: flex; flex-direction: column; gap: 2px; }

.list-header {
  display: flex;
  padding: var(--space-2) var(--space-4);
  gap: var(--space-4);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  margin-bottom: var(--space-2);
}

.list-header > div.sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
}

.list-header > div.sortable:hover { color: var(--text-bright); }
.list-header > div.sortable.active { color: var(--accent); }

.col-result { min-width: 60px; text-align: center; }
.col-date { min-width: 90px; }
.col-players { flex: 2; min-width: 150px; }
.col-opening { flex: 3; min-width: 200px; }
.col-moves { min-width: 70px; text-align: center; }
.col-tags { flex: 1; min-width: 100px; }
.col-actions { min-width: 40px; }

@media (max-width: 900px) {
  .col-opening, .col-tags, .col-date { display: none; }
}
</style>
