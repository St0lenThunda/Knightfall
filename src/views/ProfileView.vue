<template>
  <div class="page profile-page" :class="{ 'with-lab': activeTab === 'vault' }">
    <!-- Header: Navigation Tabs -->
    <nav class="profile-nav-tabs glass-sm">
      <button 
        v-for="tab in tabs" 
        :key="tab.id" 
        class="profile-tab" 
        :class="{ active: activeTab === tab.id }" 
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <main class="profile-content-wrapper">
      <Transition name="fade-slide" mode="out-in">
        <div :key="activeTab" class="profile-tab-content" :class="{ 'with-sidebar': activeTab === 'vault' }">
          
          <!-- TAB 1: OVERVIEW -->
          <template v-if="activeTab === 'overview'">
            <MobileProfileCarousel 
              v-if="isMobile"
              :joined-date="joinedDate"
              @show-badge-modal="showBadgeModal = true"
              @switch-tab="activeTab = $event"
            />
            <WarRoomPanel 
              v-else
              :joined-date="joinedDate"
              @show-badge-modal="showBadgeModal = true"
              @toggle-intel="toggleIntel"
              @switch-tab="activeTab = $event"
            />
          </template>

          <!-- TAB 2: VAULT (Game Archive) -->
          <ProfileVaultTab 
            v-else-if="activeTab === 'vault'" 
            @openLab="showLabModal = true" 
          />

          <!-- TAB 3: CONSTELLATION -->
          <!-- <ProfileConstellationTab v-else-if="activeTab === 'constellation'" /> -->

          <!-- TAB 4: DNA -->
          <ProfileDnaTab v-else-if="activeTab === 'dna'" />

          <!-- TAB 5: INTEGRATIONS -->
          <ProfileIntegrationsTab v-else-if="activeTab === 'integrations'" />

        </div>
      </Transition>
    </main>

    <!-- Global Overlays & Modals -->
    <BadgeShowcaseModal :visible="showBadgeModal" @close="showBadgeModal = false" />

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showLabModal" class="modal-overlay">
          <div class="lab-modal glass-lg">
            <div class="modal-header">
              <h3>Vault Lab</h3>
              <button @click="showLabModal = false">Close</button>
            </div>
            <div class="modal-body">
              <LibraryLab />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Initialization Overlay -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isInitialSync && libraryStore.isProcessingIntegrity" class="page-loader-overlay">
          <div class="progress-info-v2">
            <div class="spinner-xl"></div>
            <div class="text-group-center">
              <h2>Initializing War Room</h2>
              <span class="status-msg-lg">{{ libraryStore.integrityMessage }}</span>
              <span class="percentage-lg">{{ libraryStore.integrityProgress }}%</span>
            </div>
          </div>
          <div class="integrity-progress-track-lg">
            <div class="integrity-progress-fill" :style="{ width: libraryStore.integrityProgress + '%' }"></div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUserStore } from '../stores/userStore'
import { useLibraryStore } from '../stores/libraryStore'

// Pillar Components (Tabs)
import WarRoomPanel from '../components/profile/WarRoomPanel.vue'
import MobileProfileCarousel from '../components/profile/MobileProfileCarousel.vue'
import ProfileVaultTab from '../components/profile/tabs/ProfileVaultTab.vue'
// import ProfileConstellationTab from '../components/profile/tabs/ProfileConstellationTab.vue'
import ProfileDnaTab from '../components/profile/tabs/ProfileDnaTab.vue'
import ProfileIntegrationsTab from '../components/profile/tabs/ProfileIntegrationsTab.vue'
import LibraryLab from '../components/library/LibraryLab.vue'

// Modals
import BadgeShowcaseModal from '../components/profile/modals/BadgeShowcaseModal.vue'

// Pillar Composables
import { useProfileNavigation } from '../composables/profile/useProfileNavigation'
import { useProfileActions } from '../composables/profile/useProfileActions'
import { useCurriculumStore } from '../stores/curriculumStore'
import { useMobileDetect } from '../composables/useMobileDetect'

// Styles
import '../assets/profile.css'

