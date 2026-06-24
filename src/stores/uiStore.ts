import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration: number
  /** The count of times this identical notification message was consecutively generated. */
  count?: number
  /** The active window timeout ID to auto-clear this notification, allowing resets on duplicate hits. */
  timeoutId?: any
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

  /**
   * Adds a new toast notification or increments the duplicate counter of an existing one.
   * If a toast with the identical message and variant is already active, we increment
   * its count and reset its timer to prevent display spam.
   * 
   * @param message - The text content to display inside the notification.
   * @param variant - The style type of the toast (info, success, warning, error).
   * @param duration - How long in milliseconds before the toast disappears (0 to persist).
   */
  function addToast(message: string, variant: ToastVariant = 'info', duration = 3000) {
    // Check if a toast with the exact same message and variant is already shown
    const existingIndex = toasts.value.findIndex(
      t => t.message === message && t.variant === variant
    )

    if (existingIndex > -1) {
      const existing = toasts.value[existingIndex]
      // Increment duplicate count
      existing.count = (existing.count || 1) + 1

      // Clear the old auto-dismiss timeout to reset duration
      if (existing.timeoutId) {
        clearTimeout(existing.timeoutId)
      }

      // Schedule a new auto-dismiss timeout if duration is positive
      if (duration > 0) {
        existing.timeoutId = setTimeout(() => {
          removeToast(existing.id)
        }, duration)
      }

      // Update the reactive array with a copy to trigger Vue's reactivity updates
      toasts.value.splice(existingIndex, 1, { ...existing })
    } else {
      const id = Date.now().toString() + Math.random().toString(36).substring(2)
      const newToast: Toast = { id, message, variant, duration, count: 1 }

      // Schedule auto-dismiss timeout if duration is positive
      if (duration > 0) {
        newToast.timeoutId = setTimeout(() => {
          removeToast(id)
        }, duration)
      }

      toasts.value.push(newToast)
    }
  }

  /**
   * Manually removes a toast notification from the queue.
   * Also handles clearing any active timers to prevent memory leaks.
   * 
   * @param id - The unique identifier of the toast to close.
   */
  function removeToast(id: string) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      const toast = toasts.value[index]
      if (toast.timeoutId) {
        clearTimeout(toast.timeoutId)
      }
      toasts.value.splice(index, 1)
    }
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
  const isTelemetryOpen = ref(false)
  const isSidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')

  function toggleSidebar() {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
    localStorage.setItem('sidebar-collapsed', isSidebarCollapsed.value.toString())
  }

  function handleCancel() {
    isConfirmOpen.value = false
    isArchetypeModalOpen.value = false
  }

  return { 
    toasts, addToast, removeToast, 
    isConfirmOpen, confirmTitle, confirmMessage, confirmIcon, confirmVariant, confirmLabel,
    confirm, handleConfirm, handleCancel,
    notify: addToast,
    isArchetypeModalOpen,
    isTelemetryOpen,
    isSidebarCollapsed,
    toggleSidebar
  }
})
