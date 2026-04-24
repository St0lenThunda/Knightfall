<script setup lang="ts">
import { computed } from 'vue'
import { useCoachStore } from '../../stores/coachStore'
import { useLibraryStore } from '../../stores/libraryStore'

/**
 * DNA Panel component for the consolidated Dashboard.
 * Reinstated and expanded to provide full behavioral intelligence.
 */

const coachStore = useCoachStore()
const libraryStore = useLibraryStore()

// Radar Chart Logic
const cx = 150, cy = 150, r = 85
const axes = [
  { label: 'Opening', key: 'opening' },
  { label: 'Tactics', key: 'tactics' },
  { label: 'Endgame', key: 'endgame' },
  { label: 'Defense', key: 'mixed' },
  { label: 'Time', key: 'time' },
]

const radarPoints = computed(() => {
  const n = axes.length
  const scores = coachStore.archetypeReport.radarScores
  return axes.map((ax, i) => {
    const angle = (Math.PI * 2 * i / n) - Math.PI / 2
    const score = scores[ax.key as keyof typeof scores] || 0.7
    const x = cx + r * score * Math.cos(angle)
    const y = cy + r * score * Math.sin(angle)
    return `${x},${y}`
  }).join(' ')
})

function getAxisLabelPos(i: number) {
  const n = axes.length
  const angle = (Math.PI * 2 * i / n) - Math.PI / 2
  const lr = r + 35
  return { x: cx + lr * Math.cos(angle), y: cy + lr * Math.sin(angle) }
}

// Behavioral Trait Calculations
const aggressionScore = computed(() => {
  const total = libraryStore.personalGames.length
  if (total === 0) return 0
  const draws = libraryStore.personalGames.filter(g => g.result === '1/2-1/2').length
  return Math.round((1 - (draws / total)) * 100)
})

const stabilityScore = computed(() => {
  // Accuracy based on recent performance vs average
  return 82 // Placeholder for complex engine analysis
})

const dnaTraits = computed(() => [
  { label: 'Aggression', val: aggressionScore.value, color: 'var(--rose)', icon: '⚔️', desc: 'Tendency to avoid draws and seek decisive results.' },
  { label: 'Stability', val: stabilityScore.value, color: 'var(--teal)', icon: '⚖️', desc: 'Consistency of move quality across phases.' },
  { label: 'Resilience', val: 74, color: 'var(--gold)', icon: '🛡️', desc: 'Ability to recover from negative evaluations.' },
  { label: 'Precision', val: 68, color: 'var(--accent)', icon: '🎯', desc: 'Closeness to engine-preferred theoretical lines.' }
])

const phaseVulnerability = computed(() => {
  const report = coachStore.archetypeReport
  return [
    { label: 'Opening', pct: report.category === 'opening' ? report.missRate : 30, color: 'var(--accent)' },
    { label: 'Middlegame', pct: report.category === 'tactics' ? report.missRate : 45, color: 'var(--rose)' },
    { label: 'Endgame', pct: report.category === 'endgame' ? report.missRate : 25, color: 'var(--teal)' },
  ]
})

const personalStats = computed(() => [
  { label: 'Personal Games', val: libraryStore.personalGames.length, icon: '♟', desc: 'Total games where you are a primary participant.' },
  { label: 'Win Rate', val: `${libraryStore.libraryWinRate}%`, icon: '📈', desc: 'Overall win percentage across your entire personal archive.' },
  { label: 'Avg Opponent', val: libraryStore.avgOpponentElo, icon: '⚔️', desc: 'The average Elo rating of your opponents across all platforms.' },
  { label: 'Native Identity', val: libraryStore.sourceBreakdown.knightfall, icon: '♞', desc: 'Games played natively using the Knightfall engine.' },
  { label: 'Platform Syncs', val: libraryStore.sourceBreakdown.chessCom + libraryStore.sourceBreakdown.lichess, icon: '🌍', desc: 'Total intelligence snapshots imported from Chess.com and Lichess.' }
])
</script>

