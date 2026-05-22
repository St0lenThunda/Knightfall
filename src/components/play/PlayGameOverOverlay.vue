<script setup lang="ts">
/**
 * Play Game Over Overlay
 * 
 * Displays the result of the match and provides options for 
 * starting a new game or reviewing the session.
 */
defineProps<{
  /** The final score/result of the game, e.g., '1-0', '0-1', '1/2-1/2' */
  result: string | null
  /** The specific reason for the game ending, e.g., 'Resignation', 'Checkmate' */
  reason?: string | null
  /** Whether the AI review report is currently loading */
  isReviewing: boolean
}>()

defineEmits(['newGame', 'review'])
</script>

<template>
  <div class="game-over-overlay glass backdrop-overlay">
    <h3 style="color: var(--accent-bright);">Game Over</h3>
    <p v-if="reason" class="reason-text">{{ reason }}</p>
    <p class="result-text">{{ result }}</p>
    
    <div class="actions">
      <button class="btn btn-primary" @click="$emit('newGame')">New Game</button>
      <button class="btn btn-ghost" @click="$emit('review')" :disabled="isReviewing">
        <span v-if="isReviewing" class="spinner-sm mr-1"></span>
        {{ isReviewing ? 'Loading...' : 'Review Game' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.game-over-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  padding: var(--space-6) var(--space-8);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  min-width: 300px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  border: 1px solid var(--border);

}

.reason-text {
  font-weight: 500;
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.result-text {
  font-weight: 600; 
  font-size: 1.1rem; 
  margin-bottom: var(--space-2);
}

.actions {
  display: flex; 
  gap: var(--space-2); 
  justify-content: center;
}

.mr-1 { margin-right: 4px; }
</style>
