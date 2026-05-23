<template>
  <div class="settings-group">
    <h3>Data Maintenance & Integrity</h3>
    <p class="muted mb-6">System-level vault optimization and recovery tools to keep your game archives clean and synchronized.</p>

    <!-- Status badge -->
    <div class="status-row mb-6">
      <span class="label">Vault Status</span>
      <div class="status-badge" :class="{ 'is-active': libraryStore.isProcessingIntegrity }">
        <span class="pulse-dot"></span>
        {{ libraryStore.isProcessingIntegrity ? 'System Rebuilding...' : 'Healthy / Idle' }}
      </div>
    </div>

    <!-- Integrity Tools Grid -->
    <div class="maintenance-grid">
      <!-- 1. Sanitize Test Data -->
      <div class="maintenance-card glass-sm">
        <div class="card-content">
          <div class="card-meta">
            <h4>🧹 Sanitize Test Data</h4>
            <p class="desc">Purges short test matches and automated testing artifacts from your local library.</p>
          </div>
          <button 
            class="btn btn-ghost btn-sm" 
            :disabled="libraryStore.isProcessingIntegrity" 
            @click="handleSanitize"
          >
            Purge Test Data
          </button>
        </div>
      </div>

      <!-- 2. Sanitize Metadata -->
      <div class="maintenance-card glass-sm">
        <div class="card-content">
          <div class="card-meta">
            <h4>🛡️ Sanitize PGN Metadata</h4>
            <p class="desc">Validates game headers and metadata tags. Fixes missing ELO rankings or unrecognized openings.</p>
          </div>
          <button 
            class="btn btn-ghost btn-sm" 
            :disabled="libraryStore.isProcessingIntegrity" 
            @click="handleMaintenance(() => libraryStore.repairVaultMetadata(), 'SANITIZING_METADATA', 'PGN header metadata repaired.')"
          >
            Sanitize Metadata
          </button>
        </div>
      </div>

      <!-- 3. Repair Identity -->
      <div class="maintenance-card glass-sm">
        <div class="card-content">
          <div class="card-meta">
            <h4>🧬 Repair Identity Tags</h4>
            <p class="desc">Recalculates 'My Games' ownership tags based on your active profile username and Lichess handle.</p>
          </div>
          <button 
            class="btn btn-ghost btn-sm" 
            :disabled="libraryStore.isProcessingIntegrity" 
            @click="handleMaintenance(() => libraryStore.repairVaultIdentity(), 'REPAIRING_IDENTITY', 'Identity reference mapping repaired.')"
          >
            Repair Identity
          </button>
        </div>
      </div>

      <!-- 4. Deduplicate Vault -->
      <div class="maintenance-card glass-sm">
        <div class="card-content">
          <div class="card-meta">
            <h4>🧹 Clean Duplicate Entries</h4>
            <p class="desc">Scans the local vault for identical game fingerprints and merges redundant records.</p>
          </div>
          <button 
            class="btn btn-ghost btn-sm" 
            :disabled="libraryStore.isProcessingIntegrity" 
            @click="handleMaintenance(() => libraryStore.purgeDuplicates(), 'DEDUPLICATING_VAULT', 'Deduplication complete. Redundant copies removed.')"
          >
            Deduplicate Vault
          </button>
        </div>
      </div>
    </div>

    <!-- Danger Zone section -->
    <h3 class="danger-title mt-10">Danger Zone</h3>
    <div class="setting-row danger-zone">
      <div class="setting-info">
        <div class="label text-danger">The Rite of Oblivion</div>
        <div class="desc">Permanently wipe your entire local library (IndexedDB) and clear all cloud backups from Supabase. This cannot be undone.</div>
      </div>
      <div class="setting-action">
        <button 
          class="btn btn-outline-danger btn-sm" 
          :disabled="libraryStore.isProcessingIntegrity" 
          @click="showWipeConfirm = true"
        >
          Purge Library
        </button>
      </div>
    </div>

    <!-- Nuclear Reset Confirmation Modal -->
    <NuclearWipeModal 
      :visible="showWipeConfirm" 
      :is-wiping="isWiping" 
      @cancel="showWipeConfirm = false" 
      @confirm="handleNuclearReset" 
    />

    <!-- Immersion Progress Overlay for Rebuilding Tasks -->
    <Transition name="slide-up">
      <div v-if="libraryStore.isProcessingIntegrity" class="integrity-overlay glass-lg">
        <div class="scanning-light"></div>
        <div class="overlay-content">
          <div class="progress-hero">
            <div class="pulse-container">
              <div class="pulse-ring"></div>
              <div class="pulse-ring"></div>
              <div class="pulse-center">⚙️</div>
            </div>
            <div class="hero-percentage text-glow">
              {{ libraryStore.integrityProgress }}%
            </div>
          </div>
          <div class="text-center mt-6">
            <h3 class="status-msg text-glow">{{ libraryStore.integrityMessage }}</h3>
            <div class="progress-stats mt-4">
              <span class="task-id">TASK: LIBRARY_OPTIMIZATION_{{ Math.floor(Math.random() * 1000) }}</span>
            </div>
          </div>
          <div class="integrity-progress-track mt-8">
            <div class="integrity-progress-fill" :style="{ width: libraryStore.integrityProgress + '%' }">
              <div class="fill-glow"></div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * SettingsMaintenanceTab
 * 
 * Manages administrative library maintenance tasks: deduplication,
 * metadata sanitization, Playwright/test cleaning, and nuclear wipes.
 */
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLibraryStore } from '../../stores/libraryStore'
import { useUiStore } from '../../stores/uiStore'
import NuclearWipeModal from '../profile/modals/NuclearWipeModal.vue'

