<template>
  <!--
    CoachPanel: Extracts the LLM AI coaching UI and logic from AnalysisView.
    Handles caching, debounced API calls to Gemini, and markdown rendering.
  -->
  <div class="coaching-section">
    <div v-if="isCoachThinking" class="coach-thinking-compact">
      <div class="spinner"></div>
      <span>Generating Insights...</span>
    </div>
    <div v-else-if="coachResponse" class="coach-prose-wrap animated-fade-in">
      <div class="prose-header">ANALYSIS</div>
      <div class="coach-markdown" v-html="renderedCoach"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useEngineStore } from '../stores/engineStore'
import { generateCoaching } from '../api/llmApi'
import { renderMarkdown } from '../utils/markdown'
import { logger } from '../utils/logger'

const store = useGameStore()
const libraryStore = useLibraryStore()
const engineStore = useEngineStore()

const isCoachThinking = ref(false)
const coachResponse = ref<string | null>(null)

const renderedCoach = computed(() => renderMarkdown(coachResponse.value))

const currentGame = computed(() => {
  if (!store.loadedGameId) return null
  return libraryStore.gamesMap.get(store.loadedGameId) || null
})

const playerNames = computed(() => {
  const headers = store.chess.header()
  const w = headers.White
  const b = headers.Black
  return {
      white: (w && w !== '?') ? w : 'White',
      black: (b && b !== '?') ? b : 'Black',
  }
})

const comparisonData = computed(() => {
  if (store.moveHistory.length === 0) return null
  const idx = store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex
  
  const playedMove = store.moveHistory[idx]
  const beforeFen = idx > 0 ? store.moveHistory[idx - 1].fen : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  
  return { playedMove, beforeFen, moveNumber: idx + 1 }
})

const hasGame = computed(() => store.moveHistory.length > 0)

async function askCoach() {
  const currentViewIndex = store.viewIndex
  logger.info(`[Coach] Interaction started for move idx: ${currentViewIndex}`)

  if (!hasGame.value || !comparisonData.value) {
    logger.info(`[Coach] Aborting: No game or comparison data.`)
    coachResponse.value = null
    isCoachThinking.value = false
    return
  }
  
  const { playedMove, beforeFen } = comparisonData.value
  const currentFen = playedMove.fen

  // CHECK CACHE
  if (currentGame.value) {
      if (currentGame.value.analysisCache && currentGame.value.analysisCache[currentFen]) {
          logger.info(`[Coach] Cache Hit for FEN: ${currentFen.substring(0, 20)}...`)
          coachResponse.value = currentGame.value.analysisCache[currentFen]
          isCoachThinking.value = false
          return
      }
  }

  isCoachThinking.value = true
  coachResponse.value = null

  try {
      logger.info(`[Coach] Waiting for engine (target depth 3)... Current: ${engineStore.currentDepth}`)
      let waitCount = 0
      while (engineStore.currentDepth < 3 && waitCount < 10) {
          if (store.viewIndex !== currentViewIndex) {
              logger.info(`[Coach] Request cancelled (user moved to ${store.viewIndex})`)
              return
          }
          await new Promise(r => setTimeout(r, 60))
          waitCount++
      }

      logger.info(`[Coach] Engine ready (Depth: ${engineStore.currentDepth}). Triggering LLM...`)
      if (store.viewIndex !== currentViewIndex) {
          logger.info(`[Coach] Aborted before LLM: viewIndex changed from ${currentViewIndex} to ${store.viewIndex}`)
          return
      }

      const sideIdx = (store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex)
      const side = sideIdx % 2 === 0 ? 'White' : 'Black'
      const playerName = side === 'White' ? playerNames.value.white : playerNames.value.black
      const opponentName = side === 'White' ? playerNames.value.black : playerNames.value.white
      const bestMove = engineStore.suggestedMove || 'unknown'
      const eval_ = engineStore.evalNumber

      logger.info(`[Coach] Calling generateCoaching for player: ${playerName}`)

      const response = await generateCoaching({
        fen: beforeFen,
        evalNumber: eval_,
        pv: engineStore.pv,
        moveSan: playedMove.san,
        moveNumber: playedMove.moveNumber,
        side,
        bestMove,
        playerName,
        opponentName
      })

      if (store.viewIndex !== currentViewIndex) {
          logger.info(`[Coach] LLM response received but ignored (late arrival).`)
          return
      }

      logger.info(`[Coach] LLM Response successfully received.`)
      coachResponse.value = response

      // PERSIST TO CACHE
      if (store.loadedGameId && response) {
          libraryStore.updateGameAnalysis(store.loadedGameId, currentFen, response)
      }
  } catch (err) {
      if (store.viewIndex !== currentViewIndex) return
      logger.error('[Coach] Failed:', err)
      coachResponse.value = "The AI coach encountered a momentary lapse. Try selecting this move again!"
  } finally {
      if (store.viewIndex === currentViewIndex) {
          isCoachThinking.value = false
          logger.info(`[Coach] Request finished for move idx: ${currentViewIndex}`)
      }
  }
}

// Reset coaching panel and re-analyze whenever the selected move changes
let analysisDebounce: any = null
watch(() => [store.viewIndex, store.loadedGameId], () => {
  coachResponse.value = null
  isCoachThinking.value = true
  
  if (analysisDebounce) clearTimeout(analysisDebounce)
  
  analysisDebounce = setTimeout(() => {
    if (comparisonData.value) {
      askCoach()
    } else {
      isCoachThinking.value = false
    }
  }, 100)
}, { deep: false })

</script>

<style scoped>
.coach-thinking-compact { display: flex; align-items: center; gap: 12px; padding: var(--space-4); color: var(--text-muted); font-size: 0.85rem; }
.spinner { width: 16px; height: 16px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.coach-prose-wrap { overflow-y: auto; max-height: 300px; }
.prose-header { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; }

.coach-markdown { font-size: 0.9rem; line-height: 1.7; color: var(--text-secondary); }
.coach-markdown :deep(h1),
.coach-markdown :deep(h2),
.coach-markdown :deep(h3) { color: var(--text-primary); font-weight: 800; margin: 12px 0 6px; }
.coach-markdown :deep(h1) { font-size: 1.1rem; }
.coach-markdown :deep(h2) { font-size: 1rem; }
.coach-markdown :deep(h3) { font-size: 0.92rem; color: var(--accent-bright); }
.coach-markdown :deep(p) { margin: 6px 0; }
.coach-markdown :deep(strong) { color: var(--text-primary); font-weight: 700; }
.coach-markdown :deep(em) { font-style: italic; color: var(--text-muted); }
.coach-markdown :deep(ul),
.coach-markdown :deep(ol) { padding-left: 1.4em; margin: 6px 0; }
.coach-markdown :deep(li) { margin-bottom: 4px; }
.coach-markdown :deep(code) {
  background: rgba(139, 92, 246, 0.15);
  color: var(--accent-bright);
  padding: 1px 5px;
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 0.85em;
}
.coach-markdown :deep(blockquote) {
  border-left: 3px solid var(--accent);
  padding-left: 12px;
  margin: 8px 0;
  color: var(--text-muted);
  font-style: italic;
}
.coach-markdown :deep(hr) { border: none; border-top: 1px solid var(--border); margin: 12px 0; }
</style>
