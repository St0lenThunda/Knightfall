<script setup lang="ts">
import { computed } from 'vue'
import type { Bot } from '../../stores/game/useBotEngine'

/**
 * BotBriefingModal
 * 
 * Provides an immersive dossier on a digital adversary.
 * Includes personality traits, tactical backstory, and engine stats.
 */
interface Props {
  bot: Bot | null
  show: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'prev', 'next'])

/**
 * Fallback traits if not defined in the bot object.
 */
const traits = computed(() => {
  return props.bot?.traits || ['Standard']
})

/**
 * Fallback backstory if not defined in the bot object.
 */
const backstory = computed(() => {
  return props.bot?.backstory || "A standard digital adversary."
})
</script>

<template>
  <Transition name="fade-scale">
    <div v-if="show && bot" class="briefing-overlay" @click.self="emit('close')">
      <div class="briefing-modal glass-lg">
        <button class="close-btn" @click="emit('close')">✕</button>
        
        <div class="briefing-layout">
          <!-- Left: Bot Visual -->
          <div class="bot-visual-section">
            <div class="avatar-frame">
              <img :src="bot.avatar" :alt="bot.name" class="bot-avatar" />
              <div class="scan-line"></div>
            </div>
            <div class="rating-badge text-glow">{{ bot.rating }} ELO</div>
            <div class="archetype-label text-muted">{{ bot.mortalArchetype?.toUpperCase() || 'STANDARD' }} ARCHETYPE</div>
          </div>

          <!-- Right: Intelligence Dossier -->
          <div class="bot-info-section">
            <div class="dossier-header">
              <span class="classification">CLASSIFICATION: ADVERSARY</span>
              <h2 class="bot-name text-glow">{{ bot.name }}</h2>
            </div>

            <div class="trait-cloud">
              <span v-for="trait in traits" :key="trait" class="trait-tag">
                {{ trait }}
              </span>
            </div>

            <div class="dossier-block">
              <label>BACKSTORY & BEHAVIOR</label>
              <p class="backstory">{{ backstory }}</p>
            </div>

            <div class="stats-grid">
              <div class="stat-item">
                <label>CALCULATION DEPTH</label>
                <div class="stat-value">{{ bot.depth }} <span class="unit">PLIES</span></div>
              </div>
              <div class="stat-item">
                <label>CONTEMPT FACTOR</label>
                <div class="stat-value">{{ bot.contempt > 0 ? '+' : '' }}{{ bot.contempt }}</div>
              </div>
              <div class="stat-item">
                <label>AGGRESSION</label>
                <div class="progress-lite">
                  <div class="progress-fill" :style="{ width: (bot.skillLevel / 20 * 100) + '%' }"></div>
                </div>
              </div>
            </div>

            <div class="dossier-footer">
              <div class="nav-controls">
                <button class="nav-btn prev" @click="emit('prev')">
                  <span class="arrow">←</span> PREV
                </button>
                <button class="btn btn-primary" @click="emit('close')">
                  CONFIRM MISSION
                </button>
                <button class="nav-btn next" @click="emit('next')">
                  NEXT <span class="arrow">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.briefing-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  z-index: 2000;
  display: flex;
  align-items: flex-start; /* Moved to top */
  justify-content: center;
  padding: var(--space-12) var(--space-6);
}

.briefing-modal {
  width: 100%;
  max-width: 900px;
  border: 1px solid var(--border);
  position: relative;
  overflow: hidden;
  margin-top: var(--space-8);
  animation: modal-enter 0.4s var(--ease) forwards;
}

.close-btn {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  z-index: 10;
  transition: color 0.2s;
}

.close-btn:hover { color: var(--text-primary); }

.briefing-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  min-height: 500px;
}

.bot-visual-section {
  background: rgba(255, 255, 255, 0.03);
  border-right: 1px solid var(--border);
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-6);
}

.avatar-frame {
  width: 200px;
  height: 200px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--accent-bright);
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 243, 255, 0.15);
}

.bot-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(0.2) contrast(1.1);
}

.scan-line {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--accent-bright);
  box-shadow: 0 0 10px var(--accent-bright);
  opacity: 0.5;
  animation: scan 3s linear infinite;
}

.rating-badge {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 800;
}

.archetype-label {
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  font-weight: 700;
}

.bot-info-section {
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.classification {
  font-size: 0.65rem;
  font-weight: 900;
  color: var(--accent-bright);
  letter-spacing: 0.2em;
}

.bot-name {
  font-size: 2.5rem;
  font-weight: 900;
  margin-top: var(--space-1);
}

.trait-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.trait-tag {
  background: rgba(0, 243, 255, 0.1);
  border: 1px solid rgba(0, 243, 255, 0.2);
  color: var(--accent-bright);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.dossier-block label, .stat-item label {
  display: block;
  font-size: 0.65rem;
  font-weight: 900;
  color: var(--text-muted);
  margin-bottom: var(--space-2);
  letter-spacing: 0.1em;
}

.backstory {
  line-height: 1.6;
  color: var(--text-secondary);
  font-size: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
  background: rgba(0, 0, 0, 0.2);
  padding: var(--space-6);
  border-radius: var(--radius-md);
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 1.2rem;
  font-weight: 700;
}

.stat-value .unit {
  font-size: 0.7rem;
  opacity: 0.5;
}

.progress-lite {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin-top: 6px;
}

.progress-fill {
  height: 100%;
  background: var(--accent-bright);
  box-shadow: 0 0 10px var(--accent-bright);
  border-radius: 2px;
}

.dossier-footer {
  margin-top: auto;
  padding-top: var(--space-4);
}

.nav-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.nav-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  border-color: var(--accent-dim);
}

.nav-btn .arrow {
  font-size: 1rem;
}

@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}

@keyframes modal-enter {
  from { opacity: 0; transform: translateY(-20px); } /* Enter from top */
  to { opacity: 1; transform: translateY(0); }
}

.fade-scale-enter-active, .fade-scale-leave-active { transition: all 0.3s var(--ease); }
.fade-scale-enter-from, .fade-scale-leave-to { opacity: 0; transform: scale(1.02); }

@media (max-width: 768px) {
  .briefing-layout { grid-template-columns: 1fr; }
  .bot-visual-section { border-right: none; border-bottom: 1px solid var(--border); }
}
</style>
