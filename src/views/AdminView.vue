<template>
  <div class="admin-view-container custom-scroll">
    <header class="view-header">
      <div class="header-main">
        <span class="view-pill">SECURITY_LEVEL_MAXIMUM</span>
        <h1>Archivist Command Center</h1>
        <p class="muted">
          Supervise user progression profiles, manage database metrics, and execute administrative rites.
        </p>
      </div>
    </header>

    <!-- Admin dashboard grid layout -->
    <div class="admin-grid">
      <!-- Left side: User Directory Management -->
      <section class="grid-card main-panel glass">
        <UserDirectory 
          @purge-user="triggerPurgeConfirm" 
        />
      </section>

      <!-- Right side: Database telemetry overview & warning ledger -->
      <section class="grid-card side-panel glass">
        <div class="ledger-header">
          <h5>SECURITY_LEDGER</h5>
        </div>
        <div class="ledger-content">
          <div class="ledger-item info-alert">
            <span class="bullet">✦</span>
            <div>
              <strong>Designated Administrator:</strong>
              <p class="muted">
                Only profiles flagged with <code>role = 'admin'</code> in the database profiles table are authorized to query this view or perform deletion requests.
              </p>
            </div>
          </div>

          <div class="ledger-item warning-alert">
            <span class="bullet">⚡</span>
            <div>
              <strong>Rite of Oblivion:</strong>
              <p class="muted">
                Executing a user purge completely deletes their auth credentials, meaning they can no longer log in. All associated matches, puzzles, and quest progress are cleaned up atomically.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Teleport / Overlay Modals -->
    <PurgeConfirmationModal
      v-if="showPurgeModal"
      :show="showPurgeModal"
      :user="userToPurge"
      @close="closePurgeConfirm"
      @confirm="executeUserPurge"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAdminStore } from '../stores/adminStore'
import { useUiStore } from '../stores/uiStore'

// --- COMPONENTS ---
import UserDirectory from '../components/admin/UserDirectory.vue'
import PurgeConfirmationModal from '../components/admin/PurgeConfirmationModal.vue'

const adminStore = useAdminStore()
const uiStore = useUiStore()

// --- COMPOSABLE STATE ---
const showPurgeModal = ref(false)
const userToPurge = ref<any>({ id: '', username: '', email: '' })

// --- METHODS ---
/**
 * Opens the double confirmation modal and sets the target user profile.
 * 
 * @param user - The user profile structure containing id, username, and email
 */
function triggerPurgeConfirm(user: any) {
  userToPurge.value = user
  showPurgeModal.value = true
}

/**
 * Closes the purge modal and resets the selected target user state.
 */
function closePurgeConfirm() {
  showPurgeModal.value = false
  userToPurge.value = { id: '', username: '', email: '' }
}

/**
 * Executes the database purge function via the adminStore action.
 * Shows feedback to the admin on completion.
 * 
 * @param userId - UUID of the target user to delete
 */
async function executeUserPurge(userId: string) {
  const result = await adminStore.purgeUser(userId)
  
  if (result.success) {
    uiStore.addToast(`Rite of Oblivion complete. User profile and all associated data purged.`, 'success')
    closePurgeConfirm()
  } else {
    // Determine the error details
    const errObj: any = result.error
    const errorMsg = errObj?.message || 'Check database permissions or triggers.'
    uiStore.addToast(`Oblivion failed: ${errorMsg}`, 'error')
  }
}
</script>

<style scoped>
.admin-view-container {
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-height: 100vh;
  box-sizing: border-box;
}

.view-header {
  border-bottom: 1px solid var(--border);
  padding-bottom: var(--space-6);
}

.view-pill {
  font-size: 0.65rem;
  font-weight: 900;
  color: var(--accent-bright);
  letter-spacing: 0.15em;
  background: rgba(167, 139, 250, 0.1);
  border: 1px solid rgba(167, 139, 250, 0.2);
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: var(--space-2);
}

h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.01em;
}

.admin-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
  flex-grow: 1;
}

@media (min-width: 1200px) {
  .admin-grid {
    grid-template-columns: 3fr 1fr;
  }
}

.grid-card {
  border-radius: var(--radius-xl);
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

.main-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.side-panel {
  background: rgba(13, 13, 16, 0.4);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.ledger-header h5 {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  color: var(--text-muted);
  font-weight: 800;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: var(--space-3);
}

.ledger-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.ledger-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  font-size: 0.8rem;
  line-height: 1.5;
}

.info-alert {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.info-alert .bullet {
  color: var(--accent);
}

.warning-alert {
  background: rgba(244, 63, 94, 0.03);
  border: 1px solid rgba(244, 63, 94, 0.1);
}

.warning-alert .bullet {
  color: #fb7185;
}

.ledger-item strong {
  display: block;
  margin-bottom: 2px;
  color: #fff;
}
</style>
