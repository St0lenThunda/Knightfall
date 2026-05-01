<template>
  <Transition name="modal-fade">
    <div v-if="uiStore.isConfirmOpen" class="confirm-overlay" @click.self="uiStore.handleCancel">
      <div class="confirm-modal glass-lg">
        <div class="modal-content">
          <h3>{{ uiStore.confirmTitle }}</h3>
          <p class="muted mt-2">{{ uiStore.confirmMessage }}</p>
          
          <div class="modal-actions mt-8">
            <button class="btn btn-ghost" @click="uiStore.handleCancel">Cancel</button>
            <button class="btn btn-danger" @click="uiStore.handleConfirm">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useUiStore } from '../stores/uiStore'

const uiStore = useUiStore()
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(10, 10, 15, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.confirm-modal {
  width: 100%;
  max-width: 400px;
  padding: var(--space-8);
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.btn-danger {
  background: var(--danger);
  color: white;
}
.btn-danger:hover {
  background: #ef4444;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
}
</style>
