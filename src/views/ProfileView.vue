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
                  <span class="badge badge-primary">✨ {{ userStore.xp }} XP</span>
                  <span class="badge badge-accent">{{ libraryStore.personalGames.length }} Personal DNA</span>
                  <span v-if="libraryStore.games.length > libraryStore.personalGames.length" class="badge badge-outline">📚 {{ libraryStore.games.length - libraryStore.personalGames.length }} Library Assets</span>
                  <span class="badge badge-outline" title="Games played natively on Knightfall">♞ {{ libraryStore.sourceBreakdown.knightfall }} Native</span>
                  <span class="badge badge-outline" title="Imported from Chess.com/Lichess">🌍 {{ libraryStore.sourceBreakdown.chessCom + libraryStore.sourceBreakdown.lichess }} Imported</span>
                  <span class="badge">{{ ECO_COUNT }} Openings</span>
                </div>
              </div>
              <div class="header-actions">
                <button class="btn btn-ghost btn-sm" @click="libraryStore.loadGames" title="Reload from Local Storage">
                  🔄 Refresh
                </button>
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
                  <span class="badge badge-primary">✨ {{ userStore.xp }} XP</span>
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
                  <span class="badge badge-primary">✨ {{ userStore.xp }} XP</span>
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
          <div class="glass-lg badge-modal-v2">
            <button class="btn-close-absolute" @click="showBadgeModal = false">✕</button>

            <header class="modal-header">
              <div class="title-group">
                <h3>Badge Showcase</h3>
                <p class="muted">Your journey of mastery and milestones</p>
              </div>
              <div class="completion-summary">
                <span class="count">{{ coachStore.achievements.earnedCount }}</span>
                <span class="total">/ {{ coachStore.achievements.totalCount }} Earned</span>
              </div>
            </header>
            
            <div class="badge-layout">
              <!-- Left: Scrollable List -->
              <div class="badge-list-sidebar custom-scrollbar">
                <div v-for="pillar in badgePillars" :key="pillar.id" class="badge-pillar-section">
                  <div class="pillar-label">
                    <span class="icon">{{ pillar.icon }}</span>
                    <span>{{ pillar.label }}</span>
                  </div>
                  <div class="badge-grid-v2">
                    <div 
                      v-for="b in coachStore.achievements.badges.filter(x => x.pillar === pillar.id)" 
                      :key="b.id" 
                      class="badge-hex-item"
                      :class="{ 
                        'is-earned': b.earned, 
                        'is-selected': selectedBadge?.id === b.id,
                        ['pillar-' + b.pillar]: true
                      }"
                      @click="selectedBadge = b"
                    >
                      <div class="badge-hex-inner">
                        <span class="icon">{{ b.icon }}</span>
                      </div>
                      <div v-if="b.earned" class="earned-sparkle"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right: Detail Panel -->
              <div class="badge-detail-panel glass-sm">
                <Transition name="fade-slide" mode="out-in">
                  <div v-if="selectedBadge" :key="selectedBadge.id" class="detail-content">
                    <div class="detail-icon-wrap" :class="'pillar-' + selectedBadge.pillar">
                      <div class="large-icon">{{ selectedBadge.icon }}</div>
                      <div class="icon-ring"></div>
                    </div>
                    
                    <div class="detail-info text-center mt-6">
                      <span class="pillar-tag" :class="'pillar-' + selectedBadge.pillar">{{ selectedBadge.pillar.toUpperCase() }}</span>
                      <h2 class="mt-2">{{ selectedBadge.label }}</h2>
                      <p class="muted mt-4">{{ selectedBadge.description }}</p>
                    </div>

                    <div class="detail-progress mt-8">
                      <div class="progress-header">
                        <span class="status">{{ selectedBadge.earned ? 'ACHIEVED' : 'IN PROGRESS' }}</span>
                        <span class="val">{{ selectedBadge.progressLabel }}</span>
                      </div>
                      <div class="progress-track-lg">
                        <div class="progress-fill" :style="{ width: (selectedBadge.progress || 0) * 100 + '%', background: getPillarColor(selectedBadge.pillar) }"></div>
                      </div>
                    </div>

                    <div v-if="selectedBadge.earned" class="earned-date mt-6">
                      <span class="icon">✨</span>
                      <span>Achievement Unlocked</span>
                    </div>
                  </div>
                  <div v-else class="empty-detail">
                    <div class="placeholder-icon">🏅</div>
                    <p class="muted">Select a badge to view details</p>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
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
const selectedBadge = ref<any>(null)

function getPillarColor(pillar: string) {
  const colors: Record<string, string> = {
    milestone: 'var(--gold)',
    mastery: 'var(--teal)',
    ritual: 'var(--rose)',
    title: 'var(--accent)'
  }
  return colors[pillar] || 'var(--accent)'
}

function toggleIntel() {
  if (libraryStore.isBulkAnalyzing) libraryStore.stopBulkAnalysis()
  else libraryStore.startBulkAnalysis() // The engine will auto-force if completed
}





