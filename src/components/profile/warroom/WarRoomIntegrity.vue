<script setup lang="ts">
import { useLibraryStore } from '../../../stores/libraryStore'
import { useUiStore } from '../../../stores/uiStore'

const libraryStore = useLibraryStore()
const uiStore = useUiStore()

defineEmits(['deduplicateVault', 'showWipeConfirm'])

async function handleIntegrityAction(actionFn: () => Promise<any>, successMsg: string) {
  try {
    await actionFn()
    uiStore.addToast(successMsg, 'success')
  } catch (err: any) {
    uiStore.addToast(`Operation failed: ${err.message || 'Unknown error'}`, 'error')
    libraryStore.isProcessingIntegrity = false // Fallback to clear overlay
  }
}
</script>

<template>
  <div class="glass card-v3 mt-6">
    <div class="card-header">
      <h4>Data Integrity & Maintenance</h4>
    </div>
    <div class="integrity-grid mt-6">
      <div class="integrity-item">
        <button class="btn btn-ghost btn-sm" @click="handleIntegrityAction(() => libraryStore.syncCloudGames(), 'Cloud synchronization complete.')">🔄 Refresh Cloud DNA</button>
        <p class="muted">Synchronize your local library with the cloud. <br/><em>Use this if you played games on another device and they aren't showing up here.</em></p>
      </div>
      
      <div class="integrity-item">
        <button class="btn btn-ghost btn-sm" @click="handleIntegrityAction(() => libraryStore.pushLocalGamesToCloud(), 'Vault successfully pushed to cloud.')">☁️ Push Vault to Cloud</button>
        <p class="muted">Back up your local collection to Supabase. <br/><em>Use this if you just imported a large PGN file locally and want it saved to your account.</em></p>
      </div>

      <div class="integrity-item">
        <button class="btn btn-ghost btn-sm" @click="handleIntegrityAction(() => libraryStore.repairVaultMetadata(), 'Metadata sanitization complete.')">🛡️ Sanitize Metadata</button>
        <p class="muted">Re-validate all metadata and PGN headers. <br/><em>Use this if you notice missing Elo ratings, incorrect dates, or 'Unknown' openings in your vault.</em></p>
      </div>

      <div class="integrity-item">
        <button class="btn btn-ghost btn-sm" @click="handleIntegrityAction(() => libraryStore.repairVaultIdentity(), 'Identity repair complete. Tags updated.')">🧬 Repair Identity</button>
        <p class="muted">Recalculates 'My Games' tags based on your profile. <br/><em>Use this if your 'Weakness DNA' is polluted with professional games you didn't actually play.</em></p>
      </div>

      <div class="integrity-item">
        <button class="btn btn-ghost btn-sm" @click="$emit('deduplicateVault')">🧹 Clean Duplicates</button>
        <p class="muted">Scan your entire vault for redundant entries. <br/><em>Use this if you see the same game appearing multiple times after merging collections.</em></p>
      </div>

      <div class="integrity-item">
        <button class="btn btn-ghost btn-sm text-rose" @click="$emit('showWipeConfirm')">⚠️ Nuclear Reset</button>
        <p class="muted">Wipe your entire local and cloud library. <br/><em>Use this if you want to start your Knightfall journey over with a completely clean slate.</em></p>
      </div>
    </div>

    <!-- Integrity Progress Overlay -->
    <Transition name="fade">
      <div v-if="libraryStore.isProcessingIntegrity" class="integrity-progress-overlay glass-md">
        <div class="progress-info">
          <div class="spinner"></div>
          <div class="text-group">
            <span class="status-msg">{{ libraryStore.integrityMessage }}</span>
            <span class="percentage">{{ libraryStore.integrityProgress }}%</span>
          </div>
        </div>
        <div class="integrity-progress-track">
          <div class="integrity-progress-fill" :style="{ width: libraryStore.integrityProgress + '%' }"></div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.card-v3 { padding: var(--space-6); border-radius: var(--radius-xl); position: relative; overflow: hidden; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }

.integrity-grid { display: flex; flex-direction: column; gap: var(--space-4); }
.integrity-item { 
  display: grid; grid-template-columns: 200px 1fr; align-items: center; gap: var(--space-6); 
  padding: var(--space-4); background: rgba(255,255,255,0.02); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05); 
}
.integrity-item p { margin: 0; font-size: 0.85rem; }
.text-rose { color: var(--rose); }
.glass-md { background: rgba(0,0,0,0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); }

.integrity-progress-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--space-10);
}

.progress-info {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.text-group {
  display: flex;
  flex-direction: column;
}

.status-msg { font-size: 0.9rem; font-weight: 700; color: white; }
.percentage { font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-bright); }

.integrity-progress-track {
  width: 100%;
  max-width: 300px;
  height: 4px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  overflow: hidden;
}

.integrity-progress-fill {
  height: 100%;
  background: var(--accent-gradient);
  transition: width 0.3s ease;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(139, 92, 246, 0.2);
  border-top-color: var(--accent-bright);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
