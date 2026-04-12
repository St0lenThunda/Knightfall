<template>
  <div class="page analysis-page">
    <div class="analysis-header">
      <div>
        <h2>🔬 Game Analysis</h2>
        <p class="muted" style="font-size: 0.9rem;">AI-powered coaching, not just engine numbers</p>
      </div>
      <div style="display:flex; gap: var(--space-2);">
        <button class="btn btn-primary btn-sm" @click="loadDemo">Load Demo Game</button>
        <button class="btn btn-ghost btn-sm">📂 Import PGN</button>
      </div>
    </div>

    <div class="analysis-layout">
      <!-- Board column -->
      <div class="analysis-board-col">
        <div class="eval-bar-horizontal glass-sm">
          <div class="eval-label">♔</div>
          <div class="eval-track">
            <div class="eval-fill" :style="{ width: evalPercent + '%' }"></div>
          </div>
          <div class="eval-label">♚</div>
          <div class="eval-num" :class="evalNum > 0 ? 'positive' : 'negative'">
            {{ evalNum > 0 ? '+' : '' }}{{ evalNum.toFixed(1) }}
          </div>
        </div>

        <ChessBoard :flipped="false" />

        <div class="analysis-nav">
          <button class="btn btn-ghost btn-sm" @click="store.goToMove(0)">⏮</button>
          <button class="btn btn-ghost btn-sm" @click="store.stepBack()">◀</button>
          <button class="btn btn-ghost btn-sm" @click="store.stepForward()">▶</button>
          <button class="btn btn-ghost btn-sm" @click="goToEnd()">⏭</button>
        </div>
      </div>

      <!-- Panel -->
      <div class="analysis-panel">
        <div class="analysis-tabs">
          <button v-for="tab in tabs" :key="tab.id"
            class="analysis-tab" :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id">
            {{ tab.icon }} {{ tab.label }}
          </button>
        </div>

        <!-- Coaching tab -->
        <div v-if="activeTab === 'coaching'" class="tab-content">
          <div v-if="!hasGame" class="empty-analysis">
            <div class="empty-icon">🔬</div>
            <h4>No game loaded</h4>
            <p class="muted">Load a game to get AI coaching insights.</p>
            <button class="btn btn-primary" @click="loadDemo">Load Demo Game</button>
          </div>
          <div v-else class="coaching-content">
            <div class="move-legend">
              <span v-for="cl in classifications" :key="cl.label"
                class="move-class-badge" :style="{ background: cl.bg, color: cl.color }">
                {{ cl.icon }} {{ cl.label }}
              </span>
            </div>
            <div class="coaching-feed">
              <div v-for="entry in coachingFeed" :key="entry.move"
                class="coaching-card" :class="entry.type"
                @click="store.goToMove(entry.moveIndex)">
                <div class="coaching-card-header">
                  <span class="move-num-badge mono">{{ entry.move }}</span>
                  <span class="classification-badge" :style="{ background: entry.classBg, color: entry.classColor }">
                    {{ entry.classIcon }} {{ entry.classification }}
                  </span>
                  <span class="muted" style="font-size:0.75rem; margin-left:auto;">Δ{{ entry.eval }}</span>
                </div>
                <p class="coaching-text">{{ entry.coaching }}</p>
                <div v-if="entry.bestMove" class="best-move-row">
                  <span class="label">Best was:</span>
                  <span class="mono" style="color: var(--green); font-size: 0.85rem;">{{ entry.bestMove }}</span>
                </div>
                
                <!-- LLM Coach section -->
                <div style="margin-top: var(--space-4); border-top: 1px solid rgba(255,255,255,0.05); padding-top: var(--space-3);" @click.stop>
                  <button v-if="!coachResponse && !isCoachThinking" class="btn btn-primary btn-sm" @click="askCoach(entry)" style="width: 100%; justify-content: center;">
                    🧠 Ask AI Coach to Explain
                  </button>
                  <div v-if="isCoachThinking" class="coach-thinking">
                    <span class="thinking-dots"><span></span><span></span><span></span></span>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">AI Coach is writing...</span>
                  </div>
                  <div v-if="coachResponse" class="coach-response glass-sm">
                    <div class="coach-avatar">🧠</div>
                    <p class="coach-response-text">{{ coachResponse }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Moves tab -->
        <div v-if="activeTab === 'moves'" class="tab-content moves-tab">
          <MoveHistory />
        </div>

        <!-- Summary tab -->
        <div v-if="activeTab === 'summary'" class="tab-content">
          <div v-if="!hasGame" class="empty-analysis">
            <div class="empty-icon">📊</div>
            <h4>No game loaded</h4>
            <button class="btn btn-primary" @click="loadDemo">Load Demo Game</button>
          </div>
          <div v-else class="summary-content">
            <div class="accuracy-row">
              <div class="accuracy-card">
                <div class="label">White Accuracy</div>
                <div class="accuracy-num">87%</div>
                <div class="accuracy-bar"><div class="accuracy-fill white-fill" style="width:87%"></div></div>
              </div>
              <div class="accuracy-card">
                <div class="label">Black Accuracy</div>
                <div class="accuracy-num" style="color: var(--text-secondary);">74%</div>
                <div class="accuracy-bar"><div class="accuracy-fill black-fill" style="width:74%"></div></div>
              </div>
            </div>
            <div class="mistake-breakdown">
              <h4 style="margin-bottom: var(--space-4);">Move Quality</h4>
              <div v-for="row in moveQuality" :key="row.label" class="quality-row">
                <div class="quality-label">
                  <span :style="{ color: row.color }">{{ row.icon }}</span> {{ row.label }}
                </div>
                <div class="quality-bars">
                  <div class="quality-bar"><div class="quality-fill" :style="{ width: (row.white/18*100)+'%', background: row.color }"></div></div>
                  <span style="font-size:0.8rem;min-width:20px;">{{ row.white }}</span>
                  <div class="quality-bar"><div class="quality-fill" :style="{ width: (row.black/18*100)+'%', background: row.color }"></div></div>
                  <span style="font-size:0.8rem;min-width:20px;">{{ row.black }}</span>
                </div>
              </div>
              <div class="quality-legend"><span>♔ White</span><span>♚ Black</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useEngineStore } from '../stores/engineStore'
