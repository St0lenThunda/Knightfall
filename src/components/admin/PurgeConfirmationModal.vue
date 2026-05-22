<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
        <div class="modal-box glass-heavy error-focus">
          <div class="modal-header">
            <span class="warning-badge">⚠️ ARCHIVAL PURGE</span>
            <button class="close-btn" @click="$emit('close')">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="purge-icon">💀</div>
            <h3>Initiate Rite of Oblivion?</h3>
            
            <p class="warning-text">
              Warning: This will permanently delete the profile for 
              <strong>{{ user.username }}</strong> (<code>{{ user.id }}</code>) 
              along with all their matches, puzzle attempts, and curriculum progress. This action is <strong>irreversible</strong>.
            </p>
            
            <div class="confirmation-form">
              <label for="username-confirm" class="confirm-label">
                Type the username <strong>{{ user.username }}</strong> to confirm:
              </label>
              <input
                id="username-confirm"
                v-model="confirmationText"
                type="text"
                class="confirm-input glass-input"
                placeholder="Enter username"
                autocomplete="off"
                :disabled="loading"
              />
            </div>
            
            <div class="modal-actions">
              <button class="btn btn-ghost" @click="$emit('close')" :disabled="loading">Cancel</button>
              <button
                class="btn btn-rose btn-purge"
                :disabled="!isMatching || loading"
                @click="handlePurge"
              >
                {{ loading ? 'Purging records...' : 'Confirm Purge' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

/**
 * Props Definition
 * 
 * @property user - The target user object to be deleted
 * @property show - Controls modal visibility
 */
const props = defineProps<{
  user: {
    id: string
    username: string
    email?: string
  }
  show: boolean
}>()

/**
 * Emits Definition
 * 
 * @property close - Fired when the modal should be closed
 * @property confirm - Fired when the deletion is approved and triggered
 */
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', userId: string): void
}>()

// --- COMPOSABLE STATE ---
const confirmationText = ref('')
const loading = ref(false)

// --- COMPUTED PROPERTIES ---
/**
 * Verification check: Ensure the typed confirmation text matches the user's username.
 * This is a classic safety gate to prevent accidental deletions due to misclicks.
 */
const isMatching = computed(() => {
  return confirmationText.value.trim() === props.user.username
})

// --- METHODS ---
/**
 * Triggers the confirm emission and updates loading state during async execution.
 */
async function handlePurge() {
  if (!isMatching.value || loading.value) return
  loading.value = true
  try {
    await emit('confirm', props.user.id)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 12, 0.85);

  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000; /* High z-index above HUD and overlays */
}

.modal-box {
  width: 90%;
  max-width: 440px;
  background: rgba(18, 10, 15, 0.95); /* Deep reddish-dark background for warning context */
  border: 1px solid rgba(244, 63, 94, 0.2);
  border-radius: var(--radius-xl);
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.9), 0 0 40px rgba(244, 63, 94, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: var(--space-4) var(--space-5);
  background: rgba(244, 63, 94, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.warning-badge {
  font-size: 0.65rem;
  font-weight: 900;
  color: #f87171;
  letter-spacing: 0.15em;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
}
.close-btn:hover {
  color: #fff;
}

.modal-body {
  padding: var(--space-6);
  text-align: center;
}

.purge-icon {
  font-size: 3rem;
  margin-bottom: var(--space-3);
  line-height: 1;
}

h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #fff;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.warning-text {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin: var(--space-4) 0;
  padding: var(--space-4);
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-md);
  border-left: 3px solid #ef4444;
}

.confirmation-form {
  margin: var(--space-5) 0 var(--space-6);
  text-align: left;
}

.confirm-label {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: var(--space-2);
}

.confirm-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  color: #fff;
  font-family: inherit;
  font-size: 0.9rem;
  transition: all 0.3s;
  box-sizing: border-box;
}
.confirm-input:focus {
  outline: none;
  border-color: rgba(244, 63, 94, 0.5);
  box-shadow: 0 0 10px rgba(244, 63, 94, 0.15);
  background: rgba(255, 255, 255, 0.06);
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

.btn {
  font-weight: 600;
  font-size: 0.85rem;
  padding: var(--space-2-5) var(--space-5);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.btn-rose {
  background: rgba(244, 63, 94, 0.15);
  border: 1px solid rgba(244, 63, 94, 0.4);
  color: #fb7185;
}
.btn-rose:hover:not(:disabled) {
  background: rgba(244, 63, 94, 0.3);
  border-color: #fb7185;
  box-shadow: 0 0 15px rgba(244, 63, 94, 0.25);
}
.btn-rose:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Transitions */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .modal-box, .modal-fade-leave-to .modal-box {
  transform: scale(0.95) translateY(12px);
}
</style>
