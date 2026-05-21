import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalysisArrows } from '../../../composables/analysis/useAnalysisArrows'
import { useEngineStore } from '../../../stores/engineStore'
import { useSettingsStore } from '../../../stores/settingsStore'

describe('useAnalysisArrows Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('generates best move arrow when enabled', () => {
    const engineStore = useEngineStore()
    const settings = useSettingsStore()
    
    settings.showBestMoveArrow = true
    engineStore.bestMove = 'e2e4'
    
    const { engineArrows } = useAnalysisArrows()
    expect(engineArrows.value).toContainEqual({
      from: 'e2',
      to: 'e4',
      type: 'suggestion'
    })
  })

  it('hides best move arrow when disabled', () => {
    const engineStore = useEngineStore()
    const settings = useSettingsStore()
    
    settings.showBestMoveArrow = false
    engineStore.bestMove = 'e2e4'
    
    const { engineArrows } = useAnalysisArrows()
    expect(engineArrows.value.some(a => a.type === 'suggestion')).toBe(false)
  })

  it('generates threat arrow when enabled', () => {
    const engineStore = useEngineStore()
    const settings = useSettingsStore()
    
    settings.showThreatArrow = true
    engineStore.pv = ['e2e4', 'e7e5'] // Opponent threat is move 2
    
    const { engineArrows } = useAnalysisArrows()
    expect(engineArrows.value).toContainEqual({
      from: 'e7',
      to: 'e5',
      type: 'threat'
    })
  })

  it('hides threat arrow when disabled', () => {
    const engineStore = useEngineStore()
    const settings = useSettingsStore()
    
    settings.showThreatArrow = false
    engineStore.pv = ['e2e4', 'e7e5']
    
    const { engineArrows } = useAnalysisArrows()
    expect(engineArrows.value.some(a => a.type === 'threat')).toBe(false)
  })
})
