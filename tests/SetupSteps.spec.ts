import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import OpponentStep from '../src/components/play/setup/OpponentStep.vue'
import ParameterStep from '../src/components/play/setup/ParameterStep.vue'

describe('OpponentStep.vue', () => {
  const activeBot = {
    id: 'maya',
    name: 'Maya',
    avatar: 'maya.png',
    rating: 1200,
    mortalArchetype: 'The Mortal',
    traits: ['Tactical', 'Human-like'],
    backstory: 'A friendly bot.',
    depth: 5,
    contempt: 0
  }

  it('renders bot details and toggleable drawer correctly', async () => {
    const wrapper = mount(OpponentStep, {
      props: { activeBot }
    })
    
    // Check main details
    expect(wrapper.find('h3').text()).toBe('Maya')
    expect(wrapper.find('.classification').text()).toContain('THE MORTAL')
    expect(wrapper.find('.bot-lore').text()).toBe('A friendly bot.')
    
    // Check renamed labels
    expect(wrapper.find('.mini-stats').text()).toContain('FORESIGHT')
    expect(wrapper.find('.mini-stats').text()).toContain('5 / 16 moves')
    expect(wrapper.find('.mini-stats').text()).not.toContain('plies')
    expect(wrapper.find('.mini-stats').text()).not.toContain('DEPTH')

    // Check inline descriptions
    expect(wrapper.find('.mini-stats').text()).toContain('The number of moves the adversary looks ahead')
    expect(wrapper.find('.mini-stats').text()).toContain('Determines how much the bot avoids draws')

    // Check drawer container structure
    const drawer = wrapper.find('.details-drawer')
    expect(drawer.exists()).toBe(true)
    expect(drawer.classes()).not.toContain('open')
    
    // Check toggle behavior
    const toggleBtn = wrapper.find('.intel-toggle-btn')
    expect(toggleBtn.text()).toContain('VIEW INTEL')
    
    await toggleBtn.trigger('click')
    expect(drawer.classes()).toContain('open')
    expect(toggleBtn.text()).toContain('COLLAPSE INTEL')
  })

  it('emits prev/next events', async () => {
    const wrapper = mount(OpponentStep, {
      props: { activeBot }
    })
    await wrapper.find('.nav-arrow.left').trigger('click')
    expect(wrapper.emitted('prev')).toBeTruthy()
    await wrapper.find('.nav-arrow.right').trigger('click')
    expect(wrapper.emitted('next')).toBeTruthy()
  })
})

describe('ParameterStep.vue', () => {
  const colors = [
    { value: 'w', icon: '♔', label: 'White' },
    { value: 'b', icon: '♚', label: 'Black' }
  ]
  const timeControls = [
    { label: '10+5', time: 600, inc: 5 },
    { label: '3+2', time: 180, inc: 2 }
  ]

  it('renders color and time options', () => {
    const wrapper = mount(ParameterStep, {
      props: {
        selectedColor: 'w',
        colors,
        selectedTc: timeControls[0],
        timeControls
      }
    })
    expect(wrapper.findAll('.color-btn')).toHaveLength(2)
    expect(wrapper.findAll('.tc-btn')).toHaveLength(2)
    expect(wrapper.find('.color-btn.active').text()).toContain('White')
    expect(wrapper.find('.tc-btn.active').text()).toContain('10+5')
  })

  it('emits updateColor and updateTc events', async () => {
    const wrapper = mount(ParameterStep, {
      props: {
        selectedColor: 'w',
        colors,
        selectedTc: timeControls[0],
        timeControls
      }
    })
    await wrapper.findAll('.color-btn')[1].trigger('click')
    expect(wrapper.emitted('updateColor')![0]).toEqual(['b'])
    
    await wrapper.findAll('.tc-btn')[1].trigger('click')
    expect(wrapper.emitted('updateTc')![0]).toEqual([timeControls[1]])
  })
})
