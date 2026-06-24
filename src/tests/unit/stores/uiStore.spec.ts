import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUiStore } from '../../../stores/uiStore'

describe('UiStore - Toast Notifications', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Use fake timers to mock setTimeout calls for auto-dismissible toasts
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should add a basic toast notification', () => {
    const uiStore = useUiStore()
    expect(uiStore.toasts).toHaveLength(0)

    uiStore.addToast('Test Message', 'info')
    expect(uiStore.toasts).toHaveLength(1)
    expect(uiStore.toasts[0].message).toBe('Test Message')
    expect(uiStore.toasts[0].variant).toBe('info')
    expect(uiStore.toasts[0].count).toBe(1)
  })

  it('should remove a toast after its duration completes', () => {
    const uiStore = useUiStore()
    uiStore.addToast('Auto close', 'info', 1000)
    expect(uiStore.toasts).toHaveLength(1)

    // Fast-forward time by 1 second to trigger the scheduled removeToast timeout
    vi.advanceTimersByTime(1000)
    expect(uiStore.toasts).toHaveLength(0)
  })

  it('should prevent duplicates and increment the count badge instead', () => {
    const uiStore = useUiStore()
    uiStore.addToast('Duplicate alert', 'warning')
    uiStore.addToast('Duplicate alert', 'warning')
    uiStore.addToast('Duplicate alert', 'warning')

    // It should merge duplicates into a single active toast item with an incremented counter
    expect(uiStore.toasts).toHaveLength(1)
    expect(uiStore.toasts[0].message).toBe('Duplicate alert')
    expect(uiStore.toasts[0].count).toBe(3)
  })

  it('should allow identical messages with different variants to coexist', () => {
    const uiStore = useUiStore()
    uiStore.addToast('Common message', 'info')
    uiStore.addToast('Common message', 'error')

    // Different variants are treated as unique and should render separately
    expect(uiStore.toasts).toHaveLength(2)
    expect(uiStore.toasts[0].variant).toBe('info')
    expect(uiStore.toasts[0].count).toBe(1)
    expect(uiStore.toasts[1].variant).toBe('error')
    expect(uiStore.toasts[1].count).toBe(1)
  })

  it('should reset the auto-dismiss timer when a duplicate toast is added', () => {
    const uiStore = useUiStore()
    uiStore.addToast('Reset timer', 'info', 2000)
    
    // Move forward 1.5 seconds (toast is still active)
    vi.advanceTimersByTime(1500)
    expect(uiStore.toasts).toHaveLength(1)

    // Trigger duplicate toast (should renew duration to 2 seconds from now)
    uiStore.addToast('Reset timer', 'info', 2000)

    // Move forward another 1 second (originally it would have closed at 2.0s, now it should close at 1.5 + 2.0 = 3.5s)
    vi.advanceTimersByTime(1000)
    expect(uiStore.toasts).toHaveLength(1)
    expect(uiStore.toasts[0].count).toBe(2)

    // Move past the new reset threshold (additional 1.1 seconds, total 3.6s elapsed)
    vi.advanceTimersByTime(1100)
    expect(uiStore.toasts).toHaveLength(0)
  })
})
