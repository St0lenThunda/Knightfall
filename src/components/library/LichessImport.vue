<template>
  <div class="lichess-import glass-sm p-6 rounded-xl">
    <div class="import-header mb-6">
      <div class="icon-bg">
        <img src="https://lichess1.org/assets/_H8m9X6/logo/lichess-favicon-256.png" alt="Lichess" class="lichess-logo" />
      </div>
      <div class="header-text">
        <h3 class="text-xl font-bold">Lichess Data Ingestion</h3>
        <p class="text-sm text-muted">Sync your games, clocks, and evaluations for DNA analysis.</p>
      </div>
    </div>

    <div class="import-form flex gap-3">
      <div class="input-group flex-1">
        <input 
          v-model="username" 
          type="text" 
          placeholder="Lichess Username"
          class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent outline-none transition-all"
          :disabled="libraryStore.isImporting"
          @keyup.enter="handleImport"
        />
      </div>
      <button 
        class="btn btn-primary px-6" 
        :disabled="!username || libraryStore.isImporting"
        @click="handleImport"
      >
        <span v-if="libraryStore.isImporting" class="spinner-tiny mr-2"></span>
        {{ libraryStore.isImporting ? 'Syncing...' : 'Sync Games' }}
      </button>
    </div>

    <!-- Progress State -->
    <Transition name="fade">
      <div v-if="libraryStore.isImporting" class="mt-6">
        <div class="flex justify-between text-xs mb-2 text-muted uppercase font-bold tracking-wider">
          <span>Extracting Telemetry</span>
          <span>{{ libraryStore.importProgress }}%</span>
        </div>
        <div class="progress-bar-bg h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            class="progress-fill h-full bg-accent shadow-[0_0_10px_#8b5cf6] transition-all duration-300"
            :style="{ width: libraryStore.importProgress + '%' }"
          ></div>
        </div>
      </div>
    </Transition>

    <div v-if="!libraryStore.isImporting && lastImportCount > 0" class="mt-4 text-sm text-green-400 font-medium">
      ✓ Successfully ingested {{ lastImportCount }} games with full telemetry.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLibraryStore } from '../../stores/libraryStore'

const libraryStore = useLibraryStore()
const username = ref(localStorage.getItem('knightfall_lichess_username') || '')
const lastImportCount = ref(0)

async function handleImport() {
  if (!username.value) return
  
  localStorage.setItem('knightfall_lichess_username', username.value)
  
  const beforeCount = libraryStore.games.length
  await libraryStore.importFromLichess(username.value, 15) // Limit to 15 for now
  const afterCount = libraryStore.games.length
  
  lastImportCount.value = afterCount - beforeCount
}
</script>

<style scoped>
.lichess-import {
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.icon-bg {
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  box-shadow: 0 4px 20px rgba(255, 255, 255, 0.1);
}

.lichess-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.import-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.spinner-tiny {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: white;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
