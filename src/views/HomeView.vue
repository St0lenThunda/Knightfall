<template>
  <div class="page home-page">

    <!-- Logged in view: Dashboard -->
    <template v-if="userStore.session && userStore.profile">
      <section class="stats-row">
        <div class="stat-card">
          <div class="stat-label">Library Performance</div>
          <div class="stat-value text-gradient">{{ libraryStore.performanceRating }}</div>
          <div class="stat-delta up">▲ Chronological Elo</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Library Games</div>
          <div class="stat-value">{{ libraryStore.games.length }}</div>
          <div class="stat-delta">Combined Sources</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Unique Openings</div>
          <div class="stat-value text-teal-gradient">{{ libraryStore.openingStats.length }}</div>
          <div class="stat-delta">Repertoire Depth</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Library Win Rate</div>
          <div class="stat-value" :style="{ color: libraryWinRate > 50 ? 'var(--green)' : 'var(--gold)' }">
            {{ libraryWinRate }}%
          </div>
          <div class="stat-delta up">▲ Trending Up</div>
        </div>
      </section>

      <!-- Two column: Feature cards + Activity -->
      <section class="home-grid">
        <!-- Feature spotlight cards -->
        <div class="feature-cards">
          <h3 style="margin-bottom: var(--space-4);">What's waiting for you</h3>
          <div class="feature-card glass" v-for="f in features" :key="f.title"
            @click="f.id === 'analysis' ? handleQuickAnalysis() : router.push(f.path)" style="cursor: pointer;">
            <div class="feature-icon" :style="{ background: f.bg }">{{ f.icon }}</div>
            <div class="feature-body">
              <div class="feature-title">{{ f.title }}</div>
              <div class="feature-desc muted">{{ f.desc }}</div>
            </div>
            <div class="feature-arrow">›</div>
          </div>
        </div>

        <!-- Recent activity + Weakness report -->
        <div class="right-column">
          <!-- Weakness DNA -->
          <div class="glass weakness-card">
            <div class="card-header">
              <h4>🧬 Weakness DNA</h4>
              <span class="badge badge-rose">AI INSIGHT</span>
            </div>
            <p class="muted" style="font-size: 0.85rem; margin: var(--space-3) 0;">
              Based on your last {{ libraryStore.games.length }} analyzed games, we found patterns in your mistakes:
            </p>
            <div class="weakness-items">
              <div v-for="w in weaknesses" :key="w.label" class="weakness-item">
                <div class="weakness-label">
                  <span>{{ w.icon }} {{ w.label }}</span>
                  <span style="font-size: 0.8rem; color: var(--text-muted);">{{ w.pct }}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-bar-fill" :style="{ width: w.pct + '%', background: w.color }"></div>
                </div>
              </div>
            </div>
            <RouterLink to="/dna" class="btn btn-ghost btn-sm" style="margin-top: var(--space-4); width: 100%; justify-content: center;">
              Full DNA Lab →
            </RouterLink>
          </div>

          <!-- Mini Prescription Engine (The Clinic) -->
          <div v-if="miniRx.length > 0" class="glass clinic-mini-card">
            <div class="card-header">
              <h4>📋 The Clinic</h4>
              <span class="badge badge-teal">ACTIVE RX</span>
            </div>
            <div class="mini-prescriptions">
              <div v-for="rx in miniRx" :key="rx.id" class="mini-rx-item" :class="rx.severity">
                <span class="rx-icon">{{ rx.icon }}</span>
                <div class="rx-info">
                  <div class="rx-title">{{ rx.title }}</div>
                  <router-link :to="rx.link" class="rx-action">{{ rx.linkText }}</router-link>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent games -->
          <div class="glass recent-games">
            <div class="card-header">
              <h4>Recent Games</h4>
              <RouterLink to="/profile?tab=vault" class="btn-cleanup-text">VIEW VAULT →</RouterLink>
            </div>
            <div class="game-list">
              <div v-for="g in recentGames" :key="g.id" class="game-row" @click="router.push('/analysis?id=' + g.id)" style="cursor:pointer;">
                <div class="game-result-dot" :class="g.result"></div>
                <div class="game-info">
                  <span class="game-opponent">vs {{ g.opponent }}</span>
                  <span class="game-meta muted">{{ g.control }} · {{ g.opening }}</span>
                </div>
                <div class="game-score" :class="g.result">{{ g.score }}</div>
              </div>
              <div v-if="recentGames.length === 0" class="muted" style="padding: var(--space-4); text-align:center; font-size:0.85rem;">
                No games in archive yet.
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- Guest view: Sales / Marketing section -->
    <template v-else>
      <!-- Hero section (Guest only) -->
      <section class="hero">
        <div class="hero-content">
          <div class="hero-eyebrow">
            <span class="badge badge-accent">✦ EARLY ACCESS</span>
          </div>
          <h1>Chess, <span class="text-gradient">reimagined</span>.</h1>
          <p class="hero-subtitle">
            AI-powered coaching. Pattern-based learning. Premium design.
            <br>The chess platform you deserved all along.
          </p>
          <div class="hero-actions">
            <RouterLink to="/play" class="btn btn-primary btn-lg" id="hero-play-btn">
              ♟ Play Now
            </RouterLink>
            <RouterLink to="/puzzles" class="btn btn-ghost btn-lg" id="hero-puzzles-btn">
              ⚡ Solve Puzzles
            </RouterLink>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <span class="hero-stat-value">12k+</span>
              <span class="hero-stat-desc">Players</span>
            </div>
            <div class="hero-stat-divider"></div>
            <div class="hero-stat">
              <span class="hero-stat-value">98%</span>
              <span class="hero-stat-desc">Ad-free forever</span>
            </div>
            <div class="hero-stat-divider"></div>
            <div class="hero-stat">
              <span class="hero-stat-value">500ms</span>
              <span class="hero-stat-desc">Avg. move latency</span>
            </div>
          </div>
        </div>

        <!-- Mini preview board -->
        <div class="hero-board glass">
          <div class="hero-board-header">
            <div class="player-chip">
              <div class="player-avatar" style="background: linear-gradient(135deg, #374151, #1f2937);">♚</div>
              <span>Engine Level 4</span>
              <span class="badge badge-teal">1650</span>
            </div>
          </div>
          <div class="mini-board">
            <div v-for="(row, ri) in previewBoard" :key="ri" class="mini-row">
              <div v-for="(cell, ci) in row" :key="ci" class="mini-sq" :class="(ri+ci)%2===0?'mini-light':'mini-dark'">
                {{ cell }}
              </div>
            </div>
          </div>
          <div class="hero-board-footer">
            <div class="player-chip">
              <div class="player-avatar" style="background: linear-gradient(135deg, var(--accent), #7c3aed);">{{ userStore.profile?.username?.charAt(0).toUpperCase() || 'P' }}</div>
              <span>{{ userStore.profile?.username || 'Player' }}</span>
              <span class="badge badge-gold">{{ userStore.profile?.rating || 1200 }}</span>
            </div>
            <span class="badge badge-green" style="margin-left: auto;">● LIVE</span>
          </div>
        </div>
      </section>

      <section class="landing-sales">
        <div class="section-title-wrap">
          <h2 class="section-title">A New Era of Chess Study</h2>
          <p class="section-subtitle muted">Bespoke technology designed for the modern grandmaster and the aspiring novice alike.</p>
        </div>

        <!-- Showcase 1: AI Coaching -->
        <div class="feature-showcase">
          <div class="showcase-content">
            <div class="badge badge-accent">🔬 NEXT-GEN ANALYSIS</div>
            <h2>Live AI Coaching</h2>
            <p>Don't just see the 'Best Move'. Understand the <i>why</i>. Our AI coach breaks down complex positional nuances into plain English, helping you build genuine intuition.</p>
            <ul class="feature-list">
              <li><span>✓</span> Line-by-line tactical commentary</li>
              <li><span>✓</span> Critical moments automatically flagged</li>
              <li><span>✓</span> Dynamic threats and ideas visualization</li>
            </ul>
          </div>
          <div class="showcase-image glass">
            <img src="/images/landings/ai_coaching.png" alt="AI Coaching Interface" />
          </div>
        </div>

        <!-- Showcase 2: Weakness DNA -->
        <div class="feature-showcase reverse">
          <div class="showcase-content">
            <div class="badge badge-rose">🧬 PATTERN DETECTION</div>
            <h2>Weakness DNA</h2>
            <p>Every chess player has a signature mistake pattern. We analyze your entire game history to map your tactical gaps, from endgame conversion to structural vulnerabilities.</p>
            <ul class="feature-list">
              <li><span>✓</span> Automated mistake classification</li>
              <li><span>✓</span> Spaced-repetition puzzle training</li>
              <li><span>✓</span> Personalized improvement roadmap</li>
            </ul>
          </div>
          <div class="showcase-image glass">
            <img src="/images/landings/weakness_dna.png" alt="Weakness DNA Analytics" />
          </div>
        </div>

        <!-- Showcase 3: Aesthetics -->
        <div class="feature-showcase">
          <div class="showcase-content">
            <div class="badge badge-gold">✨ PREMIUM EXPERIENCE</div>
            <h2>Design Without Compromise</h2>
            <p>Knightfall is more than a tool—it's a sanctuary. We've built a distraction-free, high-fidelity environment where you can lose yourself in the beauty of the game.</p>
            <ul class="feature-list">
              <li><span>✓</span> Sleek obsidian and glass aesthetics</li>
              <li><span>✓</span> Fluid, physics-based animations</li>
              <li><span>✓</span> Zero ads, zero distractions</li>
            </ul>
          </div>
          <div class="showcase-image glass">
            <img src="/images/landings/premium_design.png" alt="Premium Knightfall UI" />
          </div>
        </div>

        <!-- Call to action -->
        <div class="landing-cta glass">
          <h2>Ready to elevate your game?</h2>
          <p class="muted">Join 12,000+ players mastering the art of the 64 squares.</p>
          <div class="cta-btns">
            <button class="btn btn-primary btn-lg" @click="handleGetStarted">Create Account</button>
            <RouterLink to="/play" class="btn btn-ghost btn-lg">Explore as Guest</RouterLink>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useGameStore } from '../stores/gameStore'
