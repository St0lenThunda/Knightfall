<script setup lang="ts">
/**
 * DNABadges: Renders a preview of earned achievements/badges.
 */
import { useCoachStore } from '../../../stores/coachStore'

const coachStore = useCoachStore()
defineEmits(['showBadgeModal'])
</script>

<template>
  <div class="glass card-v3">
    <div class="card-header">
      <h4>Earned Badges</h4>
      <button @click="$emit('showBadgeModal')" class="btn-cleanup-text">VIEW ALL →</button>
    </div>
    <div class="badges-mini-grid mt-4">
      <div v-for="b in coachStore.achievements.badges.filter(x => x.earned).slice(0, 3)" :key="b.id" class="badge-mini-card glass-sm">
        <div class="badge-icon-wrapper">{{ b.icon }}</div>
        <div class="badge-content">
          <div class="badge-label">{{ b.label }}</div>
          <div class="badge-description muted">{{ b.description }}</div>
        </div>
      </div>
      <div v-if="coachStore.achievements.badges.filter(x => x.earned).length === 0" class="muted p-4 italic" style="font-size: 0.85rem;">
        No badges earned yet. Solve puzzles or win games to unlock them!
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-v3 { padding: var(--space-6); border-radius: var(--radius-xl); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }

.badges-mini-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-4); }
.badge-mini-card { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s var(--ease); }
.badge-mini-card:hover { background: rgba(139, 92, 246, 0.1); border-color: var(--accent); transform: translateY(-2px); }
.badge-icon-wrapper { font-size: 1.8rem; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border-radius: 12px; }
.badge-label { font-weight: 800; font-size: 0.9rem; }
.badge-description { font-size: 0.75rem; line-height: 1.3; margin-top: 2px; }

.btn-cleanup-text { background: none; border: none; color: var(--accent); font-size: 0.75rem; font-weight: 800; cursor: pointer; }
.btn-cleanup-text:hover { color: var(--accent-bright); }
</style>
