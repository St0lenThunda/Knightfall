<template>
  <div class="view-container">
    <!-- Pillar Header -->
    <SanctumHeader 
      :badges="userStore.badges"
      :archetype="userStore.profile?.archetype || 'The Unwritten Page'"
      :isProcessing="isProcessing()"
      :isGenerating="isGenerating()"
      @scan="scanForMistakes"
      @recalibrate="recalibratePath"
      @openArchetype="uiStore.isArchetypeModalOpen = true"
      @showFanfare="showFanfare = true"
    />

    <div class="scroll-container neon-scroll">
      <div class="sanctum-content">
        
        <!-- THE SHADOW REALM: Personalized Drills -->
        <SanctumShadowRealm 
          :puzzles="curriculumStore.personalPuzzles"
          :isProcessing="isProcessing()"
          @openPuzzle="openPersonalPuzzle"
          @scan="scanForMistakes"
        />

        <!-- STANDARD CURRICULUM -->
        <SanctumSubjectCard 
          v-for="realm in activeRealms" 
          :key="realm.id"
          :realm="realm"
          :quests="curriculumStore.questsByRealm[realm.id] || []"
          :progress="curriculumStore.getRealmProgress(realm.id)"
          @openQuest="openQuest"
        />
      </div>
    </div>

    <!-- Celebration Fanfare for completing all standard lessons -->
    <SanctumFanfareOverlay 
      v-if="showFanfare" 
      :total-quests="curriculumStore.quests.length"
      @close="closeFanfare" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'
import { useCurriculumStore } from '../stores/curriculumStore'
import { Storage, StorageKey } from '../utils/storage'

// Pillar Components
import SanctumHeader from '../components/sanctum/SanctumHeader.vue'
import SanctumShadowRealm from '../components/sanctum/SanctumShadowRealm.vue'
import SanctumSubjectCard from '../components/sanctum/SanctumSubjectCard.vue'
import SanctumFanfareOverlay from '../components/sanctum/SanctumFanfareOverlay.vue'

// Pillar Composables
import { useSanctumActions } from '../composables/sanctum/useSanctumActions'

// Core Stores
const userStore = useUserStore()
const uiStore = useUiStore()
const curriculumStore = useCurriculumStore()

const showFanfare = ref(false)

/**
 * Checks if the user has completed all standard quests in the curriculum.
 */
const isCurriculumFullyCompleted = computed(() => {
  if (!curriculumStore.quests || curriculumStore.quests.length === 0) return false
  return curriculumStore.quests.every(q => curriculumStore.completedQuestIds.includes(q.id))
})

// Filter out Shadow Realm from standard curriculum
const activeRealms = computed(() => {
  return curriculumStore.realms.filter(r => r.id !== 'personal-realm')
})

// Initialize Pillar Logic
const { 
  scanForMistakes, 
  recalibratePath, 
  openQuest, 
  openPersonalPuzzle, 
  isProcessing,
  isGenerating
} = useSanctumActions()

/**
 * Closes the fanfare modal and records that the user has acknowledged the completion milestone.
 */
function closeFanfare() {
  showFanfare.value = false
  Storage.set(StorageKey.SANCTUM_FANFARE_SHOWN, true)
}

// Watch completion status to automatically trigger the fanfare modal
watch(isCurriculumFullyCompleted, (completed) => {
  const fanfareShown = Storage.get<boolean>(StorageKey.SANCTUM_FANFARE_SHOWN, false)
  if (completed && !fanfareShown) {
    showFanfare.value = true
  }
})

onMounted(async () => {
  if (userStore.session?.user.id) {
    await curriculumStore.fetchProgress(userStore.session.user.id)
  }
  // Auto-generate drills if empty
  if (curriculumStore.personalPuzzles.length === 0) {
    await curriculumStore.generatePersonalPuzzles()
  }

  // Trigger celebration on load if they completed everything but haven't seen the fanfare yet
  const fanfareShown = Storage.get<boolean>(StorageKey.SANCTUM_FANFARE_SHOWN, false)
  if (isCurriculumFullyCompleted.value && !fanfareShown) {
    showFanfare.value = true
  }
})
</script>

<style scoped>
.view-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
}

.scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-8);
}

.sanctum-content {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding-bottom: var(--space-12);
}

@media (max-width: 768px) {
  .scroll-container { padding: var(--space-4); }
}
</style>
