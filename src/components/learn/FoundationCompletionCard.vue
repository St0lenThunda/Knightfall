<template>
  <div class="completion-card glass animated-fade-in">
    <div class="confetti">🎉</div>
    <h1 class="completion-title">Lesson Complete!</h1>
    <p class="completion-subtitle">
      You've completed <strong>{{ lessonTitle }}</strong>.
    </p>

    <div class="rewards-row">
      <div class="reward">
        <span class="val">{{ isAlreadyCompleted ? '+0' : `+${xpReward}` }}</span>
        <span class="lbl">XP EARNED</span>
      </div>
      <div class="reward">
        <span class="val">✅</span>
        <span class="lbl">{{ isAlreadyCompleted ? 'ALREADY COMPLETED' : 'QUEST COMPLETE' }}</span>
      </div>
    </div>

    <button class="btn btn-primary btn-lg" @click="$emit('continue')">
      Continue Path →
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * Component displaying the completion card with XP rewards after successfully passing a lesson.
 */
defineProps<{
  lessonTitle: string;
  xpReward: number;
  isAlreadyCompleted: boolean;
}>();

defineEmits(['continue']);
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

.completion-card .confetti {
  font-size: 4rem;
  animation: bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.completion-title {
  font-size: 2rem;
  background: linear-gradient(135deg, var(--gold), #fbbf24);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.completion-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.rewards-row {
  display: flex;
  gap: var(--space-12);
  margin: var(--space-4) 0;
}

.reward {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.reward .val {
  font-size: 2rem;
  font-weight: 800;
  color: var(--gold);
}

.reward .lbl {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

@keyframes bounceIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
