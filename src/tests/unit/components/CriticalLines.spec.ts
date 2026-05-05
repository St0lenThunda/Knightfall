import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import CriticalLines from '../../../components/analysis/CriticalLines.vue'
import { useSettingsStore } from '../../../stores/settingsStore'

describe('CriticalLines Component', () => {
  const defaultProps = {
    multiPvs: [
      { id: '1', score: '+0.5', moves: ['e4', 'e5'] },
      { id: '2', score: '+0.3', moves: ['d4', 'd5'] }
    ]
  }

  const createWrapper = (settingsState = {}) => {
    return mount(CriticalLines, {
      props: defaultProps,
      global: {
        plugins: [createTestingPinia({ 
          createSpy: vi.fn,
          initialState: {
            settings: {
              analysisShowCriticalLines: true,
              ...settingsState
            }
          }
        })]
      }
    })
  }

  it('renders critical lines when enabled and multiple PVs exist', () => {
    const wrapper = createWrapper({ analysisShowCriticalLines: true })
    expect(wrapper.find('.alt-lines-compact').exists()).toBe(true)
    expect(wrapper.text()).toContain('CRITICAL LINES')
  })

  it('hides critical lines when disabled', () => {
    const wrapper = createWrapper({ analysisShowCriticalLines: false })
    expect(wrapper.find('.alt-lines-compact').exists()).toBe(false)
  })

  it('hides critical lines when only one PV exists', () => {
    const wrapper = mount(CriticalLines, {
      props: { multiPvs: [{ id: '1', score: '+0.5', moves: ['e4'] }] },
      global: {
        plugins: [createTestingPinia({ 
          createSpy: vi.fn,
          initialState: { settings: { analysisShowCriticalLines: true } }
        })]
      }
    })
    expect(wrapper.find('.alt-lines-compact').exists()).toBe(false)
  })
})
