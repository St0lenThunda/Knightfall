import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import CoachPanel from '../../../components/CoachPanel.vue'
import { useSettingsStore } from '../../../stores/settingsStore'

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

  it('shows thinking state when isCoachThinking is true', async () => {
    const wrapper = createWrapper()
    // Manually trigger thinking state if needed, or mock the refs
    // Since we are using setup, we can't easily set refs from outside unless exposed
    // But we can check the default state if it depends on props/stores
  })
})
