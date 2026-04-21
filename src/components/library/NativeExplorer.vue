<template>
  <div class="native-explorer glass-card">
    <div class="explorer-header">
      <div class="path-nav">
        <button class="nav-btn" @click="goUp" :disabled="isAtRoot">
          <span class="icon">⬆️</span>
        </button>
        <div class="current-path neon-text-sm">{{ currentPath }}</div>
      </div>
      <div class="explorer-actions">
        <button class="btn btn-ghost btn-xs" @click="loadDirectory(currentPath)">
          🔄 Refresh
        </button>
      </div>
    </div>

    <div class="explorer-list custom-scrollbar">
      <TransitionGroup name="list-stagger">
        <div 
          v-for="entry in entries" 
          :key="entry.full_path"
          class="explorer-item glass-xs"
          :class="{ 'is-dir': entry.is_dir, 'is-pgn': entry.name.endsWith('.pgn') }"
          @click="handleEntryClick(entry)"
        >
          <span class="file-icon">{{ entry.is_dir ? '📁' : '📄' }}</span>
          <span class="file-name">{{ entry.name }}</span>
          <div v-if="entry.name.endsWith('.pgn')" class="import-badge">
            <button class="btn btn-primary btn-xs" @click.stop="importPgn(entry.full_path)">
              IMPORT
            </button>
          </div>
        </div>
      </TransitionGroup>

      <div v-if="entries.length === 0" class="empty-state">
        <p class="muted small">No files found or directory inaccessible.</p>
      </div>
    </div>

    <div v-if="importing" class="import-overlay">
       <div class="spinner"></div>
       <div class="status">Ingesting Master Archive...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { useUiStore } from '../../stores/uiStore'

interface FileEntry {
  name: String;
  is_dir: boolean;
  full_path: string;
}

const uiStore = useUiStore()
const currentPath = ref('/home') // Starting at home for Linux
const entries = ref<FileEntry[]>([])
const importing = ref(false)

const isAtRoot = computed(() => currentPath.value === '/' || currentPath.value === '')

async function loadDirectory(path: string) {
  try {
    const results = await invoke<FileEntry[]>('list_directory', { path })
    entries.value = results
    currentPath.value = path
  } catch (err: any) {
    uiStore.addToast(`Failed to load directory: ${err}`, 'error')
  }
}

function handleEntryClick(entry: FileEntry) {
  if (entry.is_dir) {
    loadDirectory(entry.full_path)
  }
}

function goUp() {
  const parts = currentPath.value.split('/')
  parts.pop()
  const parent = parts.join('/') || '/'
  loadDirectory(parent)
}

async function importPgn(path: string) {
  try {
    importing.value = true
    uiStore.addToast('Started high-speed PGN ingestion...', 'info')
    
    // Call our native Rust importer
    const count = await invoke<number>('import_pgn', { path })
    
    uiStore.addToast(`Successfully imported ${count} games into DuckDB!`, 'success')
  } catch (err: any) {
    uiStore.addToast(`Import failed: ${err}`, 'error')
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  loadDirectory(currentPath.value)
})
</script>

<style scoped>
.native-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
}

.explorer-header {
  padding: var(--space-4);
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.path-nav {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  overflow: hidden;
}

.current-path {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--accent-bright);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.explorer-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.explorer-item {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.explorer-item:hover {
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.2);
  transform: translateX(4px);
}

.explorer-item.is-dir .file-icon { filter: sepia(1) saturate(5) hue-rotate(220deg); }
.explorer-item.is-pgn { border-left: 3px solid var(--accent); }

.file-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.explorer-item:hover .file-name { color: var(--text-primary); }

.import-badge { opacity: 0; transition: opacity 0.2s; }
.explorer-item:hover .import-badge { opacity: 1; }

.import-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-6);
  z-index: 100;
}

.spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(139,92,246,0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.status { color: var(--accent-bright); font-weight: 700; letter-spacing: 1px; }

@keyframes spin { to { transform: rotate(360deg); } }

/* Stagger Animation */
.list-stagger-enter-active { transition: all 0.3s ease; }
.list-stagger-enter-from { opacity: 0; transform: translateY(10px); }
</style>
