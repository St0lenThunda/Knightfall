<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content glass-lg animated-scale-in">
      <button class="close-btn" @click="$emit('close')">×</button>
      
      <div class="modal-layout">
        <!-- Sidebar: Preview -->
        <div class="preview-side">
          <StaticBoard :fen="finalFen" :size="240" />
          <div class="opening-badge">
             <span class="eco">{{ game.eco }}</span>
             <span class="opening-name" v-if="game.openingName">{{ game.openingName }}</span>
             <span class="moves">{{ game.movesCount }} plies • {{ game.termination || game.terminalState || 'Finished' }}</span>
          </div>
        </div>

        <!-- Main Info -->
        <div class="info-side">
          <header class="game-header">
            <!-- Tab Navigation -->
            <div class="modal-tabs">
              <button 
                class="tab-link" 
                :class="{ active: activeTab === 'briefing' }"
                @click="activeTab = 'briefing'"
              >
                Intelligence
              </button>
              <button 
                class="tab-link" 
                :class="{ active: activeTab === 'pgn' }"
                @click="activeTab = 'pgn'"
              >
                PGN Explorer
              </button>
            </div>

            <div class="p-row">
              <div class="p-bundle white">
                <span class="p-name">{{ resolvedWhite }}</span>
                <span class="p-rating" v-if="game.whiteElo">({{ game.whiteElo }})</span>
              </div>
              <span class="vs">vs</span>
              <div class="p-bundle black">
                <span class="p-name">{{ resolvedBlack }}</span>
                <span class="p-rating" v-if="game.blackElo">({{ game.blackElo }})</span>
              </div>
            </div>
            <div class="result-row">
                <span class="result-badge" :class="resultClass">{{ game.result }}</span>
            </div>
          </header>

          <div v-if="activeTab === 'briefing'" class="tab-content-wrapper">
            <div class="meta-grid">
              <div class="meta-item">
                <span class="label">Event</span>
                <span class="val">{{ game.event }}</span>
              </div>
              <div class="meta-item">
                <span class="label">Date</span>
                <span class="val">{{ game.date }}</span>
              </div>
              <div class="meta-item">
                <span class="label">Added to Laboratory</span>
                <span class="val">{{ formattedAddedAt }}</span>
              </div>
            </div>

            <div class="tags-section" v-if="game.tags?.length">
              <span v-for="tag in game.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>

            <!-- Live Synthesis Progress -->
            <div v-if="isSynthesizing" class="synthesis-progress-box glass-xs">
              <header class="intel-header">
                <span class="icon mini-loader"></span>
                <span class="title">Synthesizing Intel...</span>
                <span class="progress-percent muted" style="margin-left: auto;">{{ progressPercent }}%</span>
              </header>
              <div class="progress-bar-container">
                <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
              </div>
              <div class="intel-grid" style="margin-top: 12px;">
                <div class="intel-stat" :class="{ 'text-rose': libraryStore.activeGameStats.blunders > 0 }">
                  <span class="val">{{ libraryStore.activeGameStats.blunders }}</span>
                  <span class="label">Blunders</span>
                </div>
                <div class="intel-stat" :class="{ 'text-gold': libraryStore.activeGameStats.mistakes > 0 }">
                  <span class="val">{{ libraryStore.activeGameStats.mistakes }}</span>
                  <span class="label">Mistakes</span>
                </div>
                <div class="intel-stat" :class="{ 'text-cyan': libraryStore.activeGameStats.brilliants > 0 }">
                  <span class="val">{{ libraryStore.activeGameStats.brilliants }}</span>
                  <span class="label">Brilliant</span>
                </div>
                <div class="intel-stat text-muted">
                  <span class="val">{{ libraryStore.activeGameStats.movesProcessed }}/{{ libraryStore.activeGameStats.totalMoves }}</span>
                  <span class="label">Moves</span>
                </div>
              </div>
            </div>

            <!-- Intelligence Briefing (DNA Metrics) -->
            <div v-if="hasEvals && !isSynthesizing" class="intel-briefing glass-xs">
              <header class="intel-header">
                <span class="icon">🧬</span>
                <span class="title">Intelligence Briefing</span>
              </header>
              <div class="intel-grid">
                <div class="intel-stat" title="Average Centipawn Loss">
                  <span class="val">{{ game.acpl }}</span>
                  <span class="label">ACPL</span>
                </div>
                <div class="intel-stat" title="Theoretical Knowledge">
                  <span class="val">{{ game.theoreticalAccuracy }}%</span>
                  <span class="label">Book</span>
                </div>
                <div class="intel-stat text-rose" v-if="game.blunderCount">
                  <span class="val">{{ game.blunderCount }}</span>
                  <span class="label">Blunders</span>
                </div>
                <div class="intel-stat text-gold" v-if="game.mistakeCount">
                  <span class="val">{{ game.mistakeCount }}</span>
                  <span class="label">Mistakes</span>
                </div>
                <div class="intel-stat text-orange" v-if="game.inaccuracyCount">
                  <span class="val">{{ game.inaccuracyCount }}</span>
                  <span class="label">Inaccuracies</span>
                </div>
                <div class="intel-stat text-cyan" v-if="game.brilliantCount">
                  <span class="val">{{ game.brilliantCount }}</span>
                  <span class="label">Brilliant</span>
                </div>
                <div class="intel-stat text-rose" v-if="game.missedWins">
                  <span class="val">{{ game.missedWins }}</span>
                  <span class="label">Missed Wins</span>
                </div>
                <div class="intel-stat" v-if="game.maxEvalChange">
                  <span class="val">{{ (game.maxEvalChange / 100).toFixed(1) }}</span>
                  <span class="label">Max Swing</span>
                </div>
              </div>
            </div>

            <!-- Warden Ghost Telemetry -->
            <div v-if="game.telemetry" class="telemetry-section glass-xs">
              <header class="tel-header">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="icon">🛰️</span>
                  <span class="title">Warden Ghost Telemetry</span>
                </div>
                <span v-if="game.telemetry.isBusted" class="badge badge-rose pulse">VIOLATION DETECTED</span>
              </header>
              <div class="tel-grid">
                <div class="tel-item">
                  <span class="label">Visibility Blurs</span>
                  <span class="val" :class="{ 'text-rose': game.telemetry.blurCount > 0 }">{{ game.telemetry.blurCount }}</span>
                </div>
                <div class="tel-item">
                  <span class="label">Suspicion Score</span>
                  <span class="val" :class="getSuspicionClass(game.telemetry.suspicionScore)">{{ game.telemetry.suspicionScore }}%</span>
                </div>
              </div>
            </div>
            
            <!-- Raw PGN Meta (Headers) -->
            <div class="raw-meta-section glass-xs" v-if="Object.keys(rawHeaders).length">
              <header class="tel-header">
                <span class="title">Raw Intelligence (PGN Headers)</span>
              </header>
              <div class="raw-meta-scroll neon-scroll">
                <div v-for="(val, key) in rawHeaders" :key="key" class="raw-meta-item">
                  <span class="key">{{ key }}</span>
                  <span class="val">{{ val }}</span>
                </div>
              </div>
            </div>

            <!-- Raw Clocks -->
            <div v-if="game.clocks?.length" class="clocks-section glass-xs">
              <header class="tel-header">
                <span class="title">Raw Time Telemetry</span>
              </header>
              <div class="clock-stats">
                <div class="clock-item">
                  <span class="label">Avg Thinking Time</span>
                  <span class="val">{{ avgThinkingTime }}s</span>
                </div>
                <div class="clock-item">
                  <span class="label">Time Scarcity</span>
                  <span class="val">{{ timeScarcity }}%</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'pgn'" class="tab-content-wrapper pgn-explorer">
            <header class="intel-header">
              <span class="icon">📄</span>
              <span class="title">PGN EXPLORER</span>
              <button class="btn btn-ghost btn-sm" @click="copyPgn" style="margin-left: auto;">
                {{ copied ? 'Copied!' : 'Copy PGN' }}
              </button>
            </header>
            
            <div class="pgn-scroll-container glass-xs neon-scroll">
              <pre class="pgn-text">{{ game.pgn }}</pre>
            </div>

            <div class="pgn-footer muted">
              Raw PGN data recovered from the Knightfall vault.
            </div>
          </div>

          <footer class="modal-actions">
            <button class="btn btn-primary btn-lg launch-btn" @click="$emit('analyze')">
              🔬 Launch Analysis
            </button>
            <button 
              class="btn btn-gold btn-lg launch-btn" 
              @click="$emit('synthesize')"
              :disabled="isSynthesizing"
            >
              <template v-if="isSynthesizing">
                <span class="mini-loader"></span> Processing...
              </template>
              <template v-else>
                🧬 {{ hasEvals ? 'Re-Synthesize' : 'Synthesize Intel' }}
              </template>
            </button>
            <div class="secondary-actions">
               <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
               <button class="btn btn-ghost text-danger" @click="$emit('delete')" title="Remove from Vault & Cloud">
                 🗑️ Delete
               </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Chess } from 'chess.js'