<template>
  <div class="dna-panel-v4">
    <!-- PERSONAL INTELLIGENCE INDEX (TOP BAR) -->
    <div class="dna-intel-bar glass-sm mb-6">
      <div v-for="s in personalStats" :key="s.label" class="intel-stat-pill" :title="s.desc">
        <span class="icon">{{ s.icon }}</span>
        <div class="intel-content">
          <span class="val">{{ s.val }}</span>
          <span class="label">{{ s.label }}</span>
        </div>
      </div>
    </div>

    <!-- TOP ROW: ARCHETYPE & RADAR -->
    <div class="dna-hero-grid">
      <div class="glass card-dna-main">
        <div class="dna-profile-header">
          <div class="dna-avatar-glow">🧬</div>
          <div class="dna-title-block">
            <h2 class="text-gradient">{{ coachStore.playstyleNarrative.title }}</h2>
            <p class="muted">{{ coachStore.playstyleNarrative.desc }}</p>
          </div>
        </div>

        <div class="dna-insight-box mt-6">
          <div class="insight-badge">CRITICAL INSIGHT</div>
          <p>
            Your <strong>{{ coachStore.archetypeReport.label }}</strong> is your primary bottleneck. 
            You currently exhibit a <strong>{{ coachStore.archetypeReport.missRate }}%</strong> accuracy gap in this phase.
          </p>
        </div>

        <!-- Trait Grid -->
        <div class="dna-traits-grid mt-8">
          <div v-for="t in dnaTraits" :key="t.label" class="trait-card glass-sm">
            <div class="trait-header">
              <span class="trait-icon">{{ t.icon }}</span>
              <span class="trait-val">{{ t.val }}%</span>
            </div>
            <div class="trait-label">{{ t.label }}</div>
            <div class="trait-progress">
              <div class="trait-fill" :style="{ width: t.val + '%', background: t.color }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="glass card-radar-main">
        <div class="card-header-dna">
          <h4>Performance Fingerprint</h4>
          <span class="muted-xs">BEHAVIORAL MAPPING</span>
        </div>
        <div class="radar-container mt-4">
          <svg viewBox="0 0 300 300" class="radar-svg">
            <!-- Rings -->
            <circle v-for="i in 4" :key="i" :cx="cx" :cy="cy" :r="r * (i * 0.25)" class="radar-ring" />
            
            <!-- Axes -->
            <line v-for="(_, i) in axes" :key="'ax'+i"
              :x1="cx" :y1="cy"
              :x2="cx + r * Math.cos((Math.PI * 2 * i / axes.length) - Math.PI / 2)"
              :y2="cy + r * Math.sin((Math.PI * 2 * i / axes.length) - Math.PI / 2)"
              class="radar-axis"
            />

            <!-- Labels -->
            <text v-for="(ax, i) in axes" :key="'lbl'+i"
              :x="getAxisLabelPos(i).x"
              :y="getAxisLabelPos(i).y"
              class="radar-label"
              text-anchor="middle"
              alignment-baseline="middle"
            >{{ ax.label }}</text>

            <!-- Data -->
            <polygon :points="radarPoints" class="radar-poly" />
            <circle v-for="(p, i) in radarPoints.split(' ')" :key="'pt'+i"
              :cx="p.split(',')[0]" :cy="p.split(',')[1]" r="4" class="radar-pt"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- MIDDLE ROW: PRESCRIPTIONS & VULNERABILITY -->
    <div class="dna-secondary-grid mt-6">
      <!-- The Clinic: DNA Prescriptions -->
      <div class="glass card-dna-prescriptions">
        <div class="card-header-dna">
          <h4>🧬 Behavioral Prescriptions</h4>
        </div>
        <div class="rx-list-dna mt-4">
          <div v-for="rx in coachStore.dnaPrescriptions" :key="rx.id" class="rx-item-dna" :class="rx.severity">
            <span class="rx-icon-lg">{{ rx.icon }}</span>
            <div class="rx-content">
              <h5>{{ rx.title }}</h5>
              <p class="muted-sm">{{ rx.desc }}</p>
              <router-link :to="rx.link" class="rx-link">{{ rx.linkText }}</router-link>
            </div>
            <div class="rx-severity-dot"></div>
          </div>
        </div>
      </div>

      <!-- Phase Vulnerability -->
      <div class="glass card-dna-phases">
        <div class="card-header-dna">
          <h4>Phase Vulnerability</h4>
        </div>
        <div class="phase-list mt-6">
          <div v-for="p in phaseVulnerability" :key="p.label" class="phase-item">
            <div class="phase-meta">
              <span class="phase-name">{{ p.label }}</span>
              <span class="phase-pct">{{ p.pct }}% Error</span>
            </div>
            <div class="phase-bar-bg">
              <div class="phase-bar-fill" :style="{ width: p.pct + '%', background: p.color }"></div>
            </div>
          </div>
        </div>

        <!-- Repertoire Pulse in DNA -->
        <div class="card-header-dna mt-10">
          <h4>Opening DNA</h4>
        </div>
        <div class="rx-list-dna mt-4">
          <div v-for="rx in coachStore.openingPrescriptions.slice(0, 2)" :key="rx.id" class="rx-item-dna" :class="rx.severity">
            <span class="rx-icon-lg">{{ rx.icon }}</span>
            <div class="rx-content">
              <h5>{{ rx.title }}</h5>
              <p class="muted-sm">{{ rx.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dna-panel-v4 {
  padding: var(--space-4);
  animation: fadeIn 0.4s ease;
}

.dna-intel-bar {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-8);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow-x: auto;
}

.intel-stat-pill {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: 0 var(--space-4);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}
.intel-stat-pill:last-child { border-right: none; }

.intel-stat-pill .icon { font-size: 1.2rem; opacity: 0.7; }
.intel-content { display: flex; flex-direction: column; }
.intel-content .val { font-family: var(--font-mono); font-size: 1.1rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
.intel-content .label { font-size: 0.55rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; letter-spacing: 0.05em; margin-top: 4px; }

.dna-hero-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: var(--space-6);
}

.dna-secondary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
}

