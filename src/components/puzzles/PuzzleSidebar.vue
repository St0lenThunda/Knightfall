<template>
  <div class="puzzle-sidebar">
    <!-- Today's progress -->
    <div class="glass progress-card">
      <div class="card-header">
        <h4>Today's Progress</h4>
      </div>
      <div class="progress-row">
        <span class="muted" style="font-size:0.85rem;">Solved today</span>
        <span style="font-weight: 700;">{{ solvedToday }} / 10</span>
      </div>
      <div class="progress-bar" style="margin-top: var(--space-2);">
        <div class="progress-bar-fill" :style="{ width: (solvedToday * 10) + '%' }"></div>
      </div>

      <div class="xp-bar" style="margin-top: var(--space-5);">
        <div class="progress-row" style="margin-bottom: var(--space-2);">
          <span class="muted" style="font-size:0.85rem;">XP toward next rank</span>
          <span class="badge badge-gold">{{ nextTitle || 'Knight' }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill" :style="{ width: levelProgress + '%', background: 'linear-gradient(90deg, var(--gold), #f59e0b)' }"></div>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px;">
          {{ xp }} / {{ xpForNextLevel }} XP
        </div>
      </div>
    </div>

    <!-- Puzzle queue -->
    <div class="glass puzzle-queue">
      <div class="card-header"><h4>Up Next</h4></div>
      <div class="queue-list">
        <div v-for="p in queue.slice(0, 5)" :key="p.id" class="queue-item">
          <div class="queue-board-thumb">
            <span style="font-size: 1.5rem">♟</span>
          </div>
          <div class="queue-meta">
            <div style="font-weight: 600; font-size:0.88rem;">{{ p.title }}</div>
            <div style="display:flex; gap: var(--space-2); margin-top: 3px;">
              <span class="badge badge-accent">{{ p.category || (p.themes && p.themes[0]) || 'Mixed' }}</span>
              <span style="font-size:0.75rem; color: var(--text-muted);">⭐ {{ p.rating }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="queue.length > 5" class="queue-footer">
        <button class="btn btn-ghost btn-sm" @click="$emit('view-sanctum')">
          +{{ queue.length - 5 }} More in Sanctum →
        </button>
      </div>
    </div>

    <!-- Weakness targeting -->
    <div class="glass weakness-target">
      <div class="card-header">
        <h4>🧬 Targeting your weakness</h4>
      </div>
      <p class="muted" style="font-size: 0.82rem; margin-top: var(--space-2);">
        These puzzles are selected based on your <strong style="color: var(--text-primary);">{{ weakness.label }}</strong> weakness ({{ weakness.missRate }}% miss rate).
      </p>
    </div>

    <!-- Ghost Mastery (Shadow Realm Analytics) -->
    <div v-if="shadowStats.total > 0" class="glass ghost-mastery">
      <div class="card-header">
        <h4>👻 Ghost Mastery</h4>
      </div>
      <div class="stats-grid mt-3">
        <div class="mini-stat">
          <div class="stat-label">Ghosts Cleared</div>
          <div class="stat-value text-teal-gradient">{{ shadowStats.solved }}</div>
        </div>
        <div class="mini-stat">
          <div class="stat-label">Success Rate</div>
          <div class="stat-value text-rose-gradient">{{ shadowStats.accuracy }}%</div>
        </div>
      </div>
      <p class="muted mt-3" style="font-size: 0.75rem;">
        You are {{ shadowStats.accuracy > 70 ? 'dominating' : 'struggling with' }} your past self.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Puzzle } from '../../api/puzzleApi'

/**
 * PuzzleSidebar
 * 
 * High-density informational sidepanel for tactical training.
 */
defineProps<{
  solvedToday: number;
  xp: number;
  xpForNextLevel: number;
  levelProgress: number;
  nextTitle: string;
  queue: Puzzle[];
  weakness: { label: string; missRate: number };
  shadowStats: { total: number; solved: number; accuracy: number };
}>()

defineEmits(['view-sanctum'])
</script>

<style scoped>
.puzzle-sidebar { display: flex; flex-direction: column; gap: var(--space-6); }
.progress-card, .puzzle-queue, .weakness-target, .ghost-mastery { padding: var(--space-6); }
.progress-row { display: flex; justify-content: space-between; align-items: center; }

.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.mini-stat { background: rgba(255,255,255,0.03); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.05); }
.stat-label { font-size: 0.65rem; color: var(--text-muted); font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
.stat-value { font-size: 1.1rem; font-weight: 900; margin-top: 2px; }

.text-teal-gradient { background: linear-gradient(135deg, #2dd4bf, #0d9488); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.text-rose-gradient { background: linear-gradient(135deg, #fb7185, #e11d48); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

.queue-list { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-3); }
.queue-item { display: flex; gap: var(--space-3); align-items: center; }
.queue-board-thumb {
  width: 48px; height: 48px;
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.full-width { width: 100%; }
.queue-footer { margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid rgba(255,255,255,0.05); }
</style>
