<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/userStore'

const userStore = useUserStore()
const router = useRouter()

const emit = defineEmits(['close'])

const isDev = import.meta.env.DEV

// Time ticker
const currentTime = ref(Date.now())
let timerInterval: any = null

onMounted(() => {
  timerInterval = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000) // Update every second for a fluid ticking timer
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

// Calculate the remaining time until the next heart
const timeRemainingStr = computed(() => {
  const lastActiveStr = userStore.profile?.last_active_at
  if (!lastActiveStr) return 'calculating...'

  const lastActiveTime = new Date(lastActiveStr).getTime()
  const msElapsed = currentTime.value - lastActiveTime
  const fourHoursMs = 4 * 60 * 60 * 1000
  const msRemaining = fourHoursMs - (msElapsed % fourHoursMs)

  if (msRemaining <= 0 || isNaN(msRemaining)) {
    return '0h 00m 00s'
  }

  const hours = Math.floor(msRemaining / (60 * 60 * 1000))
  const minutes = Math.floor((msRemaining % (60 * 60 * 1000)) / (60 * 1000))
  const seconds = Math.floor((msRemaining % (60 * 1000)) / 1000)

  return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
})

function handleGoToGauntlet() {
  router.push('/gauntlet')
  emit('close')
}

function handleGoBack() {
  if (window.history.state && window.history.state.back) {
    router.back()
  } else {
    router.push('/path')
  }
  emit('close')
}

async function handleAdminRefill() {
  await userStore.refillHearts()
  emit('close')
}
</script>

<template>
  <div class="hearts-overlay">
    <div class="hearts-modal glass-floating animated-scale-up">
      <div class="heart-broken-icon">💔</div>
      
      <h2 class="title-lg text-glow text-rose">Energy Depleted</h2>
      <p class="subtitle text-secondary">You have run out of hearts to continue this lesson.</p>

      <div class="countdown-section glass-xs">
        <div class="lbl">NEXT HEART IN</div>
        <div class="timer font-mono text-glow">{{ timeRemainingStr }}</div>
        <div class="desc text-muted">Hearts regenerate automatically every 4 hours.</div>
      </div>

      <div class="options-list">
        <h3>Other Ways to Recharge:</h3>
        <div class="option-item glass-xs">
          <div class="option-icon">⚔️</div>
          <div class="option-details">
            <div class="option-title">The Daily Gauntlet</div>
            <div class="option-desc">Complete the Daily Gauntlet puzzle challenge to instantly earn a bonus heart.</div>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-primary" @click="handleGoToGauntlet">⚔️ Go to Daily Gauntlet</button>
        <button class="btn btn-ghost" @click="handleGoBack">← Return to Path</button>
        
        <!-- Dev Refill -->
        <button v-if="userStore.isAdmin || isDev" class="btn btn-xs btn-danger mt-4" @click="handleAdminRefill">
          ❤️ Dev Refill
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hearts-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999; /* Higher than SideNav to fully lock down view */
  background: rgba(5, 5, 10, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.hearts-modal {
  width: 100%;
  max-width: 480px;
  padding: var(--space-10);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(244, 63, 94, 0.25);
  box-shadow: 0 20px 80px rgba(0,0,0,0.8), 0 0 40px rgba(244, 63, 94, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-6);
}

.heart-broken-icon {
  font-size: 4rem;
  animation: pulse-break 2s infinite ease-in-out;
  filter: drop-shadow(0 0 15px rgba(244, 63, 94, 0.4));
}

.text-rose {
  color: var(--rose, #f43f5e);
}

.subtitle {
  font-size: 0.95rem;
  margin-top: calc(-1 * var(--space-2));
}

.countdown-section {
  width: 100%;
  padding: var(--space-6) var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.countdown-section .lbl {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--rose, #f43f5e);
}

.countdown-section .timer {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--text);
}

.countdown-section .desc {
  font-size: 0.8rem;
}

.options-list {
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.options-list h3 {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-secondary);
}

.option-item {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255,255,255,0.03);
}

.option-icon {
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-title {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text);
}

.option-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin-top: var(--space-1);
}

.modal-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.modal-actions button {
  width: 100%;
}

.animated-scale-up {
  animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes pulse-break {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
</style>
