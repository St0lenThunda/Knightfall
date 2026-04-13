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

  return { toasts, addToast, removeToast }
})
