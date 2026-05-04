<template>
  <div class="glass-floating card-v4 mt-8">
    <div class="card-header">
      <div class="header-group">
        <span class="icon-glow">🛡️</span>
        <div class="title-meta">
          <h4 class="text-glow">Data Integrity & Maintenance</h4>
          <p class="muted">System-level vault optimization tools</p>
        </div>
      </div>
      <div class="status-badge" :class="{ 'is-active': libraryStore.isProcessingIntegrity }">
        <span class="pulse-dot"></span>
        {{ libraryStore.isProcessingIntegrity ? 'System Processing' : 'Operational' }}
      </div>
    </div>

    <div class="integrity-grid mt-8">
      <div class="integrity-item glass-sm">
        <div class="item-content">
          <button class="btn btn-action" @click="handleIntegrityAction(() => libraryStore.refreshCloudDna(), 'SYNCING_FROM_CLOUD', 'Cloud DNA refreshed and sanitized.')">🔄 Refresh Cloud DNA</button>
          <p class="muted">Sync local library with cloud. Use if played on another device.</p>
        </div>
      </div>
      
      <div class="integrity-item glass-sm">
        <div class="item-content">
          <button class="btn btn-action" @click="handleIntegrityAction(() => libraryStore.pushLocalGamesToCloud(), 'BACKING_UP_TO_CLOUD', 'Vault successfully pushed to cloud.')">☁️ Push Vault to Cloud</button>
          <p class="muted">Back up local collection. Use after large PGN imports.</p>
        </div>
      </div>

      <div class="integrity-item glass-sm">
        <div class="item-content">
          <button class="btn btn-action" @click="handleSanitize">🧹 Sanitize Test Data</button>
          <p class="muted">Purge 1-move games and Playwright pollution from local & cloud.</p>
        </div>
      </div>

      <div class="integrity-item glass-sm">
        <div class="item-content">
          <button class="btn btn-action" @click="handleIntegrityAction(() => libraryStore.repairVaultMetadata(), 'SANITIZING_METADATA', 'Metadata sanitization complete.')">🛡️ Sanitize Metadata</button>
          <p class="muted">Validate PGN headers. Fixes missing Elo or unknown openings.</p>
        </div>
      </div>

      <div class="integrity-item glass-sm">
        <div class="item-content">
          <button class="btn btn-action" @click="handleIntegrityAction(() => libraryStore.repairVaultIdentity(), 'REPAIRING_IDENTITY', 'Identity repair complete. Tags updated.')">🧬 Repair Identity</button>
          <p class="muted">Recalculates 'My Games' tags based on your active profile.</p>
        </div>
      </div>

      <div class="integrity-item glass-sm">
        <div class="item-content">
          <button class="btn btn-action" @click="handleIntegrityAction(() => libraryStore.purgeDuplicates(), 'DEDUPLICATING_VAULT', 'Deduplication complete. Redundant games purged.')">🧹 Clean Duplicates</button>
          <p class="muted">Scan vault for redundant entries from merged collections.</p>
        </div>
      </div>

      <div class="integrity-item glass-sm dangerous">
        <div class="item-content">
          <button class="btn btn-action text-rose" @click="$emit('showWipeConfirm')">⚠️ Nuclear Reset</button>
          <p class="muted">Wipe entire library. Start your journey with a clean slate.</p>
        </div>
      </div>
    </div>

    <!-- High-Fidelity Progress Overlay -->
    <Transition name="slide-up">
      <div v-if="libraryStore.isProcessingIntegrity" class="integrity-overlay glass-lg">
        <div class="scanning-light"></div>
        <div class="overlay-content">
          <div class="progress-hero">
            <div class="pulse-container">
              <div class="pulse-ring"></div>
              <div class="pulse-ring"></div>
              <div class="pulse-center">🧬</div>
            </div>
            <div class="hero-percentage text-glow">
              {{ libraryStore.integrityProgress }}%
            </div>
          </div>
          <div class="text-center mt-6">
            <h3 class="status-msg text-glow">{{ libraryStore.integrityMessage }}</h3>
            <div class="progress-stats mt-4">
              <span class="task-id">TASK: INTEGRITY_REPAIR_{{ Math.floor(Math.random() * 1000) }}</span>
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
 * WarRoomIntegrity: Manages the maintenance and synchronization of the library.
 * Employs high-fidelity overlays and rhythmic energy animations during processing.
 */
import { storeToRefs } from 'pinia'
import { useLibraryStore } from '../../../stores/libraryStore'
import { useUiStore } from '../../../stores/uiStore'

const libraryStore = useLibraryStore()
const uiStore = useUiStore()

// We use storeToRefs to ensure explicit .value access in the script setup,
// which prevents IDE confusion and maintains clear reactivity boundaries.
const { isProcessingIntegrity, integrityProgress, integrityMessage } = storeToRefs(libraryStore)

