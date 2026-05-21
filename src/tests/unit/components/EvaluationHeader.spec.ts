import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import EvaluationHeader from '../../../components/analysis/EvaluationHeader.vue'
import { useSettingsStore } from '../../../stores/settingsStore'

describe('EvaluationHeader Component', () => {
  const defaultProps = {
    playerNames: {
      white: 'Magnus',
      whiteElo: '2850',
      black: 'Hikaru',
      blackElo: '2800'
    },
    evalNum: 0.5,
    evalPercent: 55,
    hasGame: true,
    moveQuality: null
  }

  const createWrapper = () => {
    return mount(EvaluationHeader, {
      props: defaultProps,
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })]
      }
    })
  }

  it('renders player names correctly', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Magnus')
    expect(wrapper.text()).toContain('Hikaru')
  })

  it('displays evaluation number with correct sign', () => {
    const wrapper = createWrapper()
    const evalNumEl = wrapper.find('.eval-num')
    expect(evalNumEl.text()).toBe('+0.5')
  })

  it('hides eval bar when analysisShowEvalBar is false', async () => {
    const wrapper = createWrapper()
    const settings = useSettingsStore()
    
    expect(wrapper.find('.eval-bar-horizontal').exists()).toBe(true)
    
    settings.analysisShowEvalBar = false
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.eval-bar-horizontal').exists()).toBe(false)
  })

  it('updates bar width based on evalPercent', () => {
    // We must seed `analysisShowEvalBar: true` because the eval bar is wrapped in
    // `v-if="settings.analysisShowEvalBar"`. Without it, `createTestingPinia`
    // defaults the value to `undefined`, hiding `.eval-bar-horizontal` and its
    // child `.eval-fill` before we ever get to inspect the style binding.
    const wrapper = mount(EvaluationHeader, { 
      props: { ...defaultProps, evalPercent: 75 },
      global: {
        plugins: [createTestingPinia({ 
          createSpy: vi.fn,
          initialState: { settings: { analysisShowEvalBar: true } }
        })]
      }
    })
    const fill = wrapper.find('.eval-fill')
    expect(fill.attributes('style')).toContain('width: 75%')
  })
})
