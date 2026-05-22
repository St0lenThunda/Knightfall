<script setup lang="ts">
/**
 * ConfirmModal: A high-fidelity, global confirmation dialog.
 * Syncs with uiStore to provide consistent "Knightfall" interactions.
 */
import { useUiStore } from '../stores/uiStore'

const uiStore = useUiStore()
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="uiStore.isConfirmOpen" class="confirm-overlay" @click.self="uiStore.handleCancel">
      <div class="confirm-modal glass-floating">
        <div class="modal-content">
          <div class="modal-icon">{{ uiStore.confirmIcon }}</div>
          <h3 class="text-glow">{{ uiStore.confirmTitle }}</h3>
          <p class="muted mt-4">{{ uiStore.confirmMessage }}</p>
          
          <div class="modal-actions mt-10">
            <button class="btn btn-ghost" @click="uiStore.handleCancel">Cancel</button>
            <button 
              class="btn" 
              :class="uiStore.confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'" 
              @click="uiStore.handleConfirm"
            >
              {{ uiStore.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(5, 5, 10, 0.85);

  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.confirm-modal {
  width: 100%;
  max-width: 420px;
  padding: var(--space-10);
  text-align: center;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: var(--radius-xl);
}

.modal-icon { font-size: 3rem; margin-bottom: var(--space-4); filter: drop-shadow(0 0 10px rgba(255,255,255,0.2)); }
.modal-actions { display: flex; gap: var(--space-4); justify-content: center; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.3s var(--ease); }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.9) translateY(20px); }

.btn-danger { background: var(--rose); color: white; box-shadow: var(--glow-rose); }
.btn-danger:hover { background: #ff4d4d; transform: translateY(-2px); box-shadow: 0 0 25px rgba(244, 63, 94, 0.4); }
</style>
