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
             <span class="moves">{{ game.movesCount }} plies</span>
          </div>
        </div>

        <!-- Main Info -->
        <div class="info-side">
          <header class="game-header">
            <div class="p-row">
              <span class="p-name white">{{ game.white }}</span>
              <span class="vs">vs</span>
              <span class="p-name black">{{ game.black }}</span>
            </div>
            <div class="result-row">
                <span class="result-badge" :class="resultClass">{{ game.result }}</span>
            </div>
          </header>

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

          <footer class="modal-actions">
            <button class="btn btn-primary btn-lg launch-btn" @click="$emit('analyze')">
              🔬 Launch Analysis
            </button>
            <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
          </footer>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Chess } from 'chess.js'
import StaticBoard from './StaticBoard.vue'

const props = defineProps<{
  game: any
}>()

defineEmits(['close', 'analyze'])

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
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
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
.opening-badge .moves { font-size: 0.75rem; color: var(--text-muted); }

.info-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
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
.vs { font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase; }
.white { color: white; }
.black { color: var(--text-secondary); }

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

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.meta-item { display: flex; flex-direction: column; gap: 2px; }
.meta-item:first-child { grid-column: span 2; }
.meta-item .label { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; }
.meta-item .val { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }

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
  gap: var(--space-4);
  margin-top: auto;
  padding-top: var(--space-4);
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
