import { describe, it, expect, beforeEach, vi } from 'vitest'
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
    const wrapper = mount(EvaluationHeader, { 
      props: { ...defaultProps, evalPercent: 75 },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })]
      }
    })
    const fill = wrapper.find('.eval-fill')
    expect(fill.attributes('style')).toContain('width: 75%')
  })
})
