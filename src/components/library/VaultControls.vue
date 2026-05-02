<script setup lang="ts">
/**
 * Vault Controls
 * 
 * Modularizes the filtering, searching, and sorting UI for the Vault.
 */
import { useLibraryStore } from '../../stores/libraryStore'

const libraryStore = useLibraryStore()

defineProps<{
  viewMode: 'grid' | 'list'
  limit: number
}>()

const emit = defineEmits([
  'update:viewMode', 
  'update:limit', 
  'toggleSortOrder'
])
</script>

<template>
  <div class="vault-sticky-controls">
    <div class="vault-filters glass-sm">
      <div class="search-box glass-xs">
        <span class="search-icon">🔍</span>
        <input 
          type="text" 
          v-model="libraryStore.searchQuery" 
          placeholder="Search by player, opening, or event..."
        />
      </div>

      <div class="filter-group">
        <div class="filter-item">
          <label>Result</label>
          <select v-model="libraryStore.filterResult" class="filter-select glass-xs">
            <option value="all">All Results</option>
            <option value="1-0">Wins (1-0)</option>
            <option value="0-1">Losses (0-1)</option>
            <option value="1/2-1/2">Draws (½-½)</option>
          </select>
        </div>

        <div class="filter-item">
          <label>Perspective</label>
          <select v-model="libraryStore.filterPerspective" class="filter-select glass-xs">
            <option value="all">Any Color</option>
            <option value="white">As White</option>
            <option value="black">As Black</option>
          </select>
        </div>

        <div class="filter-item">
          <label>Tag</label>
          <select v-model="libraryStore.selectedTag" class="filter-select glass-xs">
            <option value="all">All Sources</option>
            <option v-for="tag in libraryStore.allTags" :key="tag" :value="tag">
              {{ tag }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="vault-controls glass-sm">
      <div class="control-group">
        <div class="view-toggle">
          <button class="toggle-btn" :class="{ active: viewMode === 'grid' }" @click="emit('update:viewMode', 'grid')" title="Grid View">
            🔲 Grid
          </button>
          <button class="toggle-btn" :class="{ active: viewMode === 'list' }" @click="emit('update:viewMode', 'list')" title="Database View">
            📂 Database
          </button>
        </div>

        <div class="sort-controls">
          <span class="label muted">Sort:</span>
          <select v-model="libraryStore.sortBy" class="sort-select glass-xs">
            <option value="addedAt">Recently Added</option>
            <option value="date">Game Date</option>
            <option value="movesCount">Move Count</option>
            <option value="player">Player Name</option>
            <option value="opening">Opening (ECO)</option>
          </select>
          <button class="dir-btn glass-xs" @click="emit('toggleSortOrder')" :title="libraryStore.sortOrder === 'asc' ? 'Ascending' : 'Descending'">
            {{ libraryStore.sortOrder === 'asc' ? '↑' : '↓' }}
          </button>
        </div>
        
        <div class="limit-controls">
          <span class="label muted">Limit:</span>
          <select 
            :value="limit" 
            @change="emit('update:limit', Number(($event.target as HTMLSelectElement).value))"
            class="sort-select glass-xs"
          >
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
            <option :value="500">500</option>
          </select>
        </div>
      </div>
      
      <div class="vault-meta">
        <span class="badge" v-if="libraryStore.games.length === 0" style="background: var(--rose-dim);">RAW VAULT EMPTY</span>
        <span class="muted">{{ libraryStore.filteredGames.length }} games found ({{ libraryStore.games.length }} total)</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vault-sticky-controls {
  position: sticky;
  top: -1px;
  z-index: 100;
  background: var(--bg);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.vault-filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.02);
  margin-bottom: var(--space-2);
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.search-box input {
  flex: 1;
  background: transparent;
  border: none;
  color: white;
  font-size: 0.95rem;
  outline: none;
}

.filter-group { display: flex; gap: var(--space-4); flex-wrap: wrap; }
.filter-item { display: flex; flex-direction: column; gap: 4px; }
.filter-item label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-left: 2px; }

.filter-select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: white;
  font-size: 0.8rem;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  outline: none;
  cursor: pointer;
  min-width: 140px;
}

.vault-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-2);
  gap: var(--space-4);
  flex-wrap: wrap;
}

.control-group { display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap; }

.view-toggle {
  display: flex;
  background: rgba(0,0,0,0.2);
  padding: 3px;
  border-radius: var(--radius-md);
  gap: 2px;
}

.toggle-btn {
  padding: 6px 14px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.toggle-btn.active {
  background: var(--accent);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.sort-controls, .limit-controls { display: flex; align-items: center; gap: var(--space-2); }
.sort-controls .label, .limit-controls .label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }

.sort-select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: white;
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  outline: none;
  cursor: pointer;
}

.dir-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.vault-meta { font-size: 0.85rem; }
.badge { padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; color: white; }
</style>
