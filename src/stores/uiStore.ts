import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration: number
}

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])
  
  // Confirmation Modal State
  const isConfirmOpen = ref(false)
  const confirmTitle = ref('')
  const confirmMessage = ref('')
  const confirmIcon = ref('❓')
  const confirmVariant = ref<'primary' | 'danger'>('primary')
  const confirmLabel = ref('Confirm')
  let confirmCallback: (() => void) | null = null

  function addToast(message: string, variant: ToastVariant = 'info', duration = 3000) {
    const id = Date.now().toString() + Math.random().toString(36).substring(2)
    toasts.value.push({ id, message, variant, duration })

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  function removeToast(id: string) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) toasts.value.splice(index, 1)
  }

  /**
   * Triggers a styled confirmation modal.
   */
  function confirm(
    title: string, 
    message: string, 
    onConfirm: () => void, 
    options: { icon?: string, variant?: 'primary' | 'danger', label?: string } = {}
  ) {
    confirmTitle.value = title
    confirmMessage.value = message
    confirmIcon.value = options.icon || '❓'
    confirmVariant.value = options.variant || 'primary'
    confirmLabel.value = options.label || 'Confirm'
    confirmCallback = onConfirm
    isConfirmOpen.value = true
  }

  function handleConfirm() {
    if (confirmCallback) confirmCallback()
    isConfirmOpen.value = false
  }

  const isArchetypeModalOpen = ref(false)

  function handleCancel() {
    isConfirmOpen.value = false
    isArchetypeModalOpen.value = false
  }

  return { 
    toasts, addToast, removeToast, 
    isConfirmOpen, confirmTitle, confirmMessage, confirmIcon, confirmVariant, confirmLabel,
    confirm, handleConfirm, handleCancel,
    isArchetypeModalOpen
  }
})
