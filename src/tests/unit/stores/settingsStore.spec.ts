import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '../../../stores/settingsStore'
import { Storage, StorageKey } from '../../../utils/storage'

// Mock Storage
vi.mock('../../../utils/storage', () => ({
  Storage: {
    get: vi.fn((key, def) => def),
    set: vi.fn()
  },
  StorageKey: {
    ANALYSIS_SHOW_SUGGESTIONS: 'kf_analysis_show_suggestions',
    ANALYSIS_SHOW_COACH: 'kf_analysis_show_coach',
    ANALYSIS_SHOW_POSITIONAL_HEALTH: 'kf_analysis_show_positional_health',
    ANALYSIS_SHOW_CRITICAL_LINES: 'kf_analysis_show_critical_lines',
    ANALYSIS_SHOW_EVAL_BAR: 'kf_analysis_show_eval_bar',
    SHOW_BEST_MOVE_ARROW: 'kf_show_best_move_arrow',
    SHOW_THREAT_ARROW: 'kf_show_threat_arrow'
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

  it('persists changes to storage when toggled', async () => {
    const settings = useSettingsStore()
    
    settings.analysisShowSuggestions = false
    
    // We expect Storage.set to be called (usually debounced or via watcher)
    // Since we have a watcher in the store, we wait for next tick if necessary
    expect(Storage.set).toHaveBeenCalledWith(
      'kf_analysis_show_suggestions', 
      false
    )
  })
})