import { generateCoaching } from '../api/llmApi'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import ChessBoard from '../components/ChessBoard.vue'
import MoveHistory from '../components/MoveHistory.vue'

const store = useGameStore()
const engineStore = useEngineStore()
engineStore.init()

const coachResponse = ref<string | null>(null)
const isCoachThinking = ref(false)

async function askCoach(_entry: any) {
  if (!engineStore.bestMove) return
  isCoachThinking.value = true
  coachResponse.value = null
  
  coachResponse.value = await generateCoaching({
    fen: store.fen,
    evalNumber: engineStore.evalNumber,
    pv: engineStore.pv
  })
  isCoachThinking.value = false
}

const activeTab = ref('coaching')
const tabs = [
  { id: 'coaching', icon: '🤖', label: 'AI Coaching' },
  { id: 'moves',    icon: '📋', label: 'Moves' },
  { id: 'summary',  icon: '📊', label: 'Summary' },
]
const hasGame = computed(() => store.moveHistory.length > 0)
const evalNum = computed(() => engineStore.evalNumber)
const evalPercent = computed(() => engineStore.evalPercent)

watch(() => store.fen, (newFen) => {
  coachResponse.value = null
  engineStore.analyze(newFen, 15)
})

onUnmounted(() => {
  engineStore.stop()
})

function goToEnd() {
  store.viewIndex = -1
  if (store.moveHistory.length > 0) store.chess.load(store.moveHistory[store.moveHistory.length - 1].fen)
}

function loadDemo() {
  const pgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6'
  const game = new Chess()
  game.loadPgn(pgn)
  const temp = new Chess()
  store.moveHistory.splice(0)
  const moves = game.history({ verbose: true })
  moves.forEach((m, i) => {
    temp.move(m)
    store.moveHistory.push({ san: m.san, fen: temp.fen(), from: m.from as Square, to: m.to as Square, moveNumber: Math.ceil((i+1)/2), isCapture: !!m.captured, isCheck: m.san.includes('+') })
  })
  store.chess.loadPgn(pgn)
  store.lastMove = moves.length ? { from: moves[moves.length-1].from as Square, to: moves[moves.length-1].to as Square } : null
}

