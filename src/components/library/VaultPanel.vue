<template>
  <div class="vault-panel animated-fade-in">
    <VaultControls 
      v-model:viewMode="viewMode"
      :selectedCount="selectedIds.size"
      @toggleSortOrder="toggleSortOrder"
      @bulkDelete="handleBulkDelete"
      @clearSelection="clearSelection"
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
      :games="libraryStore.filteredGames"
      :selectedIds="selectedIds"
      @select="handleSelect"
      @analyze="handleAnalyze"
      @delete="handleDelete"
      @toggleSelection="toggleSelection"
      @setSort="setSort"
    />

    <!-- Infinite Scroll Trigger -->
    <div v-if="libraryStore.hasMoreGames" ref="loadMoreTrigger" class="load-more">
      <div class="mini-loader"></div>
      <span>Synthesizing more records...</span>
    </div>

    <div v-else-if="libraryStore.games.length > 0" class="vault-end">
      <span>End of Intelligence Vault</span>
    </div>

    <!-- Game Details Modal -->
    <GameDetailsModal 
      v-if="selectedGame" 
      :game="selectedGame" 
      @close="selectedGame = null"
      @analyze="handleAnalyze(selectedGame!)"
      @synthesize="libraryStore.analyzeGame(selectedGame!.id)"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLibraryStore, type LibraryGame } from '../../stores/libraryStore'
import { useUiStore } from '../../stores/uiStore'
import VaultControls from './VaultControls.vue'
import VaultList from './VaultList.vue'
import GameDetailsModal from './GameDetailsModal.vue'
import { useVaultActions } from '../../composables/library/useVaultActions'

const libraryStore = useLibraryStore()
const uiStore = useUiStore()
const { handleAnalyze } = useVaultActions()

// View State
const viewMode = ref<'grid' | 'list'>('list')
const loadMoreTrigger = ref<HTMLElement | null>(null)
const isFetchingMore = ref(false)

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
 * Game Actions (Delegated to Composable)
 */
// handleAnalyze is handled by the composable destructuring above

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

/**
 * Infinite Scroll Logic
 */
let observer: IntersectionObserver | null = null

function setupObserver() {
  if (observer) observer.disconnect()
  
  observer = new IntersectionObserver(async ([entry]) => {
    if (entry.isIntersecting && libraryStore.hasMoreGames && !isFetchingMore.value) {
      isFetchingMore.value = true
      await libraryStore.loadMoreGames()
      isFetchingMore.value = false
    }
  }, { threshold: 0.1 })

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
}

onMounted(async () => {
  if (libraryStore.games.length === 0) {
    await libraryStore.loadGames()
  }
  setupObserver()
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

.load-more, .vault-end {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-8);
  color: var(--text-muted);
  font-size: var(--font-sm);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.mini-loader {
  width: 16px;
  height: 16px;
  border: 2px solid var(--accent-dim);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
