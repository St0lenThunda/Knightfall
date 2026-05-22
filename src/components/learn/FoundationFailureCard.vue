<template>
  <div class="completion-card glass failure-card animated-fade-in">
    <div class="failure-icon">💡</div>
    <h1 class="failure-title">Try Again!</h1>
    <p class="failure-subtitle">
      You scored <strong>{{ score }}</strong> out of <strong>{{ total }}</strong>.
      An advisor demands at least 70% correct answers to unlock passage.
    </p>

    <div class="action-buttons">
      <button class="btn btn-primary" @click="$emit('retry')">
        🔄 Retry Quiz
      </button>
      <button class="btn btn-secondary" @click="$emit('review')">
        📖 Review Lesson
      </button>
      <button class="btn btn-ghost" @click="$emit('back')">
        Back to Path
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Component displaying the failure card if the user doesn't meet the passing threshold.
 */
defineProps<{
  score: number;
  total: number;
}>();

defineEmits(['retry', 'review', 'back']);
</script>

<style scoped>
.completion-card {
  text-align: center;
  padding: var(--space-12);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  max-width: 500px;
  margin: var(--space-12) auto;
}

.failure-card {
  border-color: rgba(244, 63, 94, 0.2) !important;
}

.failure-icon {
  font-size: 4rem;
  animation: pulse 2s infinite;
}

.failure-title {
  font-size: 2rem;
  background: linear-gradient(135deg, var(--rose), #f43f5e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.failure-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  max-width: 400px;
  margin: 0 auto;
}

.action-buttons {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
</style>
