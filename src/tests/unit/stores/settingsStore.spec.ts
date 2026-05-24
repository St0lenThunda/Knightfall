import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '../../../stores/settingsStore'
import { Storage } from '../../../utils/storage'
import { nextTick } from 'vue'

// Mock Storage
vi.mock('../../../utils/storage', () => ({
  Storage: {
    get: vi.fn((_key, def) => def),
    set: vi.fn()
  },
  StorageKey: {
    BOARD_THEME: 'kf_board_theme',
    PIECE_THEME: 'kf_piece_theme',
    SOUND_ENABLED: 'kf_sound_enabled',
    ENGINE_MULTI_PV: 'kf_engine_multi_pv',
    ANALYSIS_DEPTH: 'kf_analysis_depth',
    ANIMATION_SPEED: 'kf_animation_speed',
    COACH_PERSONALITY: 'kf_coach_personality',
    SHOW_BEST_MOVE_ARROW: 'kf_show_best_move_arrow',
    SHOW_THREAT_ARROW: 'kf_show_threat_arrow',
    MOVE_ANIMATION_EFFECT: 'kf_move_animation_effect',
    MOVE_ANIMATION_DENSITY: 'kf_move_animation_density',
    MOVE_ANIMATION_LENGTH: 'kf_move_animation_length',
    ANALYSIS_SHOW_SUGGESTIONS: 'kf_analysis_show_suggestions',
    ANALYSIS_SHOW_COACH: 'kf_analysis_show_coach',
    ANALYSIS_SHOW_POSITIONAL_HEALTH: 'kf_analysis_show_positional_health',
    ANALYSIS_SHOW_CRITICAL_LINES: 'kf_analysis_show_critical_lines',
    ANALYSIS_SHOW_EVAL_BAR: 'kf_analysis_show_eval_bar'
  }
}))

describe('SettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with all analysis layers enabled by default', () => {
    const settings = useSettingsStore()
    
    expect(settings.analysisShowSuggestions).toBe(true)
    expect(settings.analysisShowCoach).toBe(true)
    expect(settings.analysisShowPositionalHealth).toBe(true)
    expect(settings.analysisShowCriticalLines).toBe(true)
    expect(settings.analysisShowEvalBar).toBe(true)
    expect(settings.showBestMoveArrow).toBe(true)
    expect(settings.showThreatArrow).toBe(true)
  })

  it('initializes with default move animation trail options', () => {
    const settings = useSettingsStore()
    
    expect(settings.moveAnimationEffect).toBe('none')
    expect(settings.moveAnimationDensity).toBe('medium')
    expect(settings.moveAnimationLength).toBe('normal')
  })

  it('persists changes to storage when toggled', async () => {
    const settings = useSettingsStore()
    
    settings.analysisShowSuggestions = false
    
    // We wait for Vue's nextTick so that the watcher triggers the Storage.set call
    await nextTick()
    
    expect(Storage.set).toHaveBeenCalledWith(
      'kf_analysis_show_suggestions', 
      false
    )
  })

  it('persists changes to move animation density and length when updated', async () => {
    const settings = useSettingsStore()
    
    settings.moveAnimationDensity = 'high'
    settings.moveAnimationLength = 'long'
    
    await nextTick()
    
    expect(Storage.set).toHaveBeenCalledWith(
      'kf_move_animation_density',
      'high'
    )
    expect(Storage.set).toHaveBeenCalledWith(
      'kf_move_animation_length',
      'long'
    )
  })
})
