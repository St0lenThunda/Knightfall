<script setup lang="ts">
/**
 * WarRoomAcademy: Displays high-level metrics for the Knight's Path and Scholar's Sanctum.
 * This bridges the gap between raw rating stats and long-term academic mastery.
 */
import { computed } from 'vue'
import { useCurriculumStore } from '../../../stores/curriculumStore'
import { useUserStore } from '../../../stores/userStore'
import { useUiStore } from '../../../stores/uiStore'

const curriculumStore = useCurriculumStore()
const userStore = useUserStore()
const uiStore = useUiStore()

// --- METRIC CALCULATIONS ---

/**
 * Calculates the total percentage of the Sanctum (Library) mastered.
 */
const sanctumCompletion = computed(() => {
  const totalLessons = 20 // Standardized count across current subjects
  const completed = userStore.completedLessons.length
  return Math.round((completed / totalLessons) * 100)
})

/**
 * Maps the 5-stage assessment results to a visual progress state.
 */
const pathStages = [
  { id: 'tactics', label: 'Tactics', icon: '⚔️' },
  { id: 'calculation', label: 'Visualization', icon: '👁️' },
  { id: 'endgame', label: 'Technique', icon: '⏳' },
  { id: 'strategy', label: 'Insight', icon: '🧭' },
  { id: 'speed', label: 'Instinct', icon: '⚡' }
]

const getStageStatus = (id: string) => {
  const result = curriculumStore.results.find(r => r.stage === id)
  if (result) return 'complete'
  if (curriculumStore.currentStage === id) return 'active'
  return 'locked'
}

const activeArchetype = computed(() => userStore.profile?.archetype || 'The Unwritten Page')

/**
 * The count of tactical patterns the user has recently failed.
 */
const activeGhosts = computed(() => curriculumStore.personalPuzzles.length)
</script>

<template>
  <div class="warroom-academy glass-sm">
    <div class="academy-header">
      <div class="title-group">
        <h3>The Knight's Path</h3>
        <p class="muted">Academic Mastery & Personal Diagnostics</p>
      </div>
      <div class="archetype-pill" @click="uiStore.isArchetypeModalOpen = true" style="cursor: pointer;">
        <span class="label">PROFILE</span>
        <span class="val">{{ activeArchetype }}</span>
      </div>
    </div>

    <div class="academy-metrics-grid">
      <!-- 1. The Path Visualizer -->
      <div class="metric-card path-progress">
        <div class="metric-label">
          DIAGNOSTIC STATUS
          <span class="info-trigger" data-tooltip="Tracks your progress through the 5 assessment stages. Complete these to finalize your Soul Map.">ⓘ</span>
        </div>
        <div class="path-steps">
          <div 
            v-for="stage in pathStages" 
            :key="stage.id" 
            class="path-step" 
            :class="getStageStatus(stage.id)"
            :data-tooltip="stage.label"
          >
            <span class="step-icon">{{ stage.icon }}</span>
            <div class="step-indicator"></div>
          </div>
        </div>
      </div>

      <!-- 2. Sanctum Coverage -->
      <div class="metric-card sanctum-stats">
        <div class="metric-label">
          SANCTUM MASTERY
          <span class="info-trigger" data-tooltip="Overall progress through the Scholar's Sanctum library. Includes lessons and mastered patterns.">ⓘ</span>
        </div>
        <div class="sanctum-gauge">
          <div class="gauge-value">{{ sanctumCompletion }}%</div>
          <div class="gauge-bar">
            <div class="gauge-fill" :style="{ width: sanctumCompletion + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 3. Neural Load (Ghosts) -->
      <div class="metric-card neural-load">
        <div class="metric-label">
          NEURAL LOAD
          <span class="info-trigger" data-tooltip="Specific patterns you've failed recently. These 'Ghosts' stay in your queue until solved in the Shadow Realm.">ⓘ</span>
        </div>
        <div class="ghost-count">
          <span class="val">{{ activeGhosts }}</span>
          <span class="sub">Active Ghosts</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.warroom-academy {
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.academy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-group h3 { margin: 0; font-size: 1.1rem; }
.title-group p { margin: 4px 0 0; font-size: 0.75rem; }

.archetype-pill {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid var(--accent-dim);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.archetype-pill .label { font-size: 0.55rem; font-weight: 800; color: var(--text-muted); }
.archetype-pill .val { font-size: 0.8rem; font-weight: 900; color: var(--accent-bright); }

.academy-metrics-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: var(--space-4);
}

.metric-card {
  background: rgba(255, 255, 255, 0.02);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.metric-label {
  font-size: 0.6rem;
  font-weight: 900;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  margin-bottom: var(--space-3);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-trigger {
  font-size: 0.7rem;
  color: var(--text-dim);
  cursor: help;
  opacity: 0.6;
  transition: opacity 0.2s;
  background: rgba(255, 255, 255, 0.05);
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.info-trigger:hover {
  opacity: 1;
  color: var(--accent-bright);
  background: rgba(139, 92, 246, 0.1);
}

/* --- PATH VISUALIZER --- */
.path-steps {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}
.path-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  flex: 1;
}
.path-step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 35px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: var(--border);
  z-index: 1;
}
.path-step.complete:not(:last-child)::after { background: var(--teal-dim); }

.step-icon {
  font-size: 1.2rem;
  opacity: 0.3;
  z-index: 2;
  transition: all 0.3s ease;
}
.step-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--border);
  border: 2px solid var(--bg-surface);
  z-index: 2;
  transition: all 0.3s ease;
}

.path-step.complete .step-icon { opacity: 1; transform: scale(1.1); }
.path-step.complete .step-indicator { background: var(--teal); box-shadow: 0 0 10px var(--teal-dim); }
.path-step.active .step-indicator { background: var(--accent); animation: pulse-indicator 2s infinite; }

@keyframes pulse-indicator {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
  70% { transform: scale(1.2); box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
}

/* --- SANCTUM GAUGE --- */
.sanctum-gauge { display: flex; flex-direction: column; gap: 8px; }
.gauge-value { font-size: 1.5rem; font-weight: 900; color: var(--teal); }
.gauge-bar { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
.gauge-fill { height: 100%; background: var(--teal); border-radius: 2px; }

/* --- GHOST COUNT --- */
.ghost-count { display: flex; flex-direction: column; align-items: baseline; gap: 2px; }
.ghost-count .val { font-size: 1.5rem; font-weight: 900; color: var(--rose); }
.ghost-count .sub { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); }

@media (max-width: 900px) {
  .academy-metrics-grid { grid-template-columns: 1fr; }
}
</style>
