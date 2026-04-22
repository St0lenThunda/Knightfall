<template>
  <div class="vault-panel animated-fade-in">
    <div class="vault-grid">
      <GameCard 
        v-for="game in displayedGames" 
        :key="game.id" 
        :game="game" 
        @click="selectedGame = game"
      />
    </div>

    <!-- Infinite Scroll Sentinel -->
    <div ref="scrollSentinel" class="scroll-sentinel">
      <div v-if="hasMore" class="loading-more">
        <div class="spinner-sm"></div>
        <span>Loading more games...</span>
      </div>
      <div v-else class="all-loaded muted">
        ✨ You've reached the end of your collection
      </div>
    </div>

    <!-- Details Modal -->
    <Transition name="modal">
      <GameDetailsModal 
        v-if="selectedGame" 
        :game="selectedGame" 
        @close="selectedGame = null"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLibraryStore, type LibraryGame } from '../../stores/libraryStore'
import GameCard from './GameCard.vue'
import GameDetailsModal from './GameDetailsModal.vue'

const libraryStore = useLibraryStore()

const limit = ref(40)
const selectedGame = ref<LibraryGame | null>(null)
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
})
</script>

<style scoped>
.vault-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.vault-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.scroll-sentinel {
  padding: var(--space-8) 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-more {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-muted);
  font-weight: 600;
}

.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.all-loaded {
  font-size: 0.85rem;
  font-weight: 500;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Modal Transition */
.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }
</style>
