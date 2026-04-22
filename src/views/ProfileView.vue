<template>
  <div class="page profile-page">
    <div class="profile-header">
      <div class="profile-hero glass">
        <div class="profile-avatar">{{ userStore.profile?.username?.charAt(0).toUpperCase() || 'P' }}</div>
        <div class="profile-info">

          <!-- View Mode -->
          <template v-if="!isEditing">
            <div style="display:flex; align-items:center; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-2);">
              <h2 style="margin: 0;">{{ userStore.profile?.username || 'Player' }}</h2>
              <span class="title-badge" :style="{ color: userStore.badges.title.color, borderColor: userStore.badges.title.color }">
                {{ userStore.badges.title.symbol }} {{ userStore.badges.title.label }}
              </span>
              <!-- Edit button — always visible, route guard ensures auth -->
              <button
                class="btn-edit-inline"
                @click="startEdit"
                title="Edit username"
              >✎</button>
            </div>
            <p class="muted" style="font-size: 0.9rem; margin-bottom: var(--space-3);">
              Joined {{ joinedDate }}<span v-if="userStore.profile?.location"> · {{ userStore.profile.location }}</span>
              <span v-if="userStore.profile?.chessComUsername" class="chess-com-tag"> · ♟ {{ userStore.profile.chessComUsername }}</span>
            </p>
            <div class="profile-badges">
              <span v-for="b in userStore.badges.badges.filter(x => x.earned).slice(0, 5)" :key="b.id" class="tag">
                {{ b.icon }} {{ b.label }}
              </span>
              <span class="tag muted" v-if="userStore.badges.badges.filter(x => x.earned).length === 0">No badges yet — start playing!</span>
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
                <label class="label" style="font-size: 0.8rem; margin-bottom: var(--space-1); display:block; color: rgba(255,255,255,0.5);">New Username</label>
                <input
                  type="text"
                  class="input"
                  v-model="editUsername"
                  placeholder="Enter username..."
                  required
                  autofocus
                />
              </div>
              <div>
                <label class="label" style="font-size: 0.8rem; margin-bottom: var(--space-1); display:block; color: rgba(255,255,255,0.5);">Location <span class="muted">(optional)</span></label>
                <input
                  type="text"
                  class="input"
                  v-model="editLocation"
                  placeholder="e.g. New York, USA"
                />
              </div>
              <div>
                <label class="label" style="font-size: 0.8rem; margin-bottom: var(--space-1); display:block; color: rgba(255,255,255,0.5);">Chess.com Username <span class="muted">(optional)</span></label>
                <input
                  type="text"
                  class="input"
                  v-model="editChessComUser"
                  placeholder="e.g. hikaru"
                />
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
            <div class="rating-num" style="color: var(--teal);">{{ userStore.badges.earnedCount }}<span style="font-size:1rem; opacity:0.5;">/{{ userStore.badges.totalCount }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="profile-layout">
      <!-- Left: stats + openings -->
      <div class="profile-left">
        <!-- Win/Loss/Draw donuts -->
        <div class="glass wld-card">
          <h4 style="margin-bottom: var(--space-4);">Win / Loss / Draw</h4>
          <div class="wld-visual">
            <div class="wld-ring-container">
              <svg viewBox="0 0 100 100" class="wld-ring">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12"/>
                <!-- Win arc ~62% -->
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--green)" stroke-width="12"
                  :stroke-dasharray="`${(wldData[0].pct / 100) * 251.3} 251.3`" stroke-dashoffset="251.3" stroke-linecap="round"/>
                <!-- Loss arc -->
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--rose)" stroke-width="12"
                  :stroke-dasharray="`${(wldData[1].pct / 100) * 251.3} 251.3`" :stroke-dashoffset="251.3 - (wldData[0].pct / 100) * 251.3" stroke-linecap="round"/>
                <!-- Draw arc -->
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

        <!-- Opening repertoire -->
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
            <h4>Badges</h4>
            <span class="muted" style="font-size:0.8rem;">{{ userStore.badges.earnedCount }} / {{ userStore.badges.totalCount }} earned</span>
          </div>

          <div v-for="pillar in badgePillars" :key="pillar.id" style="margin-bottom: var(--space-5);">
            <div class="badge-pillar-label">{{ pillar.icon }} {{ pillar.label }}</div>
            <div class="badge-grid">
              <div
                v-for="b in userStore.badges.badges.filter(x => x.pillar === pillar.id)"
                :key="b.id"
                class="badge-item"
                :class="{ 'badge-earned': b.earned, 'badge-locked': !b.earned }"
                :data-tooltip="b.description"
              >
                <div class="badge-icon">{{ b.icon }}</div>
                <div class="badge-name">{{ b.label }}</div>
                <div v-if="!b.earned && b.progress !== undefined" class="badge-progress-bar">
                  <div class="badge-progress-fill" :style="{ width: (b.progress * 100) + '%' }"></div>
                </div>
                <div v-if="!b.earned && b.progressLabel" class="badge-progress-label">{{ b.progressLabel }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: rating chart + activity -->
      <div class="profile-right">
        <!-- Rating chart -->
        <div class="glass rating-chart-card">
          <div class="card-header" style="margin-bottom: var(--space-4);">
            <h4>Rating History</h4>
            <div class="tabs-mini">
              <button v-for="p in periods" :key="p"
                class="tab-mini" :class="{ active: activePeriod === p }"
                @click="activePeriod = p">
                {{ p }}
              </button>
            </div>
          </div>
          <div class="chart-area">
            <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="rating-svg" preserveAspectRatio="none">
              <!-- Grid lines -->
              <line v-for="g in gridLines" :key="g.rating" :x1="0" :y1="g.y" :x2="chartW" :y2="g.y"
                stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
              <!-- Rating labels -->
              <text v-for="g in gridLines" :key="'t'+g.rating" x="4" :y="g.y - 4"
                fill="rgba(255,255,255,0.25)" font-size="9" font-family="JetBrains Mono">
                {{ g.rating }}
              </text>
              <!-- Area fill -->
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="rgba(139,92,246,0.4)"/>
                  <stop offset="100%" stop-color="rgba(139,92,246,0)"/>
                </linearGradient>
              </defs>
              <path :d="areaPath" fill="url(#chartGrad)"/>
              <!-- Line -->
              <path :d="linePath" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>
              <!-- Data points -->
              <circle v-for="(pt, i) in chartPoints" :key="i"
                :cx="pt.x" :cy="pt.y" r="3"
                fill="var(--accent)" stroke="var(--bg-card)" stroke-width="2"/>
            </svg>
          </div>
        </div>

        <!-- Activity heatmap -->
        <div class="glass activity-card">
          <div class="card-header" style="margin-bottom: var(--space-4);">
            <h4>Activity — Last 12 Weeks</h4>
            <span class="badge badge-green">{{ userStore.pastGames.length }} games</span>
          </div>
          <div class="heatmap">
            <div v-for="(week, wi) in heatmapData" :key="wi" class="heatmap-col">
              <div
                v-for="(day, di) in week" :key="di"
                class="heat-cell"
                :style="{ background: heatColor(day) }"
                :data-tooltip="`${day} games`"
              ></div>
            </div>
          </div>
          <div class="heatmap-legend">
            <span class="muted" style="font-size:0.75rem;">Less</span>
            <div v-for="i in 5" :key="i" class="heat-cell" :style="{ background: heatColor(i * 2) }"></div>
            <span class="muted" style="font-size:0.75rem;">More</span>
          </div>
        </div>

        <!-- Weakness DNA Radar Chart -->
        <div class="glass radar-card">
          <div class="card-header" style="margin-bottom: var(--space-4);">
            <h4>Weakness DNA</h4>
            <span class="badge" :class="dnaCategory === 'tactics' ? 'badge-rose' : dnaCategory === 'endgame' ? 'badge-teal' : dnaCategory === 'opening' ? 'badge-accent' : 'badge-gold'">
              {{ userStore.weaknessDna.label }}
            </span>
          </div>
          <div class="radar-container">
            <svg viewBox="0 0 200 200" class="radar-svg">
              <defs>
                <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="rgba(139,92,246,0.5)"/>
                  <stop offset="100%" stop-color="rgba(139,92,246,0.05)"/>
                </radialGradient>
              </defs>
              <!-- Background rings -->
              <polygon v-for="lvl in [0.25, 0.5, 0.75, 1]" :key="lvl"
                :points="radarRing(lvl)"
                fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="0.5"/>
              <!-- Axis lines -->
              <line v-for="(ax, i) in radarAxes" :key="'ax'+i"
                x1="100" y1="100"
                :x2="ax.outerX" :y2="ax.outerY"
                stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
              <!-- Data polygon -->
              <polygon :points="radarDataPoints"
                fill="url(#radarGrad)" stroke="var(--accent)" stroke-width="1.5" stroke-linejoin="round"
                style="transition: all 0.6s ease;"/>
              <!-- Data dots -->
              <circle v-for="(ax, i) in radarAxes" :key="'dot'+i"
                :cx="ax.dataX" :cy="ax.dataY" r="3"
                :fill="ax.isWeakest ? 'var(--rose)' : 'var(--accent)'"
                stroke="var(--bg-card)" stroke-width="1.5"/>
              <!-- Labels -->
              <text v-for="(ax, i) in radarAxes" :key="'lbl'+i"
                :x="ax.labelX" :y="ax.labelY"
                text-anchor="middle" dominant-baseline="middle"
                font-size="8" font-family="Inter, sans-serif"
                :fill="ax.isWeakest ? 'var(--rose)' : 'rgba(255,255,255,0.5)'">
                {{ ax.label }}
              </text>
            </svg>
            <div class="radar-legend">
              <div v-for="ax in radarAxes" :key="ax.label" class="radar-legend-row">
                <div class="radar-legend-dot" :style="{ background: ax.isWeakest ? 'var(--rose)' : 'var(--accent)' }"></div>
                <span :style="{ color: ax.isWeakest ? 'var(--rose)' : 'rgba(255,255,255,0.7)', fontWeight: ax.isWeakest ? '700' : '400' }">
                  {{ ax.label }}
                </span>
                <span class="muted" style="margin-left: auto; font-size: 0.78rem;">{{ Math.round(ax.value * 100) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent games -->
        <div class="glass">
          <div style="padding: var(--space-5);">
            <div class="card-header" style="margin-bottom: var(--space-4);"><h4>Recent Games</h4></div>
            <div style="display:flex; flex-direction:column; gap: var(--space-2);">
              <div v-for="g in recentGames" :key="g.id" class="game-row">
                <div class="game-result-dot" :class="g.result"></div>
                <div class="game-info">
                  <span class="game-opponent">vs {{ g.opponent }}</span>
                  <span class="game-meta muted">{{ g.control }} · {{ g.opening }}</span>
                </div>
                <div class="game-score" :class="g.result">{{ g.score }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useUiStore } from '../stores/uiStore'
import { supabase } from '../api/supabaseClient'

const router = useRouter()
const userStore = useUserStore()
const libraryStore = useLibraryStore()
const uiStore = useUiStore()

const activePeriod = ref('1M')
const periods = ['1W', '1M', '3M', 'All']

const badgePillars = [
  { id: 'milestone', label: 'Milestones', icon: '🏅' },
  { id: 'mastery',   label: 'DNA Mastery', icon: '🧬' },
  { id: 'ritual',    label: 'Streaks & Rituals', icon: '🔥' },
]

const isEditing = ref(false)
const editUsername = ref('')
const editLocation = ref('')
const editChessComUser = ref('')
const isSaving = ref(false)

const joinedDate = computed(() => {
  const raw = (userStore.session as any)?.user?.created_at ?? null
  if (!raw) return 'recently'
  try {
    return new Date(raw).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } catch {
    return 'recently'
  }
})

// Ensure profile is populated on page load (user may already be logged in)
onMounted(() => {
  userStore.fetchUserData()
})

async function startEdit() {
  if (!userStore.profile) {
    await userStore.fetchUserData()
  }
  editUsername.value = userStore.profile?.username ?? ''
  editLocation.value = (userStore.profile as any)?.location ?? ''
  editChessComUser.value = userStore.profile?.chessComUsername ?? ''
  isEditing.value = true
}

async function saveProfile() {
  const trimmed = editUsername.value.trim()
  if (!trimmed) {
    uiStore.addToast('Username cannot be empty.', 'error')
    return
  }

  // Guarantee we have a session and profile
  if (!userStore.session) {
    uiStore.addToast('You must be logged in to update your profile.', 'error')
    return
  }

  const userId = userStore.session.user.id
  isSaving.value = true

  const { error } = await supabase
    .from('profiles')
    .update({ username: trimmed, location: editLocation.value.trim() || null })
    .eq('id', userId)

  isSaving.value = false

  if (error) {
    console.error('[saveProfile] Supabase error:', error)
    uiStore.addToast('Save failed: ' + error.message, 'error')
  } else {
    // Persist Chess.com username to localStorage
    const chessComTrimmed = editChessComUser.value.trim()
    if (chessComTrimmed) {
      localStorage.setItem('knightfall_chesscom_username', chessComTrimmed)
    } else {
      localStorage.removeItem('knightfall_chesscom_username')
    }
    
    isEditing.value = false
    uiStore.addToast('Profile updated!', 'success')
    await userStore.fetchUserData()
  }
}

const wldData = computed(() => userStore.wldStats)
const openingStats = computed(() => userStore.openingStats)

// Chart
const chartW = 500
const chartH = 120
const ratingData = computed(() => libraryStore.performanceHistory)
const minR = computed(() => Math.min(...ratingData.value) - 10)
const maxR = computed(() => Math.max(...ratingData.value) + 10)

const chartPoints = computed(() => ratingData.value.map((r: number, i: number) => ({
  x: (i / (Math.max(1, ratingData.value.length - 1))) * chartW,
  y: chartH - ((r - minR.value) / (Math.max(1, maxR.value - minR.value))) * chartH,
})))

const linePath = computed(() =>
  chartPoints.value.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
)

const areaPath = computed(() => {
  const pts = chartPoints.value
  const line = pts.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  return `${line} L${chartW},${chartH} L0,${chartH} Z`
})

const gridLines = computed(() => {
  const diff = maxR.value - minR.value
  return [minR.value + diff*0.2, minR.value + diff*0.5, minR.value + diff*0.8].map(r => ({
    rating: Math.round(r),
    y: chartH - ((r - minR.value) / (maxR.value - minR.value)) * chartH,
  }))
})

// Heatmap
const heatmapData = computed(() => libraryStore.activityHeatmap)
function heatColor(count: number) {
  if (count === 0) return 'rgba(255,255,255,0.04)'
  if (count <= 2)  return 'rgba(139,92,246,0.25)'
  if (count <= 4)  return 'rgba(139,92,246,0.5)'
  if (count <= 6)  return 'rgba(139,92,246,0.75)'
  return 'rgba(139,92,246,1)'
}

const recentGames = computed(() => [...userStore.pastGames].reverse().slice(0, 5))

// ---- Radar Chart ----
const dnaCategory = computed(() => userStore.weaknessDna.category)

// 6 axes: the 4 weakness categories + puzzle solve rate + game win rate
const radarAxisDefs = [
  { key: 'opening',  label: 'Opening' },
  { key: 'tactics',  label: 'Tactics' },
  { key: 'endgame',  label: 'Endgame' },
  { key: 'mixed',    label: 'Positional' },
  { key: 'puzzles',  label: 'Puzzles' },
  { key: 'games',    label: 'Win Rate' },
]

const radarValues = computed(() => {
  const dna = userStore.weaknessDna as any
  const breakdown: { cat: string; score: number }[] = dna.breakdown || []
  const totalScore = breakdown.reduce((s: number, b: any) => s + b.score, 0) || 1

  // Invert scores: high failure score → low radar value (weakness = depressed axis)
  const catValue = (key: string) => {
    const b = breakdown.find((x: any) => x.cat === key)
    const rawScore = b ? b.score : 0
    return Math.max(0.1, 1 - (rawScore / totalScore) * 4) // clamp between 0.1-1
  }

  const puzzleRate = userStore.puzzleAttempts.length
    ? userStore.puzzleAttempts.filter(a => a.solved).length / userStore.puzzleAttempts.length
    : 0.5
  const wld = userStore.wldStats
  const total = (wld[0].count + wld[1].count + wld[2].count) || 1
  const winRate = wld[0].count / total

  return {
    opening:  catValue('opening'),
    tactics:  catValue('tactics'),
    endgame:  catValue('endgame'),
    mixed:    catValue('mixed'),
    puzzles:  Math.max(0.1, puzzleRate),
    games:    Math.max(0.1, winRate),
  } as Record<string, number>
})

const cx = 100, cy = 100, r = 70

function radarPoint(axisIndex: number, value: number, total: number) {
  const angle = (Math.PI * 2 * axisIndex / total) - Math.PI / 2
  return {
    x: cx + r * value * Math.cos(angle),
    y: cy + r * value * Math.sin(angle),
  }
}

const radarAxes = computed(() => {
  const vals = radarValues.value
  const weakest = dnaCategory.value
  const n = radarAxisDefs.length
  return radarAxisDefs.map((def, i) => {
    const angle = (Math.PI * 2 * i / n) - Math.PI / 2
    const outer = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
    const data  = radarPoint(i, vals[def.key] ?? 0.5, n)
    const label = { x: cx + (r + 18) * Math.cos(angle), y: cy + (r + 18) * Math.sin(angle) }
    return {
      label: def.label,
      value: vals[def.key] ?? 0.5,
      outerX: outer.x, outerY: outer.y,
      dataX: data.x,   dataY: data.y,
      labelX: label.x, labelY: label.y,
      isWeakest: def.key === weakest,
    }
  })
})

const radarDataPoints = computed(() =>
  radarAxes.value.map(ax => `${ax.dataX},${ax.dataY}`).join(' ')
)

function radarRing(scale: number) {
  const n = radarAxisDefs.length
  return radarAxisDefs.map((_, i) => {
    const angle = (Math.PI * 2 * i / n) - Math.PI / 2
    return `${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)}`
  }).join(' ')
}
</script>

<style scoped>
.profile-page { padding-top: var(--space-6); }

/* Chess Title Badge */
/* Inline edit button */
.btn-edit-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.6);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.btn-edit-inline:hover {
  background: rgba(139,92,246,0.2);
  border-color: var(--accent);
  color: var(--accent);
  transform: scale(1.1);
}

/* Chess Title Badge */
.title-badge {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 3px 10px;
  border: 1px solid currentColor;
  border-radius: 999px;
  letter-spacing: 0.05em;
  background: rgba(255,255,255,0.05);
}

/* Badge Showcase */
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
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
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
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.4);
  box-shadow: 0 0 16px rgba(139, 92, 246, 0.1);
}
.badge-locked {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  opacity: 0.6;
  filter: grayscale(0.4);
}
.badge-icon { font-size: 1.6rem; line-height: 1; }
.badge-name {
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
  color: rgba(255,255,255,0.8);
}
.badge-locked .badge-name { color: rgba(255,255,255,0.4); }
.badge-progress-bar {
  width: 100%;
  height: 3px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  margin-top: var(--space-1);
  overflow: hidden;
}
.badge-progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  transition: width 0.6s ease;
}
.badge-progress-label {
  font-size: 0.65rem;
  color: rgba(255,255,255,0.35);
}

