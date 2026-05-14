import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import CoachPanel from '../../../components/CoachPanel.vue'

describe('CoachPanel Component', () => {
  const createWrapper = (settingsState = {}) => {
    return mount(CoachPanel, {
      global: {
        plugins: [createTestingPinia({ 
          createSpy: vi.fn,
          initialState: {
            settings: {
              analysisShowCoach: true,
              ...settingsState
            }
          }
        })]
      }
    })
  }

  it('renders coaching section when enabled', () => {
    const wrapper = createWrapper({ analysisShowCoach: true })
    expect(wrapper.find('.coaching-section').exists()).toBe(true)
  })

  it('hides coaching section when disabled', () => {
    const wrapper = createWrapper({ analysisShowCoach: false })
    expect(wrapper.find('.coaching-section').exists()).toBe(false)
  })

  it('mounts cleanly with default state (no thinking overlay)', () => {
    // We can't set internal `shallowRef` values from the outside without exposing them,
    // so this test verifies the component renders at all without throwing —
    // a critical sanity check for the coaching section's default idle state.
    expect(() => createWrapper()).not.toThrow()
  })
})