import { useCoachStore } from '../stores/coachStore'

const router = useRouter()
const userStore = useUserStore()
const libraryStore = useLibraryStore()
const gameStore = useGameStore()
const coachStore = useCoachStore()

// Mini preview board (simplified static)
const previewBoard = [
  ['♜','♞','♝','♛','♚','♝','','♜'],
  ['♟','♟','♟','','♟','♟','♟','♟'],
  ['','','','','','♞','',''],
  ['','','','♟','','','',''],
  ['','','','','♙','','',''],
  ['','','♘','','','','',''],
  ['♙','♙','♙','♙','','♙','♙','♙'],
  ['♖','','♗','♕','♔','♗','♘','♖'],
]

const features = [
  { id: 'play',     icon: '♟', title: 'Play a Game',       desc: 'Local, vs computer, or multiplayer',    path: '/play',     bg: 'var(--accent-dim)' },
  { id: 'puzzles',  icon: '⚡', title: 'Adaptive Puzzles',  desc: 'Training targeted at your Weakness DNA', path: '/puzzles',  bg: 'var(--rose-dim)' },
  { id: 'gauntlet', icon: '🔥', title: 'Daily Gauntlet',  desc: '5 puzzles, one shot, daily glory',      path: '/gauntlet', bg: 'var(--accent-dim)' },
  { id: 'dna',      icon: '🧬', title: 'DNA Lab',           desc: 'Discover your hidden playstyle patterns', path: '/dna',      bg: 'var(--teal-dim)' },
  { id: 'opening',  icon: '📖', title: 'Opening Lab',       desc: 'Build a bulletproof repertoire',          path: '/opening-lab', bg: 'var(--gold-dim)' },
  { id: 'analysis', icon: '🔬', title: 'Game Analysis',     desc: 'AI coaching — line by line breakdowns',  path: '/analysis', bg: 'var(--teal-dim)' },
  { id: 'profile',  icon: '📈', title: 'Your Profile',      desc: 'Rating history & opening stats',          path: '/profile',  bg: 'var(--gold-dim)' },
]

