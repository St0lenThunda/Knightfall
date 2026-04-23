import { ref } from 'vue'
import { LlmService } from '../../../services/llmService'
import { logger } from '../../../utils/logger'

interface InsightTask {
  fen: string
  theme: string
  severity: string
  gameId: string
  attempts: number
}

/**
 * Analysis Insights Module
 * Manages the serial Gemini queue with exponential backoff retries.
 */
export function useAnalysisInsights() {
  const insightQueue = ref<InsightTask[]>([])
  const isInsightProcessing = ref(false)

  /**
   * Adds an insight task to the queue
   */
  function queueInsight(task: Omit<InsightTask, 'attempts'>) {
    insightQueue.value.push({ ...task, attempts: 0 })
    processQueue()
  }

  /**
   * Serial processor for the insight queue
   */
  async function processQueue() {
    if (isInsightProcessing.value || insightQueue.value.length === 0) return
    isInsightProcessing.value = true

    const task = insightQueue.value.shift()
    if (!task) {
      isInsightProcessing.value = false
      return
    }

    try {
      logger.info(`[Intel Hub] AI Insight Pass: ${task.theme} (Attempt ${task.attempts + 1})`)
      
      const explanation = await LlmService.explainMistake({
        fen: task.fen,
        bestMove: 'N/A',
        playedMove: 'N/A',
        theme: task.theme,
        severity: task.severity,
        isManualTrigger: true
      })

      // Update the cache if we have a valid result
      if (explanation) {
        // We need to find the game in the global library context to update it.
        // This will be handled by the orchestrator by listening to 'insight-complete'
        // or by passing a reference. For simplicity here, we use a custom event.
        window.dispatchEvent(new CustomEvent('knightfall-insight-complete', {
          detail: { gameId: task.gameId, fen: task.fen, explanation }
        }))
      }
    } catch (err) {
      logger.warn(`[Intel Hub] AI Insight failed for ${task.theme}:`, err)
      
      // RETRY LOGIC: Exponential backoff (max 3 retries)
      if (task.attempts < 3) {
        task.attempts++
        const delay = Math.pow(2, task.attempts) * 2000
        logger.info(`[Intel Hub] Retrying insight in ${delay}ms...`)
        setTimeout(() => {
          insightQueue.value.push(task)
          processQueue()
        }, delay)
      } else {
        logger.error(`[Intel Hub] Permanent failure for insight: ${task.theme}`)
      }
    } finally {
      isInsightProcessing.value = false
      // Cool down delay before next task
      setTimeout(() => processQueue(), 500)
    }
  }

  /**
   * Purges the queue (Safe-Stop)
   */
  function clearInsights() {
    insightQueue.value = []
  }

  return {
    insightQueue,
    queueInsight,
    clearInsights
  }
}
