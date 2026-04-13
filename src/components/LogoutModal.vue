<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div class="modal-backdrop" @click.self="$emit('close')">
        <div class="modal-box glass">
          <div class="logout-icon">👋</div>
          <h3>Sign Out?</h3>
          <p class="muted" style="font-size: 0.9rem; margin: var(--space-3) 0 var(--space-6);">
            You'll need to log back in to access your profile and saved progress.
          </p>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
            <button class="btn btn-rose" @click="confirm" :disabled="loading">
              {{ loading ? 'Signing out...' : 'Yes, Sign Out' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../api/supabaseClient'
import { useUiStore } from '../stores/uiStore'

const emit = defineEmits(['close'])
const router = useRouter()
const uiStore = useUiStore()
const loading = ref(false)

async function confirm() {
  loading.value = true
  await supabase.auth.signOut()
  uiStore.addToast('Successfully signed out.', 'info')
  emit('close')
  router.push('/')
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  width: 100%;
  max-width: 360px;
  padding: var(--space-8);
  border-radius: var(--radius-lg);
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.logout-icon {
  font-size: 2.5rem;
  margin-bottom: var(--space-4);
  line-height: 1;
}

h3 { margin: 0; font-size: 1.3rem; }

.modal-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
}

.btn-rose {
  background: rgba(244, 63, 94, 0.15);
  border: 1px solid rgba(244, 63, 94, 0.4);
  color: #fb7185;
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-rose:hover:not(:disabled) {
  background: rgba(244, 63, 94, 0.3);
  border-color: #fb7185;
}
.btn-rose:disabled { opacity: 0.5; cursor: not-allowed; }

/* Transition */
.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .modal-box, .modal-fade-leave-to .modal-box { transform: scale(0.95) translateY(8px); }
</style>
