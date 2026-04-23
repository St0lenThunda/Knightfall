<template>
  <div class="page profile-page" :class="{ 'with-lab': activeTab === 'vault' }">
    <!-- Header: Navigation Tabs -->
    <div class="profile-nav-tabs glass-sm">
      <button class="profile-tab" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">
        👤 Overview
      </button>
      <button class="profile-tab" :class="{ active: activeTab === 'vault' }" @click="activeTab = 'vault'">
        🗄️ Vault
      </button>
      <button class="profile-tab" :class="{ active: activeTab === 'constellation' }" @click="activeTab = 'constellation'">
        ✨ Constellation
      </button>
    </div>

    <div class="profile-content-wrapper">
      <Transition name="fade-slide" mode="out-in">
        <div :key="activeTab" class="profile-tab-content">
          
          <!-- TAB 1: OVERVIEW (The Original Profile Dashboard) -->
          <div v-if="activeTab === 'overview'" class="overview-content">
            <div class="profile-header">
              <div class="profile-hero glass">
                <div class="profile-avatar">{{ userStore.profile?.username?.charAt(0).toUpperCase() || 'P' }}</div>
                <div class="profile-info">
                  <!-- View Mode -->
                  <template v-if="!isEditing">
                    <div style="display:flex; align-items:center; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-2);">
                      <h2 style="margin: 0;">{{ userStore.profile?.username || 'Player' }}</h2>
                      <span class="title-badge" :style="{ color: coachStore.achievements.title.color, borderColor: coachStore.achievements.title.color }">
                        {{ coachStore.achievements.title.symbol }} {{ coachStore.achievements.title.label }}
                      </span>
                      <button class="btn-edit-inline" @click="startEdit" title="Edit username">✎</button>
                    </div>
                    <p class="muted" style="font-size: 0.9rem; margin-bottom: var(--space-3);">
                      Joined {{ joinedDate }}<span v-if="userStore.profile?.location"> · {{ userStore.profile.location }}</span>
                      <span v-if="userStore.profile?.chessComUsername" class="chess-com-tag"> · ♟ {{ userStore.profile.chessComUsername }}</span>
                      <span v-if="userStore.profile?.lichessUsername" class="lichess-tag"> · ♘ {{ userStore.profile.lichessUsername }}</span>
                    </p>
                    <div class="profile-badges">
                      <span v-for="b in coachStore.achievements.badges.filter(x => x.earned).slice(0, 5)" :key="b.id" class="tag">
                        {{ b.icon }} {{ b.label }}
                      </span>
                      <span class="tag muted" v-if="coachStore.achievements.badges.filter(x => x.earned).length === 0">No badges yet — start playing!</span>
                    </div>
                  </template>

                  <!-- Edit Mode -->
                  <template v-else>
                    <div style="display:flex; align-items:center; gap: var(--space-3); margin-bottom: var(--space-3);">
                      <h2 style="margin: 0; opacity: 0.4;">{{ userStore.profile?.username }}</h2>
                      <span style="font-size:0.8rem; color: var(--accent); font-weight: 600;">← Editing</span>
                    </div>
                    <form @submit.prevent="saveProfile" style="display:flex; flex-direction: column; gap: var(--space-3); max-width: 280px;">
                      <div>
                        <label class="label">New Username</label>
                        <input type="text" class="input" v-model="editUsername" required autofocus />
                      </div>
                      <div>
                        <label class="label">Location</label>
                        <input type="text" class="input" v-model="editLocation" placeholder="e.g. London, UK" />
                      </div>
                      <div>
                        <label class="label">Chess.com Username</label>
                        <input type="text" class="input" v-model="editChessComUser" placeholder="e.g. hikaru" />
                      </div>
                      <div>
                        <label class="label">Lichess Username</label>
                        <input type="text" class="input" v-model="editLichessUser" placeholder="e.g. thibault" />
                      </div>
                      <div style="display: flex; gap: var(--space-2);">
                        <button type="submit" class="btn btn-primary btn-sm" :disabled="isSaving">
                          {{ isSaving ? 'Saving...' : '✓ Save Changes' }}
                        </button>
                        <button type="button" class="btn btn-ghost btn-sm" @click="isEditing = false" :disabled="isSaving">Cancel</button>
                      </div>
                    </form>
                  </template>
                </div>

                <div class="profile-rating-showcase">
                  <div class="rating-big">
                    <div class="label">Rapid Rating</div>
                    <div class="rating-num text-gradient">{{ userStore.currentRating }}</div>
                  </div>
                  <div class="rating-big">
                    <div class="label">Puzzle Rating</div>
                    <div class="rating-num" style="color: var(--gold);">{{ userStore.profile?.puzzle_rating ?? 1200 }}</div>
                  </div>
                  <div class="rating-big">
                    <div class="label">Badges</div>
                    <div class="rating-num" style="color: var(--teal);">{{ coachStore.achievements.earnedCount }}<span style="font-size:1rem; opacity:0.5;">/{{ coachStore.achievements.totalCount }}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="profile-layout">
              <div class="profile-left">
                <!-- WLD -->
                <div class="glass wld-card">
                  <h4 style="margin-bottom: var(--space-4);">Win / Loss / Draw</h4>
                  <div class="wld-visual">
                    <div class="wld-ring-container">
                      <svg viewBox="0 0 100 100" class="wld-ring">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--green)" stroke-width="12"
                          :stroke-dasharray="`${(wldData[0].pct / 100) * 251.3} 251.3`" stroke-dashoffset="251.3" stroke-linecap="round"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--rose)" stroke-width="12"
                          :stroke-dasharray="`${(wldData[1].pct / 100) * 251.3} 251.3`" :stroke-dashoffset="251.3 - (wldData[0].pct / 100) * 251.3" stroke-linecap="round"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--gold)" stroke-width="12"
                          :stroke-dasharray="`${(wldData[2].pct / 100) * 251.3} 251.3`" :stroke-dashoffset="251.3 - ((wldData[0].pct + wldData[1].pct) / 100) * 251.3" stroke-linecap="round"/>
                      </svg>
                      <div class="wld-center">
                        <div class="wld-pct">{{ wldData[0].pct }}%</div>
                        <div class="label">Win rate</div>
                      </div>
                    </div>
                    <div class="wld-legend">
                      <div class="wld-row" v-for="r in wldData" :key="r.label">
                        <div class="wld-dot" :style="{ background: r.color }"></div>
                        <span>{{ r.label }}</span>
                        <span class="wld-count">{{ r.count }}</span>
                        <span class="wld-pct-small muted">{{ r.pct }}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Top Openings -->
                <div class="glass opening-card">
                  <div class="card-header" style="margin-bottom: var(--space-4);">
                    <h4>Top Openings Played</h4>
                  </div>
                  <div class="opening-list">
                    <div v-for="o in openingStats.slice(0, 4)" :key="o.name" class="opening-row">
                      <div class="opening-info">
                        <div class="opening-name">{{ o.name }}</div>
                        <div class="opening-meta muted">{{ o.games }} games</div>
                      </div>
                      <div class="opening-stats">
                        <div class="mini-wld">
                          <div class="mini-wld-bar" :style="{ width: o.winPct + '%', background: 'var(--green)' }"></div>
                          <div class="mini-wld-bar" :style="{ width: o.drawPct + '%', background: 'var(--gold)' }"></div>
                          <div class="mini-wld-bar" :style="{ width: o.lossPct + '%', background: 'var(--rose)' }"></div>
                        </div>
                        <span style="font-size:0.8rem; font-weight:700; color: var(--green);">{{ o.winPct }}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Badge Collection -->
                <div class="glass badge-showcase-card">
                  <div class="card-header" style="margin-bottom: var(--space-4);">
                    <h4>Badge Showcase</h4>
                    <span class="muted" style="font-size:0.8rem;">{{ coachStore.achievements.earnedCount }} / {{ coachStore.achievements.totalCount }} earned</span>
                  </div>

                  <div v-for="pillar in badgePillars" :key="pillar.id" style="margin-bottom: var(--space-5);">
                    <div class="badge-pillar-label">{{ pillar.icon }} {{ pillar.label }}</div>
                    <div class="badge-grid">
                      <div
                        v-for="b in coachStore.achievements.badges.filter(x => x.pillar === pillar.id)"
                        :key="b.id"
                        class="badge-item"
                        :class="{ 'badge-earned': b.earned, 'badge-locked': !b.earned }"
                        :title="b.description"
                      >
                        <div class="badge-icon">{{ b.icon }}</div>
                        <div class="badge-name">{{ b.label }}</div>
                        <div v-if="!b.earned && b.progress !== undefined" class="badge-progress-bar">
                          <div class="badge-progress-fill" :style="{ width: (b.progress * 100) + '%' }"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="profile-right">
                <!-- Rating History -->
                <div class="glass rating-chart-card">
                  <div class="card-header" style="margin-bottom: var(--space-4);">
                    <h4>Rating History</h4>
                    <div class="tabs-mini">
                      <button v-for="p in periods" :key="p" class="tab-mini" :class="{ active: activePeriod === p }" @click="activePeriod = p">{{ p }}</button>
                    </div>
                  </div>
                  <div class="chart-container">
                    <div class="y-axis">
                      <span v-for="g in gridLines" :key="g.rating" class="axis-label">{{ g.rating }}</span>
                    </div>
                    <div class="chart-area">
                      <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="rating-svg" preserveAspectRatio="none">
                        <!-- Horizontal Grid Lines -->
                        <line v-for="g in gridLines" :key="g.rating" :x1="0" :y1="g.y" :x2="chartW" :y2="g.y" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
                        
                        <!-- Main Path -->
                        <path :d="areaPath" fill="rgba(139,92,246,0.2)"/>
                        <path :d="linePath" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </div>
                  </div>
                  <div class="x-axis muted">
                    <span>{{ activePeriod === 'All' ? 'Start' : 'Previous' }}</span>
                    <span>Now</span>
                  </div>
                </div>

                <!-- Activity Heatmap -->
                <div class="glass activity-card">
                  <div class="card-header" style="margin-bottom: var(--space-4);">
                    <h4>Activity — Last 12 Weeks</h4>
                    <div class="heatmap-legend">
                      <span class="muted">Less</span>
                      <div class="heat-cell" style="background: rgba(255,255,255,0.04)"></div>
                      <div class="heat-cell" style="background: rgba(139,92,246,0.25)"></div>
                      <div class="heat-cell" style="background: rgba(139,92,246,0.5)"></div>
                      <div class="heat-cell" style="background: rgba(139,92,246,0.75)"></div>
                      <div class="heat-cell" style="background: rgba(139,92,246,1)"></div>
                      <span class="muted">More</span>
                    </div>
                  </div>
                  <div class="heatmap-container">
                    <div class="day-labels muted">
                      <span>Mon</span>
                      <span>Wed</span>
                      <span>Fri</span>
                    </div>
                    <div class="heatmap">
                      <div v-for="(week, wi) in heatmapData" :key="wi" class="heatmap-col">
                        <div v-for="(day, di) in week" :key="di" class="heat-cell" :style="{ background: heatColor(day) }"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: VAULT (Game Archive) -->
          <div v-else-if="activeTab === 'vault'" class="vault-tab-content">
            <header class="tab-header glass-xs">
              <div class="header-info">
                <h2>Game Archive</h2>
                <div class="header-stats">
                  <span class="badge badge-accent">{{ libraryStore.games.length }} Games</span>
                  <span class="badge">{{ ECO_COUNT }} Openings</span>
                </div>
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
                  <span class="badge badge-accent">{{ ECO_COUNT }} Known Variations</span>
                </div>
              </div>
            </header>
            <ConstellationPanel />
          </div>

        </div>
      </Transition>
      
      <!-- Laboratory Sidebar (only for Vault) -->
      <aside v-if="activeTab === 'vault'" class="profile-lab-sidebar glass">
        <LibraryLab />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useCoachStore } from '../stores/coachStore'
