import { vi } from 'vitest'

/**
 * Knightfall Vitest Global Setup
 * 
 * Provides shims and mocks for browser APIs that are not fully implemented 
 * in happy-dom, ensuring that stores and composables can be tested in isolation.
 */

// 1. Shim IndexedDB (Basic mock to prevent ReferenceErrors)
// Since we use IDB for game persistence, we need to ensure tests don't crash
// when libraries attempt to open or delete databases.
const indexedDBMock = {
  open: vi.fn().mockReturnValue({ onsuccess: null, onerror: null, onupgradeneeded: null }),
  deleteDatabase: vi.fn().mockReturnValue({ onsuccess: (cb: any) => cb && cb(), onerror: null }),
}

Object.defineProperty(global, 'indexedDB', {
  value: indexedDBMock,
  writable: true
})

// 2. Mock localStorage if needed
if (!global.localStorage) {
  const store: Record<string, string> = {}
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { for (const k in store) delete store[k] }
    }
  })
}

// 3. Mock URL.createObjectURL (Used for exporting PGNs and Blobs)
if (typeof URL.createObjectURL === 'undefined') {
  Object.defineProperty(URL, 'createObjectURL', {
    value: vi.fn().mockReturnValue('blob:mock-url')
  })
}

// 4. Global Mocks for Audio (Stockfish/Engine sound effects)
class MockAudio {
  play = vi.fn().mockResolvedValue(undefined)
  pause = vi.fn()
  load = vi.fn()
}
global.Audio = MockAudio as any
