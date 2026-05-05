import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import AnalysisControls from '../../../components/analysis/AnalysisControls.vue'
import { useSettingsStore } from '../../../stores/settingsStore'

describe('AnalysisControls Component', () => {
  const defaultProps = {
    currentDepth: 20,
    isCloudScanning: false,
    hasCloudData: false,
    isPlaying: false,
    pauseReason: null,
    selectedMoveLabel: 'Move 1',
    suggestedMove: 'e4',
    evalNum: 0.5,
    multiPvs: []
  }

  const createWrapper = (props = {}) => {
    return mount(AnalysisControls, {
      props: { ...defaultProps, ...props },
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })]
      }
    })
  }

  it('hides Deep Scan button when hasCloudData is false', () => {
    const wrapper = createWrapper({ hasCloudData: false })
    expect(wrapper.find('.btn-outline').exists()).toBe(false)
  })

  it('shows Deep Scan button when hasCloudData is true', () => {
    const wrapper = createWrapper({ hasCloudData: true })
    expect(wrapper.find('.btn-outline').exists()).toBe(true)
    expect(wrapper.text()).toContain('Deep Scan')
  })

  it('shows scanning state when isCloudScanning is true', () => {
    const wrapper = createWrapper({ hasCloudData: true, isCloudScanning: true })
    expect(wrapper.text()).toContain('Scanning...')
  })

  it('toggles visibility menu when key button is clicked', async () => {
    const wrapper = createWrapper()
    const keyBtn = wrapper.find('.btn-key')
    
    expect(wrapper.find('.visibility-menu').exists()).toBe(false)
    await keyBtn.trigger('click')
    expect(wrapper.find('.visibility-menu').exists()).toBe(true)
  })

  it('emits navigation events correctly', async () => {
    const wrapper = createWrapper()
    const navButtons = wrapper.findAll('.nav-btn-sm')
    
    await navButtons[0].trigger('click') // First
    expect(wrapper.emitted('firstMove')).toBeTruthy()
    
    await navButtons[1].trigger('click') // Prev
    expect(wrapper.emitted('prevMove')).toBeTruthy()
  })
})
