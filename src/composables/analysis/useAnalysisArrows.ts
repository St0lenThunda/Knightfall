import { computed } from 'vue'
import { useEngineStore } from '../../stores/engineStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { type ArrowDef } from '../../components/board/ArrowLayer.vue'

/**
 * Pillar Composable: useAnalysisArrows
 * 
 * Generates visual arrows for the chess board based on the engine's 
 * primary suggestion, alternative variations, and opponent threats.
 */
export function useAnalysisArrows() {
  const engineStore = useEngineStore()
  const settings = useSettingsStore()

  const engineArrows = computed<ArrowDef[]>(() => {
    const arrows: ArrowDef[] = []
    
    // 1. Primary Suggestion Arrow
    if (settings.showBestMoveArrow && engineStore.suggestedMove) {
      const sm = engineStore.suggestedMove
      if (sm && sm.length >= 4) {
        arrows.push({ 
          from: sm.slice(0, 2), 
          to: sm.slice(2, 4), 
          type: 'suggestion' 
        })
      }
    }
    
    // 2. Alternative Variations (Multi-PV)
    if (settings.showBestMoveArrow && engineStore.multiPvs.length > 1) {
      engineStore.multiPvs.slice(1, 3).forEach(alt => {
        if (alt?.moves?.[0]?.length >= 4) {
          arrows.push({ 
            from: alt.moves[0].slice(0, 2), 
            to: alt.moves[0].slice(2, 4), 
            type: 'suggestion-alt' 
          })
        }
      })
    }
    
    // 3. Opponent Threat Arrow
    if (settings.showThreatArrow && engineStore.pv.length > 1) {
      const threatUci = engineStore.pv[1]
      if (threatUci?.length >= 4) {
        arrows.push({ 
          from: threatUci.slice(0, 2), 
          to: threatUci.slice(2, 4), 
          type: 'threat' 
        })
      }
    }
    
    return arrows
  })

  return {
    engineArrows
  }
}
