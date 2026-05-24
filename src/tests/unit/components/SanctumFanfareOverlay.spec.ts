import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import SanctumFanfareOverlay from '../../../components/sanctum/SanctumFanfareOverlay.vue'

/**
 * SanctumFanfareOverlay Unit Tests
 * 
 * Verifies that the celebratory overlay renders correct statistics, badge details,
 * and emits the proper 'close' event when the user claims their title.
 */
describe('SanctumFanfareOverlay.vue', () => {
  const createWrapper = () => {
    return mount(SanctumFanfareOverlay, {
      global: {
        plugins: [createTestingPinia({ 
          createSpy: vi.fn,
          initialState: {
            user: {
              profile: { id: 'test-user', xp: 500 }
            }
          }
        })]
      }
    })
  }

  it('renders celebration title and badge name correctly', () => {
    const wrapper = createWrapper()
    
    // Validate key text achievements are present
    expect(wrapper.find('.celebration-title').text()).toBe('Sanctum Conquered')
    expect(wrapper.find('.unlock-name').text()).toBe('Sanctum Conqueror')
  })

  it('renders standard curriculum achievement statistics', () => {
    const wrapper = createWrapper()
    
    const statValues = wrapper.findAll('.stat-val').map(el => el.text())
    // Educational Note: The expanded curriculum now has 70 quests, 5 realms, and 5,000 total XP.
    expect(statValues).toContain('70')
    expect(statValues).toContain('5 / 5')
    expect(statValues).toContain('5,000')
  })

  it('emits close event when Claim Title is clicked', async () => {
    const wrapper = createWrapper()
    
    const claimBtn = wrapper.find('.glow-btn')
    expect(claimBtn.exists()).toBe(true)
    
    await claimBtn.trigger('click')
    
    // Assert emission happened
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')!.length).toBe(1)
  })
})
