<template>
  <!--
    CoachPanel: Extracts the LLM AI coaching UI and logic from AnalysisView.
    Handles caching, debounced API calls to Gemini, and markdown rendering.
  -->
  <div class="coaching-section">
    <!-- Level 1 Deterministic Tag removed from here, emitted to parent instead -->

    <div v-if="isCoachThinking" class="coach-thinking-compact">
      <div class="spinner"></div>
      <span>Generating Deep Insights...</span>
    </div>
    <div v-else-if="coachResponse" class="coach-prose-wrap animated-fade-in">
      <div class="prose-header">
        <span>COACH'S TAKE</span>
      </div>
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
import { TaggingService, type TaggedMistake } from '../services/taggingService'
import { useAdminStore } from '../stores/adminStore'
import { useUserStore } from '../stores/userStore'

const store = useGameStore()
const libraryStore = useLibraryStore()
const engineStore = useEngineStore()
const userStore = useUserStore()

const emit = defineEmits(['update:tag'])

const isCoachThinking = ref(false)
const coachResponse = ref<string | null>(null)
const deterministicTag = ref<TaggedMistake | null>(null)

const renderedCoach = computed(() => renderMarkdown(coachResponse.value))

const currentGame = computed(() => {
  if (!store.loadedGameId) return null
  return libraryStore.gamesMap.get(store.loadedGameId) || null
})

const playerNames = computed(() => {
  const headers = store.chess.header()
  let w = (headers.White && headers.White !== '?') ? headers.White : 'White'
  let b = (headers.Black && headers.Black !== '?') ? headers.Black : 'Black'

  // 1. Prioritize Library Game metadata (more stable than PGN headers)
  if (currentGame.value) {
    if (w === 'White' || w === 'Unknown' || w === '?') w = currentGame.value.white
    if (b === 'Black' || b === 'Unknown' || b === '?') b = currentGame.value.black
  }

  // 2. Resolve 'White'/'Black' to the user's name if authenticated
  const myUsername = userStore.profile?.username || userStore.displayName
  if ((w === 'White' || w === 'Unknown') && userStore.isAuthenticated) w = myUsername
  if ((b === 'Black' || b === 'Unknown') && userStore.isAuthenticated) b = myUsername
  
  return { white: w, black: b }
})

const userSide = computed(() => {
  const myUsername = userStore.profile?.username
  if (!myUsername) return 'White' // Default for guests
  if (playerNames.value.white === myUsername) return 'White'
  if (playerNames.value.black === myUsername) return 'Black'
  return 'White' // Default fallback
})




const comparisonData = computed(() => {
  if (store.moveHistory.length === 0) return null
  const idx = store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex
  
  const playedMove = store.moveHistory[idx]
  const beforeFen = idx > 0 ? store.moveHistory[idx - 1].fen : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  
  return { playedMove, beforeFen, moveNumber: idx + 1 }
})

/**
 * DETERMINISTIC TAGGING (Level 1 Intelligence)
 * 
 * Compares the eval of the position BEFORE a move to the eval AFTER.
 * Eval sources (in priority order):
 *   1. Pre-computed evals from the library's post-game fast scan
 *   2. Live-cached evals from prior navigation in this session
 *   3. Heuristic: use the engine's live eval of the current position
 * 
 * The engine evaluates the position you're CURRENTLY viewing. So when
 * viewing move N, engineStore gives us eval(position_N). We need 
 * eval(position_{N-1}) to compute the delta — that comes from the
 * moveHistory cache.
 */

// Cache the engine eval onto the current move whenever analysis finishes
watch(() => engineStore.isAnalyzing, (busy) => {
  if (busy) return // Still thinking
  const idx = store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex
  if (idx >= 0 && store.moveHistory[idx]) {
    store.moveHistory[idx].eval = engineStore.evalScoreCp / 100
  }
})

