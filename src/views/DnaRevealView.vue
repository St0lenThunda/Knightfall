<template>
  <div class="dna-reveal-container page" :class="!isSequencing ? 'theme-' + archetype.id : ''">
    <div v-if="isSequencing" class="sequencing-overlay">
      <div class="dna-helix-container">
        <div v-for="i in 20" :key="i" class="dna-dot" :style="{ '--i': i }"></div>
      </div>
      <h1 class="sequencing-text">SEQUENCING CHESS DNA...</h1>
      <div class="status-box">
        <p class="status-message">{{ statusMessage }}</p>
        <div class="status-progress-bar">
          <div class="status-progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </div>

    <Transition name="scale-fade">
      <div v-if="!isSequencing" class="archetype-reveal">
        <div class="archetype-card glass-lg">
          <div class="dna-badge">ARCHETYPE IDENTIFIED</div>
          <h1 class="archetype-name">{{ archetype.name }}</h1>
          <div class="archetype-icon">{{ archetype.icon }}</div>
          
          <p class="archetype-description mt-4">
            {{ archetype.description }}
          </p>

          <div class="dna-stats mt-8">
            <div v-for="(val, key) in stats" :key="key" class="stat-item">
              <span class="stat-label">{{ key.toUpperCase() }}</span>
              <div class="stat-bar-bg">
                <div class="stat-bar-fill" :style="{ width: (val * 100) + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="archetype-actions mt-10">
            <button v-if="userStore.session" class="btn btn-primary btn-lg" @click="proceedToWarRoom">
              Enter The War Room →
            </button>
            <button v-else class="btn btn-accent btn-lg" @click="saveProfile">
              Save My DNA Profile →
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCurriculumStore } from '../stores/curriculumStore'
import { useUserStore } from '../stores/userStore'

// Initialize stores at the very top of setup
const userStore = useUserStore()
const router = useRouter()
const curriculumStore = useCurriculumStore()

const isSequencing = ref(true)
const progress = ref(0)
const statusMessage = ref('Analyzing tactical floor...')

const archetypes = [
  { 
    id: 'storm', 
    name: 'The Storm', 
    icon: '⚡', 
    description: 'A whirlwind of tactical energy. You rely on instinct and lightning-fast pattern recognition to overwhelm opponents before they can react.'
  },
  { 
    id: 'oracle', 
    name: 'The Oracle', 
    icon: '👁️', 
    description: 'A master of deep visualization. You see the board not as it is, but as it will be, calculating lines that others fear to tread.'
  },
  { 
    id: 'technician', 
    name: 'The Technician', 
    icon: '⚙️', 
    description: 'Precision personified. Your endgame technique and positional accuracy make you a grinder who converts the smallest advantages into victory.'
  },
  { 
    id: 'rogue', 
    name: 'The Rogue', 
    icon: '🗡️', 
    description: 'Unpredictable and sharp. You thrive in chaos, finding unconventional solutions and tactical swindles when your back is against the wall.'
  },
  {
    id: 'student',
    name: 'The Apprentice',
    icon: '🌱',
    description: 'A balanced seeker of wisdom. Your DNA is still forming, showing potential across all categories as you build your unique style.'
  }
]

const stats = computed(() => {
  const res = curriculumStore.results
  
  /**
   * Calculates a nuanced score for a stage.
   * We add a tiny bit of "Neural Variance" (random noise) to make the
   * results feel precisely calculated and unique to the user.
   */
  const getWeightedScore = (stageKey: string, timeWeight = 0.2) => {
    const stage = res.find(r => r.stage === stageKey)
    if (!stage) return 0.4 + (Math.random() * 0.1) // Baseline for skipped stages
    
    // Base accuracy is the foundation
    const base = stage.accuracy
    
    // Time bonus: solving significantly faster than average (15s) gives a boost
    const timeFactor = Math.max(0, (20 - stage.avgTime) / 20) * timeWeight
    
    // Add 1-3% "Neural Noise" for non-symmetrical feel
    const noise = (Math.random() * 0.04) - 0.02
    
    return Math.min(0.98, Math.max(0.1, base + timeFactor + noise))
  }

  return {
    tactics: getWeightedScore('tactics', 0.3), // Speed matters more here
    calculation: getWeightedScore('calculation', 0.1), // Accuracy is king
    endgame: getWeightedScore('endgame', 0.15),
    strategy: getWeightedScore('strategy', 0.2),
    speed: getWeightedScore('speed', 0.4) // Speed is the primary factor
  }
})

