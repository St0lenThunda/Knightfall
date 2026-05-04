<script setup lang="ts">
import { BOTS, TIME_CONTROLS, type GameMode, type TimeControl } from '../../stores/gameStore'
import type { Color } from 'chess.js'

/**
 * Play Setup Panel
 * 
 * Handles the "New Game" configuration UI, including mode, opponent, 
 * color, and time control selection.
 */
defineProps<{
  activeBotId: string
}>()

const selectedMode = defineModel<GameMode>('selectedMode', { required: true })
const selectedColor = defineModel<Color>('selectedColor', { required: true })
const selectedTc = defineModel<TimeControl>('selectedTc', { required: true })

const modes: { id: GameMode; icon: string; label: string }[] = [
  { id: 'local', icon: '🤝', label: 'Pass & Play' },
  { id: 'vs-computer', icon: '🤖', label: 'vs Computer' },
]

const colors: { value: Color; icon: string; label: string }[] = [
  { value: 'b', icon: '♚', label: 'Black side' },
  { value: 'w', icon: '♔', label: 'White side' },
]

defineEmits(['start', 'selectBot'])
</script>

<template>
  <div class="setup-panel glass">
    <h3 class="mb-5">New Game</h3>

    <!-- Mode select -->
    <div class="setup-section">
      <div class="label mb-3">Game Mode</div>
      <div class="mode-grid">
        <button
          v-for="m in modes" :key="m.id"
          class="mode-btn"
          :class="{ active: selectedMode === m.id }"
          @click="selectedMode = m.id"
        >
          <span class="mode-icon">{{ m.icon }}</span>
          <span class="mode-label">{{ m.label }}</span>
        </button>
      </div>
    </div>

    <!-- Color select (vs computer) -->
    <Transition name="fade-up">
      <div class="vs-computer-settings" v-if="selectedMode === 'vs-computer'">
        <div class="setup-section">
          <div class="label mb-3">Choose Opponent</div>
          <div class="bot-list">
            <div
              v-for="bot in BOTS" :key="bot.id"
              class="bot-card glass-sm"
              :class="{ active: activeBotId === bot.id }"
              @click="$emit('selectBot', bot)"
            >
              <img 
                :src="bot.avatar" 
                class="bot-avatar" 
                :alt="bot.name"
                @error="(e) => (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + bot.id"
              />
              <div class="bot-info">
                <div class="bot-name">
                  {{ bot.name }} 
                  <span class="badge badge-accent">{{ bot.rating }}</span>
                </div>
                <div class="bot-desc muted">{{ bot.description }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="setup-section">
          <div class="label mb-3">Play as</div>
          <div class="color-picker">
            <button
              v-for="c in colors" :key="c.value"
              class="color-btn"
              :class="{ active: selectedColor === c.value }"
              @click="selectedColor = c.value"
            >
              {{ c.icon }} {{ c.label }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Time control -->
    <div class="setup-section">
      <div class="label mb-3">Time Control</div>
      <div class="tc-grid">
        <button
          v-for="tc in TIME_CONTROLS" :key="tc.label"
          class="tc-btn"
          :class="{ active: selectedTc.label === tc.label }"
          @click="selectedTc = tc"
        >
          {{ tc.label }}
        </button>
      </div>
    </div>

    <button 
      class="btn btn-primary w-full justify-center mt-4"
      @click="$emit('start')" 
      id="start-game-btn"
    >
      ♟ Start Game
    </button>
  </div>
</template>

<style scoped>
.setup-panel { 
  padding: var(--space-6); 
  overflow-y: auto; 
  max-height: 100%; 
}

.setup-section { 
  margin-bottom: var(--space-5); 
}

.mode-grid { 
  display: flex; 
  flex-direction: column; 
  gap: var(--space-2); 
}

.mode-btn {
  display: flex; 
  align-items: center; 
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 0.9rem;
}

.mode-btn:hover { 
  background: var(--bg-card); 
  color: var(--text-primary); 
}

.mode-btn.active { 
  border-color: var(--accent); 
  background: var(--accent-dim); 
  color: var(--accent-bright); 
}

.mode-icon { 
  font-size: 1.3rem; 
}

.color-picker { 
  display: flex; 
  gap: var(--space-2); 
}

.color-btn {
  flex: 1; 
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.15s ease;
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 6px;
}

.color-btn.active { 
  border-color: var(--accent); 
  background: var(--accent-dim); 
  color: var(--accent-bright); 
}

.bot-list { 
  display: flex; 
  flex-direction: column; 
  gap: var(--space-2); 
}

.bot-card { 
  width: 100%; 
  display: flex; 
  align-items: center; 
  gap: var(--space-3); 
  padding: var(--space-3); 
  border-radius: var(--radius-md); 
  border: 1px solid var(--border); 
  cursor: pointer; 
  transition: all 0.2s ease; 
  background: var(--bg-elevated); 
}

.bot-card:hover { 
  border-color: rgba(255,255,255,0.2); 
}

.bot-card.active { 
  border-color: var(--accent); 
  background: var(--accent-dim); 
}

.bot-avatar { 
  width: 44px; 
  height: 44px; 
  border-radius: 8px; 
  object-fit: cover; 
}

.bot-info { 
  flex: 1; 
  text-align: left; 
}

.bot-name { 
  font-weight: 700; 
  font-size: 0.9rem; 
  display: flex; 
  align-items: center; 
  gap: var(--space-2); 
  margin-bottom: 2px; 
}

.bot-desc { 
  font-size: 0.75rem; 
  line-height: 1.3; 
}

.tc-grid { 
  display: grid; 
  grid-template-columns: repeat(2, 1fr); 
  gap: var(--space-2); 
}

.tc-btn {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 600;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.tc-btn:hover { 
  background: var(--bg-card); 
}

.tc-btn.active { 
  border-color: var(--teal); 
  background: var(--teal-dim); 
  color: var(--teal); 
}

.mb-5 { margin-bottom: var(--space-5); }
.mb-3 { margin-bottom: var(--space-3); }
.w-full { width: 100%; }
</style>
