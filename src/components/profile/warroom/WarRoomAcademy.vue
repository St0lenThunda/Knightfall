<script setup lang="ts">
/**
 * WarRoomAcademy: Displays high-level metrics for the Knight's Path and Scholar's Sanctum.
 * This bridges the gap between raw rating stats and long-term academic mastery.
 */
import { computed } from 'vue'
import { useCurriculumStore } from '../../../stores/curriculumStore'
import { useUserStore } from '../../../stores/userStore'
import { useUiStore } from '../../../stores/uiStore'
import { archetypes } from '../../../composables/useArchetypeStats'

const curriculumStore = useCurriculumStore()
const userStore = useUserStore()
const uiStore = useUiStore()

// --- METRIC CALCULATIONS ---

/**
 * Calculates the total percentage of the Sanctum (Library) mastered.
 */
const sanctumCompletion = computed(() => {
  const totalQuests = curriculumStore.quests.length || 20
  const completed = userStore.completedQuests.length
  return Math.round((completed / totalQuests) * 100)
})

/**
 * Dynamic calculation of the 5 core learning disciplines (realms) in the Scholar's Sanctum.
 * Returns detailed tooltip descriptions and current quest completion progress.
 */
const pathStages = computed(() => {
  /**
   * Helper to format quest completion progress for a given realm.
   * 
   * @param realmId - The identifier of the target realm
   */
  const getProgressString = (realmId: string) => {
    const realmQuests = curriculumStore.quests.filter(q => q.realmId === realmId)
    const completed = realmQuests.filter(q => curriculumStore.completedQuestIds.includes(q.id)).length
    const total = realmQuests.length
    return `${completed}/${total} completed`
  }

  return [
    { 
      id: 'foundations-realm', 
      label: 'Foundations', 
      icon: '🏛️', 
      tooltip: `Foundations: Basic board rules and piece mechanics (${getProgressString('foundations-realm')})` 
    },
    { 
      id: 'opening-realm', 
      label: 'Openings', 
      icon: '🗺️', 
      tooltip: `Openings: Classic systems and starting guidelines (${getProgressString('opening-realm')})` 
    },
    { 
      id: 'tactics-realm', 
      label: 'Tactics', 
      icon: '⚔️', 
      tooltip: `Tactics: Calculation patterns and forced checkmates (${getProgressString('tactics-realm')})` 
    },
    { 
      id: 'strategy-realm', 
      label: 'Strategy', 
      icon: '🏰', 
      tooltip: `Strategy: Positional plans and pawn structure insights (${getProgressString('strategy-realm')})` 
    },
    { 
      id: 'endgame-realm', 
      label: 'Endgames', 
      icon: '⏳', 
      tooltip: `Endgames: Conversion techniques and theoretical checkmates (${getProgressString('endgame-realm')})` 
    }
  ]
})

/**
 * Calculates whether a Sanctum realm is locked, active (in progress), or completed.
 * 
 * @param realmId - The identifier of the realm
 * @returns 'complete' | 'active' | 'locked'
 */
const getRealmStatus = (realmId: string) => {
  const realmQuests = curriculumStore.quests.filter(q => q.realmId === realmId)
  if (realmQuests.length === 0) return 'locked'
  
  const completed = realmQuests.filter(q => curriculumStore.completedQuestIds.includes(q.id)).length
  const total = realmQuests.length
  
  // Complete: All quests inside the realm are solved
  if (completed === total && total > 0) return 'complete'
  
  // Active: User has accessed/unlocked at least one quest but hasn't finished them all
  const hasAccess = realmQuests.some(q => q.status === 'unlocked' || curriculumStore.completedQuestIds.includes(q.id))
  if (hasAccess) return 'active'
  
  // Locked: All quests within the realm remain locked
  return 'locked'
}

/**
 * Computed property to find the active archetype definition object.
 */
const activeArchetypeObj = computed(() => {
  const archId = userStore.profile?.archetype?.toLowerCase()
  return archetypes.find(a => a.id === archId) || null
})

/**
 * Computed name of the player's core archetype persona (e.g. The Vanguard).
 */
const activeArchetype = computed(() => {
  return activeArchetypeObj.value?.persona || 'The Squire'
})

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
      <div 
        class="archetype-pill" 
        @click="uiStore.isArchetypeModalOpen = true" 
        style="cursor: pointer;"
        :data-tooltip="'Active Form: ' + (activeArchetypeObj?.name || 'Initiate Form')"
      >
        <span class="label">ARCHETYPE</span>
        <span class="val">
          <span v-if="activeArchetypeObj?.icon" style="margin-right: 4px;">{{ activeArchetypeObj.icon }}</span>
          {{ activeArchetype.toUpperCase() }}
        </span>
      </div>
    </div>

    <div class="academy-metrics-grid">
      <!-- 1. The Path Visualizer -->
      <div class="metric-card path-progress">
        <div class="metric-label">
          DIAGNOSTIC STATUS
          <span class="info-trigger" data-tooltip="Tracks your progress through the 5 disciplines of the Scholar's Sanctum. Complete all quests in a realm to master it.">ⓘ</span>
        </div>
        <div class="path-steps">
          <div 
            v-for="stage in pathStages" 
            :key="stage.id" 
            class="path-step" 
            :class="getRealmStatus(stage.id)"
            :data-tooltip="stage.tooltip"
          >
            <span class="step-icon">{{ stage.icon }}</span>
            <div class="step-indicator"></div>
          </div>
        </div>

        <!-- Legend Key -->
        <div class="path-legend">
          <div class="legend-item">
            <span class="legend-dot complete"></span>
            <span>Completed</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot active"></span>
            <span>In Progress</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot"></span>
            <span>Locked</span>
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
.path-step:not(:last-child)::before {
  content: '';
  position: absolute;
  top: 35px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: var(--border);
  z-index: 1;
}
.path-step.complete:not(:last-child)::before { background: var(--teal-dim); }

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

/* --- PATH VISUALIZER LEGEND KEY --- */
.path-legend {
  display: flex;
  justify-content: center;
  gap: var(--space-6);
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid rgba(255, 255, 255, 0.03);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--border);
}

.legend-dot.complete {
  background: var(--teal);
  box-shadow: 0 0 8px var(--teal-dim);
}

.legend-dot.active {
  background: var(--accent);
  animation: pulse-dot-mini 2s infinite;
}

@keyframes pulse-dot-mini {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
</style>
