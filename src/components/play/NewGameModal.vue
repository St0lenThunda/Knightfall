<script setup lang="ts">
import { ref, computed } from 'vue'
import { BOTS, TIME_CONTROLS, type GameMode, type TimeControl } from '../../stores/gameStore'
import type { Color } from 'chess.js'

// Sub-components
import ModeStep from './setup/ModeStep.vue'
import OpponentStep from './setup/OpponentStep.vue'
import ParameterStep from './setup/ParameterStep.vue'

/**
 * NewGameModal
 * 
 * A high-fidelity, step-based onboarding system for starting a match.
 * Replaces the static setup panel with an immersive workflow.
 */
const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close', 'start'])

// Game Store is initialized in the steps

// Local state for the workflow
const step = ref(1) // 1: Mode, 2: Opponent, 3: Parameters
const selectedMode = ref<GameMode>('vs-computer')
const selectedColor = ref<Color | 'r'>('w')
const selectedTc = ref<TimeControl>(TIME_CONTROLS[1]) // 10+5 as default
const activeBotIndex = ref(0)

const activeBot = computed(() => BOTS[activeBotIndex.value])

const modes: { id: GameMode; icon: string; label: string; desc: string }[] = [
  { id: 'local', icon: '🤝', label: 'Pass & Play', desc: 'Battle a friend on the same machine.' },
  { id: 'vs-computer', icon: '🤖', label: 'vs Computer', desc: 'Challenge a silicon intelligence.' },
]

const colors: { value: Color | 'r'; icon: string; label: string }[] = [
  { value: 'w', icon: '♔', label: 'White side' },
  { value: 'r', icon: '🎲', label: 'Random' },
  { value: 'b', icon: '♚', label: 'Black side' },
]

/**
 * Navigation logic
 */
function nextStep() {
  if (step.value === 1 && selectedMode.value === 'local') {
    step.value = 3 // Skip bot selection for local games
  } else {
    step.value++
  }
}

function prevStep() {
  if (step.value === 3 && selectedMode.value === 'local') {
    step.value = 1
  } else {
    step.value--
  }
}

function cycleBot(direction: number) {
  let next = activeBotIndex.value + direction
  if (next < 0) next = BOTS.length - 1
  if (next >= BOTS.length) next = 0
  activeBotIndex.value = next
}

function finalize() {
  const resolvedColor = selectedColor.value === 'r' 
    ? (Math.random() < 0.5 ? 'w' : 'b') 
    : selectedColor.value

  emit('start', {
    mode: selectedMode.value,
    color: resolvedColor,
    tc: selectedTc.value,
    bot: activeBot.value
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade-scale">
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div class="step-modal">
        <button class="close-btn" @click="emit('close')">✕</button>

        <!-- Header -->
        <div class="modal-header">
          <div class="step-indicator">
            <div 
              v-for="s in (selectedMode === 'local' ? 2 : 3)" 
              :key="s" 
              class="step-dot"
              :class="{ active: (selectedMode === 'local' && step === 3 ? 2 : step) >= s }"
            ></div>
          </div>
          <h2 class="text-glow">
            <span v-if="step === 1">CHOOSE YOUR BATTLE</span>
            <span v-if="step === 2">SELECT ADVERSARY</span>
            <span v-if="step === 3">SET PARAMETERS</span>
          </h2>
        </div>

        <div class="step-container">
          <Transition name="step-slide" mode="out-in">
            <div :key="step">
              <!-- STEP 1: MODE -->
              <ModeStep 
                v-if="step === 1"
                :selected-mode="selectedMode"
                :modes="modes"
                @select="selectedMode = $event"
              />

              <!-- STEP 2: OPPONENT -->
              <OpponentStep 
                v-if="step === 2"
                :active-bot="activeBot"
                @prev="cycleBot(-1)"
                @next="cycleBot(1)"
              />

              <!-- STEP 3: PARAMETERS -->
              <ParameterStep 
                v-if="step === 3"
                :selected-color="selectedColor"
                :colors="colors"
                :selected-tc="selectedTc"
                :time-controls="TIME_CONTROLS"
                @update-color="selectedColor = $event"
                @update-tc="selectedTc = $event"
              />
            </div>
          </Transition>
        </div>

        <!-- Footer Actions -->
        <div class="modal-footer">
          <button 
            v-if="step > 1" 
            class="action-btn secondary"
            @click="prevStep"
          >
            ← BACK
          </button>
          
          <button 
            v-if="step < 3" 
            class="action-btn primary"
            @click="nextStep"
          >
            NEXT STEP →
          </button>

          <button 
            v-if="step === 3" 
            class="action-btn start-battle text-glow"
            @click="finalize"
          >
            READY FOR BATTLE
          </button>
        </div>
      </div>
    </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  align-items: flex-start;
  padding-top: 5vh;
}

.step-modal {
  width: 90%;
  max-width: 800px;
  background: var(--bg-surface);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  position: relative;
  overflow-y: auto;
  max-height: 90vh;
  padding: var(--space-8);
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8);
}

.close-btn {
  position: absolute;
  top: var(--space-6);
  right: var(--space-6);
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  z-index: 10;
}

.modal-header {
  text-align: center;
  margin-bottom: var(--space-10);
}

.step-indicator {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
  margin-bottom: var(--space-4);
}

.step-dot {
  width: 24px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  transition: all 0.3s;
}

.step-dot.active {
  background: var(--accent-bright);
  box-shadow: 0 0 10px var(--accent-bright);
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.step-container {
  min-height: 400px;
}

.modal-footer {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-10);
  padding-top: var(--space-8);
  border-top: 1px solid var(--border);
}

.action-btn {
  padding: var(--space-4) var(--space-8);
  border-radius: var(--radius-lg);
  font-weight: 900;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 160px;
}

.action-btn.primary {
  background: var(--accent-bright);
  border: none;
  color: white;
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text-muted);
}

.action-btn.start-battle {
  background: var(--accent-bright);
  border: none;
  color: white;
  padding: var(--space-4) var(--space-12);
  font-size: 1.1rem;
}

.action-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

/* Transitions */
.fade-scale-enter-active, .fade-scale-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.fade-scale-enter-from, .fade-scale-leave-to { opacity: 0; transform: scale(0.95); }

.step-slide-enter-active { transition: all 0.4s var(--ease); }
.step-slide-leave-active { transition: all 0.3s var(--ease); }
.step-slide-enter-from { opacity: 0; transform: translateX(30px); }
.step-slide-leave-to { opacity: 0; transform: translateX(-30px); }

@media (max-width: 768px) {
  .step-modal {
    padding: var(--space-4);
    width: 95%;
  }
  .step-container {
    min-height: 280px;
  }
  .modal-header {
    margin-bottom: var(--space-4);
  }
  .modal-header h2 {
    font-size: 1.15rem;
  }
  .modal-footer {
    margin-top: var(--space-4);
    padding-top: var(--space-4);
  }
  .action-btn {
    padding: var(--space-3) var(--space-4);
    min-width: 120px;
    font-size: 0.9rem;
  }
}
</style>
