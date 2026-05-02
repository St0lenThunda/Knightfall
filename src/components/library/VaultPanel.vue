<template>
  <div class="vault-panel animated-fade-in">
    <!-- Main Controls & Filters -->
    <VaultControls 
      v-model:viewMode="viewMode"
      v-model:limit="limit"
      @toggleSortOrder="toggleSortOrder"
    />

    <!-- Top Pagination -->
    <VaultPagination 
      mini
      :currentPage="currentPage"
      :totalPages="totalPages"
      :visiblePages="visiblePages"
      @prev="prevPage"
      @next="nextPage"
      @update:page="currentPage = $event"
    />

    <!-- Main Content -->
    <div v-if="viewMode === 'grid'" class="vault-grid">
      <GameCard 
        v-for="(game, index) in displayedGames" 
        :key="game.id + '-' + index" 
        v-memo="[game.id, game.tags?.length]"
        :game="game" 
        @click="selectedGame = game"
        @analyze="handleAnalyze(game)"
        @delete="handleDelete(game)"
      />
    </div>

    <VaultList 
      v-else
      :games="displayedGames"
      @select="selectedGame = $event"
      @analyze="handleAnalyze"
      @delete="handleDelete"
      @setSort="setSort"
    />

    <!-- Bottom Pagination -->
    <VaultPagination 
      :currentPage="currentPage"
      :totalPages="totalPages"
      :visiblePages="visiblePages"
      @prev="prevPage"
      @next="nextPage"
      @update:page="currentPage = $event"
    />

    <!-- Lazy Loading (Vault Overflow) -->
    <div v-if="libraryStore.hasMoreGames" class="vault-overflow glass-sm">
      <div class="overflow-text">
        <span class="muted">Showing {{ libraryStore.games.length }} of {{ libraryStore.totalVaultGames }} games in your vault.</span>
      </div>
      <button class="btn btn-primary btn-sm" :disabled="libraryStore.isImporting" @click="libraryStore.loadMoreGames">
        {{ libraryStore.isImporting ? 'Syncing...' : 'Load 500 More' }}
      </button>
    </div>

    <!-- Modals -->
    <Teleport to="body">
      <Transition name="modal">
        <GameDetailsModal 
          v-if="selectedGame" 
          :game="selectedGame" 
          @close="selectedGame = null"
          @analyze="handleAnalyze(selectedGame)"
          @delete="handleDelete(selectedGame)"
        />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore, type LibraryGame } from '../../stores/libraryStore'
import { useUiStore } from '../../stores/uiStore'

// Pillar Components
import GameCard from './GameCard.vue'
import GameDetailsModal from './GameDetailsModal.vue'
import VaultControls from './VaultControls.vue'
import VaultList from './VaultList.vue'
import VaultPagination from './VaultPagination.vue'

// Pillar Composables
import { useVaultFilters } from '../../composables/library/useVaultFilters'
import { useVaultPagination } from '../../composables/library/useVaultPagination'

const router = useRouter()
const libraryStore = useLibraryStore()
const uiStore = useUiStore()

// Initialize Pillar Logic
const { viewMode, limit, toggleSortOrder, setSort } = useVaultFilters()
const { currentPage, totalPages, displayedGames, visiblePages, nextPage, prevPage } = useVaultPagination(limit)

// UI State
const selectedGame = ref<LibraryGame | null>(null)

/**
 * Game Actions
 */
function handleAnalyze(game: LibraryGame) {
  router.push(`/analysis?id=${game.id}`)
}

/**
 * Triggers the deletion flow via the global UI store.
 */
function handleDelete(game: LibraryGame) {
  uiStore.confirm(
    'Delete Game?',
    'This will permanently remove the match from your Vault and Cloud. This action cannot be undone.',
    async () => {
      await libraryStore.deleteGame(game.id)
      selectedGame.value = null
    },
    { icon: '🗑️', variant: 'danger', label: 'Yes, Delete' }
  )
}
</script>

<style scoped>
.vault-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.vault-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.vault-overflow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-lg);
  margin-top: var(--space-4);
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 1px dashed rgba(139, 92, 246, 0.2);
}

.overflow-text { font-size: 0.85rem; font-weight: 500; }

.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }
</style>
