<template>
  <div class="puzzles-header">
    <div>
      <h2 style="display: flex; align-items: center; gap: var(--space-2);">
        <span>{{ routeMeta.icon }}</span>
        <span>{{ routeMeta.title }}</span>
      </h2>
      <p class="muted" style="font-size: 0.9rem;">Targeted by your Weakness DNA</p>
    </div>
    <div class="puzzle-stats">
      <div class="stat-card" style="padding: var(--space-3) var(--space-5);">
        <div class="stat-label">Puzzle Rating</div>
        <div class="stat-value" style="font-size: 1.4rem;">{{ rating }}</div>
      </div>
      <div class="stat-card" style="padding: var(--space-3) var(--space-5);">
        <div class="stat-label">Streak 🔥</div>
        <div class="stat-value text-gold-gradient" style="font-size: 1.4rem;">{{ streak }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const routeMeta = computed(() => ({
  title: route?.meta?.title || 'Siege Trials',
  icon: route?.meta?.icon || '⚡'
}))

/**
 * PuzzleHeader
 * 
 * Displays the primary tactical stats (Rating, Streak) for the user.
 */
defineProps<{
  rating: number;
  streak: number;
}>()
</script>

<style scoped>
.puzzles-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
  gap: var(--space-4);
}
.puzzle-stats {
  display: flex;
  gap: var(--space-3);
}
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.stat-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.stat-value {
  font-weight: 900;
  margin-top: 2px;
}
.text-gold-gradient {
  background: linear-gradient(135deg, var(--gold), #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
