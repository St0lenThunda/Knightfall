<template>
  <div class="puzzle-card glass">
    <div class="puzzle-card-header">
      <div>
        <div class="label">Puzzle #{{ id }}</div>
        <h3 style="margin-top: 4px;">{{ title }}</h3>
      </div>
      <div style="display:flex; gap: var(--space-4); align-items: center;">
        <div v-if="!solved" class="puzzle-timer">
          <span class="icon">⏱️</span> {{ time }}s
        </div>
        <span class="badge badge-rose">Endgame</span>
        <span class="badge badge-teal">⭐ {{ difficulty }}</span>
      </div>
    </div>

    <div class="puzzle-turn-indicator" :class="toMove" style="display:flex; align-items:center; justify-content:space-between;">
      <div>
        {{ toMove === 'white' ? '♔' : '♚' }}
        <span>{{ toMove === 'white' ? 'White' : 'Black' }} to move</span>
      </div>
      <span v-if="isMate" class="badge badge-rose">Mate in {{ movesToSolve }}</span>
      <span v-else class="badge badge-accent">{{ movesToSolve }} Move{{ movesToSolve !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Real puzzle board -->
    <div class="puzzle-board-wrapper">
      <slot name="board"></slot>
    </div>

    <!-- Controls -->
    <div v-if="solved && explanation" class="puzzle-feedback correct" style="margin-top: var(--space-4);">
      <div class="feedback-icon">🎓</div>
      <div>
        <div class="feedback-title">Coach's Insight</div>
        <div class="feedback-msg">{{ explanation }}</div>
      </div>
    </div>

    <div class="puzzle-controls">
      <button class="btn btn-ghost btn-sm" @click="$emit('hint')" :disabled="solved">
        💡 {{ hintLabel }}
      </button>
      <button class="btn btn-ghost btn-sm" @click="$emit('solve')" :disabled="solved" title="Viewing the solution awards 0 XP">
        📝 Solution
      </button>
      <button class="btn btn-ghost btn-sm" @click="$emit('next')">
        {{ solved ? 'Next Puzzle →' : 'Skip →' }}
      </button>
      <button class="btn btn-ghost btn-sm text-rose" @click="$emit('discard')" v-if="isPersonal" title="Remove this broken drill from your training vault">
        🗑 Discard
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * PuzzleCard
 * 
 * The main interactive unit for a tactical drill.
 * Handles the board layout, indicators, and user controls.
 */
defineProps<{
  id: string;
  title: string;
  difficulty: string | number;
  time: number;
  toMove: 'white' | 'black';
  isMate: boolean;
  movesToSolve: number;
  solved: boolean;
  explanation?: string;
  hintLabel: string;
  isPersonal: boolean;
}>()

defineEmits(['hint', 'solve', 'next', 'discard'])
</script>

<style scoped>
.puzzle-card { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
.puzzle-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; }

.puzzle-timer {
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: 4px;
}

.puzzle-turn-indicator {
  display: flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-size: 0.88rem; font-weight: 600;
  width: fit-content;
}
.puzzle-turn-indicator.white { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); }
.puzzle-turn-indicator.black { background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); }

.puzzle-board-wrapper {
  display: flex;
  justify-content: center;
  margin: var(--space-4) 0;
}

.puzzle-feedback {
  display: flex; align-items: flex-start; gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid;
}
.puzzle-feedback.correct { background: var(--green-dim); border-color: rgba(16,185,129,0.3); }
.feedback-icon { font-size: 1.4rem; }
.feedback-title { font-weight: 700; margin-bottom: 3px; }
.feedback-msg { font-size: 0.85rem; color: var(--text-secondary); }

.puzzle-controls { display: flex; gap: var(--space-2); flex-wrap: wrap; }
</style>