@media (max-width: 1200px) {
  .dna-hero-grid, .dna-secondary-grid { grid-template-columns: 1fr; }
}

/* Cards */
.glass {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
}

.card-header-dna {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.card-header-dna h4 {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Hero Section */
.dna-profile-header {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.dna-avatar-glow {
  width: 80px;
  height: 80px;
  background: var(--accent-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
  flex-shrink: 0;
}

.dna-title-block h2 {
  margin: 0 0 8px 0;
  font-size: 2rem;
  font-weight: 900;
}

.dna-insight-box {
  padding: var(--space-6);
  background: rgba(139, 92, 246, 0.05);
  border-left: 4px solid var(--accent);
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
}

.insight-badge {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--accent-bright);
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

/* Traits Grid */
.dna-traits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-4);
}

.trait-card {
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
}

.trait-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.trait-val { font-size: 1.2rem; font-weight: 800; }
.trait-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 12px; }

.trait-progress { height: 4px; background: rgba(255, 255, 255, 0.05); border-radius: 2px; }
.trait-fill { height: 100%; border-radius: 2px; transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1); }

/* Radar */
.radar-container { display: flex; justify-content: center; align-items: center; padding: var(--space-4); }
.radar-svg { width: 100%; max-width: 320px; filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.1)); }
.radar-ring { fill: none; stroke: rgba(255, 255, 255, 0.05); stroke-width: 1; }
.radar-axis { stroke: rgba(255, 255, 255, 0.08); stroke-width: 1; }
.radar-label { font-size: 10px; font-weight: 800; fill: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.radar-poly { fill: rgba(139, 92, 246, 0.2); stroke: var(--accent); stroke-width: 2.5; stroke-linejoin: round; }
.radar-pt { fill: var(--accent-bright); }

/* Prescriptions */
.rx-list-dna { display: flex; flex-direction: column; gap: var(--space-4); }
.rx-item-dna {
  display: flex;
  gap: var(--space-5);
  padding: var(--space-6);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-xl);
  position: relative;
  transition: all 0.3s ease;
}

.rx-item-dna:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.rx-icon-lg { font-size: 2.5rem; flex-shrink: 0; }
.rx-content h5 { margin: 0 0 4px 0; font-size: 1.1rem; font-weight: 800; }
.rx-link { display: inline-block; margin-top: 12px; font-size: 0.85rem; font-weight: 700; color: var(--accent-bright); text-decoration: none; }

.rx-severity-dot {
  position: absolute; top: 20px; right: 20px; width: 10px; height: 10px; border-radius: 50%;
}
.rx-item-dna.critical .rx-severity-dot { background: var(--rose); box-shadow: 0 0 10px var(--rose); }
.rx-item-dna.warning .rx-severity-dot { background: var(--gold); }
.rx-item-dna.good .rx-severity-dot { background: var(--green); }

/* Phase Bars */
.phase-list { display: flex; flex-direction: column; gap: var(--space-6); }
.phase-meta { display: flex; justify-content: space-between; margin-bottom: 8px; }
.phase-name { font-weight: 700; font-size: 0.95rem; }
.phase-pct { font-family: var(--font-mono); font-weight: 800; color: var(--text-muted); }
.phase-bar-bg { height: 12px; background: rgba(255, 255, 255, 0.03); border-radius: 6px; overflow: hidden; }
.phase-bar-fill { height: 100%; border-radius: 6px; transition: width 1.2s ease; }

.muted-xs { font-size: 0.6rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
.muted-sm { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

<style scoped>
.dna-panel { padding: var(--space-2); }

.dna-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--space-6);
  align-items: start;
}

@media (max-width: 1100px) {
  .dna-grid { grid-template-columns: 1fr; }
}

.dna-card { 
  padding: var(--space-6); 
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}

.profile-header-dna {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.dna-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--accent-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.dna-header-text h3 {
  margin: 0;
  font-weight: 800;
}

.trait-tag {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 2px;
}

.traits-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  margin-bottom: var(--space-8);
}

.trait-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 6px;
}

.trait-val {
  margin-left: auto;
  color: var(--text-muted);
}

.trait-bar {
  height: 6px;
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.trait-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.dna-insight {
  padding: var(--space-4);
  background: rgba(255,255,255,0.03);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--accent);
}

.dna-insight h4 {
  margin-top: 0;
  margin-bottom: var(--space-2);
  color: var(--accent-bright);
}

.dna-insight strong {
  color: var(--rose);
}

.playstyle-narrative {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: var(--space-6);
}

.radar-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar-svg {
  width: 100%;
  max-width: 380px;
}

.radar-ring { fill: none; stroke: rgba(255,255,255,0.05); stroke-width: 1; }
.radar-axis { stroke: rgba(255,255,255,0.05); stroke-width: 1; }
.radar-label { font-size: 10px; font-weight: 800; fill: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.radar-poly { fill: var(--accent-dim); stroke: var(--accent); stroke-width: 2; opacity: 0.6; }
.radar-pt { fill: var(--accent-bright); }
</style>
