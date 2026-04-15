<template>
  <div class="game-card glass" :class="{ compact }">
    <div class="card-preview">
      <!-- Simplified Board Preview -->
      <div class="mini-board" :data-fen="finalFen">
         <div v-for="i in 64" :key="i" class="mini-sq" :class="(Math.floor((i-1)/8) + ((i-1)%8)) % 2 === 0 ? 'light' : 'dark'"></div>
         <div class="board-overlay">
            <span class="preview-text">{{ game.eco }}</span>
         </div>
      </div>
      
      <!-- Quick Action Overlay -->
      <div class="quick-actions">
        <button class="quick-btn analyze-btn" @click.stop="$emit('analyze')" title="Instant Analysis">
          🔬
        </button>
      </div>
    </div>

    <div class="card-info">
      <div class="player-row">
        <div class="player-bundle white">
          <span class="player-name">{{ game.white }}</span>
          <span class="rating-label" v-if="game.whiteElo">({{ game.whiteElo }})</span>
        </div>
        <span class="vs">vs</span>
        <div class="player-bundle black">
          <span class="player-name">{{ game.black }}</span>
          <span class="rating-label" v-if="game.blackElo">({{ game.blackElo }})</span>
        </div>
      </div>
      
      <div class="meta-row">
        <span class="result-badge" :class="resultClass">{{ game.result }}</span>
        <span class="game-date" v-if="!compact">{{ game.date }}</span>
        <span v-else class="eco-badge">{{ game.eco }}</span>
      </div>
      
      <div class="event-row muted" v-if="!compact">
        {{ game.event }}
      </div>
      
      <div class="footer-row" v-if="!compact">
        <div class="tags-list" v-if="game.tags?.length">
          <span v-for="tag in game.tags" :key="tag" class="small-tag">{{ tag }}</span>
        </div>
        <div class="stats-footer">
          <span class="moves-count">🧩 {{ game.movesCount }}</span>
          <span class="added-at">Added {{ formattedAddedAt }}</span>
        </div>
      </div>
      <div class="compact-footer" v-else>
         <span class="moves-count">🧩 {{ game.movesCount }}</span>
         <span class="game-date">{{ game.date }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Chess } from 'chess.js'

const props = defineProps<{
  game: any
  compact?: boolean
}>()

defineEmits(['analyze'])

const resultClass = computed(() => {
    if (props.game.result === '1-0') return 'win-w'
    if (props.game.result === '0-1') return 'win-b'
    return 'draw'
})

const formattedAddedAt = computed(() => {
    return new Date(props.game.addedAt).toLocaleDateString()
})

const finalFen = computed(() => {
    try {
        const c = new Chess()
        c.loadPgn(props.game.pgn)
        return c.fen()
    } catch {
        return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    }
})
</script>

<style scoped>
.game-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255,255,255,0.05);
  position: relative;
}

.game-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow: 0 12px 30px rgba(0,0,0,0.4), 0 0 0 1px var(--accent);
  background: rgba(255,255,255,0.03);
}

.card-preview {
  position: relative;
  aspect-ratio: 16/9;
  background: #1a1a2e;
  overflow: hidden;
}

.mini-board {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  width: 100%;
  height: 100%;
  opacity: 0.3;
}
.mini-sq { width: 100%; height: 100%; }
.mini-sq.light { background: #e0e0e0; }
.mini-sq.dark { background: #4b4b6a; }

.board-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, rgba(13,11,41,0.2) 0%, rgba(13,11,41,0.6) 100%);
}
.preview-text {
  font-size: 2.22rem;
  font-weight: 900;
  color: white;
  opacity: 0.2;
  letter-spacing: 0.1em;
}

.quick-actions {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(2px);
  transition: opacity 0.2s;
}
.game-card:hover .quick-actions { opacity: 1; }

.quick-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 0 20px var(--accent);
  transition: transform 0.2s;
}
.quick-btn:hover { transform: scale(1.1); background: var(--accent-bright); }

.card-info {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.player-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 700;
  font-size: 0.88rem;
}
.vs { color: var(--text-muted); font-size: 0.65rem; text-transform: uppercase; margin: 0 4px; }
.player-bundle { flex: 1; display: flex; align-items: baseline; gap: 4px; min-width: 0; }
.player-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rating-label { font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono); font-weight: 500; flex-shrink: 0; }

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.eco-badge { font-size: 0.65rem; font-weight: 900; color: var(--text-muted); font-family: var(--font-mono); }

.result-badge {
  padding: 1px 8px;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 800;
}
.win-w { background: rgba(16,185,129,0.15); color: #10b981; }
.win-b { background: rgba(244,63,94,0.15); color: #f43f5e; }
.draw { background: rgba(245,158,11,0.15); color: #f59e0b; }

.game-date { font-size: 0.75rem; color: var(--text-muted); }
.event-row { font-size: 0.7rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.footer-row, .compact-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--border);
}

.tags-list { display: flex; flex-wrap: wrap; gap: 4px; }
.small-tag {
  font-size: 0.58rem;
  background: rgba(139, 92, 246, 0.1);
  color: var(--accent-bright);
  padding: 0 5px;
  border-radius: 3px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

/* Compact specific adjustments */
.game-card.compact .card-info { padding: var(--space-3); gap: var(--space-1); }
.game-card.compact .player-row { font-size: 0.82rem; }
.game-card.compact .preview-text { font-size: 1.8rem; }
.game-card.compact .card-preview { aspect-ratio: 2/1; }
</style>
