<script setup lang="ts">
/**
 * FoundationChallenge — Phase 2: The Dojo
 *
 * Renders a guided challenge banner that appears when a slide has a
 * `challenge` property. Validates a single specific move (from → to)
 * on the chess board.
 *
 * Why a separate component? Challenge validation logic is distinct from
 * narrative rendering and quiz logic. Extracting it keeps each component
 * focused on a single responsibility.
 *
 * This component does NOT directly interact with the board — it receives
 * move events from the parent view and emits success/failure signals.
 */
import { ref } from 'vue'
import type { FoundationChallenge as ChallengeType } from '../../types/foundationTypes'

/**
 * @prop challenge - The challenge data (instruction, from, to, successMessage)
 * @prop active - Whether the challenge is currently accepting input
 */
const props = defineProps<{
  challenge: ChallengeType
  active: boolean
}>()

const emit = defineEmits<{
  /** Fired when the user successfully completes the challenge */
  (e: 'complete'): void
}>()

/** Whether the user has completed this challenge */
const isCompleted = ref(false)

/** Whether the user just made an incorrect attempt (triggers shake animation) */
const isShaking = ref(false)

/**
 * Validates a move against the challenge's expected from/to.
 *
 * Called by the parent view when a move is made on the board.
 * Returns true if the move matches, false otherwise.
 *
 * @param from - The source square of the attempted move
 * @param to - The target square of the attempted move
 * @returns boolean - Whether the move was correct
 */
function validateMove(from: string, to: string): boolean {
  if (isCompleted.value) return false

  if (from === props.challenge.from && to === props.challenge.to) {
    isCompleted.value = true
    emit('complete')
    return true
  }

  // Wrong move — trigger shake feedback
  isShaking.value = true
  setTimeout(() => {
    isShaking.value = false
  }, 500)

  return false
}

/**
 * Resets the challenge state (used when navigating away and back).
 */
function reset() {
  isCompleted.value = false
  isShaking.value = false
}

// Expose methods so the parent view can call them
defineExpose({ validateMove, reset })
</script>

<template>
  <Transition name="challenge-slide">
    <div
      v-if="active"
      class="challenge-banner"
      :class="{
        'challenge-completed': isCompleted,
        'challenge-shake': isShaking
      }"
    >
      <!-- Challenge Icon & Status -->
      <div class="challenge-header">
        <span class="challenge-icon">{{ isCompleted ? '✅' : '⚔️' }}</span>
        <span class="challenge-label">{{ isCompleted ? 'Challenge Complete!' : 'Try It' }}</span>
      </div>

      <!-- Instruction Text -->
      <p class="challenge-instruction">
        {{ isCompleted ? challenge.successMessage : challenge.instruction }}
      </p>

      <!-- Hint for incorrect attempts -->
      <p v-if="isShaking" class="challenge-hint">
        Not quite — try again! Look at the board carefully.
      </p>
    </div>
  </Transition>
</template>

<style scoped>
.challenge-banner {
  padding: var(--space-4) var(--space-5);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.03));
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-left: 4px solid var(--gold);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: all 0.4s var(--ease);
}

/* ─── COMPLETED STATE ─── */
.challenge-completed {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.03));
  border-color: rgba(16, 185, 129, 0.3);
  border-left-color: var(--green);
}

/* ─── SHAKE ANIMATION (Wrong Move) ─── */
.challenge-shake {
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
  border-color: rgba(244, 63, 94, 0.3);
  border-left-color: var(--rose);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(4px); }
}

/* ─── HEADER ─── */
.challenge-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.challenge-icon {
  font-size: 1.2rem;
}

.challenge-label {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gold);
}

.challenge-completed .challenge-label {
  color: var(--green);
}

/* ─── INSTRUCTION ─── */
.challenge-instruction {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.5;
}

/* ─── HINT ─── */
.challenge-hint {
  font-size: 0.8rem;
  color: var(--rose);
  font-style: italic;
  animation: fadeIn 0.3s var(--ease);
}

/* ─── TRANSITION ─── */
.challenge-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.challenge-slide-leave-active {
  transition: all 0.2s var(--ease);
}

.challenge-slide-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}

.challenge-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
