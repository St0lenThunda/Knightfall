<script setup lang="ts">
/**
 * OpponentStep.vue
 * 
 * Step 2 of the New Game workflow.
 * Features the bot selection carousel with lore and technical parameters.
 */
import { ref } from 'vue'
import type { Bot } from '../../../stores/game/useBotEngine'

const props = defineProps<{
  activeBot: Bot
}>()

defineEmits(['prev', 'next'])

/**
 * State variable that controls the visibility of the adversary details drawer.
 * When true, the backstory and attributes (Foresight/Contempt) are displayed.
 */
const showDetails = ref(false)
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
            
            <button 
              class="intel-toggle-btn glass-sm" 
              :class="{ active: showDetails }" 
              @click="showDetails = !showDetails"
              aria-expanded="showDetails"
              aria-controls="bot-intel-drawer"
            >
              <span class="icon">📜</span>
              <span>{{ showDetails ? 'COLLAPSE INTEL' : 'VIEW INTEL' }}</span>
              <span class="chevron" :class="{ rotated: showDetails }">▼</span>
            </button>
            
            <div 
              id="bot-intel-drawer" 
              class="details-drawer" 
              :class="{ open: showDetails }"
            >
              <div class="drawer-content">
                <p class="bot-lore">{{ activeBot.backstory }}</p>
                
                <div class="mini-stats">
                  <div class="m-stat">
                    <label>FORESIGHT</label>
                    <span class="m-stat-value">{{ activeBot.depth }} / 16 moves</span>
                    <div class="stat-bar-container">
                      <div class="stat-bar-fill foresight-bar" :style="{ width: (activeBot.depth / 16 * 100) + '%' }"></div>
                    </div>
                    <p class="stat-desc">The number of moves the adversary looks ahead. Higher foresight means stronger tactical precision.</p>
                  </div>
                  
                  <div class="m-stat">
                    <label>CONTEMPT</label>
                    <span class="m-stat-value">{{ activeBot.contempt > 0 ? '+' : '' }}{{ activeBot.contempt }}</span>
                    <div class="stat-bar-container contempt-track">
                      <div class="center-marker"></div>
                      <div 
                        class="stat-bar-fill contempt-bar" 
                        :class="{ negative: activeBot.contempt < 0 }"
                        :style="{ 
                          width: (Math.abs(activeBot.contempt) / 2) + '%',
                          left: activeBot.contempt >= 0 ? '50%' : 'calc(50% - ' + (Math.abs(activeBot.contempt) / 2) + '%)' 
                        }"
                      ></div>
                    </div>
                    <p class="stat-desc">Determines how much the bot avoids draws. High contempt makes the bot play more aggressively to win.</p>
                  </div>
                </div>
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

.m-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.m-stat label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 0.6rem;
  font-weight: 900;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.m-stat-value {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.stat-desc {
  font-size: 0.7rem;
  line-height: 1.35;
  color: var(--text-muted);
  margin-top: 4px;
}

.stat-bar-container {
  position: relative;
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
  width: 100%;
}

.stat-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  top: 0;
  left: 0;
}

.foresight-bar {
  background: var(--accent-bright);
  box-shadow: 0 0 8px var(--accent-bright);
}

.contempt-track {
  overflow: visible;
}

.center-marker {
  position: absolute;
  left: 50%;
  top: -2px;
  bottom: -2px;
  width: 2px;
  background: rgba(255, 255, 255, 0.3);
  z-index: 2;
}

.contempt-bar {
  background: var(--teal);
  box-shadow: 0 0 8px var(--teal);
}

.contempt-bar.negative {
  background: var(--rose);
  box-shadow: 0 0 8px var(--rose);
}

/* Details Drawer */
.intel-toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 8px var(--space-4);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  width: fit-content;
  margin-bottom: var(--space-2);
}

.intel-toggle-btn:hover {
  background: rgba(0, 243, 255, 0.05);
  border-color: var(--accent-dim);
  color: var(--text-primary);
}

.intel-toggle-btn.active {
  background: rgba(0, 243, 255, 0.1);
  border-color: var(--accent-bright);
  color: var(--accent-bright);
}

.intel-toggle-btn .chevron {
  font-size: 0.6rem;
  transition: transform 0.2s ease;
  margin-left: var(--space-1);
}

.intel-toggle-btn .chevron.rotated {
  transform: rotate(180deg);
}

.details-drawer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
  opacity: 0;
}

.details-drawer.open {
  max-height: 300px;
  opacity: 1;
}

/* Allow tooltips to overflow the drawer when open and actively interacted with */
.details-drawer.open:hover,
.details-drawer.open:focus-within {
  overflow: visible;
}

.drawer-content {
  padding-top: var(--space-2);
}

/* Transitions */
.carousel-slide-enter-active { transition: all 0.4s var(--ease); }
.carousel-slide-leave-active { transition: all 0.3s var(--ease); }
.carousel-slide-enter-from { opacity: 0; transform: scale(0.9) translateX(50px); }
.carousel-slide-leave-to { opacity: 0; transform: scale(0.9) translateX(-50px); }

@media (max-width: 768px) {
  .carousel-container {
    gap: var(--space-2);
  }

  .nav-arrow {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .bot-hero-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: var(--space-4);
    gap: var(--space-3);
  }

  .bot-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .avatar-frame {
    width: 100px;
    height: 100px;
    margin-bottom: var(--space-1);
  }

  .hero-rating {
    font-size: 0.8rem;
  }

  .bot-details {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .bot-header h3 {
    font-size: 1.25rem;
    margin-bottom: 2px;
  }

  .classification {
    font-size: 0.55rem;
  }

  .trait-row {
    margin-bottom: var(--space-2);
    flex-wrap: wrap;
    gap: var(--space-1);
    justify-content: center;
  }

  .trait-tag {
    padding: 2px 6px;
    font-size: 0.6rem;
  }

  .intel-toggle-btn {
    padding: 6px 12px;
    font-size: 0.65rem;
    margin-bottom: var(--space-1);
    align-self: center;
  }

  .details-drawer {
    width: 100%;
  }

  .bot-lore {
    font-size: 0.75rem;
    line-height: 1.35;
    margin-bottom: var(--space-2);
  }

  .mini-stats {
    padding-top: var(--space-2);
    gap: var(--space-4);
    justify-content: center;
    width: 100%;
  }

  .m-stat label {
    font-size: 0.55rem;
  }

  .m-stat-value {
    font-size: 0.75rem;
  }

  .stat-desc {
    font-size: 0.65rem;
    line-height: 1.3;
  }
}
</style>
