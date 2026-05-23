<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLibraryStore } from '../../stores/libraryStore'
import { archetypes } from '../../composables/useArchetypeStats'

const route = useRoute()
const routeMeta = computed(() => ({
  title: route?.meta?.title || 'The Sanctum',
  icon: route?.meta?.icon || '🧘'
}))

const props = defineProps<{
  badges: any[]
  archetype: string
  isProcessing: boolean
  isGenerating: boolean
}>()

const libraryStore = useLibraryStore()

/**
 * Computed property to find the active archetype definition object.
 */
const activeArchetypeObj = computed(() => {
  const archId = props.archetype?.toLowerCase()
  return archetypes.find(a => a.id === archId) || null
})

/**
 * Computed display value for the player's core archetype persona (e.g. The Vanguard).
 */
const displayValue = computed(() => {
  return activeArchetypeObj.value?.persona || 'The Squire'
})

defineEmits(['scan', 'recalibrate', 'openArchetype'])
</script>

<template>
  <div class="header-section">
    <div class="header-flex">
      <div class="title-group">
        <h1 class="view-title" style="display: flex; align-items: center; gap: var(--space-2);">
          <span>{{ routeMeta.icon }}</span>
          <span>{{ routeMeta.title }}</span>
        </h1>
        <p class="view-subtitle text-muted">Your <span class="text-accent">Sanctum</span> is curated by your gameplay DNA.</p>
      </div>
      
      <div class="actions-group">
        <!-- Badges Showcase -->
        <div class="badges-showcase glass" v-if="badges && badges.length > 0">
          <div 
            v-for="badge in badges" :key="badge.id" 
            class="sanctum-badge" 
            :style="{ borderColor: badge.color }" 
            :data-tooltip="badge.name"
          >
            <span class="badge-icon">{{ badge.icon }}</span>
          </div>
        </div>

        <!-- DNA Status Mini -->
        <div 
          class="dna-status-mini glass" 
          @click="$emit('openArchetype')" 
          style="cursor: pointer;"
          :data-tooltip="'Active Form: ' + (activeArchetypeObj?.name || 'Initiate Form')"
        >
          <span class="label">DNA PROFILE</span>
          <span class="val">
            <span v-if="activeArchetypeObj?.icon" style="margin-right: 4px;">{{ activeArchetypeObj.icon }}</span>
            {{ displayValue.toUpperCase() }}
          </span>
        </div>
        
        <!-- Action Buttons -->
        <button 
          v-if="(libraryStore.personalGames?.length || 0) > 0"
          class="btn btn-primary btn-sm" 
          @click="$emit('scan')"
          :disabled="isProcessing"
        >
          <span v-if="isProcessing">🔮 Analyzing...</span>
          <span v-else>🔍 Scan for Mistakes</span>
        </button>

        <button 
          v-if="(libraryStore.personalGames?.length || 0) > 0"
          class="btn btn-secondary btn-sm" 
          @click="$emit('recalibrate')"
          :disabled="isGenerating"
        >
          <span v-if="isGenerating">🎛 Sequencing...</span>
          <span v-else>🔄 Recalibrate Path</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header-section {
  padding: var(--space-8);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: radial-gradient(circle at top right, rgba(139, 92, 246, 0.05), transparent 50%);
}

.header-flex {
  display: flex; 
  justify-content: space-between; 
  align-items: flex-start;
}

.view-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: var(--space-2);
  background: linear-gradient(135deg, var(--accent-bright), var(--teal));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.actions-group {
  display: flex; 
  gap: var(--space-4); 
  align-items: center;
}

.badges-showcase {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  align-items: center;
}

.sanctum-badge {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: help;
  transition: all 0.2s ease;
}

.sanctum-badge:hover {
  transform: translateY(-2px) scale(1.1);
  background: rgba(255, 255, 255, 0.1);
}

.badge-icon { font-size: 1.2rem; }

.dna-status-mini {
  padding: var(--space-2) var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border: 1px solid var(--accent-dim);
}

.dna-status-mini .label { font-size: 0.6rem; font-weight: 800; color: var(--text-muted); }
.dna-status-mini .val { font-size: 0.85rem; font-weight: 900; color: var(--accent-bright); }

.text-accent { color: var(--accent-bright); }

@media (max-width: 1024px) {
  .header-flex { flex-direction: column; gap: var(--space-6); }
}
</style>
