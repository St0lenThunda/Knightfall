<template>
  <Transition name="overlay-fade">
    <div class="puzzle-success-overlay" v-if="visible">
      <div class="success-content glass-premium">
        <div class="success-badge" :class="{ 'is-learned': solutionUsed }">
          {{ solutionUsed ? 'LEARNED' : 'SOLVED!' }}
        </div>
        
        <div class="celebration-icon">
          <span v-if="!solutionUsed">🏆</span>
          <span v-else>📖</span>
        </div>

        <h2 class="success-title">
          {{ solutionUsed ? 'The path is revealed' : 'Excellent Technique' }}
        </h2>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">TIME</div>
            <div class="stat-value">{{ formatTime(timeTaken) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">XP REWARD</div>
            <div class="stat-value text-accent">{{ xpGained > 0 ? `+${xpGained}` : '0' }} XP</div>
          </div>
          <div class="stat-item" v-if="bonusLabel">
            <div class="stat-label">BONUS</div>
            <div class="stat-value text-green">{{ bonusLabel }}</div>
          </div>
        </div>

        <div class="explanation-box" v-if="explanation">
          <p class="explanation-text">{{ explanation }}</p>
        </div>

        <div class="action-buttons">
          <button class="btn btn-primary btn-lg" @click="$emit('next')">
            <span>Next Puzzle</span>
            <span class="icon">→</span>
          </button>
          <button class="btn btn-secondary" @click="$emit('close')">
            Review Position
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * PuzzleSuccessOverlay.vue
 * 
 * A premium, clear notification overlay displayed after a puzzle is solved.
 * Replaces the simple toast with a high-fidelity feedback loop.
 */

defineProps<{
  visible: boolean
  solutionUsed: boolean
  xpGained: number
  timeTaken: number
  bonusLabel?: string
  explanation?: string
}>()

defineEmits(['next', 'close'])

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}
</script>

<style scoped>
.puzzle-success-overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 15, 0.4);
  backdrop-filter: blur(4px);
  padding: var(--space-6);
}

.success-content {
  width: 100%;
  max-width: 420px;
  background: rgba(23, 23, 35, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  padding: var(--space-8) var(--space-6);
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(139, 92, 246, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-premium {
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
}

.success-badge {
  background: linear-gradient(135deg, #fbbf24, #d97706);
  color: #000;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  padding: 4px 16px;
  border-radius: 100px;
  text-transform: uppercase;
}

.success-badge.is-learned {
  background: linear-gradient(135deg, #60a5fa, #2563eb);
  color: #fff;
}

.celebration-icon {
  font-size: 4rem;
  line-height: 1;
  filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.4));
}

.success-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  width: 100%;
}

.stat-item {
  background: rgba(255, 255, 255, 0.03);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-label {
  font-size: 0.65rem;
  color: var(--text-muted);
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.text-accent { color: var(--accent-bright); }
.text-green { color: #4ade80; }

.explanation-box {
  background: rgba(139, 92, 246, 0.05);
  border-left: 3px solid var(--accent);
  padding: var(--space-4);
  border-radius: var(--radius-sm);
  width: 100%;
  text-align: left;
}

.explanation-text {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text-secondary);
  margin: 0;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
}

.btn-lg {
  padding: var(--space-4);
  font-size: 1rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.btn-lg .icon {
  transition: transform 0.2s;
}

.btn-lg:hover .icon {
  transform: translateX(4px);
}

/* Animations */
@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}
</style>
