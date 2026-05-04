<script setup lang="ts">
/**
 * OpponentStep.vue
 * 
 * Step 2 of the New Game workflow.
 * Features the bot selection carousel with lore and technical parameters.
 */
import type { Bot } from '../../../stores/game/useBotEngine'

defineProps<{
  activeBot: Bot
}>()

defineEmits(['prev', 'next'])
</script>

<template>
  <div class="step-content bot-selection">
    <div class="carousel-container">
      <button class="nav-arrow left" @click="$emit('prev')">←</button>
      
      <Transition name="carousel-slide" mode="out-in">
        <div :key="activeBot.id" class="bot-hero-card glass">
          <div class="bot-visual">
            <div class="avatar-frame">
              <img :src="activeBot.avatar" :alt="activeBot.name" class="hero-avatar" />
              <div class="scan-line"></div>
            </div>
            <div class="hero-rating text-glow">{{ activeBot.rating }} ELO</div>
          </div>
          
          <div class="bot-details">
            <div class="bot-header">
              <span class="classification" data-tooltip="Defines the unique behavioral profile and tactical instincts of the adversary.">CLASSIFICATION: {{ activeBot.mortalArchetype?.toUpperCase() || 'STANDARD' }}</span>
              <h3>{{ activeBot.name }}</h3>
            </div>
            
            <div class="trait-row">
              <span v-for="t in activeBot.traits" :key="t" class="trait-tag">{{ t }}</span>
            </div>
            
            <p class="bot-lore">{{ activeBot.backstory }}</p>
            
            <div class="mini-stats">
              <div class="m-stat">
                <label>DEPTH <span class="stat-info-trigger" data-tooltip="The number of half-moves the engine looks ahead. Higher depth means stronger tactical precision but slower calculation.">ⓘ</span></label>
                <span>{{ activeBot.depth }} plies</span>
              </div>
              <div class="m-stat">
                <label>CONTEMPT <span class="stat-info-trigger" data-tooltip="Determines how much the bot avoids draws. High contempt makes the bot play more aggressively to win, even if the position is objectively equal.">ⓘ</span></label>
                <span>{{ activeBot.contempt }}</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <button class="nav-arrow right" @click="$emit('next')">→</button>
    </div>
  </div>
</template>

<style scoped>
.carousel-container {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
}

.nav-arrow {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-muted);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.nav-arrow:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  border-color: var(--accent-dim);
}

.bot-hero-card {
  flex: 1;
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--space-6);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.avatar-frame {
  width: 180px;
  height: 180px;
  border-radius: var(--radius-md);
  border: 1px solid var(--accent-bright);
  overflow: hidden;
  position: relative;
  margin-bottom: var(--space-3);
}

.hero-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-rating {
  font-family: var(--font-mono);
  font-weight: 800;
  text-align: center;
  font-size: 1.1rem;
}

.bot-header h3 {
  font-size: 1.8rem;
  font-weight: 900;
  margin-bottom: var(--space-2);
}

.classification {
  font-size: 0.6rem;
  font-weight: 900;
  color: var(--accent-bright);
  letter-spacing: 0.15em;
  cursor: help;
}

.trait-row {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.trait-tag {
  background: rgba(0, 243, 255, 0.1);
  color: var(--accent-bright);
  font-size: 0.65rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 4px;
  text-transform: uppercase;
}

.bot-lore {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}

.mini-stats {
  display: flex;
  gap: var(--space-6);
  border-top: 1px solid var(--border);
  padding-top: var(--space-4);
}

.m-stat label {
  display: block;
  font-size: 0.6rem;
  font-weight: 900;
  color: var(--text-muted);
}

.m-stat span {
  font-weight: 700;
  font-size: 0.9rem;
}

/* Transitions */
.carousel-slide-enter-active { transition: all 0.4s var(--ease); }
.carousel-slide-leave-active { transition: all 0.3s var(--ease); }
.carousel-slide-enter-from { opacity: 0; transform: scale(0.9) translateX(50px); }
.carousel-slide-leave-to { opacity: 0; transform: scale(0.9) translateX(-50px); }

@media (max-width: 768px) {
  .bot-hero-card { grid-template-columns: 1fr; }
}
</style>
