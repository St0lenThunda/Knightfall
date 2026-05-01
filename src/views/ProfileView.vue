<template>
  <div class="page profile-page" :class="{ 'with-lab': activeTab === 'vault' }">
    <!-- Header: Navigation Tabs -->
    <div class="profile-nav-tabs glass-sm">
      <button v-for="tab in tabs" :key="tab.id" class="profile-tab" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        {{ tab.label }}
      </button>
    </div>

    <div class="profile-content-wrapper">
      <Transition name="fade-slide" mode="out-in">
        <div :key="activeTab" class="profile-tab-content" :class="{ 'with-sidebar': activeTab === 'vault' }">
          
          <!-- TAB 1: OVERVIEW -->
          <WarRoomPanel 
            v-if="activeTab === 'overview'" 
            :joined-date="joinedDate"
            @show-badge-modal="showBadgeModal = true"
            @show-wipe-confirm="showWipeConfirm = true"
            @toggle-intel="toggleIntel"
            @deduplicate-vault="deduplicateVault"
            @switch-tab="activeTab = $event"
          />

          <!-- TAB 2: VAULT (Game Archive) -->
          <div v-else-if="activeTab === 'vault'" class="vault-tab-content">
            <ProfileTabHeader title="Game Archive">
              <template #stats>
                <span class="badge badge-primary">✨ {{ userStore.xp }} XP</span>
                <span class="badge badge-accent filter-badge" @click="applyQuickFilter('My Games')">
                  {{ libraryStore.personalGames.length }} Personal DNA
                </span>
                <span class="badge badge-outline filter-badge" @click="applyQuickFilter('native')">
                  ♞ {{ libraryStore.sourceBreakdown.knightfall }} Native
                </span>
                <span class="badge">{{ ECO_COUNT }} Openings</span>
              </template>
              <template #actions>
                <button class="btn btn-ghost btn-sm" @click="libraryStore.loadGames">🔄 Refresh</button>
                <button class="btn btn-secondary btn-sm" @click="showLabModal = true">📥 Import & Sources</button>
              </template>
            </ProfileTabHeader>
            <VaultPanel />
          </div>

          <!-- TAB 3: CONSTELLATION -->
          <div v-else-if="activeTab === 'constellation'" class="constellation-tab-content">
            <ProfileTabHeader title="Opening Constellation">
              <template #stats>
                <span class="badge badge-primary">✨ {{ userStore.xp }} XP</span>
                <span class="badge badge-accent">{{ libraryStore.personalGames.length }} Analyzed DNA</span>
                <span class="badge">{{ ECO_COUNT }} Variations</span>
              </template>
            </ProfileTabHeader>
            <ConstellationPanel />
          </div>

          <!-- TAB 4: DNA -->
          <div v-else-if="activeTab === 'dna'" class="dna-tab-content">
            <ProfileTabHeader title="Weakness DNA Lab">
              <template #stats>
                <span class="badge badge-primary">✨ {{ userStore.xp }} XP</span>
                <span class="badge badge-accent">{{ libraryStore.personalGames.length }} Snapshots</span>
                <span class="badge badge-outline">App IQ: {{ libraryStore.performanceRating }}</span>
              </template>
            </ProfileTabHeader>
            <DnaPanel />
          </div>

          <!-- TAB 5: INTEGRATIONS -->
          <div v-else-if="activeTab === 'integrations'" class="integrations-tab-content">
            <ProfileTabHeader title="System Integrations">
              <template #stats>
                <span class="badge" :class="isLichessLinked ? 'badge-primary' : 'badge-outline'">
                  Lichess: {{ isLichessLinked ? 'LINKED' : 'UNLINKED' }}
                </span>
              </template>
            </ProfileTabHeader>
            <IntegrationsPanel />
          </div>

        </div>
      </Transition>
    </div>

    <!-- Modals & Overlays -->
    <BadgeShowcaseModal :visible="showBadgeModal" @close="showBadgeModal = false" />
    <NuclearWipeModal :visible="showWipeConfirm" :is-wiping="isWiping" @cancel="showWipeConfirm = false" @confirm="handleNuclearReset" />

    <Teleport to="body">
      <div v-if="showLabModal" class="modal-overlay" @click.self="showLabModal = false">
        <div class="glass-lg lab-modal">
          <header class="modal-header">
            <h3>Intelligence Lab</h3>
            <button class="btn-close" @click="showLabModal = false">✕</button>
          </header>
          <div class="modal-body"><LibraryLab /></div>
        </div>
      </div>
    </Teleport>

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
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/userStore'
import { useLibraryStore } from '../stores/libraryStore'
import { Storage, StorageKey } from '../utils/storage'