/* Radar Chart */
.radar-card { padding: var(--space-5); margin-bottom: var(--space-4); }
.radar-container {
  display: flex;
  align-items: center;
  gap: var(--space-5);
}
.radar-svg {
  width: 200px;
  height: 200px;
  flex-shrink: 0;
  filter: drop-shadow(0 0 12px rgba(139,92,246,0.25));
}
.radar-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.radar-legend-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.85rem;
}
.radar-legend-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Hero */
.profile-hero {
  display: flex; align-items: center; gap: var(--space-6);
  padding: var(--space-6); margin-bottom: var(--space-6);
  flex-wrap: wrap;
}
.profile-avatar {
  width: 80px; height: 80px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #7c3aed);
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; font-weight: 800; flex-shrink: 0;
  box-shadow: 0 0 32px rgba(139,92,246,0.4);
}
.profile-info { flex: 1; }
.profile-badges { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3); }
.profile-rating-showcase {
  display: flex; gap: var(--space-6); flex-wrap: wrap;
}
.rating-big { text-align: center; }
.rating-num { font-size: 2rem; font-weight: 800; line-height: 1; margin: var(--space-1) 0; }

/* Layout */
.profile-layout {
  display: grid; grid-template-columns: 340px 1fr;
  gap: var(--space-5); align-items: start;
}
@media (max-width: 1000px) { .profile-layout { grid-template-columns: 1fr; } }