import { useLibraryStore } from '../../stores/libraryStore'
import { useUserStore } from '../../stores/userStore'
import { safeLoadPgn } from '../../utils/pgnParser'
import StaticBoard from './StaticBoard.vue'

const props = defineProps<{
  game: any
}>()

const libraryStore = useLibraryStore()
const userStore = useUserStore()

const activeTab = ref('briefing')
const copied = ref(false)

const myUsername = computed(() => userStore.profile?.username || userStore.displayName)

const resolvedWhite = computed(() => {
    const w = props.game.white
    if (w === 'White' || w === '?' || w === 'Unknown') {
        if (props.game.userSide === 'white') return myUsername.value
    }
    return w
})

const resolvedBlack = computed(() => {
    const b = props.game.black
    if (b === 'Black' || b === '?' || b === 'Unknown') {
        if (props.game.userSide === 'black') return myUsername.value
    }
    return b
})

function copyPgn() {
  navigator.clipboard.writeText(props.game.pgn)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

defineEmits(['close', 'analyze', 'delete', 'synthesize'])

const resultClass = computed(() => {
    if (props.game.result === '1-0') return 'win-w'
    if (props.game.result === '0-1') return 'win-b'
    return 'draw'
})

const formattedAddedAt = computed(() => {
    return new Date(props.game.addedAt).toLocaleDateString()
})

const isSynthesizing = computed(() => {
  return libraryStore.isBulkAnalyzing && libraryStore.currentAnalyzingId === props.game.id
})

const progressPercent = computed(() => {
  const stats = libraryStore.activeGameStats
  if (!stats || !stats.totalMoves) return 0
  return Math.round((stats.movesProcessed / stats.totalMoves) * 100)
})

const hasEvals = computed(() => {
  return props.game.evals && props.game.evals.length > 0
})

const finalFen = computed(() => {
    try {
        if (!props.game?.pgn) return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        const c = new Chess()
        safeLoadPgn(c, props.game.pgn)
        return c.fen()
    } catch (e) {
        console.warn('[GameDetailsModal] Failed to parse FEN from PGN:', e)
        return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    }
})

const rawHeaders = computed(() => {
  try {
    if (!props.game?.pgn) return {}
    const c = new Chess()
    safeLoadPgn(c, props.game.pgn)
    const headers = c.header()
    // Only exclude headers that are already visually dominant in the header
    const excluded = ['White', 'Black']
    const filtered: Record<string, any> = {}
    for (const key in headers) {
      if (!excluded.includes(key)) {
        filtered[key] = headers[key]
      }
    }
    return filtered
  } catch {
    return {}
  }
})

const avgThinkingTime = computed(() => {
  if (!props.game.clocks || props.game.clocks.length < 2) return 0
  let diffs = []
  for (let i = 2; i < props.game.clocks.length; i++) {
    // Clock is descending. Move i-2 to i
    const diff = props.game.clocks[i-2] - props.game.clocks[i]
    if (diff > 0) diffs.push(diff)
  }
  if (diffs.length === 0) return 0
  return Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length)
})

