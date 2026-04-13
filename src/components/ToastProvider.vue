<template>
  <div class="toast-container">
    <TransitionGroup name="toast-list">
      <div 
        v-for="toast in uiStore.toasts" 
        :key="toast.id" 
        class="toast glass-sm"
        :class="`toast-${toast.variant}`"
      >
        <span class="toast-icon">{{ getIcon(toast.variant) }}</span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close btn btn-icon" @click="uiStore.removeToast(toast.id)">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useUiStore, type ToastVariant } from '../stores/uiStore'

const uiStore = useUiStore()

function getIcon(variant: ToastVariant) {
  if (variant === 'success') return '✓'
  if (variant === 'error') return '✕'
  if (variant === 'warning') return '⚠'
  return 'ℹ'
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: var(--space-4);
  right: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  z-index: 9999;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  pointer-events: auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  min-width: 280px;
  max-width: 400px;
}

.toast-message {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
}

.toast-close {
  opacity: 0.5;
  font-size: 0.8rem;
  padding: 4px;
  width: auto; height: auto;
}
.toast-close:hover { opacity: 1; }

.toast-success { border-left: 4px solid var(--green); }
.toast-success .toast-icon { color: var(--green); font-weight: 900; }

.toast-error { border-left: 4px solid var(--rose); background: rgba(244,63,94,0.1); }
.toast-error .toast-icon { color: var(--rose); font-weight: 900; }

.toast-warning { border-left: 4px solid var(--gold); }
.toast-warning .toast-icon { color: var(--gold); font-weight: 900; }

.toast-info { border-left: 4px solid var(--accent); }
.toast-info .toast-icon { color: var(--accent); font-weight: 900; }

/* Transitions */
.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.3s ease;
}
.toast-list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.toast-list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
