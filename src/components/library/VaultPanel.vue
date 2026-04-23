<template>
  <div class="vault-panel animated-fade-in">
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
          <button class="toggle-btn" :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'" title="Grid View">
            🔲 Grid
          </button>
          <button class="toggle-btn" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'" title="Database View">
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
          <button class="dir-btn glass-xs" @click="toggleSortOrder" :title="libraryStore.sortOrder === 'asc' ? 'Ascending' : 'Descending'">
            {{ libraryStore.sortOrder === 'asc' ? '↑' : '↓' }}
          </button>
        </div>
        <div class="limit-controls">
          <span class="label muted">Limit:</span>
          <select v-model="limit" class="sort-select glass-xs">
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
            <option :value="500">500</option>
          </select>
        </div>
      </div>
      
      <div class="vault-meta">
        <span class="muted">{{ libraryStore.filteredGames.length }} games found</span>
      </div>
    </div>

    <!-- Top Pagination -->
    <div class="pagination-controls mini glass-xs">
      <div class="page-info muted">
        Page <strong>{{ currentPage }}</strong> / {{ totalPages }}
      </div>
      <div class="page-nav">
        <button class="nav-btn btn-xs" :disabled="currentPage === 1" @click="prevPage">←</button>
        <button class="nav-btn btn-xs" :disabled="currentPage === totalPages" @click="nextPage">→</button>
      </div>
    </div>

    <div v-if="viewMode === 'grid'" class="vault-grid">
      <GameCard 
        v-for="game in displayedGames" 
        :key="game.id" 
        :game="game" 
        @click="selectedGame = game"
        @analyze="handleAnalyze(game)"
      />
    </div>

    <div v-else class="vault-list">
      <div class="list-header muted">
        <div class="col-result">Result</div>
        <div class="col-date">Date</div>
        <div class="col-players">Players</div>
        <div class="col-opening">Opening / Event</div>
        <div class="col-moves">Moves</div>
        <div class="col-tags">Source</div>
        <div class="col-actions"></div>
      </div>
      <GameRow
        v-for="game in displayedGames"
        :key="game.id"
        :game="game"
        @click="selectedGame = game"
        @analyze="handleAnalyze(game)"
      />
    </div>

    <!-- Pagination Controls -->
    <div class="pagination-controls glass-sm">
      <div class="page-info muted">
        Page <strong>{{ currentPage }}</strong> of {{ totalPages }}
      </div>
      
      <div class="page-nav">
        <button class="nav-btn" :disabled="currentPage === 1" @click="prevPage">
          ← Previous
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="p in visiblePages" 
            :key="p" 
            class="page-num" 
            :class="{ active: p === currentPage }"
            @click="currentPage = p"
          >
            {{ p }}
          </button>
        </div>

        <button class="nav-btn" :disabled="currentPage === totalPages" @click="nextPage">
          Next →
        </button>
      </div>
    </div>

    <!-- Details Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <GameDetailsModal 
          v-if="selectedGame" 
          :game="selectedGame" 
          @close="selectedGame = null"
          @analyze="handleAnalyze(selectedGame)"
        />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore, type LibraryGame } from '../../stores/libraryStore'
import GameCard from './GameCard.vue'
import GameRow from './GameRow.vue'
import GameDetailsModal from './GameDetailsModal.vue'

const router = useRouter()
const libraryStore = useLibraryStore()

const viewMode = ref<'grid' | 'list'>(localStorage.getItem('vault_view_mode') as any || 'grid')

watch(viewMode, (mode) => {
  localStorage.setItem('vault_view_mode', mode)
})

function handleAnalyze(game: LibraryGame) {
  router.push(`/analysis?id=${game.id}`)
}

function toggleSortOrder() {
  libraryStore.sortOrder = libraryStore.sortOrder === 'asc' ? 'desc' : 'asc'
}

const limit = ref(Number(localStorage.getItem('vault_limit')) || 20)
const currentPage = ref(1)
const selectedGame = ref<LibraryGame | null>(null)

watch(limit, (newLimit) => {
  localStorage.setItem('vault_limit', newLimit.toString())
  currentPage.value = 1 // Reset to first page when limit changes
})

// Watch filters to reset page
watch([() => libraryStore.searchQuery, () => libraryStore.filterResult, () => libraryStore.selectedTag, () => libraryStore.filterPerspective, () => libraryStore.sortBy, () => libraryStore.sortOrder], () => {
  currentPage.value = 1
})

const totalPages = computed(() => Math.ceil(libraryStore.filteredGames.length / limit.value) || 1)

const displayedGames = computed(() => {
  const start = (currentPage.value - 1) * limit.value
  return libraryStore.filteredGames.slice(start, start + limit.value)
})

const visiblePages = computed(() => {
  const range = 2
  const pages: number[] = []
  for (let i = Math.max(1, currentPage.value - range); i <= Math.min(totalPages.value, currentPage.value + range); i++) {
    pages.push(i)
  }
  return pages
})

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}
</script>

<style scoped>
.vault-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.vault-filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.02);
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

.filter-group {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-item label {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  margin-left: 2px;
}

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

.filter-select:hover { border-color: var(--accent); }

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

.control-group {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

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

.sort-controls, .limit-controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.sort-controls .label, .limit-controls .label {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

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

.dir-btn:hover { background: rgba(255, 255, 255, 0.1); border-color: var(--accent); }

.vault-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.vault-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.list-header {
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  gap: var(--space-4);
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-2);
}

/* Row column alignments matching GameRow.vue */
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

/* Pagination Styles */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-lg);
  margin-top: var(--space-6);
  background: rgba(255, 255, 255, 0.03);
}

.pagination-controls.mini {
  margin-top: 0;
  margin-bottom: var(--space-4);
  padding: var(--space-2) var(--space-4);
  justify-content: flex-end;
  gap: var(--space-4);
}

.pagination-controls.mini .page-info { font-size: 0.75rem; }
.btn-xs { padding: 4px 10px; font-size: 0.7rem; }

.page-nav {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.page-numbers {
  display: flex;
  gap: var(--space-2);
}

.page-num {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.page-num:hover { background: rgba(255, 255, 255, 0.1); color: white; }
.page-num.active { background: var(--accent); color: white; border-color: var(--accent); box-shadow: 0 0 12px rgba(139, 92, 246, 0.3); }

.nav-btn {
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: white;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.1); border-color: var(--accent); }
.nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.page-info { font-size: 0.85rem; }
.page-info strong { color: var(--accent-bright); }

/* Modal Transition */
.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }
</style>