import { useUiStore } from '../stores/uiStore'
import { supabase } from '../api/supabaseClient'

// Tab Components
import VaultPanel from '../components/library/VaultPanel.vue'
import ConstellationPanel from '../components/library/ConstellationPanel.vue'
import LibraryLab from '../components/library/LibraryLab.vue'

const route = useRoute()
const userStore = useUserStore()
const libraryStore = useLibraryStore()
const coachStore = useCoachStore()
const uiStore = useUiStore()

const activeTab = ref<'overview' | 'vault' | 'constellation'>('overview')
const activePeriod = ref('1M')
const periods = ['1W', '1M', '3M', 'All']

const isEditing = ref(false)
const editUsername = ref('')
const editLocation = ref('')
const editChessComUser = ref('')
const editLichessUser = ref('')
const isSaving = ref(false)

const badgePillars = [
  { id: 'milestone', label: 'Milestones', icon: '🏅' },
  { id: 'mastery',   label: 'DNA Mastery', icon: '🧬' },
  { id: 'ritual',    label: 'Streaks & Rituals', icon: '🔥' },
]

onMounted(async () => {
  await userStore.fetchUserData()
  
  // Handle tab from query param
  if (route.query.tab === 'vault') activeTab.value = 'vault'
  else if (route.query.tab === 'constellation') activeTab.value = 'constellation'
  
  // Trigger background maintenance
  libraryStore.repairVaultMetadata()
  libraryStore.syncCloudGames()
})

