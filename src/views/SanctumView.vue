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
          v-for="(subject, idx) in curriculum" 
          :key="idx"
          :subject="subject"
          :progress="getSubjectProgress(subject)"
          :isCompleted="isCompleted"
          @openLesson="openLesson"
          @toggleComplete="toggleComplete"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'
import { useCurriculumStore } from '../stores/curriculumStore'

// Pillar Components
import SanctumHeader from '../components/sanctum/SanctumHeader.vue'
import SanctumShadowRealm from '../components/sanctum/SanctumShadowRealm.vue'
import SanctumSubjectCard from '../components/sanctum/SanctumSubjectCard.vue'

// Pillar Composables
import { useSanctumCurriculum } from '../composables/sanctum/useSanctumCurriculum'
import { useSanctumActions } from '../composables/sanctum/useSanctumActions'

// Core Stores
const userStore = useUserStore()
const uiStore = useUiStore()
const curriculumStore = useCurriculumStore()

// Initialize Pillar Logic
const { curriculum, isCompleted, getSubjectProgress } = useSanctumCurriculum()
const { 
  scanForMistakes, 
  recalibratePath, 
  openLesson, 
  openPersonalPuzzle, 
  toggleComplete,
  isProcessing,
  isGenerating
} = useSanctumActions()

onMounted(async () => {
  if (userStore.session?.user.id) {
    await curriculumStore.fetchProgress(userStore.session.user.id)
  }
  // Auto-generate drills if empty
  if (curriculumStore.personalPuzzles.length === 0) {
    await curriculumStore.generatePersonalPuzzles()
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
