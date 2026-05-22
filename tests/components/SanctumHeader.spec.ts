import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import SanctumHeader from '../../src/components/sanctum/SanctumHeader.vue'
import { useLibraryStore } from '../../src/stores/libraryStore'

describe('SanctumHeader.vue', () => {
  const factory = (mockPersonalGames: any[]) => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false
    })
    const libraryStore = useLibraryStore(pinia)
    Object.defineProperty(libraryStore, 'personalGames', { get: () => mockPersonalGames })

    return mount(SanctumHeader, {
      props: {
        badges: [],
        archetype: 'The Unwritten Page',
        isProcessing: false,
        isGenerating: false
      },
      global: {
        plugins: [pinia]
      }
    })
  }

  it('hides "Scan for Mistakes" and "Recalibrate Path" when libraryStore.personalGames is empty', async () => {
    const wrapper = factory([])
    await wrapper.vm.$nextTick()
    
    const html = wrapper.html()
    expect(html).not.toContain('Scan for Mistakes')
    expect(html).not.toContain('Recalibrate Path')
  })

  it('shows "Scan for Mistakes" and "Recalibrate Path" when libraryStore.personalGames has games', async () => {
    const wrapper = factory([{ id: 'game-1' }])
    await wrapper.vm.$nextTick()

    const html = wrapper.html()
    expect(html).toContain('Scan for Mistakes')
    expect(html).toContain('Recalibrate Path')
  })
})
