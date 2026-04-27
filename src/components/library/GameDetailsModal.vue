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
              <div class="p-bundle white">
                <span class="p-name">{{ game.white }}</span>
                <span class="p-rating" v-if="game.whiteElo">({{ game.whiteElo }})</span>
              </div>
              <span class="vs">vs</span>
              <div class="p-bundle black">
                <span class="p-name">{{ game.black }}</span>
                <span class="p-rating" v-if="game.blackElo">({{ game.blackElo }})</span>
              </div>
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
            <div class="tel-footer muted">
              Metadata captured by Knightfall behavioral engine.
            </div>
          </div>

          <footer class="modal-actions">
            <button class="btn btn-primary btn-lg launch-btn" @click="$emit('analyze')">
              🔬 Launch Analysis
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
import { computed } from 'vue'
import { Chess } from 'chess.js'
import StaticBoard from './StaticBoard.vue'

const props = defineProps<{
  game: any
}>()

defineEmits(['close', 'analyze', 'delete'])

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
.opening-badge .moves { font-size: 0.75rem; color: var(--text-muted); }

.info-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-width: 0;
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
  margin-top: var(--space-3);
  font-size: 0.65rem;
  font-style: italic;
  opacity: 0.6;
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