.profile-left, .profile-right { display: flex; flex-direction: column; gap: var(--space-5); }

/* WLD */
.wld-card { padding: var(--space-5); }
.wld-visual { display: flex; align-items: center; gap: var(--space-5); }
.wld-ring-container { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
.wld-ring { width: 100%; height: 100%; transform: rotate(-90deg); }
.wld-center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.wld-pct { font-size: 1.4rem; font-weight: 800; }
.wld-legend { flex: 1; display: flex; flex-direction: column; gap: var(--space-2); }
.wld-row { display: flex; align-items: center; gap: var(--space-2); font-size: 0.85rem; }
.wld-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.wld-count { font-weight: 700; margin-left: auto; }
.wld-pct-small { min-width: 36px; text-align: right; }

/* Openings */
.opening-card { padding: var(--space-5); }
.tabs-mini { display: flex; gap: 4px; }
.tab-mini {
  padding: 4px 10px; border: 1px solid var(--border);
  border-radius: var(--radius-full); background: transparent;
  color: var(--text-muted); font-family: var(--font-sans);
  font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.tab-mini.active { background: var(--accent-dim); border-color: var(--accent); color: var(--accent-bright); }
.opening-list { display: flex; flex-direction: column; gap: var(--space-3); }
.opening-row { display: flex; align-items: center; gap: var(--space-3); }
.opening-info { flex: 1; }
.opening-name { font-size: 0.88rem; font-weight: 600; }
.opening-meta { font-size: 0.75rem; }
.opening-stats { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; min-width: 100px; }
.mini-wld {
  display: flex; height: 6px; width: 100px; border-radius: var(--radius-full); overflow: hidden; gap: 1px;
}
.mini-wld-bar { height: 100%; }

/* Rating chart */
.rating-chart-card { padding: var(--space-5); }
.chart-area { width: 100%; height: 120px; margin-top: var(--space-2); }
.rating-svg { width: 100%; height: 100%; }

/* Activity */
.activity-card { padding: var(--space-5); }
.heatmap { display: flex; gap: 3px; }
.heatmap-col { display: flex; flex-direction: column; gap: 3px; }
.heat-cell { width: 13px; height: 13px; border-radius: 3px; }
.heatmap-legend { display: flex; align-items: center; gap: 4px; margin-top: var(--space-3); }

/* Game rows */
.game-row { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-2); border-radius: var(--radius-sm); transition: background 0.15s; }
.game-row:hover { background: var(--bg-elevated); }
.game-result-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.game-result-dot.win  { background: var(--green); }
.game-result-dot.loss { background: var(--rose); }
.game-result-dot.draw { background: var(--gold); }
.game-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.game-opponent { font-size: 0.88rem; font-weight: 600; }
.game-meta { font-size: 0.75rem; }
.game-score { font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; }
.game-score.win  { color: var(--green); }
.game-score.loss { color: var(--rose); }
.game-score.draw { color: var(--gold); }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.stat-delta { font-size: 0.75rem; font-weight: 600; }
.stat-delta.up { color: var(--green); }

.chess-com-tag {
  color: var(--teal);
  font-weight: 600;
}
</style>