const libraryStore = useLibraryStore()
const uiStore = useUiStore()

const { isProcessingIntegrity, integrityProgress, integrityMessage } = storeToRefs(libraryStore)

const showWipeConfirm = ref(false)
const isWiping = ref(false)

/**
 * Wraps maintenance database tasks with toast feedback and progress overlay.
 * 
 * @param action - Async function containing the database maintenance operations
 * @param label - Title to display on the progress overlay during rebuild
 * @param successMsg - Toast notification message shown on successful resolution
 */
async function handleMaintenance(action: () => Promise<any>, label: string, successMsg: string) {
  isProcessingIntegrity.value = true
  integrityMessage.value = label
  integrityProgress.value = 0
  
  try {
    const result = await action()
    
    // Append number of affected rows to success message if returned by store action
    const finalMsg = (typeof result === 'number' && result > 0)
      ? `${successMsg} (${result} records affected)`
      : successMsg
      
    integrityProgress.value = 100
    uiStore.addToast(finalMsg, 'success')
  } catch (err: any) {
    uiStore.addToast(`Maintenance failed: ${err.message || 'Unknown error'}`, 'error')
  } finally {
    // Keep loading overlay visible briefly for completion satisfaction feel
    setTimeout(() => {
      isProcessingIntegrity.value = false
    }, 1200)
  }
}

/**
 * Special handler for test data sanitization.
 */
async function handleSanitize() {
  await handleMaintenance(
    () => libraryStore.purgeTestPollution(),
    'PURGING_TEST_POLLUTION',
    'Neural vault sanitized of ghost games.'
  )
}

/**
 * Resets the entire vault database, wiping local IndexedDB and optionally cloud tables.
 * 
 * @param wipeCloud - Whether to clear entries from the remote Supabase backup
 */
async function handleNuclearReset(wipeCloud: boolean) {
  isWiping.value = true
  try {
    await libraryStore.nukeVault(wipeCloud)
    showWipeConfirm.value = false
    uiStore.addToast('Library wiped successfully.', 'success')
  } catch (err: any) {
    uiStore.addToast(`Wipe failed: ${err.message || 'Unknown error'}`, 'error')
  } finally {
    isWiping.value = false
  }
}
</script>