const userStore = useUserStore()
const libraryStore = useLibraryStore()
const curriculumStore = useCurriculumStore()

// Initialize Pillar Logic
const { activeTab, tabs } = useProfileNavigation()
const { 
  isInitialSync, showLabModal, showBadgeModal, finishInitialSync 
} = useProfileActions()
const { isMobile } = useMobileDetect()

// Computed metadata
const joinedDate = computed(() => userStore.profile?.created_at ? new Date(userStore.profile.created_at).toLocaleDateString() : 'N/A')

/**
 * Lifecycle Handlers
 */
onMounted(async () => {
  await libraryStore.loadGames()
  finishInitialSync()
  
  // Load quest completion progress
  if (userStore.profile?.id) {
    await curriculumStore.fetchProgress(userStore.profile.id)
  } else if (userStore.completedQuests?.length > 0) {
    curriculumStore.completedQuestIds = [...userStore.completedQuests]
  }
  
  // Retrieve and generate tactical ghosts for the profile diagnostics panel
  await curriculumStore.generatePersonalPuzzles()
})

/**
 * Legacy Actions (To be refactored into useProfileActions in next phase)
 */
function toggleIntel() {
  if (libraryStore.isBulkAnalyzing) {
    libraryStore.stopBulkAnalysis()
  } else {
    libraryStore.startBulkAnalysis()
  }
}
</script>

<style scoped>
.profile-page { padding-top: var(--space-6); }
.profile-nav-tabs { display: flex; gap: var(--space-1); padding: var(--space-1); border-radius: var(--radius-full); margin-bottom: var(--space-8); width: fit-content; }
.profile-tab { padding: var(--space-3) var(--space-6); border-radius: var(--radius-full); border: none; background: transparent; color: var(--text-secondary); font-weight: 700; cursor: pointer; transition: all 0.2s; }
.profile-tab.active { background: var(--accent); color: white; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); }

@media (max-width: 768px) {
  .profile-nav-tabs {
    width: 100% !important;
    overflow-x: auto;
    white-space: nowrap;
    border-radius: var(--radius-md) !important;
    justify-content: flex-start;
    padding: var(--space-2) !important;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .profile-nav-tabs::-webkit-scrollbar {
    display: none;
  }
  .profile-tab {
    padding: var(--space-2) var(--space-4) !important;
    font-size: 0.8rem;
    flex-shrink: 0;
  }
}

.tele-item .label, .sum-item .label { font-size: 0.5rem; font-weight: 900; opacity: 0.5; letter-spacing: 0.1em; }
.tele-item .val, .sum-item .val { font-family: var(--font-mono); font-weight: 800; font-size: 1.1rem; }

/* Idle State */
.idle-grid {
  display: flex;
  gap: var(--space-8);
  padding: var(--space-4) var(--space-8);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(255,255,255,0.05);
  flex: 1;
}

.idle-copy { flex: 1; }
.idle-copy p { font-size: 0.8rem; line-height: 1.5; color: var(--text-muted); margin-top: 4px; }
.idle-copy .label { font-size: 0.5rem; font-weight: 900; opacity: 0.5; letter-spacing: 0.1em; }

.idle-stats { display: flex; align-items: center; border-left: 1px solid rgba(255,255,255,0.05); padding-left: var(--space-8); }
.mini-stat { display: flex; flex-direction: column; align-items: center; }
.mini-stat .label { font-size: 0.5rem; font-weight: 900; opacity: 0.5; letter-spacing: 0.1em; }
.mini-stat .val { font-family: var(--font-mono); font-weight: 800; font-size: 1rem; color: var(--accent-bright); }

/* Controls */
.deck-controls.is-analyzing { border-color: rgba(139, 92, 246, 0.3); }

.lab-modal { width: 90vw; max-width: 1000px; height: 85vh; display: flex; flex-direction: column; overflow: hidden; border-radius: var(--radius-xl); }
.modal-header { padding: var(--space-6); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); }
.modal-body { flex: 1; overflow-y: auto; padding: var(--space-6); }

/* Transition Helpers */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
