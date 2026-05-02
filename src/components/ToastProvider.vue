<template>
  <div class="toast-container">
    <TransitionGroup name="toast-list">
      <div 
        v-for="toast in uiStore.toasts" 
        :key="toast.id" 
        class="toast glass-floating"
        :class="`toast-${toast.variant}`"
      >
        <div class="toast-shimmer"></div>
        <div class="toast-indicator"></div>
        <span class="toast-icon">{{ getIcon(toast.variant) }}</span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="uiStore.removeToast(toast.id)">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
/**
 * ToastProvider: A high-fidelity notification engine.
 * Employs 'Energy' glows and 'Glass 2.0' layering for immersive status updates.
 */
import { useUiStore, type ToastVariant } from '../stores/uiStore'

const uiStore = useUiStore()

/**
 * Returns a high-fidelity icon for the toast variant.
 */
function getIcon(variant: ToastVariant) {
  if (variant === 'success') return '✨'
  if (variant === 'error') return '🚨'
  if (variant === 'warning') return '⚠️'
  return '📡'
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  z-index: 10000;
  pointer-events: none;
}

.toast {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-xl);
  pointer-events: auto;
  min-width: 320px;
  max-width: 450px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: var(--shadow-2xl);
}

.toast-shimmer {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: translateX(-100%);
  animation: shimmer 3s infinite;
}

.toast-indicator {
  position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
}

.toast-icon { font-size: 1.25rem; filter: drop-shadow(0 0 5px currentColor); }
.toast-message { flex: 1; font-size: 0.95rem; font-weight: 700; color: white; }

.toast-close {
  background: transparent; border: none; color: white;
  opacity: 0.3; font-size: 0.75rem; cursor: pointer;
  padding: var(--space-2); transition: all 0.2s ease;
}
.toast-close:hover { opacity: 1; transform: scale(1.2); }

/* Variant Energy Glows */
.toast-success { box-shadow: 0 0 20px rgba(45, 212, 191, 0.1); }
.toast-success .toast-indicator { background: var(--teal); box-shadow: 0 0 10px var(--teal); }
.toast-success .toast-icon { color: var(--teal); }

.toast-error { box-shadow: 0 0 20px rgba(244, 63, 94, 0.1); }
.toast-error .toast-indicator { background: var(--rose); box-shadow: 0 0 10px var(--rose); }
.toast-error .toast-icon { color: var(--rose); }

.toast-warning { box-shadow: 0 0 20px rgba(251, 191, 36, 0.1); }
.toast-warning .toast-indicator { background: var(--gold); box-shadow: 0 0 10px var(--gold); }
.toast-warning .toast-icon { color: var(--gold); }

.toast-info { box-shadow: 0 0 20px rgba(139, 92, 246, 0.1); }
.toast-info .toast-indicator { background: var(--accent); box-shadow: 0 0 10px var(--accent); }
.toast-info .toast-icon { color: var(--accent); }

/* Animations */
.toast-list-enter-active { transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.toast-list-leave-active { transition: all 0.3s var(--ease); }

.toast-list-enter-from { opacity: 0; transform: translateX(50px) scale(0.8); }
.toast-list-leave-to { opacity: 0; transform: scale(0.9) translateY(20px); }

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  30%, 100% { transform: translateX(100%); }
}
</style>