<style scoped>
.settings-group { display: flex; flex-direction: column; gap: var(--space-6); }

.settings-group h3 {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent-bright);
  margin-bottom: var(--space-2);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 8px;
}

.danger-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--rose) !important;
  margin-bottom: var(--space-2);
  border-bottom: 1px solid rgba(244, 63, 94, 0.2) !important;
  padding-bottom: 8px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  padding-bottom: var(--space-4);
}

.status-badge { 
  display: flex; align-items: center; gap: var(--space-2); 
  padding: var(--space-1) var(--space-3); border-radius: 100px; 
  background: rgba(255,255,255,0.05); font-size: 0.7rem; font-weight: 700; 
  text-transform: uppercase; color: var(--text-muted); 
}
.status-badge.is-active { color: var(--accent-bright); background: rgba(139, 92, 246, 0.1); }
.pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.is-active .pulse-dot { animation: pulse-bright 1.5s infinite; }

.maintenance-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

@media (max-width: 768px) {
  .maintenance-grid { grid-template-columns: 1fr; }
}

.maintenance-card {
  padding: var(--space-5);
  border: 1px solid rgba(255,255,255,0.03);
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-md);
  transition: all 0.3s var(--ease);
}
.maintenance-card:hover {
  border-color: rgba(139, 92, 246, 0.2);
  background: rgba(0, 0, 0, 0.3);
}

.card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  height: 100%;
}

.card-meta {
  flex: 1;
}

.card-meta h4 {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 4px;
  color: white;
}

.card-meta .desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-10);
}

.setting-info { flex: 1; }
.setting-info .label { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.setting-info .desc { font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }

.danger-zone {
  margin-top: var(--space-4);
  padding: var(--space-6);
  background: rgba(244, 63, 94, 0.02);
  border: 1px dashed rgba(244, 63, 94, 0.2);
  border-radius: var(--radius-lg);
}

.text-danger { color: var(--rose); }

.btn-outline-danger {
  background: transparent;
  border: 1px solid var(--rose);
  color: var(--rose);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 700;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-outline-danger:hover {
  background: var(--rose);
  color: white;
  box-shadow: var(--glow-rose);
  transform: translateY(-1px);
}

/* Immersive Progress Overlay */
.integrity-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(10, 10, 15, 0.95);
  border-radius: var(--radius-xl);
}

.scanning-light {
  position: absolute; top: 0; left: 0; right: 0; height: 100px;
  background: linear-gradient(to bottom, rgba(139, 92, 246, 0.1), transparent);
  animation: scan-vertical 3s infinite linear;
}

.progress-hero { display: flex; align-items: center; gap: var(--space-8); }
.pulse-container { position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; }
.pulse-ring { 
  position: absolute; inset: 0; border: 2px solid var(--accent); border-radius: 50%; 
  animation: ripple 2s infinite cubic-bezier(0, 0, 0.2, 1); opacity: 0;
}
.pulse-ring:nth-child(2) { animation-delay: 0.5s; }
.pulse-center { font-size: 2.5rem; z-index: 2; animation: float 3s infinite ease-in-out; }

.hero-percentage { font-family: var(--font-mono); font-weight: 800; color: var(--accent-bright); font-size: 3.5rem; line-height: 1; filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.4)); }
.status-msg { font-size: 1.2rem; }
.task-id { font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.1em; opacity: 0.5; }

.integrity-progress-track { width: 100%; max-width: 400px; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
.integrity-progress-fill { position: relative; height: 100%; background: var(--accent-gradient); transition: width 0.4s ease; }
.fill-glow { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); animation: shimmer 2s infinite; }

@keyframes scan-vertical { 0% { transform: translateY(-100%); } 100% { transform: translateY(500%); } }
@keyframes ripple { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(2.5); opacity: 0; } }
@keyframes pulse-bright { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from { opacity: 0; transform: translateY(40px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-40px); }
</style>
