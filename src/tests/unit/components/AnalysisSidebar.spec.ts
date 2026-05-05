import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import AnalysisSidebar from '../../../components/analysis/AnalysisSidebar.vue'
import { useSettingsStore } from '../../../stores/settingsStore'

describe('AnalysisSidebar Component', () => {
  const defaultProps = {
    metrics: { material: 50, activity: 50, safety: 50 },
    diagnosis: { material: 'Good', activity: 'Active', safety: 'Safe' },
    isCollapsed: false
  }

  const createWrapper = () => {
    return mount(AnalysisSidebar, {
      props: defaultProps,
      global: {
        plugins: [createTestingPinia({ 
          createSpy: vi.fn,
          initialState: {
            settings: {
              analysisShowPositionalHealth: true
            }
          }
        })]
      }
    })
  }

  it('renders positional health footer when enabled', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.sidebar-footer').exists()).toBe(true)
    expect(wrapper.text()).toContain('POSITIONAL HEALTH')
  })

  it('hides positional health footer when disabled', async () => {
    const wrapper = createWrapper()
    const settings = useSettingsStore()
    settings.analysisShowPositionalHealth = false
    
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.sidebar-footer').exists()).toBe(false)
  })
})
