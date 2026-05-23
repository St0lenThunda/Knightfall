import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEngineStore } from '../../../stores/engineStore'
import { nextTick } from 'vue'

// Mock Storage for SettingsStore
vi.mock('../../../utils/storage', () => ({
  Storage: {
    get: vi.fn((_key, def) => def),
    set: vi.fn()
  },
  StorageKey: {
    ENGINE_MULTI_PV: 'kf_engine_multi_pv'
  }
}))

// Mock Supabase for AdminStore
vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: (cb: any) => cb({ data: [], error: null })
    })),
    rpc: vi.fn()
  }
}))

// Stub global Worker
let mockWorkerInstance: any = null

class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: ErrorEvent) => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()
  constructor() {
    mockWorkerInstance = this
  }
}

describe('EngineStore - Stockfish Inactivity Auto-Throttling', () => {
  let store: any
  let isDocumentHidden = false

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.clearAllMocks()

    mockWorkerInstance = null
    vi.stubGlobal('Worker', MockWorker)

    // Mock document.hidden property
    isDocumentHidden = false
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => isDocumentHidden
    })

    store = useEngineStore()
  })

  afterEach(() => {
    if (store) store.cleanup()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('should initialize and start analysis successfully', () => {
    store.analyze('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 15)

    expect(store.isReady).toBe(false)
    expect(store.isAnalyzing).toBe(true)
    expect(store.isThrottled).toBe(false)

    // Simulate worker initialization callback
    mockWorkerInstance.onmessage!({ data: 'uciok' } as MessageEvent)
    mockWorkerInstance.onmessage!({ data: 'readyok' } as MessageEvent)

    expect(store.isReady).toBe(true)
    expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith('go depth 15')
  })

  it('should throttle and stop calculation after 3 minutes of inactivity', () => {
    store.analyze('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 15)
    mockWorkerInstance.onmessage!({ data: 'uciok' } as MessageEvent)
    mockWorkerInstance.onmessage!({ data: 'readyok' } as MessageEvent)

    expect(store.isAnalyzing).toBe(true)
    expect(store.isThrottled).toBe(false)

    // Fast-forward by 3 minutes (180,000 ms)
    vi.advanceTimersByTime(3 * 60 * 1000)

    expect(store.isAnalyzing).toBe(false)
    expect(store.isThrottled).toBe(true)
    expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith('stop')
  })

  it('should reset inactivity timer on user interaction', () => {
    store.analyze('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 15)
    mockWorkerInstance.onmessage!({ data: 'uciok' } as MessageEvent)
    mockWorkerInstance.onmessage!({ data: 'readyok' } as MessageEvent)

    expect(store.isAnalyzing).toBe(true)

    // Wait 2 minutes
    vi.advanceTimersByTime(2 * 60 * 1000)
    expect(store.isThrottled).toBe(false)

    // Trigger user activity event
    document.dispatchEvent(new Event('mousemove'))

    // Wait another 2 minutes (total 4 minutes elapsed, but only 2 mins since activity)
    vi.advanceTimersByTime(2 * 60 * 1000)
    expect(store.isThrottled).toBe(false)

    // Wait 1 more minute (total 3 minutes since activity)
    vi.advanceTimersByTime(1 * 60 * 1000)
    expect(store.isThrottled).toBe(true)
  })

  it('should throttle calculations immediately if page visibility changes to hidden', () => {
    store.analyze('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 15)
    mockWorkerInstance.onmessage!({ data: 'uciok' } as MessageEvent)
    mockWorkerInstance.onmessage!({ data: 'readyok' } as MessageEvent)

    expect(store.isAnalyzing).toBe(true)

    // Hide document and trigger visibilitychange
    isDocumentHidden = true
    document.dispatchEvent(new Event('visibilitychange'))

    expect(store.isAnalyzing).toBe(false)
    expect(store.isThrottled).toBe(true)
    expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith('stop')
  })

  it('should resume calculations automatically if page becomes visible and was analyzing before throttling', () => {
    store.analyze('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 15)
    mockWorkerInstance.onmessage!({ data: 'uciok' } as MessageEvent)
    mockWorkerInstance.onmessage!({ data: 'readyok' } as MessageEvent)

    expect(store.isAnalyzing).toBe(true)

    // Trigger throttling via inactivity
    vi.advanceTimersByTime(3 * 60 * 1000)
    expect(store.isAnalyzing).toBe(false)
    expect(store.isThrottled).toBe(true)

    // Return page visibility to active/visible
    isDocumentHidden = false
    document.dispatchEvent(new Event('visibilitychange'))

    expect(store.isThrottled).toBe(false)
    expect(store.isAnalyzing).toBe(true)
    expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith('go depth 15')
  })

  it('should not resume calculations if the engine was idle before throttling', () => {
    // Initialize engine without active analysis
    store.init()
    mockWorkerInstance.onmessage!({ data: 'uciok' } as MessageEvent)
    mockWorkerInstance.onmessage!({ data: 'readyok' } as MessageEvent)

    expect(store.isAnalyzing).toBe(false)

    // Trigger throttling via tab hide
    isDocumentHidden = true
    document.dispatchEvent(new Event('visibilitychange'))

    expect(store.isThrottled).toBe(true)
    expect(store.isAnalyzing).toBe(false)

    // Reset mocks to track new calls
    mockWorkerInstance.postMessage.mockClear()

    // Resume tab visibility
    isDocumentHidden = false
    document.dispatchEvent(new Event('visibilitychange'))

    expect(store.isThrottled).toBe(false)
    expect(store.isAnalyzing).toBe(false)
    expect(mockWorkerInstance.postMessage).not.toHaveBeenCalledWith('go depth 15')
  })
})