const badgePillars = [
  { id: 'milestone', label: 'Milestones', icon: '🏅' },
  { id: 'mastery',   label: 'DNA Mastery', icon: '🧬' },
  { id: 'ritual',    label: 'Rituals', icon: '🔥' },
  { id: 'title',     label: 'Archetypes', icon: '🧙‍♂️' },
]

async function deduplicateVault() {
  const count = await libraryStore.purgeDuplicates()
  await libraryStore.repairVaultMetadata()
  uiStore.addToast(`Cleanup complete. Removed ${count} duplicates and sanitized metadata.`, 'success')
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
  // 1. IMMEDIATE: Handle tab from query param for instant visual feedback
  if (route.query.tab === 'vault') activeTab.value = 'vault'
  else if (route.query.tab === 'constellation') activeTab.value = 'constellation'
  else if (route.query.tab === 'dna') activeTab.value = 'dna'

  // 2. BACKGROUND: Hydrate user data without blocking initial render
  userStore.fetchUserData()
  
  // 3. DEFERRED: Trigger maintenance tasks after render
  nextTick(() => {
    libraryStore.repairVaultMetadata()
    libraryStore.syncCloudGames()
  })
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
  const ecos = new Set(libraryStore.games.map((g: any) => g.eco))
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

/* Modal Transitions are now global in style.css */

/* Badge Modal V2 Styles */
.badge-modal-v2 {
  width: 95%;
  max-width: 900px;
  height: 80vh;
  display: flex;
  flex-direction: column;
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 32px 64px rgba(0,0,0,0.6);
  position: relative;
  background: rgba(15, 15, 25, 0.95);
  backdrop-filter: blur(30px);
}

.completion-summary {
  margin-left: auto;
  margin-right: var(--space-6);
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.completion-summary .count { font-size: 1.5rem; font-weight: 900; color: var(--accent-bright); }
.completion-summary .total { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }

.badge-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-8);
  flex: 1;
  min-height: 0;
  margin-top: var(--space-6);
}

.badge-list-sidebar {
  overflow-y: auto;
  padding-right: var(--space-4);
}

.badge-pillar-section { margin-bottom: var(--space-8); }
.pillar-label { 
  font-size: 0.75rem; 
  font-weight: 900; 
  color: var(--text-muted); 
  text-transform: uppercase; 
  letter-spacing: 0.15em;
  margin-bottom: var(--space-4);
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-grid-v2 {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: var(--space-4);
}

.badge-hex-item {
  aspect-ratio: 1;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.badge-hex-item .icon { font-size: 1.5rem; filter: grayscale(1) opacity(0.4); transition: all 0.3s; }

.badge-hex-item:hover { background: rgba(255,255,255,0.08); transform: translateY(-4px); }
.badge-hex-item.is-earned .icon { filter: none; opacity: 1; }
.badge-hex-item.is-selected { border-color: var(--accent); background: rgba(139, 92, 246, 0.1); box-shadow: 0 0 20px rgba(139, 92, 246, 0.2); }

/* Pillar Specific Effects */
.badge-hex-item.is-earned.pillar-milestone { border-bottom: 2px solid var(--gold); }
.badge-hex-item.is-earned.pillar-mastery { border-bottom: 2px solid var(--teal); }
.badge-hex-item.is-earned.pillar-ritual { border-bottom: 2px solid var(--rose); }
.badge-hex-item.is-earned.pillar-title { border-bottom: 2px solid var(--accent); }

.badge-detail-panel {
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  background: rgba(0,0,0,0.2);
}

.detail-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.detail-icon-wrap {
  width: 120px;
  height: 120px;
  background: rgba(255,255,255,0.03);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.large-icon { font-size: 3.5rem; z-index: 2; }
.icon-ring {
  position: absolute;
  inset: -10px;
  border: 2px dashed rgba(255,255,255,0.1);
  border-radius: 50%;
  animation: rotate 20s linear infinite;
}

.pillar-tag {
  font-size: 0.6rem;
  font-weight: 900;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  letter-spacing: 0.1em;
}
.pillar-tag.pillar-milestone { background: rgba(245, 158, 11, 0.1); color: var(--gold); border: 1px solid rgba(245, 158, 11, 0.2); }
.pillar-tag.pillar-mastery { background: rgba(45, 212, 191, 0.1); color: var(--teal); border: 1px solid rgba(45, 212, 191, 0.2); }
.pillar-tag.pillar-ritual { background: rgba(244, 63, 94, 0.1); color: var(--rose); border: 1px solid rgba(244, 63, 94, 0.2); }
.pillar-tag.pillar-title { background: rgba(139, 92, 246, 0.1); color: var(--accent-bright); border: 1px solid rgba(139, 92, 246, 0.2); }

.progress-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  font-size: 0.7rem;
  font-weight: 800;
}
.progress-header .status { color: var(--text-muted); letter-spacing: 0.1em; }
.progress-header .val { font-size: 0.9rem; color: white; }
.progress-track-lg { height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; width: 100%; }
.progress-fill { height: 100%; border-radius: 4px; transition: width 1s ease; }

.earned-date {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--gold);
}

.empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  opacity: 0.3;
}
.placeholder-icon { font-size: 4rem; margin-bottom: var(--space-4); }

@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