const weaknesses = computed(() => {
  const report = coachStore.archetypeReport
  const base = [
    { label: report.label,  pct: report.missRate, icon: '🧬', color: 'var(--rose)' }
  ]
  
  // Signal 2: Time/Structure
  const hasTimeIssues = coachStore.dnaPrescriptions.some(rx => rx.id === 'clock-management')
  if (hasTimeIssues) {
    base.push({ label: 'Time Management', pct: 22, icon: '⏱', color: 'var(--teal)' })
  } else {
    base.push({ label: 'Structural Gaps', pct: 14, icon: '🏗️', color: 'var(--teal)' })
  }

  // Signal 3: Tactical/Opening Vulnerability
  const hasTacticalVuln = coachStore.dnaPrescriptions.some(rx => rx.id === 'opening-vuln')
  if (hasTacticalVuln) {
    base.push({ label: 'Tactical Traps', pct: 31, icon: '⚠️', color: 'var(--gold)' })
  } else {
    base.push({ label: 'Positioning', pct: 18, icon: '♟', color: 'var(--gold)' })
  }
  
  return base
})

const miniRx = computed(() => {
  // Pull the top 2 high-priority items
  const combined = [...coachStore.dnaPrescriptions, ...coachStore.openingPrescriptions]
  return combined
    .filter(rx => rx.severity === 'critical' || rx.severity === 'warning')
    .slice(0, 2)
})

