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
              <button class="tab-link" :class="{ active: activeTab === 'briefing' }" @click="activeTab = 'briefing'">
                Intelligence
              </button>
              <button class="tab-link" :class="{ active: activeTab === 'pgn' }" @click="activeTab = 'pgn'">
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

          <BriefingTab
            v-if="activeTab === 'briefing'"
            :game="game"
            :libraryStore="libraryStore"
            :hasEvals="hasEvals"
            :isSynthesizing="isSynthesizing"
            :progressPercent="progressPercent"
            :formattedAddedAt="formattedAddedAt"
            :rawHeaders="rawHeaders"
            :avgThinkingTime="avgThinkingTime"
            :timeScarcity="timeScarcity"
          />

          <PgnTab v-else-if="activeTab === 'pgn'" :game="game" @copy-pgn="copyPgn" :copied="copied" />

          <footer class="modal-actions">
            <button class="btn btn-primary btn-lg launch-btn" @click="$emit('analyze')">
              🔬 Launch Analysis
            </button>
            <button class="btn btn-gold btn-lg launch-btn" @click="$emit('synthesize')" :disabled="isSynthesizing">
              <template v-if="isSynthesizing"><span class="mini-loader"></span> Processing...</template>
              <template v-else>{{ hasEvals ? 'Re-Synthesize' : 'Synthesize Intel' }}</template>
            </button>
            <div class="secondary-actions">
              <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
              <button class="btn btn-ghost text-danger" @click="$emit('delete')" title="Remove from Vault & Cloud">🗑️ Delete</button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * GameDetailsModal – a premium modal presenting detailed game intelligence.
 * The component delegates heavy UI sections to sub‑components to keep the file
 * well under the 500‑line threshold and to promote plug‑and‑play reuse.
 */
import { ref, computed } from 'vue'
import { Chess } from 'chess.js'
import { useLibraryStore } from '../../stores/libraryStore'
import { useUserStore } from '../../stores/userStore'
import { logger } from '../../utils/logger'
import { safeLoadPgn } from '../../utils/pgnParser'
import StaticBoard from './StaticBoard.vue'
import BriefingTab from './GameDetailsModal/BriefingTab.vue'
import PgnTab from './GameDetailsModal/PgnTab.vue'

const props = defineProps<{ game: any }>()

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

const resultClass = computed(() => {
  if (props.game.result === '1-0') return 'win-w'
  if (props.game.result === '0-1') return 'win-b'
  return 'draw'
})

const formattedAddedAt = computed(() => new Date(props.game.addedAt).toLocaleDateString())

const isSynthesizing = computed(() => libraryStore.isBulkAnalyzing && libraryStore.currentAnalyzingId === props.game.id)

const progressPercent = computed(() => {
  const stats = libraryStore.activeGameStats
  if (!stats || !stats.totalMoves) return 0
  return Math.round((stats.movesProcessed / stats.totalMoves) * 100)
})

const hasEvals = computed(() => props.game.evals && props.game.evals.length > 0)

const finalFen = computed(() => {
  try {
    if (!props.game?.pgn) return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    const c = new Chess()
    safeLoadPgn(c, props.game.pgn)
    return c.fen()
  } catch (e) {
    logger.warn('[GameDetailsModal] Failed to parse FEN from PGN:', e)
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  }
})

const rawHeaders = computed(() => {
  try {
    if (!props.game?.pgn) return {}
    const c = new Chess()
    safeLoadPgn(c, props.game.pgn)
    const headers = c.header()
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
  const diffs: number[] = []
  for (let i = 2; i < props.game.clocks.length; i++) {
    const diff = props.game.clocks[i - 2] - props.game.clocks[i]
    if (diff > 0) diffs.push(diff)
  }
  if (diffs.length === 0) return 0
  return Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length)
})

const timeScarcity = computed(() => {
  if (!props.game.clocks) return 0
  const lowTimeThreshold = 30 // seconds
  const lowTimeMoves = props.game.clocks.filter((t: number) => t < lowTimeThreshold).length
  return Math.round((lowTimeMoves / props.game.clocks.length) * 100)
})

function copyPgn() {
  navigator.clipboard.writeText(props.game.pgn)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>