// Run tagging whenever the engine finishes analysis
watch(() => [engineStore.isAnalyzing, store.viewIndex], ([isEngBusy]) => {
  if (isEngBusy || !comparisonData.value) {
    deterministicTag.value = null
    return
  }

  const { playedMove, beforeFen } = comparisonData.value
  const idx = store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex
  
  // The eval of the CURRENT position (after the move was played)
  // This is the engine's live evaluation of the position we're viewing
  const evalAfter = engineStore.evalScoreCp / 100
  
  // The eval of the PREVIOUS position (before the move was played)
  // Priority: pre-computed (from library) → live-cached (from prior navigation)
  const prevMove = idx > 0 ? store.moveHistory[idx - 1] : null
  
  let evalBefore: number
  if (prevMove?.eval !== undefined) {
    // We have data for the previous position — use it
    evalBefore = prevMove.eval
  } else if (idx === 0) {
    // First move of the game — starting position is roughly equal
    evalBefore = 0.2 // Slight white advantage (standard opening eval)
  } else {
    // No cached eval for previous position — skip tagging for now
    // The eval will get cached as the user navigates, enabling future tags
    deterministicTag.value = null
    emit('update:tag', null)
    return
  }

  // Identify mistake with full context (move played + engine's best move)
  deterministicTag.value = TaggingService.identifyMistake(
    beforeFen,
    playedMove.fen,
    evalBefore,
    evalAfter,
    playedMove.san,
    engineStore.suggestedMove || undefined
  )
  
  emit('update:tag', deterministicTag.value)
}, { immediate: true })

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

      const isUserMove = side === userSide.value

      const response = await generateCoaching({
        fen: beforeFen,
        evalNumber: eval_,
        pv: engineStore.pv,
        moveSan: playedMove.san,
        moveNumber: playedMove.moveNumber,
        side,
        bestMove,
        playerName,
        opponentName,
        isUserMove
      })

      if (store.viewIndex !== currentViewIndex) {
          logger.info(`[Coach] LLM response received but ignored (late arrival).`)
          return
      }

      logger.info(`[Coach] LLM Response successfully received.`)
      coachResponse.value = response

      // PERSIST TO CACHE
      if (store.loadedGameId && response) {
          const adminStore = useAdminStore()
          adminStore.movesAnalyzed++
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
.coaching-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  height: 100%;
}

/* Level 1: Mistake Tag Banner */
.mistake-tag-banner {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03);
  border-left: 4px solid var(--accent);
  backdrop-filter: blur(8px);
}

.mistake-tag-banner.blunder { border-left-color: var(--rose); background: rgba(244, 63, 94, 0.08); }
.mistake-tag-banner.mistake { border-left-color: var(--gold); background: rgba(251, 191, 36, 0.08); }
.mistake-tag-banner.inaccuracy { border-left-color: var(--blue); background: rgba(96, 165, 250, 0.08); }

.tag-icon {
  font-size: 1.5rem;
  background: rgba(255,255,255,0.05);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
}

.tag-title {
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-1);
}

.tag-desc {
  font-size: 0.8rem;
  opacity: 0.7;
}

.tag-explanation {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-top: var(--space-2);
}

.tag-explanation :deep(strong) {
  color: var(--accent-bright);
  font-weight: 700;
}

/* Thinking State */
.coach-thinking-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-8);
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-lg);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Level 3: Coach Prose */
.coach-prose-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.prose-header {
  font-size: 0.65rem;
  font-weight: 900;
  color: var(--text-muted);
  letter-spacing: 0.15em;
  margin-bottom: var(--space-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quality-badge-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-elevated);
  padding: 2px 4px 2px 10px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  font-family: var(--font-mono);
}

.quality-badge-wrap .label-text {
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  opacity: 0.7;
}

.quality-badge-wrap .icon-pill {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 900;
  color: white;
}

.quality-badge-wrap.great .icon-pill { background: var(--teal); box-shadow: 0 0 10px var(--teal-dim); }
.quality-badge-wrap.best .icon-pill { background: var(--teal); }
.quality-badge-wrap.good .icon-pill { background: var(--accent); }
.quality-badge-wrap.inaccuracy .icon-pill { background: var(--gold); }
.quality-badge-wrap.mistake .icon-pill { background: var(--orange); }
.quality-badge-wrap.blunder .icon-pill { background: var(--rose); box-shadow: 0 0 10px var(--rose-dim); }
.quality-badge-wrap.blunder .label-text { color: var(--rose); opacity: 1; }
.quality-badge-wrap.great .label-text { color: var(--teal); opacity: 1; }

.coach-markdown {
  font-family: var(--font-body);
  line-height: 1.6;
  color: var(--text-primary);
}

.coach-markdown :deep(p) { margin-bottom: var(--space-4); }
.coach-markdown :deep(strong) { color: var(--accent); }

/* Animations */
.animated-slide-in {
  animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animated-fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

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
