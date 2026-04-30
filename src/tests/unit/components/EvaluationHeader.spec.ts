import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvaluationHeader from '../../../components/analysis/EvaluationHeader.vue'

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

  it('renders player names correctly', () => {
    const wrapper = mount(EvaluationHeader, { props: defaultProps })
    expect(wrapper.text()).toContain('Magnus')
    expect(wrapper.text()).toContain('Hikaru')
  })

  it('displays evaluation number with correct sign', () => {
    const wrapper = mount(EvaluationHeader, { props: defaultProps })
    const evalNumEl = wrapper.find('.eval-num')
    expect(evalNumEl.text()).toBe('+0.5')
  })

  it('formats mate evaluations correctly', () => {
    const wrapper = mount(EvaluationHeader, { 
      props: { ...defaultProps, evalNum: 95 } // Over 90 means mate in the component logic
    })
    const evalNumEl = wrapper.find('.eval-num')
    expect(evalNumEl.text()).toBe('M+')
  })

  it('applies negative class for black advantage', () => {
    const wrapper = mount(EvaluationHeader, { 
      props: { ...defaultProps, evalNum: -1.2 } 
    })
    const evalNumEl = wrapper.find('.eval-num')
    expect(evalNumEl.classes()).toContain('negative')
    expect(evalNumEl.text()).toBe('-1.2')
  })

  it('updates bar width based on evalPercent', () => {
    const wrapper = mount(EvaluationHeader, { 
      props: { ...defaultProps, evalPercent: 75 } 
    })
    const fill = wrapper.find('.eval-fill')
    expect(fill.attributes('style')).toContain('width: 75%')
  })
})