const archetype = computed(() => {
  const s = stats.value
  // Weighted mapping for archetypes
  if (s.tactics > 0.75 && s.speed > 0.75) return archetypes[0] // Storm
  if (s.calculation > 0.75 && s.strategy > 0.7) return archetypes[1] // Oracle
  if (s.endgame > 0.8) return archetypes[2] // Technician
  if (s.tactics > 0.65) return archetypes[3] // Rogue
  return archetypes[4] // Student
})

const proceedToWarRoom = () => {
  router.push('/')
}

const saveProfile = () => {
  // Store results in localStorage temporarily so they survive the auth redirect/refresh
  localStorage.setItem('knightfall_pending_dna', JSON.stringify({
    archetype: archetype.value.id,
    stats: stats.value
  }))
  document.dispatchEvent(new CustomEvent('open-auth', { detail: 'signup' }))
}

onMounted(() => {
  const interval = setInterval(() => {
    progress.value += 2
    if (progress.value >= 100) clearInterval(interval)
  }, 80)

  setTimeout(() => { statusMessage.value = 'Mapping calculation depth...' }, 1000)
  setTimeout(() => { statusMessage.value = 'Evaluating endgame precision...' }, 2000)
  setTimeout(() => { statusMessage.value = 'Determining archetype...' }, 3000)
  setTimeout(() => { isSequencing.value = false }, 4500)
})
</script>

<style scoped>
.dna-reveal-container {
  height: 100vh;
  background: radial-gradient(circle at center, var(--bg-deep) 0%, #000 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  --reveal-accent: var(--accent-bright);
}

/* Archetype Theme Overrides */
.theme-storm { --reveal-accent: #a78bfa; }      /* Electric Violet */
.theme-oracle { --reveal-accent: #6366f1; }     /* Deep Indigo */
.theme-technician { --reveal-accent: #fbbf24; } /* Industrial Amber */
.theme-rogue { --reveal-accent: #f43f5e; }      /* Crimson Edge */
.theme-student { --reveal-accent: #10b981; }    /* Emerald Growth */

.sequencing-overlay {
  text-align: center;
}

.sequencing-text {
  font-size: 1.2rem;
  letter-spacing: 0.5em;
  font-weight: 900;
  color: white;
  opacity: 0.8;
  margin-top: var(--space-8);
  text-transform: uppercase;
}

.status-box {
  width: 300px;
  margin: var(--space-4) auto;
  text-align: left;
}

.status-message {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--accent-bright);
  margin-bottom: 8px;
  min-height: 1em;
}

.status-progress-bar {
  height: 2px;
  background: rgba(255,255,255,0.1);
  border-radius: 1px;
}

.status-progress-fill {
  height: 100%;
  background: var(--accent-bright);
  box-shadow: 0 0 10px var(--accent-bright);
  transition: width 0.1s linear;
}

.dna-helix-container {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.dna-dot {
  width: 10px;
  height: 10px;
  background: var(--accent-bright);
  border-radius: 50%;
  animation: helix 2s infinite ease-in-out;
  animation-delay: calc(var(--i) * 0.1s);
}

@keyframes helix {
  0%, 100% { transform: translateY(-50px) scale(0.5); opacity: 0.3; }
  50% { transform: translateY(50px) scale(1.2); opacity: 1; }
}

.archetype-reveal {
  width: 100%;
  max-width: 600px;
  padding: var(--space-4);
}

.archetype-card {
  padding: var(--space-10);
  text-align: center;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(20px);
}

.archetype-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.05),
    transparent
  );
  animation: scan 3s infinite;
}

@keyframes scan {
  0% { left: -100%; }
  100% { left: 100%; }
}

.dna-badge {
  font-size: 0.7rem;
  font-weight: 900;
  color: var(--reveal-accent);
  letter-spacing: 0.2em;
  margin-bottom: var(--space-4);
  text-shadow: 0 0 20px var(--reveal-accent);
}

.archetype-name {
  font-size: 3.5rem;
  font-weight: 900;
  margin-bottom: var(--space-4);
}

.archetype-icon {
  font-size: 5rem;
  margin: var(--space-6) 0;
}

.archetype-description {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text-muted);
}

.dna-stats {
  display: grid;
  gap: var(--space-4);
  text-align: left;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.stat-label {
  font-size: 0.6rem;
  font-weight: 800;
  color: var(--text-muted);
  width: 100px;
}

.stat-bar-bg {
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.05);
  border-radius: 3px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  background: var(--reveal-accent);
  border-radius: 3px;
  box-shadow: 0 0 10px var(--reveal-accent);
  transition: width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scale-fade-enter-active {
  transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.scale-fade-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}
</style>
