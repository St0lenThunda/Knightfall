<template>
  <div class="list-header muted">
    <div class="col-result">Result</div>
    <div 
      class="col-date sortable" 
      @click="$emit('sort', 'date')" 
      :class="{ active: sortBy === 'date' }"
    >
      Date <span v-if="sortBy === 'date'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
    </div>
    <div 
      class="col-players sortable" 
      @click="$emit('sort', 'player')" 
      :class="{ active: sortBy === 'player' }"
    >
      Players <span v-if="sortBy === 'player'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
    </div>
    <div 
      class="col-opening sortable" 
      @click="$emit('sort', 'opening')" 
      :class="{ active: sortBy === 'opening' }"
    >
      Opening / Event <span v-if="sortBy === 'opening'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
    </div>
    <div 
      class="col-moves sortable" 
      @click="$emit('sort', 'movesCount')" 
      :class="{ active: sortBy === 'movesCount' }"
    >
      Moves <span v-if="sortBy === 'movesCount'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
    </div>
    <div class="col-tags">Source</div>
    <div class="col-actions"></div>
  </div>
</template>

<script setup lang="ts">
/**
 * specialized sub-component for the Vault List Header.
 * Handles sort emissions and active state styling.
 */
defineProps<{
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}>()

defineEmits<{
  (e: 'sort', column: string): void
}>()
</script>

<style scoped>
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

.list-header > div.sortable:hover {
  color: var(--text-bright);
}

.list-header > div.sortable.active {
  color: var(--accent);
}

.col-result { min-width: 60px; text-align: center; }
.col-date { min-width: 90px; }
.col-players { flex: 2; min-width: 150px; }
.col-opening { flex: 3; min-width: 200px; }
.col-moves { min-width: 70px; text-align: center; }
.col-tags { flex: 1; min-width: 100px; }
.col-actions { min-width: 40px; }
</style>