defineEmits(['showWipeConfirm', 'deduplicateVault'])

/**
 * Wraps integrity actions with consistent toast feedback and state management.
 * Now triggers the high-fidelity immersive overlay for all maintenance tasks.
 * 
 * @param action - The store action to execute
 * @param label - The status message for the immersive overlay
 * @param successMsg - Message to display upon successful completion
 */
async function handleIntegrityAction(action: () => Promise<any>, label: string, successMsg: string) {
  // Activate the immersive progress state
  isProcessingIntegrity.value = true
  integrityMessage.value = label
  integrityProgress.value = 0
  
  try {
    const result = await action()
    
    // If the action returned a count (like purge), include it in the message
    const finalMsg = (typeof result === 'number' && result > 0) 
      ? `${successMsg} (${result} records affected)` 
      : successMsg
      
    integrityProgress.value = 100
    uiStore.addToast(finalMsg, 'success')
  } catch (e: any) {
    uiStore.addToast(`Integrity failure: ${e.message || 'Unknown error'}`, 'error')
  } finally {
    // Keep overlay visible briefly for "completion" feel
    setTimeout(() => {
      isProcessingIntegrity.value = false
    }, 1200)
  }
}

/**
 * Special handler for test data sanitization with unique visual feedback.
 */
async function handleSanitize() {
  await handleIntegrityAction(
    () => libraryStore.purgeTestPollution(),
    'PURGING_TEST_POLLUTION',
    'Neural vault sanitized of ghost games.'
  )
}
</script>

<style scoped>
.card-v4 { padding: var(--space-8); border-radius: var(--radius-2xl); position: relative; overflow: hidden; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; }
.header-group { display: flex; gap: var(--space-4); align-items: center; }
.icon-glow { font-size: 2rem; filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.4)); }
.title-meta h4 { margin-bottom: 2px; }

.status-badge { 
  display: flex; align-items: center; gap: var(--space-2); 
  padding: var(--space-1) var(--space-3); border-radius: 100px; 
  background: rgba(255,255,255,0.05); font-size: 0.7rem; font-weight: 700; 
  text-transform: uppercase; color: var(--text-muted); 
}
.status-badge.is-active { color: var(--accent-bright); background: rgba(139, 92, 246, 0.1); }
.pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.is-active .pulse-dot { animation: pulse-bright 1.5s infinite; }

.integrity-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4); }
.integrity-item { 
  padding: var(--space-5); transition: all 0.3s var(--ease); 
  border: 1px solid rgba(255,255,255,0.03);
}
.integrity-item:hover { border-color: rgba(139, 92, 246, 0.3); transform: translateY(-2px); }
.integrity-item.dangerous:hover { border-color: rgba(244, 63, 94, 0.3); }

.item-content { display: flex; flex-direction: column; gap: var(--space-2); }
.btn-action { 
  justify-content: flex-start; padding: 0; background: transparent; 
  font-weight: 700; color: white; transition: color 0.2s ease;
}
.btn-action:hover { color: var(--accent-bright); }
.dangerous .btn-action:hover { color: var(--rose); }

.integrity-overlay {
  position: absolute; inset: 0; z-index: 100;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  background: rgba(10, 10, 15, 0.9);
}

.scanning-light {
  position: absolute; top: 0; left: 0; right: 0; height: 100px;
  background: linear-gradient(to bottom, rgba(139, 92, 246, 0.1), transparent);
  animation: scan-vertical 3s infinite linear;
}

.pulse-container { position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; }
.pulse-ring { 
  position: absolute; inset: 0; border: 2px solid var(--accent); border-radius: 50%; 
  animation: ripple 2s infinite cubic-bezier(0, 0, 0.2, 1); opacity: 0;
}
.pulse-ring:nth-child(2) { animation-delay: 0.5s; }
.pulse-center { font-size: 2.5rem; z-index: 2; animation: float 3s infinite ease-in-out; }

.integrity-progress-track { width: 100%; max-width: 400px; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
.integrity-progress-fill { position: relative; height: 100%; background: var(--accent-gradient); transition: width 0.4s ease; }
.fill-glow { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); animation: shimmer 2s infinite; }

.status-msg { font-size: 1.2rem; }
.progress-hero { display: flex; align-items: center; gap: var(--space-8); }
.hero-percentage { font-family: var(--font-mono); font-weight: 800; color: var(--accent-bright); font-size: 3.5rem; line-height: 1; filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.4)); }
.task-id { font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.1em; opacity: 0.5; }

@keyframes scan-vertical { 0% { transform: translateY(-100%); } 100% { transform: translateY(500%); } }
@keyframes ripple { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(2.5); opacity: 0; } }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from { opacity: 0; transform: translateY(40px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-40px); }
</style>
