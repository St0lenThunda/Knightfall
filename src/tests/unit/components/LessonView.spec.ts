import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import LessonView from '../../../views/LessonView.vue'
import { useGameStore } from '../../../stores/gameStore'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { id: 'double-check-101' }
  }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn()
  })
}))

// Mock the puzzle fetch API
vi.mock('../../../api/puzzleApi', () => ({
  fetchPuzzleBatch: vi.fn().mockResolvedValue([
    { id: 'p1', fen: 'k7/P7/1K6/8/8/8/8/r7 b - - 0 1', solution: ['a1a7'], explanation: 'Tip 1' },
    { id: 'p2', fen: 'k7/P7/1K6/8/8/8/8/r7 b - - 0 1', solution: ['a1a7'], explanation: 'Tip 2' },
    { id: 'p3', fen: 'k7/P7/1K6/8/8/8/8/r7 b - - 0 1', solution: ['a1a7'], explanation: 'Tip 3' },
    { id: 'p4', fen: 'k7/P7/1K6/8/8/8/8/r7 b - - 0 1', solution: ['a1a7'], explanation: 'Tip 4' },
    { id: 'p5', fen: 'k7/P7/1K6/8/8/8/8/r7 b - - 0 1', solution: ['a1a7'], explanation: 'Tip 5' }
  ])
}))

describe('LessonView Component - Duolingo Lesson Flow', () => {
  const createWrapper = () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: true,
      initialState: {
        game: {
          drillIndex: 0,
          mistakeCount: 0,
          gameStarted: false,
          playerColor: 'w'
        },
        user: {
          hearts: 5,
          profile: { id: 'test-user' }
        },
        curriculum: {
          quests: [
            { id: 'double-check-101', title: 'Double Check', icon: '⚔️', description: 'Double check quest desc', xp_reward: 100 }
          ],
          personalLessons: []
        }
      }
    })
    
    return mount(LessonView, {
      global: {
        plugins: [pinia],
        stubs: {
          ChessBoard: true,
          OutOfHeartsOverlay: true
        }
      }
    })
  }

  it('renders concept explanation slide initially for the first step', async () => {
    const wrapper = createWrapper()
    await nextTick()
    
    // The concept presentation (isExplanationMode = true) should be displayed
    expect(wrapper.find('.explanation-slide').exists()).toBe(true)
    expect(wrapper.find('.explanation-slide h2').text()).toBe('Double Check')
    expect(wrapper.find('.explanation-slide button').text()).toBe('Start Exercise')
  })

  it('switches to interactive drill when Start Exercise is clicked', async () => {
    const wrapper = createWrapper()
    await nextTick()
    
    const startBtn = wrapper.find('.explanation-slide button')
    await startBtn.trigger('click')
    
    // Now it should be in interactive play mode, showing "Find the Best Move"
    expect(wrapper.find('.explanation-slide').exists()).toBe(false)
    expect(wrapper.find('.drill-info').exists()).toBe(true)
    expect(wrapper.find('.drill-info h3').text()).toBe('Find the Best Move')
  })

  it('computes correct hint arrows on steps 1-4 but returns empty for step 5 (Evaluation Mode)', async () => {
    const wrapper = createWrapper()
    await nextTick()
    
    // Force set the puzzles on the vm
    const vm = wrapper.vm as any
    vm.puzzles = [
      { id: 'p1', fen: 'k7/P7/1K6/8/8/8/8/r7 b - - 0 1', solution: ['a1a7'], explanation: 'Tip 1' },
      { id: 'p2', fen: 'k7/P7/1K6/8/8/8/8/r7 b - - 0 1', solution: ['a1a7'], explanation: 'Tip 2' },
      { id: 'p3', fen: 'k7/P7/1K6/8/8/8/8/r7 b - - 0 1', solution: ['a1a7'], explanation: 'Tip 3' },
      { id: 'p4', fen: 'k7/P7/1K6/8/8/8/8/r7 b - - 0 1', solution: ['a1a7'], explanation: 'Tip 4' },
      { id: 'p5', fen: 'k7/P7/1K6/8/8/8/8/r7 b - - 0 1', solution: ['a1a7'], explanation: 'Tip 5' }
    ]

    // 1. Puzzle index 0 (1st puzzle), player turn (drillIndex = 0) -> hint should point a1 to a7
    vm.currentPuzzleIndex = 0
    const store = useGameStore()
    store.drillIndex = 0
    expect(vm.hintArrows).toEqual([{ from: 'a1', to: 'a7', type: 'suggestion' }])

    // 2. Puzzle index 0, opponent turn (drillIndex = 1) -> hint should be empty
    store.drillIndex = 1
    expect(vm.hintArrows).toEqual([])

    // 3. Puzzle index 4 (5th/final puzzle), player turn -> hint should be empty (Evaluation Mode)
    vm.currentPuzzleIndex = 4
    store.drillIndex = 0
    expect(vm.hintArrows).toEqual([])
  })

  it('renders Evaluation Mode locked layout instead of Coach Tips on step 5', async () => {
    const wrapper = createWrapper()
    await nextTick()
    
    const vm = wrapper.vm as any
    vm.isExplanationMode = false
    vm.currentPuzzleIndex = 4 // 5th puzzle
    await nextTick()

    // Title should be "Final Evaluation" and warning message must contain "Evaluation Mode"
    expect(wrapper.find('.drill-info h3').text()).toBe('Final Evaluation')
    expect(wrapper.find('.evaluation-warning').exists()).toBe(true)
    expect(wrapper.find('.evaluation-warning').text()).toContain('No hints or coach tips are available')
  })
})
