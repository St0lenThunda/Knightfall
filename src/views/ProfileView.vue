<template>
  <div class="page profile-page">
    <div class="profile-header">
      <div class="profile-hero glass">
        <div class="profile-avatar">G</div>
        <div class="profile-info">
          <div style="display:flex; align-items:center; gap: var(--space-3); flex-wrap: wrap;">
            <h2>GrandMaster_G</h2>
            <span class="badge badge-gold">✦ PRO</span>
          </div>
          <p class="muted" style="font-size: 0.9rem; margin-top: var(--space-1);">Joined April 2024 · New York, USA</p>
          <div class="profile-badges">
            <span class="tag">🔥 7-day streak</span>
            <span class="tag">⚡ Speed Demon</span>
            <span class="tag">♟ 47 games</span>
          </div>
        </div>
        <div class="profile-rating-showcase">
          <div class="rating-big">
            <div class="label">Rapid Rating</div>
            <div class="rating-num text-gradient">1487</div>
            <div class="stat-delta up">▲ +23 this month</div>
          </div>
          <div class="rating-big">
            <div class="label">Blitz Rating</div>
            <div class="rating-num" style="color: var(--teal);">1312</div>
            <div class="stat-delta up">▲ +41 this month</div>
          </div>
          <div class="rating-big">
            <div class="label">Puzzle Rating</div>
            <div class="rating-num" style="color: var(--gold);">1124</div>
            <div class="stat-delta up">▲ +87 this month</div>
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
                  stroke-dasharray="155.9 95.8" stroke-dashoffset="251.3" stroke-linecap="round"/>
                <!-- Loss arc ~24% -->
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--rose)" stroke-width="12"
                  stroke-dasharray="60.4 191.3" stroke-dashoffset="95.4" stroke-linecap="round"/>
                <!-- Draw arc ~14% -->
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--gold)" stroke-width="12"
                  stroke-dasharray="35.2 216.5" stroke-dashoffset="34.5" stroke-linecap="round"/>
              </svg>
              <div class="wld-center">
                <div class="wld-pct">62%</div>
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
            <h4>Opening Repertoire</h4>
            <div class="tabs-mini">
              <button class="tab-mini" :class="{ active: openTab === 'white' }" @click="openTab='white'">♔ White</button>
              <button class="tab-mini" :class="{ active: openTab === 'black' }" @click="openTab='black'">♚ Black</button>
            </div>
          </div>
          <div class="opening-list">
            <div v-for="o in (openTab === 'white' ? whiteOpenings : blackOpenings)" :key="o.name" class="opening-row">
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
            <span class="badge badge-green">47 games</span>
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
import { ref, computed } from 'vue'

const openTab = ref<'white' | 'black'>('white')
const activePeriod = ref('1M')
const periods = ['1W', '1M', '3M', 'All']

const wldData = [
  { label: 'Wins',   color: 'var(--green)', count: 29, pct: 62 },
  { label: 'Losses', color: 'var(--rose)',  count: 11, pct: 24 },
  { label: 'Draws',  color: 'var(--gold)',  count: 7,  pct: 14 },
]

const whiteOpenings = [
  { name: "London System",    games: 14, winPct: 71, drawPct: 14, lossPct: 15 },
  { name: "King's Gambit",    games: 8,  winPct: 62, drawPct: 12, lossPct: 26 },
  { name: "Italian Game",     games: 6,  winPct: 50, drawPct: 16, lossPct: 34 },
]
const blackOpenings = [
  { name: "Sicilian Defense", games: 11, winPct: 63, drawPct: 18, lossPct: 19 },
  { name: "French Defense",   games: 6,  winPct: 50, drawPct: 16, lossPct: 34 },
  { name: "King's Indian",    games: 4,  winPct: 75, drawPct: 0,  lossPct: 25 },
]

// Chart
const chartW = 500
const chartH = 120
const ratingData = [1380, 1395, 1402, 1388, 1415, 1430, 1418, 1445, 1460, 1452, 1470, 1487]
const minR = 1360
const maxR = 1510

const chartPoints = computed(() => ratingData.map((r, i) => ({
  x: (i / (ratingData.length - 1)) * chartW,
  y: chartH - ((r - minR) / (maxR - minR)) * chartH,
})))

const linePath = computed(() =>
  chartPoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
)

const areaPath = computed(() => {
  const pts = chartPoints.value
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  return `${line} L${chartW},${chartH} L0,${chartH} Z`
})

const gridLines = [1400, 1440, 1480].map(r => ({
  rating: r,
  y: chartH - ((r - minR) / (maxR - minR)) * chartH,
}))

// Heatmap (12 weeks x 7 days)
const heatmapData = Array.from({ length: 12 }, () =>
  Array.from({ length: 7 }, () => Math.random() > 0.5 ? Math.floor(Math.random() * 8) : 0)
)
function heatColor(count: number) {
  if (count === 0) return 'rgba(255,255,255,0.04)'
  if (count <= 2)  return 'rgba(139,92,246,0.25)'
  if (count <= 4)  return 'rgba(139,92,246,0.5)'
  if (count <= 6)  return 'rgba(139,92,246,0.75)'
  return 'rgba(139,92,246,1)'
}

const recentGames = [
  { id: 1, result: 'win',  opponent: 'ChessWizard99',  control: '5+0',  opening: 'Sicilian',      score: '+12' },
  { id: 2, result: 'loss', opponent: 'TacticalTanya',  control: '10+5', opening: 'French',        score: '-8'  },
  { id: 3, result: 'win',  opponent: 'BlitzKing2000',  control: '1+0',  opening: 'London',        score: '+15' },
  { id: 4, result: 'draw', opponent: 'PawnStorm',      control: '10+0', opening: "King's Indian", score: '±0'  },
]
</script>

<style scoped>
.profile-page { padding-top: var(--space-6); }

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
</style>
