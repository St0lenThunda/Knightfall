<template>
  <div class="page home-page">
    <!-- Hero section -->
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
            <div class="player-avatar" style="background: linear-gradient(135deg, var(--accent), #7c3aed);">G</div>
            <span>GrandMaster_G</span>
            <span class="badge badge-gold">1487</span>
          </div>
          <span class="badge badge-green" style="margin-left: auto;">● LIVE</span>
        </div>
      </div>
    </section>

    <!-- Stats row -->
    <section class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Your Rating</div>
        <div class="stat-value text-gradient">1487</div>
        <div class="stat-delta up">▲ +23 this week</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Games Played</div>
        <div class="stat-value">47</div>
        <div class="stat-delta up">▲ 8 today</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Win Rate</div>
        <div class="stat-value" style="color: var(--green);">62%</div>
        <div class="stat-delta up">▲ +4% vs last month</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Puzzle Streak</div>
        <div class="stat-value text-gold-gradient">🔥 7</div>
        <div class="stat-delta" style="color: var(--gold);">Best: 12 days</div>
      </div>
    </section>

    <!-- Two column: Feature cards + Activity -->
    <section class="home-grid">
      <!-- Feature spotlight cards -->
      <div class="feature-cards">
        <h3 style="margin-bottom: var(--space-4);">What's waiting for you</h3>
        <div class="feature-card glass" v-for="f in features" :key="f.title"
          @click="router.push(f.path)" style="cursor: pointer;">
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
            Based on your last 47 games, we found patterns in your mistakes:
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
          <RouterLink to="/puzzles" class="btn btn-ghost btn-sm" style="margin-top: var(--space-4); width: 100%; justify-content: center;">
            Train these weaknesses →
          </RouterLink>
        </div>

        <!-- Recent games -->
        <div class="glass recent-games">
          <div class="card-header">
            <h4>Recent Games</h4>
          </div>
          <div class="game-list">
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
    </section>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'

const router = useRouter()

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
  { icon: '♟', title: 'Play a Game',       desc: 'Local, vs computer, or multiplayer',    path: '/play',     bg: 'var(--accent-dim)' },
  { icon: '⚡', title: 'Puzzle Training',   desc: 'Targeted by your weakness DNA',          path: '/puzzles',  bg: 'var(--rose-dim)' },
  { icon: '🔬', title: 'Game Analysis',     desc: 'AI coaching — line by line breakdowns',  path: '/analysis', bg: 'var(--teal-dim)' },
  { icon: '📈', title: 'Your Profile',      desc: 'Rating history & opening stats',          path: '/profile',  bg: 'var(--gold-dim)' },
]

const weaknesses = [
  { label: 'Endgame technique',  pct: 71, icon: '🏁', color: 'var(--rose)' },
  { label: 'Opening theory',     pct: 44, icon: '📖', color: 'var(--gold)' },
  { label: 'Tactical vision',    pct: 38, icon: '⚡', color: 'var(--teal)' },
  { label: 'Time management',    pct: 22, icon: '⏱', color: 'var(--green)' },
]

const recentGames = [
  { id: 1, result: 'win',  opponent: 'ChessWizard99',  control: '5+0',  opening: 'Sicilian',    score: '+12' },
  { id: 2, result: 'loss', opponent: 'TacticalTanya',   control: '10+5', opening: 'French',      score: '-8' },
  { id: 3, result: 'win',  opponent: 'BlitzKing2000',   control: '1+0',  opening: 'London',      score: '+15' },
  { id: 4, result: 'draw', opponent: 'PawnStorm',        control: '10+0', opening: "King's Indian", score: '±0' },
  { id: 5, result: 'win',  opponent: 'EndgameMaster',   control: '5+0',  opening: "Ruy López",   score: '+9' },
]
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
</style>
