<template>
  <div class="player-bar" :class="{ 'player-active': active }">
    <div class="player-avatar-sm" :style="avatarStyle">
      {{ typeof avatar === 'string' ? avatar : '' }}
    </div>
    <div class="player-details">
      <div class="player-name">{{ name }}</div>
      <div class="player-rating-small">
        <span class="badge" :class="color === 'white' ? 'badge-accent' : 'badge-teal'">{{ rating }}</span>
      </div>
    </div>
    <div class="clock" :class="{ 'clock-active': active, 'clock-low': timeSeconds < 30 }">
      {{ formattedTime }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
  rating: number
  avatar: string
  time: number // seconds
  active: boolean
  color: 'white' | 'black'
}>()

const timeSeconds = computed(() => props.time)

const formattedTime = computed(() => {
  const t = props.time
  if (t <= 0) return '0:00'
  const m = Math.floor(t / 60)
  const s = t % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const avatarStyle = computed(() => ({
  background: props.color === 'white'
    ? 'linear-gradient(135deg, var(--accent), #7c3aed)'
    : 'linear-gradient(135deg, #374151, #1f2937)',
}))
</script>

<style scoped>
.player-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  width: min(480px, 90vw);
  transition: all 0.3s ease;
}
.player-active {
  border-color: rgba(139,92,246,0.35);
  background: var(--accent-dim);
}

.player-avatar-sm {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
}

.player-details { flex: 1; }
.player-name { font-size: 0.88rem; font-weight: 600; }
.player-rating-small { margin-top: 2px; }

.clock {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-muted);
  min-width: 60px;
  text-align: right;
  transition: color 0.3s ease;
}
.clock-active { color: var(--text-primary); }
.clock-low { color: var(--rose); animation: pulse-glow 1s infinite; }
</style>