watch(() => route.query.tab, (tab) => {
  if (tab === 'vault') activeTab.value = 'vault'
  else if (tab === 'constellation') activeTab.value = 'constellation'
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

function startEdit() {
  editUsername.value = userStore.profile?.username ?? ''
  editLocation.value = (userStore.profile as any)?.location ?? ''
  editChessComUser.value = userStore.profile?.chessComUsername ?? ''
  editLichessUser.value = userStore.profile?.lichessUsername ?? ''
  isEditing.value = true
}

async function saveProfile() {
  const trimmed = editUsername.value.trim()
  if (!trimmed) return
  isSaving.value = true
  
  const { error } = await supabase
    .from('profiles')
    .update({ 
      username: trimmed, 
      location: editLocation.value.trim() || null 
    })
    .eq('id', userStore.session?.user.id)
  
  if (!error) {
    // Save platform usernames to localStorage for telemetry
    if (editChessComUser.value.trim()) {
      localStorage.setItem('knightfall_chesscom_username', editChessComUser.value.trim())
    } else {
      localStorage.removeItem('knightfall_chesscom_username')
    }
    
    if (editLichessUser.value.trim()) {
      localStorage.setItem('knightfall_lichess_username', editLichessUser.value.trim())
    } else {
      localStorage.removeItem('knightfall_lichess_username')
    }

    isEditing.value = false
    uiStore.addToast('Profile updated!', 'success')
    await userStore.fetchUserData()
  }
  isSaving.value = false
}

// Stats Helpers
const wldData = computed(() => userStore.wldStats)
const openingStats = computed(() => userStore.openingStats)
const heatmapData = computed(() => libraryStore.activityHeatmap)
function heatColor(count: number) {
  if (count === 0) return 'rgba(255,255,255,0.04)'
  return `rgba(139,92,246, ${Math.min(1, count / 8)})`
}

// Simple Chart
const chartW = 500, chartH = 120
const ratingData = computed(() => libraryStore.performanceHistory)
const minR = computed(() => Math.min(...ratingData.value) - 10)
const maxR = computed(() => Math.max(...ratingData.value) + 10)

const chartPoints = computed(() => ratingData.value.map((r, i) => ({
  x: (i / (Math.max(1, ratingData.value.length - 1))) * chartW,
  y: chartH - ((r - minR.value) / (Math.max(1, maxR.value - minR.value))) * chartH,
})))

const linePath = computed(() => chartPoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' '))
const areaPath = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ''
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  return `${line} L${chartW},${chartH} L0,${chartH} Z`
})