const timeScarcity = computed(() => {
  if (!props.game.clocks) return 0
  const lowTimeThreshold = 30 // 30 seconds
  const lowTimeMoves = props.game.clocks.filter((t: number) => t < lowTimeThreshold).length
  return Math.round((lowTimeMoves / props.game.clocks.length) * 100)
})

function getSuspicionClass(score: number) {
    if (score > 80) return 'text-rose'
    if (score > 40) return 'text-gold'
    return 'text-green'
}

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 10vh var(--space-4) var(--space-8);
  overflow-y: auto;
}

.modal-content {
  width: 100%;
  max-width: 700px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  position: relative;
  overflow: hidden;
  box-shadow: 0 32px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 2rem;
  cursor: pointer;
  z-index: 10;
  line-height: 1;
}
.close-btn:hover { color: var(--text-primary); }

.modal-layout {
  display: flex;
  padding: var(--space-8);
  gap: var(--space-8);
  min-width: 0;
}

@media (max-width: 600px) {
  .modal-layout { flex-direction: column; padding: var(--space-6); }
}

.preview-side {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: center;
}

.opening-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255,255,255,0.03);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}
.opening-badge .eco { font-weight: 900; color: var(--accent-bright); font-size: 1.2rem; }
.opening-badge .opening-name { font-size: 0.7rem; color: var(--text-primary); text-align: center; margin: 4px 0; max-width: 200px; }
.opening-badge .moves { font-size: 0.75rem; color: var(--text-muted); }

