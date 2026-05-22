<template>
  <div class="landing-step animate-fade-in">
    <!-- Hero Box with glassmorphism layout -->
    <div class="hero-arch glass-lg">
      <span class="ritual-tag">THE RITE OF INITIATION</span>
      <h1 class="hero-title">Forge Your <span class="text-gradient">Chess DNA</span></h1>
      <p class="hero-desc">
        Welcome to Knightfall. To map your cognitive strengths and weaknesses, we must initialize your tactical profile.
      </p>

      <!-- Oracle Rating Notice -->
      <div class="oracle-notice glass-sm">
        <span class="oracle-icon">🔮</span>
        <div class="oracle-text">
          <strong>The Oracle Whispers:</strong>
          <p>
            The ratings generated here are platform-specific skill benchmarks designed to optimize your personalized training queue. They do not constitute official federation ratings (like FIDE, USCF, Lichess, or Chess.com).
          </p>
        </div>
      </div>

      <!-- Self-Declaration Form -->
      <div class="declaration-form">
        <h3>Select your estimated chess experience:</h3>
        <div class="skill-grid">
          <button 
            v-for="opt in skillOptions" 
            :key="opt.label"
            class="skill-btn glass-sm"
            :class="{ active: declaredSkill === opt.value }"
            @click="declaredSkill = opt.value"
          >
            <span class="skill-emoji">{{ opt.emoji }}</span>
            <div class="skill-meta">
              <span class="skill-title">{{ opt.label }}</span>
              <span class="skill-desc">Est. {{ opt.rating }} Elo</span>
            </div>
          </button>
        </div>

        <button 
          class="btn btn-primary btn-lg btn-glow mt-8" 
          :disabled="!declaredSkill"
          @click="handleSubmit"
        >
          Begin Assessment →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * OnboardingDeclaration.vue
 *
 * Screen 1 of the Onboarding Gauntlet.
 * Allows new users/guests to select their estimated chess experience (Elo range).
 * This selection sets the baseline difficulty range for the subsequent diagnostic tests.
 *
 * Emits a 'submit' event to notify the parent orchestrator to proceed.
 */
import { ref, watch } from 'vue'

const props = defineProps<{
  /**
   * The current declared skill rating (supporting Vue v-model).
   * Can be null if the user has not selected a rating benchmark yet.
   */
  modelValue: number | null
}>()

const emit = defineEmits<{
  /** Update event for v-model binding */
  (e: 'update:modelValue', value: number | null): void
  /** Submit event triggered when they click the main action button */
  (e: 'submit'): void
}>()

// Local copy of the selected rating to maintain reactive form inputs safely
const declaredSkill = ref<number | null>(props.modelValue)

// Keep the local state and v-model bindings synchronized in both directions
watch(declaredSkill, (val) => {
  emit('update:modelValue', val)
})

watch(() => props.modelValue, (val) => {
  declaredSkill.value = val
})

/**
 * Predefined list of skill experience options matching typical benchmarks.
 * Each rating acts as a difficulty multiplier for diagnostic calculations.
 */
const skillOptions = [
  { label: 'Beginner', value: 800, rating: 800, emoji: '♟️' },
  { label: 'Casual', value: 1200, rating: 1200, emoji: '🍻' },
  { label: 'Club Player', value: 1600, rating: 1600, emoji: '⚔️' },
  { label: 'Expert', value: 2000, rating: 2000, emoji: '👑' }
]

/**
 * Validates the selection and submits the declaration to progress to Step 2.
 */
function handleSubmit() {
  if (declaredSkill.value) {
    emit('submit')
  }
}
</script>

<style scoped>
.landing-step {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.hero-arch {
  width: 100%;
  max-width: 750px;
  padding: var(--space-10);
  border-radius: var(--radius-xl);
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.ritual-tag {
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.3em;
  color: var(--accent-bright);
  display: block;
  margin-bottom: var(--space-3);
  text-transform: uppercase;
}

.hero-title {
  font-size: 3.2rem;
  font-weight: 900;
  margin-bottom: var(--space-4);
  line-height: 1.15;
}

.hero-desc {
  font-size: 1.15rem;
  color: var(--text-secondary);
  margin-bottom: var(--space-8);
}

/* Oracle Notice Styles */
.oracle-notice {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  text-align: left;
  margin-bottom: var(--space-8);
  border-left: 3px solid var(--accent);
}

.oracle-icon {
  font-size: 1.8rem;
}

.oracle-text strong {
  color: var(--accent-bright);
  font-size: 0.95rem;
}

.oracle-text p {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin-top: 2px;
  line-height: 1.5;
}

/* Skill Selection Grid Styles */
.skill-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

@media (max-width: 600px) {
  .skill-grid {
    grid-template-columns: 1fr;
  }
}

.skill-btn {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  cursor: pointer;
  text-align: left;
  border: 1px solid var(--border);
  transition: all var(--duration) var(--ease);
}

.skill-btn:hover {
  border-color: var(--accent);
  background: rgba(139, 92, 246, 0.05);
}

.skill-btn.active {
  border-color: var(--accent-bright);
  background: var(--accent-dim);
  box-shadow: var(--shadow-accent);
}

.skill-emoji {
  font-size: 1.8rem;
}

.skill-meta {
  display: flex;
  flex-direction: column;
}

.skill-title {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--text-primary);
}

.skill-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.btn-glow {
  box-shadow: 0 0 25px rgba(139, 92, 246, 0.4);
}
.btn-glow:hover {
  box-shadow: 0 0 50px rgba(139, 92, 246, 0.7);
}

.animate-fade-in {
  animation: fadeIn 0.4s var(--ease) both;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
