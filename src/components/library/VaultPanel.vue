<template>
  <div class="vault-panel">
    <div class="vault-controls glass-sm">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" v-model="libraryStore.searchQuery" placeholder="Search by player or event..." />
      </div>
      
      <div class="filters">
        <div class="results-badge glass-xs">
          {{ libraryStore.filteredGames.length }} <span class="muted">results</span>
        </div>
        <select v-model="libraryStore.selectedTag">
          <option value="all">All Tags</option>
          <option v-for="tag in libraryStore.allTags" :key="tag" :value="tag">{{ tag }}</option>
        </select>
        <select v-model="libraryStore.filterResult">
          <option value="all">All Results</option>
          <option value="1-0">White Wins</option>
          <option value="0-1">Black Wins</option>
          <option value="1/2-1/2">Draws</option>
        </select>
        <div class="sort-group">
          <select v-model="libraryStore.sortBy">
            <option value="addedAt">Added Date</option>
            <option value="date">Game Date</option>
            <option value="movesCount">Move Count</option>
            <option value="player">Player Name</option>
            <option value="opening">Opening (ECO)</option>
          </select>
          <button class="sort-dir-btn" @click="libraryStore.sortOrder = libraryStore.sortOrder === 'asc' ? 'desc' : 'asc'">
            {{ libraryStore.sortOrder === 'asc' ? '↑' : '↓' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="libraryStore.filteredGames.length === 0" class="empty-state glass">
      <div class="empty-icon">📂</div>
      <h3>No games found</h3>
      <p class="muted">Try adjusting your filters or import new PGNs.</p>
    </div>

    <div v-else class="games-grid compact">
      <GameCard 
        v-for="game in displayedGames" 
        :key="game.id" 
        :game="game"
        compact
        @click="selectedGame = game"
        @analyze="openInAnalysis(game)"
      />
    </div>
    
    <!-- Infinite Scroll Sentinel -->
    <div v-if="hasMore" ref="scrollSentinel" class="scroll-sentinel">
       <div class="mini-spinner"></div>
    </div>

    <!-- Selection Mission Control Modal -->
    <Transition name="scale">
      <GameDetailsModal 
        v-if="selectedGame" 
        :game="selectedGame" 
        @close="selectedGame = null"
        @analyze="openInAnalysis(selectedGame)"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore } from '../../stores/libraryStore'
import { useGameStore } from '../../stores/gameStore'
import GameCard from './GameCard.vue'
import GameDetailsModal from './GameDetailsModal.vue'

const libraryStore = useLibraryStore()
const gameStore = useGameStore()
const router = useRouter()

const limit = ref(40)
const selectedGame = ref<any>(null)
const scrollSentinel = ref<HTMLElement | null>(null)

const displayedGames = computed(() => libraryStore.filteredGames.slice(0, limit.value))
const hasMore = computed(() => limit.value < libraryStore.filteredGames.length)

// INFINITE SCROLL Implementation
onMounted(() => {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore.value) {
            limit.value += 20
        }
    }, { threshold: 0.5 })

    if (scrollSentinel.value) observer.observe(scrollSentinel.value)
    
    // Auto-reconnect if sentinel reappears after limit increase
    watch(scrollSentinel, (newVal) => {
        if (newVal) observer.observe(newVal)
    })
})

function openInAnalysis(game: any) {
    gameStore.loadPgn(game.pgn, 'analysis', game.id)
    router.push('/analysis')
    selectedGame.value = null
}
</script>

<style scoped>
.vault-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  height: 100%;
}

.vault-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  gap: var(--space-4);
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--border);
}

.search-box {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.search-box input {
  width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 12px 8px 36px;
  color: var(--text-primary);
  outline: none;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.search-box input:focus { border-color: var(--accent); background: rgba(255,255,255,0.05); }

.filters {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.results-badge {
  padding: 4px 10px;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.filters select {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  outline: none;
  font-size: 0.85rem;
  cursor: pointer;
}

.sort-group {
  display: flex;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-left: auto;
}

.sort-group select { border: none; padding: 6px 10px; border-right: 1px solid var(--border); border-radius: 0; }
.sort-dir-btn {
  background: none;
  border: none;
  color: var(--text-primary);
  padding: 0 10px;
  cursor: pointer;
  font-weight: 900;
  transition: background 0.2s;
}
.sort-dir-btn:hover { background: rgba(255,255,255,0.05); }

/* High-Density Grid */
.games-grid.compact {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-4);
  padding: 2px;
}

.empty-state {
  padding: var(--space-20);
  text-align: center;
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  margin-top: var(--space-10);
}
.empty-icon { font-size: 4rem; margin-bottom: var(--space-4); opacity: 0.3; }

.scroll-sentinel {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-10);
}

.mini-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.1);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Modal Transitions */
.scale-enter-active, .scale-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.scale-enter-from, .scale-leave-to { opacity: 0; transform: scale(0.9) translateY(20px); }
</style>