.info-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.modal-tabs {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.tab-link {
  background: none;
  border: none;
  padding: 8px 16px;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.tab-link:hover { color: var(--text-primary); }

.tab-link.active {
  color: var(--accent-bright);
}

.tab-link.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent-bright);
}

.tab-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.pgn-scroll-container {
  padding: var(--space-4);
  background: rgba(0,0,0,0.3);
  border-radius: var(--radius-md);
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(255,255,255,0.05);
}

.pgn-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.pgn-footer {
  font-size: 0.7rem;
}

.game-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.p-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: 1.5rem;
  font-weight: 800;
}
.p-bundle { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.vs { font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase; flex-shrink: 0; }
.white .p-name { color: white; }
.black .p-name { color: var(--text-secondary); }
.p-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.p-rating { font-size: 1rem; color: var(--text-muted); font-family: var(--font-mono); font-weight: 500; flex-shrink: 0; }

.result-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 900;
}
.win-w { background: rgba(16,185,129,0.15); color: #10b981; }
.win-b { background: rgba(244,63,94,0.15); color: #f43f5e; }
.draw { background: rgba(245,158,11,0.15); color: #f59e0b; }

.mini-loader {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.meta-item { display: flex; flex-direction: column; gap: 2px; }
.meta-item:first-child { grid-column: span 2; }
.meta-item .label { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; }
.meta-item .val { 
  font-size: 0.95rem; 
  font-weight: 600; 
  color: var(--text-primary); 
  overflow-wrap: break-word; 
  word-break: break-word;
}

.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag {
  background: rgba(139, 92, 246, 0.1);
  color: var(--accent-bright);
  padding: 4px 12px;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.secondary-actions {
  display: flex;
  gap: var(--space-2);
  flex: 1;
  justify-content: flex-end;
}

@media (max-width: 500px) {
  .modal-actions { flex-direction: column; }
  .secondary-actions { justify-content: stretch; }
  .secondary-actions button { flex: 1; }
}

.telemetry-section {
  margin-top: var(--space-6);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.clocks-section {
  margin-top: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.clock-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
.clock-item { display: flex; flex-direction: column; gap: 4px; }
.clock-item .label { font-size: 0.65rem; color: var(--text-muted); }
.clock-item .val { font-size: 1rem; font-weight: 800; color: var(--text-primary); }

.intel-briefing {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid rgba(139, 92, 246, 0.1);
  background: rgba(139, 92, 246, 0.03);
}
.intel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: var(--space-4);
}
.intel-header .title {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent-bright);
}
.progress-bar-container {
  width: 100%;
  height: 4px;
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: var(--accent-bright);
  transition: width 0.3s ease;
}
.synthesis-progress-box {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--accent-bright);
  background: rgba(139, 92, 246, 0.05);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.1);
}
.intel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--space-4);
}
.intel-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.intel-stat .val {
  font-size: 1.25rem;
  font-weight: 900;
  font-family: var(--font-mono);
  line-height: 1;
}
.intel-stat .label {
  font-size: 0.6rem;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 700;
  margin-top: 4px;
}

.tel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}
.tel-header .title {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}
.tel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
.tel-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tel-item .label {
  font-size: 0.7rem;
  color: var(--text-muted);
}
.tel-item .val {
  font-size: 1.1rem;
  font-weight: 800;
  font-family: var(--font-mono);
}
.tel-footer {
  opacity: 0.6;
}
.raw-meta-section {
  margin-top: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.raw-meta-scroll {
  max-height: 120px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 8px;
}
.raw-meta-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  padding-bottom: 2px;
}
.raw-meta-item .key {
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
}
.raw-meta-item .val {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  max-width: 60%;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pulse {
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
}

.launch-btn {
  flex: 1;
  box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);
}

.animated-scale-in {
  animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
