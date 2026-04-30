<template>
  <Transition name="intro-fade">
    <div class="puzzle-intro-overlay" v-if="visible">
      <div class="intro-content glass-void">
        <div class="void-pulse-ring"></div>
        
        <div class="intro-header">
          <div class="echo-icon">{{ icon }}</div>
          <h2 class="intro-title">{{ title || 'Echoes of the Past' }}</h2>
          <div class="category-tag">{{ category }}</div>
        </div>

        <div class="intro-body">
          <p class="intro-prose" v-if="isPersonal">
            A ghost of a previous battle has manifested. You missed a critical opportunity in this position.
          </p>
          <p class="intro-prose" v-else>
            Test your pattern recognition in this tactical challenge.
          </p>
          
          <div class="mission-card">
            <div class="mission-label">MISSION OBJECTIVE</div>
            <div class="mission-text">{{ missionText }}</div>
          </div>

          <div class="theme-badges" v-if="themes && themes.length">
            <div v-for="t in themes" :key="t" class="theme-badge">
              {{ t }}
            </div>
          </div>
        </div>

        <button class="btn btn-primary btn-void" @click="$emit('start')">
          <span>Enter the Shadow Realm</span>
          <span class="icon">✨</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  visible: boolean
  title?: string
  category?: string
  themes?: string[]
  severity?: string
}>()

defineEmits(['start'])

const isPersonal = computed(() => props.category === 'Personal Mistake')

const icon = computed(() => {
  if (isPersonal.value) return '👤'
  return '🧩'
})

const missionText = computed(() => {
  if (isPersonal.value) {
    if (props.severity === 'blunder') return 'The Oracle detected a fatal tactical oversight. Neutralize the threat and secure the winning line.'
    if (props.severity === 'mistake') return 'Your previous evaluation faltered here. Find the sequence that restores the equilibrium.'
    return 'Refine your accuracy. Find the subtle nuance you overlooked in the heat of battle.'
  }
  return 'Identify the tactical pattern and execute the winning sequence.'
})
</script>

<style scoped>
.puzzle-intro-overlay {
  position: absolute;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(5, 5, 10, 0.7);
  backdrop-filter: blur(8px);
  padding: var(--space-6);
}

.intro-content {
  width: 100%;
  max-width: 440px;
  background: rgba(15, 15, 25, 0.9);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: var(--radius-xl);
  padding: var(--space-8) var(--space-6);
  text-align: center;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  box-shadow: 0 0 50px rgba(139, 92, 246, 0.2);
}

.glass-void {
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
}

.void-pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  border: 2px solid rgba(139, 92, 246, 0.1);
  border-radius: 50%;
  animation: pulse-out 4s infinite linear;
  pointer-events: none;
}

@keyframes pulse-out {
  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
}

.intro-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.echo-icon {
  font-size: 3rem;
  background: rgba(139, 92, 246, 0.2);
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(139, 92, 246, 0.4);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
}

.intro-title {
  font-size: 1.5rem;
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.02em;
  margin: 0;
}

.category-tag {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--accent-bright);
  background: rgba(139, 92, 246, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.intro-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
}

.intro-prose {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
}

.mission-card {
  background: rgba(0, 0, 0, 0.3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.05);
  text-align: left;
}

.mission-label {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--accent-bright);
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}

.mission-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
}

.theme-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.theme-badge {
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.2s ease;
}

.theme-badge:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.btn-void {
  width: 100%;
  padding: var(--space-4);
  font-size: 1rem;
  font-weight: 800;
  background: linear-gradient(135deg, #7c3aed, #4c1d95);
  border: none;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-void:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(124, 58, 237, 0.5);
  filter: brightness(1.1);
}

/* Animations */
.intro-fade-enter-active, .intro-fade-leave-active {
  transition: all 0.4s ease;
}

.intro-fade-enter-from {
  opacity: 0;
  transform: scale(1.1);
}

.intro-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