const libraryWinRate = computed(() => libraryStore.libraryWinRate)

const recentGames = computed(() => {
  return [...libraryStore.games].reverse().slice(0, 5).map(g => {
    const isWhite = userStore.isMe(g.white)
    
    const won = (g.result === '1-0' && isWhite) || (g.result === '0-1' && !isWhite)
    const draw = g.result === '1/2-1/2'
    
    return {
      id: g.id,
      opponent: isWhite ? g.black : g.white,
      result: won ? 'win' : (draw ? 'draw' : 'loss'),
      control: g.event || 'Blitz',
      opening: g.eco || '---',
      score: g.result
    }
  })
})

function handleGetStarted() {
  document.dispatchEvent(new CustomEvent('open-auth', { detail: 'signup' }))
}

function handleQuickAnalysis() {
  if (libraryStore.games.length > 0) {
    const latest = libraryStore.games[libraryStore.games.length - 1]
    gameStore.loadPgn(latest.pgn, 'analysis', latest.id)
  }
  router.push('/analysis')
}
</script>

<style scoped>
.home-page { padding-top: var(--space-6); }

/* ─── HERO ─── */
.hero {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-10);
  align-items: center;
  margin-bottom: var(--space-10);
  padding-bottom: var(--space-10);
  border-bottom: 1px solid var(--border);
}
@media (max-width: 1100px) { .hero { grid-template-columns: 1fr; } .hero-board { display: none; } }

.hero-eyebrow { margin-bottom: var(--space-4); }
.hero h1 { margin-bottom: var(--space-4); }
.hero-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  max-width: 480px;
  margin-bottom: var(--space-6);
  line-height: 1.7;
}

.hero-actions { display: flex; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-8); }

.hero-stats { display: flex; align-items: center; gap: var(--space-5); }
.hero-stat { text-align: center; }
.hero-stat-value { display: block; font-size: 1.4rem; font-weight: 800; }
.hero-stat-desc { font-size: 0.78rem; color: var(--text-muted); }
.hero-stat-divider { width: 1px; height: 36px; background: var(--border); }

/* Mini board */
.hero-board {
  width: 320px;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  animation: pulse-glow 3s infinite;
}
.hero-board-header, .hero-board-footer {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.player-chip {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.85rem;
  font-weight: 600;
}
.player-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem;
}

.mini-board { border-radius: 6px; overflow: hidden; }
.mini-row { display: flex; }
.mini-sq {
  width: 35px; height: 35px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.mini-light { background: var(--sq-light); }
.mini-dark  { background: var(--sq-dark); }

/* ─── STATS ROW ─── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}
@media (max-width: 900px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .stats-row { grid-template-columns: 1fr; } }

/* ─── HOME GRID ─── */
.home-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--space-6);
  align-items: start;
}
@media (max-width: 1100px) { .home-grid { grid-template-columns: 1fr; } }

