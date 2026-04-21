<template>
  <div class="library-view page-container" :class="{ 'right-hidden': !rightVisible }">
    <!-- Main Content: Vault & Constellation -->
    <main class="library-main">
      <header class="library-header glass-sm">
        <div class="header-left">
          <div class="title-group">
            <h1>Knightfall Archive</h1>
            <p class="muted">Laboratory-grade chess study</p>
          </div>
          <div class="header-stats">
            <span class="badge badge-accent">{{ libraryStore.games.length }} Games</span>
            <span class="badge">{{ ECO_COUNT }} Openings</span>
          </div>
        </div>
        
        <nav class="library-tabs">
          <button v-for="tab in tabs" :key="tab.id"
            class="tab-btn" :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id">
            {{ tab.icon }} {{ tab.label }}
          </button>
        </nav>

        <div class="header-right">
          <button v-if="!rightVisible" class="btn btn-primary btn-sm" @click="rightVisible = true">
            Downloadable Archives
          </button>
        </div>
      </header>

      <div class="main-content-area">
        <Transition name="fade-slide" mode="out-in">
          <div :key="activeTab" class="tab-content">
            <VaultPanel v-if="activeTab === 'vault'" />
            <ConstellationPanel v-else-if="activeTab === 'constellation'" />
          </div>
        </Transition>
      </div>
    </main>

    <!-- Right Sidebar: The Laboratory -->
    <aside class="sidebar right-sidebar">
      <div class="lab-wrapper">
        <button class="toggle-btn right" @click="rightVisible = false">▶</button>
        <LibraryLab />
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useLibraryStore } from '../stores/libraryStore'
import VaultPanel from '../components/library/VaultPanel.vue'
import ConstellationPanel from '../components/library/ConstellationPanel.vue'
import LibraryLab from '../components/library/LibraryLab.vue'

const libraryStore = useLibraryStore()
const activeTab = ref<'vault' | 'constellation'>('vault')
const rightVisible = ref(true)

const tabs = [
  { id: 'vault', label: 'Vault', icon: '🗄️' },
  { id: 'constellation', label: 'Constellation', icon: '✨' }
] as const

watch(activeTab, (newTab) => {
    libraryStore.isConstellationActive = (newTab === 'constellation')
}, { immediate: true })

const ECO_COUNT = computed(() => {
    const ecos = new Set(libraryStore.games.map(g => g.eco))
    return ecos.size
})

onMounted(() => {
    // These are heavy background tasks that process 7500+ games.
    // We only trigger them here so they don't fight with the Engine while in the Analysis Lab.
    libraryStore.repairVaultMetadata() 
    libraryStore.syncCloudGames()
})
</script>

<style shadow scoped>
.library-view {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-6);
  height: calc(100vh - 120px);
  max-width: 1600px;
  margin: 0 auto;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0 var(--space-4);
}

.library-view.right-hidden { grid-template-columns: 1fr 0; gap: 0; }

.sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  overflow: hidden;
  transition: all 0.4s;
}

.right-hidden .right-sidebar { opacity: 0; pointer-events: none; transform: translateX(20px); }

.toggle-btn {
  background: none; border: none; color: var(--text-muted);
  cursor: pointer; padding: 4px; font-size: 0.8rem;
}
.toggle-btn:hover { color: var(--accent); }

.library-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-width: 0;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-lg);
}

.header-left { display: flex; align-items: center; gap: var(--space-8); }
.header-stats { display: flex; gap: var(--space-2); }
.title-group h1 { margin: 0; font-size: 1.5rem; }

.library-tabs {
  display: flex;
  gap: 4px;
  background: rgba(0,0,0,0.2);
  padding: 4px;
  border-radius: var(--radius-md);
}

.tab-btn {
  padding: 8px 16px; border-radius: var(--radius-sm);
  background: transparent; border: none; color: var(--text-secondary);
  font-weight: 600; cursor: pointer; transition: all 0.2s ease;
  display: flex; align-items: center; gap: 8px; font-size: 0.85rem;
}
.tab-btn.active { background: var(--accent); color: white; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2); }

.main-content-area {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.lab-wrapper { position: relative; height: 100%; }
.toggle-btn.right { position: absolute; top: 12px; right: 12px; z-index: 10; }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-20px); }

@media (max-width: 1200px) {
  .library-view { grid-template-columns: 1fr; }
  .sidebar { display: none; }
}
</style>
