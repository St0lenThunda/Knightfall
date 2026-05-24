<script setup lang="ts">
import { ref, onMounted } from 'vue'

/**
 * SanctumFanfareOverlay Component
 * 
 * Renders a full-screen, high-fidelity celebratory modal when the user completes
 * all 30 standard lessons in the Sanctum curriculum.
 * 
 * Why: To acknowledge the significant time and mental effort the player invested,
 * fostering motivation and closure in their chess theory studies.
 */

const props = withDefaults(defineProps<{
  totalQuests?: number
}>(), {
  totalQuests: 70
})

const emit = defineEmits(['close'])

// State to trigger secondary entrance animations
const animateContent = ref(false)

onMounted(() => {
  // Delay slightly to allow the backdrop blur to smooth in
  setTimeout(() => {
    animateContent.value = true
  }, 100)
})

/**
 * Handles the claiming of the final milestone.
 * Triggers completion event and notifies parent to close.
 */
function handleClaim() {
  emit('close')
}
</script>

<template>
  <div class="fanfare-overlay">
    <!-- Ambient particle glows in background -->
    <div class="glow-orb gold-glow"></div>
    <div class="glow-orb purple-glow"></div>

    <div 
      class="fanfare-modal glass-floating"
      :class="{ 'animate-in': animateContent }"
    >
      <!-- Sparkle/Fanfare Top Banner -->
      <div class="crown-badge">🏆✨</div>

      <h1 class="celebration-title text-glow">Sanctum Conquered</h1>
      <p class="celebration-subtitle">You have successfully mastered the entire curriculum of chess wisdom.</p>

      <!-- Achievement Stats Card -->
      <div class="stats-panel glass-xs">
        <div class="stat-item">
          <span class="stat-val">{{ props.totalQuests }}</span>
          <span class="stat-lbl">Quests Mastered</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-val">5 / 5</span>
          <span class="stat-lbl">Realms Cleared</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-val">5,000</span>
          <span class="stat-lbl">Total Quest XP</span>
        </div>
      </div>

      <!-- Unlock Section -->
      <div class="unlock-card glass-sm">
        <div class="unlock-badge">🏛️✨</div>
        <div class="unlock-details">
          <div class="unlock-tag">NEW BADGE UNLOCKED</div>
          <div class="unlock-name">Sanctum Conqueror</div>
          <div class="unlock-desc">Awarded for achieving 100% completion of the Grand Sanctum.</div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="modal-actions">
        <button class="btn btn-primary btn-lg glow-btn" @click="handleClaim">
          Claim Title
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fanfare-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(5, 5, 12, 0.88);
  backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  overflow: hidden;
}

/* Ambient floating backgrounds */
.glow-orb {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.15;
  pointer-events: none;
  animation: float-glow 8s infinite alternate ease-in-out;
}

.gold-glow {
  background: radial-gradient(circle, var(--gold, #d97706) 0%, transparent 70%);
  top: 10%;
  left: 15%;
}

.purple-glow {
  background: radial-gradient(circle, var(--accent, #a855f7) 0%, transparent 70%);
  bottom: 10%;
  right: 15%;
  animation-delay: -4s;
}

.fanfare-modal {
  width: 100%;
  max-width: 520px;
  padding: var(--space-10) var(--space-8);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(217, 119, 6, 0.25);
  box-shadow: 
    0 30px 100px rgba(0, 0, 0, 0.8), 
    0 0 50px rgba(217, 119, 6, 0.08);
  background: rgba(18, 18, 28, 0.4);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-6);
  opacity: 0;
  transform: scale(0.9) translateY(30px);
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fanfare-modal.animate-in {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.crown-badge {
  font-size: 5rem;
  line-height: 1;
  filter: drop-shadow(0 0 20px rgba(217, 119, 6, 0.5));
  animation: bounce-slow 3s infinite ease-in-out;
}

.celebration-title {
  font-size: 2.4rem;
  font-weight: 900;
  background: linear-gradient(135deg, #fff 30%, #fef3c7 70%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  letter-spacing: -0.5px;
}

.celebration-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
  max-width: 90%;
}

/* Stats card */
.stats-panel {
  width: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: var(--space-5) var(--space-2);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.04);
  background: rgba(255, 255, 255, 0.01);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  flex: 1;
}

.stat-val {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text);
  font-family: var(--font-mono, monospace);
  background: linear-gradient(to bottom, #fff, #e2e8f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-lbl {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--text-muted);
  text-transform: uppercase;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.08);
}

/* Unlock alert/badge */
.unlock-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(217, 119, 6, 0.15);
  background: rgba(217, 119, 6, 0.03);
  text-align: left;
}

.unlock-badge {
  font-size: 2.2rem;
  background: rgba(217, 119, 6, 0.1);
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  border: 1px solid rgba(217, 119, 6, 0.2);
  box-shadow: 0 4px 20px rgba(217, 119, 6, 0.1);
}

.unlock-tag {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: var(--gold, #f59e0b);
  margin-bottom: var(--space-1);
}

.unlock-name {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text);
}

.unlock-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: calc(0.5 * var(--space-1));
  line-height: 1.4;
}

.modal-actions {
  width: 100%;
  margin-top: var(--space-2);
}

.glow-btn {
  width: 100%;
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%);
  border: none;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #12121e;
  box-shadow: 0 0 20px rgba(217, 119, 6, 0.4);
  transition: all 0.3s ease;
}

.glow-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(217, 119, 6, 0.6);
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
}

.glow-btn:active {
  transform: translateY(1px);
}

/* Animations */
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(2deg); }
}

@keyframes float-glow {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(40px, 20px) scale(1.1); }
}
</style>