const gridLines = computed(() => {
  const diff = maxR.value - minR.value
  const steps = [0.1, 0.5, 0.9]
  return steps.map(s => {
    const val = minR.value + diff * s
    return {
      rating: Math.round(val),
      y: chartH - ((val - minR.value) / (maxR.value - minR.value)) * chartH
    }
  })
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

.profile-content-wrapper { display: flex; gap: var(--space-6); }
.profile-page.with-lab .profile-content-wrapper { display: grid; grid-template-columns: 1fr 340px; }

.tab-header { padding: var(--space-4) var(--space-6); border-radius: var(--radius-lg); margin-bottom: var(--space-6); display: flex; align-items: center; justify-content: space-between; }
.header-info { display: flex; align-items: center; gap: var(--space-6); }
.header-stats { display: flex; gap: var(--space-2); }

.profile-lab-sidebar { border-radius: var(--radius-lg); height: calc(100vh - 200px); position: sticky; top: 100px; padding: var(--space-4); }

/* Profile Overview Styles */
.profile-hero { display: flex; align-items: center; gap: var(--space-6); padding: var(--space-6); margin-bottom: var(--space-6); border-radius: var(--radius-xl); }
.profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: var(--accent-gradient); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; box-shadow: 0 0 32px rgba(139,92,246,0.3); }
.profile-rating-showcase { display: flex; gap: var(--space-8); margin-left: auto; }
.rating-big { text-align: center; }
.rating-num { font-size: 2rem; font-weight: 800; }

.profile-layout { display: grid; grid-template-columns: 350px 1fr; gap: var(--space-6); }
.wld-card, .opening-card, .rating-chart-card, .activity-card { padding: var(--space-5); border-radius: var(--radius-lg); }

.wld-visual { display: flex; align-items: center; gap: var(--space-4); }
.wld-ring-container { position: relative; width: 100px; height: 100px; }
.wld-ring { transform: rotate(-90deg); }
.wld-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.wld-pct { font-size: 1.2rem; font-weight: 800; }

.opening-list { display: flex; flex-direction: column; gap: var(--space-3); }
.opening-row { display: flex; align-items: center; gap: var(--space-3); }
.mini-wld { display: flex; height: 6px; width: 80px; border-radius: 3px; overflow: hidden; }

.chart-container { display: flex; gap: var(--space-3); }
.y-axis { display: flex; flex-direction: column-reverse; justify-content: space-between; font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono); height: 120px; padding-bottom: 4px; }
.chart-area { flex: 1; height: 120px; position: relative; }
.rating-svg { width: 100%; height: 100%; overflow: visible; }
.x-axis { display: flex; justify-content: space-between; font-size: 0.65rem; margin-top: var(--space-2); margin-left: 35px; }

