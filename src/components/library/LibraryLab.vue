<template>
  <div class="library-lab glass-sm">
    <div class="lab-header">
      <span class="icon">🔬</span>
      <div class="title-group">
        <h3>Other Sources</h3>
        <p class="muted">Master collections & Custom imports</p>
      </div>
    </div>

    <div class="lab-tabs">
      <button v-for="t in tabs" :key="t.id" 
              class="tab-btn" :class="{ active: activeTab === t.id }"
              @click="activeTab = t.id">
        {{ t.icon }}
      </button>
    </div>

    <div class="tab-content">
      <!-- Tab 1: Master Collections -->
      <div v-if="activeTab === 'library'" class="library-view animated">
        <div class="search-bar glass-xs">
          <input type="text" v-model="libSearch" placeholder="Search masters..." />
        </div>

        <div class="lib-list">
          <div
            v-for=" item in filteredLib "
            :key="item.id"
            class="lib-item glass-xs"
            :title="item.description"
          >
            <div class="item-meta">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span
                  class="pill"
                  :class="item.category"
                >{{ item.category }}</span>
                <span class="name">{{ item.name }}</span>
              </div>
              <div class="source-info">
                <span class="badge badge-accent"> {{ item.sourceWebsite || 'Local' }}</span>
              </div>
            </div>
            <button 
              class="import-mini-btn" 
              :disabled="libraryStore.isImporting"
              @click="importCurated(item)"
              title="Instant Import"
            >
              {{ libraryStore.isImporting ? '...' : '📥' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tab 2: File Upload -->
      <div v-if="activeTab === 'file'" class="file-view animated">
        <div 
          class="dropzone glass-xs"
          :class="{ dragging: isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleFileDrop"
        >
          <span class="icon">📂</span>
          <p>Drop PGN/ZIP</p>
          <button class="btn btn-ghost btn-xs" @click="($refs.fileInput as HTMLInputElement).click()">Select</button>
          <input type="file" ref="fileInput" hidden @change="handleFileSelect" accept=".pgn,.zip" />
        </div>
      </div>

      <!-- Tab 3: URL / Text -->
      <div v-if="activeTab === 'manual'" class="manual-view animated">
        <div class="input-stack">
          <div class="field">
            <label>URL Import</label>
            <div class="row">
              <input type="text" v-model="importUrl" placeholder="PGN/ZIP Link" />
              <button @click="importUrlAction">Fetch</button>
            </div>
          </div>
          <div class="field">
            <label>PGN Snippet</label>
            <textarea v-model="pgnText" placeholder="Paste PGN here..."></textarea>
            <button class="btn btn-accent btn-xs" @click="importPgnTextAction">Process</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Processing Overlay -->
    <div v-if="libraryStore.isImporting" class="lab-loader glass-lg">
      <div class="spinner"></div>
      <span class="progress-text">{{ libraryStore.importProgress }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { TOP_50_COLLECTIONS } from '../../data/curatedCollections'
import { useLibraryStore } from '../../stores/libraryStore'
import { useUiStore } from '../../stores/uiStore'

const libraryStore = useLibraryStore()
const uiStore = useUiStore()

const activeTab = ref('library')
const libSearch = ref('')
const isDragging = ref(false)
const importUrl = ref('')
const pgnText = ref('')

const tabs = [
  { id: 'library', icon: '🏆', label: 'Masters' },
  { id: 'file',    icon: '📂', label: 'Files' },
  { id: 'manual',  icon: '⌨️', label: 'Custom' }
]

const filteredLib = computed(() => {
    return TOP_50_COLLECTIONS.filter(item => 
        item.name.toLowerCase().includes(libSearch.value.toLowerCase())
    )
})

async function importCurated(item: any) {
    const beforeCount = libraryStore.games.length
    uiStore.addToast(`Importing ${item.name}...`, 'info')
    await libraryStore.importFromUrl(item.url, item.name)
    const afterCount = libraryStore.games.length
    const diff = afterCount - beforeCount
    uiStore.addToast(`Success! Added ${diff} games to ${item.name}.`, 'success')
}

async function handleFileDrop(e: DragEvent) {
    isDragging.value = false
    const file = e.dataTransfer?.files[0]
    if (file) processFile(file)
}

function handleFileSelect(e: any) {
    const file = e.target.files[0]
    if (file) processFile(file)
}

async function processFile(file: File) {
    const beforeCount = libraryStore.games.length
    if (file.name.toLowerCase().endsWith('.zip')) {
        await libraryStore.importPgnZip(file, false, ['Upload'])
    } else {
        const text = await file.text()
        await libraryStore.importPgn(text, false, ['Upload'])
    }
    const afterCount = libraryStore.games.length
    const diff = afterCount - beforeCount
    uiStore.addToast(`Import complete! ${diff} games added.`, 'success')
}

async function importUrlAction() {
    if (!importUrl.value) return
    const beforeCount = libraryStore.games.length
    await libraryStore.importFromUrl(importUrl.value, 'Web Import')
    importUrl.value = ''
    const afterCount = libraryStore.games.length
    const diff = afterCount - beforeCount
    uiStore.addToast(`URL Import complete: ${diff} games added.`, 'success')
}

async function importPgnTextAction() {
    if (!pgnText.value) return
    const beforeCount = libraryStore.games.length
    await libraryStore.importPgnText(pgnText.value, 'manual-snippet')
    pgnText.value = ''
    const afterCount = libraryStore.games.length
    const diff = afterCount - beforeCount
    uiStore.addToast(`Snippet parsed! ${diff} games added.`, 'success')
}
</script>

<style scoped>
.library-lab {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;
}

.lab-header {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  align-items: center;
}
.lab-header h3 { margin: 0; font-size: 1rem; color: var(--accent-bright); }
.lab-header .icon { font-size: 1.5rem; }

.lab-tabs {
  display: flex;
  background: rgba(0,0,0,0.3);
  border-radius: var(--radius-md);
  padding: 4px;
  margin-bottom: var(--space-4);
}
.tab-btn {
  flex: 1;
  background: none; border: none; padding: 8px;
  cursor: pointer; opacity: 0.5; transition: all 0.2s;
  border-radius: var(--radius-sm);
}
.tab-btn.active { opacity: 1; background: rgba(255,255,255,0.1); }

.tab-content { flex: 1; overflow-y: auto; }

.search-bar input {
  width: 100%; background: none; border: none; color: white;
  padding: 8px; font-size: 0.8rem; outline: none;
}

.lib-list { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
.lib-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; border-radius: var(--radius-sm);
}
.item-meta { display: flex; flex-direction: column; gap: 2px; }
.name { font-size: 0.8rem; font-weight: 600; }
.pill { font-size: 0.5rem; text-transform: uppercase; font-weight: 800; }
.pill.players { color: #a78bfa; }
.pill.openings { color: #2dd4bf; }
.pill.events { color: #fbbf24; }
.pill.narrative { color: #f43f5e; background: rgba(244, 63, 94, 0.1); }

.source-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.source-url {
  font-size: 0.65rem;
  color: var(--accent);
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.source-desc {
  font-size: 0.7rem;
  color: var(--text-muted);
  line-height: 1.2;
  max-width: 220px;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.import-mini-btn {
  background: none; border: none; cursor: pointer; opacity: 0.7;
}
.import-mini-btn:hover { opacity: 1; transform: scale(1.1); }

.dropzone {
  height: 160px; border: 2px dashed var(--border); border-radius: var(--radius-md);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; gap: 8px; transition: all 0.2s;
}
.dropzone.dragging { border-color: var(--accent); background: rgba(139, 92, 246, 0.05); }

.input-stack { display: flex; flex-direction: column; gap: var(--space-4); }
.field label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; display: block; }
.row { display: flex; gap: 4px; }
.row input { flex: 1; background: var(--bg-surface); border: 1px solid var(--border); color: white; padding: 4px 8px; font-size: 0.8rem; border-radius: 4px; }
.row button { background: var(--accent); border: none; color: white; font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 4px; cursor: pointer; }
textarea { width: 100%; height: 100px; background: var(--bg-surface); border: 1px solid var(--border); color: white; padding: 8px; font-size: 0.75rem; border-radius: 4px; resize: none; font-family: monospace; }

.lab-loader {
  position: fixed; 
  inset: 0; 
  background: rgba(0,0,0,0.85);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  backdrop-filter: blur(8px);
  z-index: 10000;
}
.spinner {
  width: 30px; height: 30px; border: 2px solid rgba(255,255,255,0.1);
  border-top-color: var(--accent); border-radius: 50%;
  animation: spin 1s linear infinite;
}
.progress-text { margin-top: 12px; font-size: 0.85rem; font-weight: 800; color: var(--accent-bright); }
@keyframes spin { to { transform: rotate(360deg); } }

.animated { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
