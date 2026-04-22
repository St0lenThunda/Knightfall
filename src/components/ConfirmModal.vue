<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div class="modal-backdrop" @click.self="$emit('cancel')">
        <div class="modal-box glass">
          <div class="confirm-icon">{{ icon }}</div>
          <h3>{{ title }}</h3>
          <p class="muted" style="font-size: 0.9rem; margin: var(--space-3) 0 var(--space-6);">
            {{ message }}
          </p>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="$emit('cancel')">Cancel</button>
            <button 
              class="btn" 
              :class="variant === 'danger' ? 'btn-rose' : 'btn-primary'"
              @click="$emit('confirm')"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * A reusable, stylized confirmation modal.
 * Replaces all native browser `confirm()` dialogs to maintain
 * a consistent, premium visual experience across the application.
 *
 * @example
 * <ConfirmModal
 *   v-if="showConfirm"
 *   title="Reset Library?"
 *   message="This will delete all games."
 *   icon="🗑️"
 *   variant="danger"
 *   confirmLabel="Yes, Reset"
 *   @confirm="doReset"
 *   @cancel="showConfirm = false"
 * />
 */
defineProps<{
  title: string
  message: string
  icon?: string
  variant?: 'danger' | 'primary'
  confirmLabel?: string
}>()

defineEmits(['confirm', 'cancel'])
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
  max-width: 400px;
  padding: var(--space-8);
  border-radius: var(--radius-lg);
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.confirm-icon {
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
.btn-rose:hover { background: rgba(244, 63, 94, 0.3); border-color: #fb7185; }

/* Transition */
.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .modal-box, .modal-fade-leave-to .modal-box { transform: scale(0.95) translateY(8px); }
</style>