.heatmap-container { display: flex; gap: var(--space-3); align-items: flex-start; }
.day-labels { display: flex; flex-direction: column; justify-content: space-between; height: 90px; font-size: 0.6rem; padding: 4px 0; }
.heatmap-legend { display: flex; align-items: center; gap: 4px; font-size: 0.65rem; }
.heatmap-legend .heat-cell { width: 10px; height: 10px; border-radius: 2px; }

.heatmap { display: flex; gap: 4px; flex: 1; }
.heatmap-col { display: flex; flex-direction: column; gap: 4px; }
.heat-cell { width: 12px; height: 12px; border-radius: 2px; }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-10px); }

.chess-com-tag { color: var(--teal); font-weight: 600; }
.lichess-tag { color: var(--accent); font-weight: 600; }
.title-badge { font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border: 1px solid currentColor; border-radius: 99px; }

/* Badge Showcase Styles */
.badge-showcase-card { padding: var(--space-5); margin-top: var(--space-4); }
.badge-pillar-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.35);
  margin-bottom: var(--space-3);
}
.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--space-3);
}
.badge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-3) var(--space-2);
  border-radius: var(--radius-md);
  gap: var(--space-1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: default;
}
.badge-item:hover { transform: translateY(-2px); }
.badge-earned {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
}
.badge-locked {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  opacity: 0.5;
  filter: grayscale(0.6);
}
.badge-icon { font-size: 1.4rem; line-height: 1; }
.badge-name {
  font-size: 0.65rem;
  font-weight: 600;
  line-height: 1.2;
  color: rgba(255,255,255,0.8);
}
.badge-progress-bar {
  width: 100%;
  height: 2px;
  background: rgba(255,255,255,0.1);
  border-radius: 1px;
  margin-top: 4px;
  overflow: hidden;
}
.badge-progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.6s ease;
}
</style>