.feature-cards { display: flex; flex-direction: column; gap: var(--space-3); }
.feature-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  transition: all var(--duration) var(--ease);
}
.feature-card:hover {
  background: var(--bg-card-hover);
  transform: translateX(3px);
  border-color: rgba(255,255,255,0.12);
}
.feature-icon {
  width: 48px; height: 48px;
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}
.feature-title { font-weight: 700; margin-bottom: 3px; }
.feature-desc { font-size: 0.85rem; }
.feature-arrow { margin-left: auto; color: var(--text-muted); font-size: 1.2rem; }

/* ─── RIGHT COLUMN ─── */
.right-column { display: flex; flex-direction: column; gap: var(--space-4); }

.weakness-card, .recent-games { padding: var(--space-5); }

.card-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: var(--space-3);
}
.weakness-items { display: flex; flex-direction: column; gap: var(--space-3); }
.weakness-item { display: flex; flex-direction: column; gap: 6px; }
.weakness-label {
  display: flex; justify-content: space-between;
  font-size: 0.85rem; font-weight: 500;
}

.game-list { display: flex; flex-direction: column; gap: 2px; margin-top: var(--space-3); }
.game-row {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  transition: background 0.15s ease;
}
.game-row:hover { background: var(--bg-elevated); }
.game-result-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.game-result-dot.win  { background: var(--green); }
.game-result-dot.loss { background: var(--rose); }
.game-result-dot.draw { background: var(--gold); }

.game-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.game-opponent { font-size: 0.88rem; font-weight: 600; }
.game-meta { font-size: 0.75rem; }
.game-score {
  font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700;
}
.game-score.win  { color: var(--green); }
.game-score.loss { color: var(--rose); }
.game-score.draw { color: var(--gold); }

/* ─── MINI CLINIC ─── */
.clinic-mini-card { padding: var(--space-5); background: linear-gradient(rgba(45, 212, 191, 0.05), transparent); }
.mini-prescriptions { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-4); }
.mini-rx-item {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3); border-radius: var(--radius-md);
  background: rgba(255,255,255,0.02); border: 1px solid var(--border);
}
.mini-rx-item.critical { border-left: 3px solid var(--rose); }
.mini-rx-item.warning { border-left: 3px solid var(--gold); }

.rx-info { display: flex; flex-direction: column; gap: 2px; }
.rx-title { font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); }
.rx-action { font-size: 0.75rem; font-weight: 800; color: var(--accent-bright); text-decoration: none; text-transform: uppercase; }
.rx-action:hover { color: white; text-decoration: underline; }

/* ─── LANDING SALES ─── */
.landing-sales {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
  padding: var(--space-10) 0;
}

.section-title-wrap {
  text-align: center;
  max-width: 600px;
  margin: 0 auto var(--space-6);
}
.section-title { font-size: 2.5rem; margin-bottom: var(--space-2); }
.section-subtitle { font-size: 1.1rem; }

.feature-showcase {
  display: flex;
  align-items: center;
  gap: var(--space-10);
}
.feature-showcase.reverse { flex-direction: row-reverse; }

.showcase-content { flex: 1; }
.showcase-content h2 { font-size: 2rem; margin: var(--space-4) 0 var(--space-2); }
.showcase-content p { font-size: 1.05rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: var(--space-4); }

.feature-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.feature-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  font-size: 0.95rem;
}
.feature-list span { color: var(--accent-bright); font-weight: 800; }

.showcase-image {
  flex: 1.2;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 30px 60px rgba(0,0,0,0.4);
  background: var(--bg-surface);
  line-height: 0;
}
.showcase-image img {
  width: 100%;
  height: auto;
  transition: transform 0.6s ease;
}
.feature-showcase:hover .showcase-image img { transform: scale(1.03); }

.landing-cta {
  text-align: center;
  padding: var(--space-12);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  background: linear-gradient(rgba(139, 92, 246, 0.05), rgba(139, 92, 246, 0.02));
  border: 1px dashed var(--border);
}
.landing-cta h2 { font-size: 2.2rem; }
.cta-btns { display: flex; gap: var(--space-4); margin-top: var(--space-2); }

@media (max-width: 900px) {
  .feature-showcase, .feature-showcase.reverse { flex-direction: column; gap: var(--space-8); }
  .section-title { font-size: 2rem; }
  .landing-sales { gap: var(--space-12); }
}
</style>