const classifications = [
  { label: 'Best',       icon: '★',  color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  { label: 'Good',       icon: '✓',  color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  { label: 'Inaccuracy', icon: '?',  color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { label: 'Blunder',   icon: '??', color: '#f43f5e', bg: 'rgba(244,63,94,0.15)' },
]

const coachingFeed = computed(() => {
  if (!hasGame.value || !engineStore.bestMove) return []
  
  const moveObj = store.moveHistory[store.viewIndex === -1 ? store.moveHistory.length - 1 : store.viewIndex]
  const moveText = moveObj ? moveObj.san : 'Start Position'

  return [{
    move: moveText,
    moveIndex: store.viewIndex,
    type: 'good',
    classification: engineStore.isAnalyzing ? 'Analyzing...' : 'Engine Eval',
    classIcon: '🤖',
    classColor: '#06b6d4',
    classBg: 'rgba(6,182,212,0.12)',
    eval: (engineStore.evalNumber > 0 ? '+' : '') + engineStore.evalNumber.toFixed(2),
    coaching: `Depth: ${engineStore.currentDepth}. Principal Variation: ${engineStore.pv.slice(0, 5).join(' ')}...`,
    bestMove: engineStore.bestMove
  }]
})

const moveQuality = [
  { label: 'Best',       icon: '★',  color: '#10b981', white: 18, black: 12 },
  { label: 'Good',       icon: '✓',  color: '#06b6d4', white: 7,  black: 8  },
  { label: 'Inaccuracy', icon: '?',  color: '#f59e0b', white: 3,  black: 5  },
  { label: 'Mistake',   icon: '?!', color: '#f97316', white: 1,  black: 3  },
  { label: 'Blunder',   icon: '??', color: '#f43f5e', white: 0,  black: 2  },
]
</script>

<style scoped>
.analysis-page { padding-top: var(--space-6); }
.analysis-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-3); }
.analysis-layout { display: grid; grid-template-columns: auto 1fr; gap: var(--space-6); align-items: start; }
@media (max-width: 1000px) { .analysis-layout { grid-template-columns: 1fr; } }
.analysis-board-col { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }
.eval-bar-horizontal { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); width: min(480px, 90vw); }
.eval-track { flex: 1; height: 8px; background: #222; border-radius: var(--radius-full); overflow: hidden; }
.eval-fill { height: 100%; background: #e8e8e8; border-radius: var(--radius-full); transition: width 0.6s var(--ease); }
.eval-label { font-size: 1rem; }
.eval-num { font-family: var(--font-mono); font-size: 0.9rem; font-weight: 700; min-width: 42px; }
.eval-num.positive { color: var(--text-primary); }
.eval-num.negative { color: var(--text-muted); }
.analysis-nav { display: flex; gap: var(--space-2); }
.analysis-panel { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); display: flex; flex-direction: column; min-height: 540px; overflow: hidden; }
.analysis-tabs { display: flex; border-bottom: 1px solid var(--border); }
.analysis-tab { flex: 1; padding: var(--space-4); border: none; background: transparent; color: var(--text-secondary); font-family: var(--font-sans); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
.analysis-tab:hover { background: var(--bg-elevated); color: var(--text-primary); }
.analysis-tab.active { border-bottom: 2px solid var(--accent); color: var(--accent-bright); background: var(--accent-dim); }
.tab-content { flex: 1; padding: var(--space-4); overflow-y: auto; }
.moves-tab { padding: 0; }
.empty-analysis { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-10) var(--space-6); text-align: center; }
.empty-icon { font-size: 3rem; }
.move-legend { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4); }
.move-class-badge { padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 700; }
.coaching-feed { display: flex; flex-direction: column; gap: var(--space-3); }
.coaching-card { padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--bg-elevated); cursor: pointer; transition: all 0.15s ease; }
.coaching-card:hover { border-color: rgba(255,255,255,0.15); }
.coaching-card.inaccuracy { border-left: 3px solid #f59e0b; }
.coaching-card.good { border-left: 3px solid #06b6d4; }
.coaching-card-header { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); }
.move-num-badge { font-size: 0.85rem; font-weight: 700; }
.classification-badge { padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 700; }
.coaching-text { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; }
.best-move-row { display: flex; gap: var(--space-2); align-items: center; margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--border); }
.summary-content { display: flex; flex-direction: column; gap: var(--space-5); }
.accuracy-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.accuracy-card { padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-elevated); }
.accuracy-num { font-size: 2rem; font-weight: 800; margin: var(--space-2) 0; }
.accuracy-bar { height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; margin-top: 6px; }
.accuracy-fill { height: 100%; border-radius: 3px; }
.white-fill { background: linear-gradient(90deg, var(--accent), var(--teal)); }
.black-fill { background: linear-gradient(90deg, #4b4b6a, #6b6b9a); }
.mistake-breakdown { background: var(--bg-elevated); border-radius: var(--radius-md); padding: var(--space-4); }
.quality-row { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3); }
.quality-label { min-width: 100px; font-size: 0.82rem; display: flex; gap: 6px; align-items: center; }
.quality-bars { flex: 1; display: flex; align-items: center; gap: var(--space-2); }
.quality-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
.quality-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
.quality-legend { display: flex; justify-content: flex-end; gap: var(--space-8); font-size: 0.75rem; color: var(--text-muted); margin-top: var(--space-3); }

/* LLM Coaching specific */
.coach-thinking { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) 0; }
.coach-response { display: flex; gap: var(--space-3); padding: var(--space-3); border-radius: var(--radius-md); background: rgba(0,0,0,0.2); border: 1px solid var(--border); align-items: flex-start; }
.coach-avatar { font-size: 1.5rem; background: rgba(255,255,255,0.05); border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.coach-response-text { font-size: 0.9rem; color: var(--text-primary); line-height: 1.5; margin: 0; }
</style>
