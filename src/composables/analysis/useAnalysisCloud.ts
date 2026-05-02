import { ref } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { useEngineStore } from '../../stores/engineStore'
import { useUiStore } from '../../stores/uiStore'
import { fetchCloudEval } from '../../api/lichessApi'

/**
 * Pillar Composable: useAnalysisCloud
 * 
 * Manages interaction with the Lichess Cloud Evaluation API.
 * Allows the user to fetch high-depth evaluations for common positions.
 */
export function useAnalysisCloud() {
  const store = useGameStore()
  const engineStore = useEngineStore()
  const uiStore = useUiStore()
  const isCloudScanning = ref(false)

  /**
   * Fetches evaluation data from the Lichess Cloud API and injects it 
   * into the local engine store if found.
   */
  async function deepCloudScan() {
    if (isCloudScanning.value) return
    isCloudScanning.value = true
    uiStore.addToast('Initiating Deep Cloud Scan...', 'info')
    
    try {
      const fen = store.fen
      const cloudData = await fetchCloudEval(fen)
      
      if (cloudData && cloudData.pvs && cloudData.pvs.length > 0) {
        // Stop local calculation to prioritize cloud data
        engineStore.stop() 
        
        const topPv = cloudData.pvs[0]
        
        // Inject cloud accuracy directly into the engine's reactive state
        engineStore.evalScoreCp = topPv.cp || 0
        engineStore.evalMate = topPv.mate || null
        engineStore.currentDepth = cloudData.depth || 40
        engineStore.bestMove = topPv.moves?.split(' ')[0] || ''
        engineStore.pv = topPv.moves?.split(' ') || []
        engineStore.isAnalyzing = false
        
        uiStore.addToast(`Cloud Scan Complete: Depth ${cloudData.depth} evaluation injected.`, 'success')
      } else {
        uiStore.addToast('No Cloud Eval found for this position.', 'warning')
      }
    } catch (err) {
      uiStore.addToast('Deep Scan aborted (Lichess Rate Limit).', 'error')
    } finally {
      isCloudScanning.value = false
    }
  }

  return {
    isCloudScanning,
    deepCloudScan
  }
}