// Tab Components
import VaultPanel from '../components/library/VaultPanel.vue'
import ConstellationPanel from '../components/library/ConstellationPanel.vue'
import DnaPanel from '../components/library/DnaPanel.vue'
import LibraryLab from '../components/library/LibraryLab.vue'
import WarRoomPanel from '../components/profile/WarRoomPanel.vue'
import IntegrationsPanel from '../components/profile/IntegrationsPanel.vue'
import ProfileTabHeader from '../components/profile/ProfileTabHeader.vue'

// Modals
import BadgeShowcaseModal from '../components/profile/modals/BadgeShowcaseModal.vue'
import NuclearWipeModal from '../components/profile/modals/NuclearWipeModal.vue'

// Styles
import '../assets/profile.css'

const userStore = useUserStore()
const libraryStore = useLibraryStore()

const activeTab = ref('overview')
const showLabModal = ref(false)
const showWipeConfirm = ref(false)
const showBadgeModal = ref(false)
const isWiping = ref(false)
const isInitialSync = ref(true)

const tabs = [
  { id: 'overview', label: '⚡ War Room' },
  { id: 'dna', label: '🧬 Soul Mapping' },
  { id: 'vault', label: '🗄️ Archives' },
  { id: 'constellation', label: '✨ Constellation' },
  { id: 'integrations', label: '🛰️ Integrations' }
]

const joinedDate = computed(() => userStore.profile?.created_at ? new Date(userStore.profile.created_at).toLocaleDateString() : 'N/A')
const ECO_COUNT = computed(() => libraryStore.ecoStats?.length || 0)
const isLichessLinked = computed(() => !!Storage.get(StorageKey.LICHESS_TOKEN, ''))

onMounted(async () => {
  await libraryStore.loadGames()
  isInitialSync.value = false
})

async function handleNuclearReset(wipeCloud: boolean) {
  isWiping.value = true
  await libraryStore.nukeVault(wipeCloud)
  showWipeConfirm.value = false
  isWiping.value = false
}

function applyQuickFilter(type: string) {
  libraryStore.setFilter(type)
}

function toggleIntel() {
  // Logic for toggling global intelligence overlays
}

function deduplicateVault() {
  libraryStore.deduplicate()
}
</script>

<style scoped>
.profile-page { padding-top: var(--space-6); }
.profile-nav-tabs { display: flex; gap: var(--space-1); padding: var(--space-1); border-radius: var(--radius-full); margin-bottom: var(--space-8); width: fit-content; }
.profile-tab { padding: var(--space-3) var(--space-6); border-radius: var(--radius-full); border: none; background: transparent; color: var(--text-secondary); font-weight: 700; cursor: pointer; transition: all 0.2s; }
.profile-tab.active { background: var(--accent); color: white; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); }
.badge { padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 800; }
.badge-primary { background: var(--accent-dim); color: var(--accent-bright); }
.badge-accent { background: var(--accent); color: white; }
.badge-outline { border: 1px solid var(--border); color: var(--text-muted); }
.lab-modal { width: 90vw; max-width: 1000px; height: 85vh; display: flex; flex-direction: column; overflow: hidden; border-radius: var(--radius-xl); }
.modal-header { padding: var(--space-6); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); }
.modal-body { flex: 1; overflow-y: auto; padding: var(--space-6); }
</style>
