<template>
  <div class="vault-panel animated-fade-in">
    <VaultControls 
      v-model:viewMode="viewMode"
      v-model:limit="limit"
      :selectedCount="selectedIds.size"
      @toggleSortOrder="toggleSortOrder"
      @bulkDelete="handleBulkDelete"
      @clearSelection="clearSelection"
    />

    <!-- Top Pagination -->
    <VaultPagination 
      :currentPage="currentPage"
      :totalPages="totalPages"
      :visiblePages="visiblePages"
      mini
      @prev="currentPage--"
      @next="currentPage++"
      @update:page="currentPage = $event"
    />

    <div v-if="libraryStore.isImporting && libraryStore.games.length === 0" class="vault-loading">
      <div class="loader"></div>
      <p>Synchronizing Neural Vault...</p>
    </div>

    <div v-else-if="libraryStore.filteredGames.length === 0" class="vault-empty">
      <div class="empty-icon">📭</div>
      <h3>No Intelligence Records Found</h3>
      <p class="muted">Try adjusting your filters or import new PGN data.</p>
    </div>

    <VaultList 
      v-else
      :games="displayedGames"
      :selectedIds="selectedIds"
      @select="handleSelect"
      @analyze="handleAnalyze"
      @delete="handleDelete"
      @toggleSelection="toggleSelection"
      @setSort="setSort"
    />

    <!-- Bottom Pagination -->
    <VaultPagination 
      v-if="libraryStore.totalVaultGames > limit"
      :currentPage="currentPage"
      :totalPages="totalPages"
      :visiblePages="visiblePages"
      @prev="currentPage--"
      @next="currentPage++"
      @update:page="currentPage = $event"
    />

    <!-- Game Details Modal -->
    <GameDetailsModal 
      v-if="selectedGame" 
      :game="selectedGame" 
      @close="selectedGame = null"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLibraryStore, type LibraryGame } from '../../stores/libraryStore'
import { useUiStore } from '../../stores/uiStore'
import VaultControls from './VaultControls.vue'
import VaultList from './VaultList.vue'
import VaultPagination from './VaultPagination.vue'
import GameDetailsModal from './GameDetailsModal.vue'

const libraryStore = useLibraryStore()
const uiStore = useUiStore()

// View State
const viewMode = ref<'grid' | 'list'>('list')
const limit = ref(25)
const currentPage = ref(1)

// UI State
const selectedGame = ref<LibraryGame | null>(null)
const selectedIds = ref(new Set<string>())

/**
 * Selection Logic
 */
function handleSelect(game: LibraryGame) {
  selectedGame.value = game
}

function toggleSelection(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  // Force reactivity
  selectedIds.value = new Set(selectedIds.value)
}

function clearSelection() {
  selectedIds.value = new Set()
}

/**
 * Pagination Calculations
 */
const totalPages = computed(() => {
  return Math.ceil(libraryStore.filteredGames.length / limit.value) || 1
})

const visiblePages = computed(() => {
  const range = 2
  const pages = []
  for (let i = Math.max(1, currentPage.value - range); i <= Math.min(totalPages.value, currentPage.value + range); i++) {
    pages.push(i)
  }
  return pages
})

/**
 * Game Actions
 */
function handleAnalyze(game: LibraryGame) {
  // Logic to open analysis view or start background analysis
  console.log('Analyze game:', game.id)
}

function handleDelete(game: LibraryGame) {
  uiStore.confirm(
    'Delete Game?',
    'This will permanently remove the match from your Vault and Cloud. This action cannot be undone.',
    async () => {
      await libraryStore.deleteGame(game.id)
      selectedGame.value = null
      selectedIds.value.delete(game.id)
      selectedIds.value = new Set(selectedIds.value)
    },
    { icon: '🗑️', variant: 'danger', label: 'Yes, Delete' }
  )
}

/**
 * Bulk Actions
 */
function handleBulkDelete() {
  const count = selectedIds.value.size
  if (count === 0) return

  uiStore.confirm(
    `Delete ${count} Games?`,
    `You are about to permanently remove ${count} games from your vault. This action is irreversible.`,
    async () => {
      await libraryStore.deleteGames(Array.from(selectedIds.value))
      clearSelection()
    },
    { icon: '🗑️', variant: 'danger', label: `Delete ${count} Items` }
  )
}

function setSort(field: string) {
  if (libraryStore.sortBy === field) {
    libraryStore.sortOrder = libraryStore.sortOrder === 'asc' ? 'desc' : 'asc'
  } else {
    libraryStore.sortBy = field
    libraryStore.sortOrder = 'desc'
  }
}

function toggleSortOrder() {
  libraryStore.sortOrder = libraryStore.sortOrder === 'asc' ? 'desc' : 'asc'
}

const displayedGames = computed(() => {
  const start = (currentPage.value - 1) * limit.value
  return libraryStore.filteredGames.slice(start, start + limit.value)
})

onMounted(async () => {
  if (libraryStore.games.length === 0) {
    await libraryStore.loadGames()
  }
})
</script>

<style scoped>
.vault-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-4);
  min-height: 600px;
}

.vault-loading, .vault-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--border);
  text-align: center;
}

.loader {
  width: 40px;
  height: 40px;
  border: 3px solid var(--accent-dim);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-4);
}

.empty-icon { font-size: 3rem; margin-bottom: var(--space-4); opacity: 0.5; }

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
