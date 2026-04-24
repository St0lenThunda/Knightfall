<template>
  <div class="page profile-page" :class="{ 'with-lab': activeTab === 'vault' }">
    <!-- Header: Navigation Tabs -->
    <div class="profile-nav-tabs glass-sm">
      <button class="profile-tab" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">
        ⚡ War Room
      </button>
      <button class="profile-tab" :class="{ active: activeTab === 'dna' }" @click="activeTab = 'dna'">
        🧬 Soul Mapping
      </button>
      <button class="profile-tab" :class="{ active: activeTab === 'vault' }" @click="activeTab = 'vault'">
        🗄️ Archives
      </button>
      <button class="profile-tab" :class="{ active: activeTab === 'constellation' }" @click="activeTab = 'constellation'">
        ✨ Constellation
      </button>
    </div>

    <div class="profile-content-wrapper">
      <Transition name="fade-slide" mode="out-in">
        <div :key="activeTab" class="profile-tab-content" :class="{ 'with-sidebar': activeTab === 'vault' }">
          
          <!-- TAB 1: OVERVIEW (The Original Profile Dashboard) -->
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
            <header class="tab-header glass-xs">
              <div class="header-info">
                <h2>Game Archive</h2>
                <div class="header-stats">
                  <span class="badge badge-accent">{{ libraryStore.personalGames.length }} Personal DNA</span>
                  <span v-if="libraryStore.games.length > libraryStore.personalGames.length" class="badge badge-outline">📚 {{ libraryStore.games.length - libraryStore.personalGames.length }} Library Assets</span>
                  <span class="badge badge-outline" title="Games played natively on Knightfall">♞ {{ libraryStore.sourceBreakdown.knightfall }} Native</span>
                  <span class="badge badge-outline" title="Imported from Chess.com/Lichess">🌍 {{ libraryStore.sourceBreakdown.chessCom + libraryStore.sourceBreakdown.lichess }} Imported</span>
                  <span class="badge">{{ ECO_COUNT }} Openings</span>
                </div>
              </div>
              <div class="header-actions">
                <button class="btn btn-ghost btn-sm" @click="deduplicateVault" title="Remove Duplicates">
                  🧹 Clean
                </button>
                <button class="btn btn-secondary btn-sm" @click="showLabModal = true">
                  📥 Import & Sources
                </button>
              </div>
            </header>
            <VaultPanel />
          </div>

          <!-- TAB 3: CONSTELLATION (Opening Tree) -->
          <div v-else-if="activeTab === 'constellation'" class="constellation-tab-content">
             <header class="tab-header glass-xs">
              <div class="header-info">
                <h2>Opening Constellation</h2>
                <div class="header-stats">
                  <span class="badge badge-accent">{{ libraryStore.personalGames.length }} Analyzed DNA</span>
                  <span class="badge">{{ ECO_COUNT }} Known Variations</span>
                </div>
              </div>
            </header>
            <ConstellationPanel />
          </div>

          <!-- TAB 4: DNA (Consolidated Intelligence) -->
          <div v-else-if="activeTab === 'dna'" class="dna-tab-content">
             <header class="tab-header glass-xs">
              <div class="header-info">
                <h2>Weakness DNA Lab</h2>
                <div class="header-stats">
                  <span class="badge badge-accent">{{ libraryStore.personalGames.length }} Analyzed Snapshots</span>
                  <span class="badge badge-outline">App IQ: {{ libraryStore.performanceRating }}</span>
                </div>
              </div>
            </header>
            <DnaPanel />
          </div>

        </div>
      </Transition>
    </div>

    <!-- Laboratory Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showLabModal" class="modal-overlay" @click.self="showLabModal = false">
          <div class="glass-lg lab-modal">
            <header class="modal-header">
              <div class="title-group">
                <h3>Intelligence Lab</h3>
                <p class="muted">Manage your master collections and PGN imports</p>
              </div>
              <button class="btn-close" @click="showLabModal = false">✕</button>
            </header>
            <div class="modal-body">
              <LibraryLab />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Nuclear Wipe Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showWipeConfirm" class="modal-overlay" @click.self="showWipeConfirm = false">
          <div class="lab-modal glass-lg animated slideInUp" style="max-width: 400px; text-align: center;">
            <header class="modal-header" style="justify-content: center; flex-direction: column; gap: var(--space-2); border: none;">
              <span class="icon" style="font-size: 3rem; margin-bottom: 10px;">💣</span>
              <h2 class="text-rose" style="margin: 0;">Nuclear Reset</h2>
            </header>
            <div class="modal-body" style="padding: var(--space-4) var(--space-8);">
              <p style="font-size: 0.95rem; line-height: 1.5;">This will permanently delete <strong class="text-rose">ALL</strong> games, tags, and analysis data in your local Vault.</p>
              <p class="muted" style="font-size: 0.75rem; margin-top: var(--space-6); background: rgba(244,63,94,0.05); padding: 12px; border-radius: var(--radius-md); border: 1px solid rgba(244,63,94,0.1);">
                This action is irreversible. All local analysis and imported collections will be lost.
              </p>
              
              <div class="cloud-wipe-opt" style="margin-top: var(--space-6); display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer;" @click="wipeCloudToo = !wipeCloudToo">
                <input type="checkbox" v-model="wipeCloudToo" style="cursor: pointer;" />
                <span style="font-size: 0.8rem; font-weight: 700;" :class="{ 'text-rose': wipeCloudToo }">Also wipe my Cloud History</span>
              </div>
            </div>
            <div class="modal-footer" style="display: flex; gap: var(--space-4); padding: var(--space-8);">
              <button class="btn btn-ghost flex-1" @click="showWipeConfirm = false" :disabled="isWiping">
                Cancel
              </button>
              <button class="btn btn-primary bg-rose flex-1" @click="handleNuclearReset" :disabled="isWiping">
                {{ isWiping ? 'Wiping...' : 'Destroy All Data' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <!-- Badge Showcase Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showBadgeModal" class="modal-overlay" @click.self="showBadgeModal = false">
          <div class="glass-lg badge-modal">
            <header class="modal-header">
              <div class="title-group">
                <h3>Badge Showcase</h3>
                <p class="muted">Your achievements and milestones</p>
              </div>
              <button class="btn-close" @click="showBadgeModal = false">✕</button>
            </header>
            <div class="modal-body">
              <div v-for="pillar in badgePillars" :key="pillar.id" class="badge-pillar">
                <div class="badge-pillar-label">{{ pillar.icon }} {{ pillar.label }}</div>
                <div class="badge-grid">
                  <div v-for="b in coachStore.achievements.badges.filter(x => x.pillar === pillar.id)" :key="b.id" 
                    class="badge-item" :class="b.earned ? 'badge-earned' : 'badge-locked'"
                    :title="b.description">
                    <span class="badge-icon">{{ b.icon }}</span>
                    <span class="badge-name">{{ b.label }}</span>
                    <div v-if="!b.earned && b.progress !== undefined" class="badge-progress-bar">
                      <div class="badge-progress-fill" :style="{ width: b.progress + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useCoachStore } from '../stores/coachStore'
import { useUiStore } from '../stores/uiStore'

// Tab Components
import VaultPanel from '../components/library/VaultPanel.vue'
import ConstellationPanel from '../components/library/ConstellationPanel.vue'
import DnaPanel from '../components/library/DnaPanel.vue'
import LibraryLab from '../components/library/LibraryLab.vue'
import WarRoomPanel from '../components/profile/WarRoomPanel.vue'

const route = useRoute()
const userStore = useUserStore()
const libraryStore = useLibraryStore()
const coachStore = useCoachStore()
const uiStore = useUiStore()

const activeTab = ref<'overview' | 'dna' | 'vault' | 'constellation'>('overview')

const isWiping = ref(false)

const showLabModal = ref(false)
const showWipeConfirm = ref(false)
const showBadgeModal = ref(false)
const wipeCloudToo = ref(false)

function toggleIntel() {
  if (libraryStore.isBulkAnalyzing) libraryStore.stopBulkAnalysis()
  else libraryStore.startBulkAnalysis()
}





const badgePillars = [
  { id: 'milestone', label: 'Milestones', icon: '🏅' },
  { id: 'mastery',   label: 'DNA Mastery', icon: '🧬' },
  { id: 'ritual',    label: 'Streaks & Rituals', icon: '🔥' },
]

async function deduplicateVault() {
  const count = await libraryStore.purgeDuplicates()
  uiStore.addToast(`Cleanup complete. Removed ${count} duplicate games.`, 'success')
}

async function handleNuclearReset() {
  isWiping.value = true
  try {
    if (wipeCloudToo.value) {
      await libraryStore.purgeCloudLibrary()
    }
    await libraryStore.resetLibrary()
    uiStore.addToast(wipeCloudToo.value ? 'Local & Cloud vaults wiped clean.' : 'Local vault wiped clean.', 'warning')
  } catch (err) {
    uiStore.addToast('Partial wipe failure. Check connection.', 'error')
  } finally {
    isWiping.value = false
    showWipeConfirm.value = false
    wipeCloudToo.value = false
  }
}

onMounted(async () => {
  await userStore.fetchUserData()
  
  // Handle tab from query param
  if (route.query.tab === 'vault') activeTab.value = 'vault'
  else if (route.query.tab === 'constellation') activeTab.value = 'constellation'
  else if (route.query.tab === 'dna') activeTab.value = 'dna'
  
  // Trigger background maintenance
  libraryStore.repairVaultMetadata()
  libraryStore.syncCloudGames()
})

watch(() => route.query.tab, (tab) => {
  if (tab === 'vault') activeTab.value = 'vault'
  else if (tab === 'constellation') activeTab.value = 'constellation'
  else if (tab === 'dna') activeTab.value = 'dna'
  else activeTab.value = 'overview'
})

watch(activeTab, (tab) => {
  libraryStore.isConstellationActive = (tab === 'constellation')
})

const ECO_COUNT = computed(() => {
  const ecos = new Set(libraryStore.games.map(g => g.eco))
  return ecos.size
})

const joinedDate = computed(() => {
  const raw = (userStore.session as any)?.user?.created_at
  if (!raw) return 'recently'
  return new Date(raw).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})
</script>

<style scoped>
.profile-page { padding: var(--space-6); }

.profile-nav-tabs {
  display: flex; gap: var(--space-2); margin-bottom: var(--space-6);
  padding: 4px; border-radius: var(--radius-lg); width: fit-content;
}
.profile-tab {
  padding: var(--space-3) var(--space-6); border-radius: var(--radius-md);
  border: none; background: transparent; color: var(--text-secondary);
  font-weight: 700; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 8px;
}
.profile-tab.active { background: var(--accent); color: white; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); }
.badge-accent { background: var(--accent); color: white; border: none; }
.badge-outline { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); color: var(--text-muted); }
.badge-ghost { background: rgba(255, 255, 255, 0.05); color: white; border: none; }
.profile-content-wrapper { display: block; min-width: 0; width: 100%; }
.profile-tab-content { min-width: 0; width: 100%; }

.tab-header { padding: var(--space-4) var(--space-6); border-radius: var(--radius-lg); margin-bottom: var(--space-6); display: flex; align-items: center; justify-content: space-between; }
.header-info { display: flex; align-items: center; gap: var(--space-6); }
.header-stats { display: flex; gap: var(--space-2); }

/* Lab Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
}

.lab-modal {
  width: 90%;
  max-width: 500px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 32px 64px rgba(0,0,0,0.6);
  position: relative;
  background: rgba(20, 20, 30, 0.95);
  backdrop-filter: blur(20px);
}

.lab-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
}

.lab-modal .modal-header h3 { margin: 0; color: var(--accent-bright); }
.lab-modal .modal-body { flex: 1; overflow-y: auto; }

.btn-close {
  background: rgba(255,255,255,0.05);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.btn-close:hover { background: var(--rose); transform: rotate(90deg); }

/* Modal Transitions */
.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.modal-enter-active .lab-modal, .modal-leave-active .lab-modal { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-enter-from .lab-modal, .modal-leave-to .lab-modal { transform: scale(0.9) translateY(20px); }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
