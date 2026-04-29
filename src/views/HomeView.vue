<template>
  <div class="page home-page">

    <!-- 🏛️ SCHOLAR'S DASHBOARD (Logged In) -->
    <template v-if="userStore.session && userStore.profile">
      <div class="scholar-dashboard animated-fade-in">
        
        <!-- Welcome Header -->
        <header class="scholar-header">
          <div class="welcome-text">
            <h1 class="text-gradient">Welcome back, Scholar {{ userStore.profile.username }}</h1>
            <p class="muted">Your curriculum is waiting. You've completed {{ totalCompleted }} lessons this week.</p>
          </div>
          <div class="quick-stats">
            <div class="mini-stat">
              <span class="label">RANK</span>
              <span class="val">{{ scholarRank }}</span>
            </div>
            <div class="mini-stat">
              <span class="label">ACADEMIC XP</span>
              <span class="val">{{ userStore.xp }}</span>
            </div>
          </div>
        </header>

        <div class="scholar-grid">
          <!-- Primary Path: The Scholar's Journey -->
          <section class="scholar-path-section glass">
            <div class="section-header">
              <h3>📜 Your Scholar's Path</h3>
              <RouterLink to="/academy" class="btn btn-ghost btn-sm">Enter Sanctum →</RouterLink>
            </div>
            
            <div class="path-visualizer">
              <div v-for="(subject, sIdx) in curriculum" :key="sIdx" class="path-node" :class="{ 'completed': isSubjectDone(subject) }">
                <div class="node-icon">{{ subject.icon }}</div>
                <div class="node-details">
                  <div class="node-title">{{ subject.title }}</div>
                  <div class="node-progress">
                    <div class="progress-bar-bg">
                      <div class="progress-bar-fill" :style="{ width: getSubjectPct(subject) + '%' }"></div>
                    </div>
                    <span>{{ getSubjectProgress(subject) }}/{{ subject.lessons.length }}</span>
                  </div>
                </div>
                <div class="node-status">{{ getSubjectStatus(subject) }}</div>
              </div>
            </div>

            <!-- Next Recommended Lesson -->
            <div class="next-lesson-cta" v-if="nextLesson">
              <div class="cta-label">CONTINUE STUDYING</div>
              <div class="cta-content">
                <div class="lesson-icon">📖</div>
                <div class="lesson-text">
                  <div class="lesson-name">{{ nextLesson.name }}</div>
                  <div class="lesson-subject">{{ nextLesson.subjectTitle }}</div>
                </div>
                <button class="btn btn-primary" @click="router.push('/lesson/' + nextLesson.id)">Resume Lesson</button>
              </div>
            </div>
          </section>

          <!-- Side Intel: The Hall of Records & DNA -->
          <aside class="scholar-sidebar">
            <!-- DNA Pulse -->
            <div class="glass pulse-card">
              <h4>🧬 DNA Pulse</h4>
              <div class="dna-mini-chart">
                <div v-for="w in weaknesses" :key="w.label" class="dna-row">
                  <div class="dna-label">
                    <span>{{ w.label }}</span>
                    <span>{{ w.pct }}%</span>
                  </div>
                  <div class="dna-bar">
                    <div class="dna-fill" :style="{ width: w.pct + '%', background: w.color }"></div>
                  </div>
                </div>
              </div>
              <RouterLink to="/profile?tab=dna" class="btn btn-ghost btn-xs full-width">Detailed Soul Map</RouterLink>
            </div>

            <!-- Hall of Records (Recent Achievements) -->
            <div class="glass records-card">
              <h4>🏆 Hall of Records</h4>
              <div class="records-list">
                <div v-for="badge in userStore.badges.slice(0, 3)" :key="badge.id" class="record-item">
                  <span class="record-icon" :style="{ borderColor: badge.color }">{{ badge.icon }}</span>
                  <div class="record-info">
                    <div class="record-name">{{ badge.name }}</div>
                    <div class="record-date muted">Earned Recently</div>
                  </div>
                </div>
                <div v-if="userStore.badges.length === 0" class="empty-records muted">
                  Complete lessons to earn badges.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </template>

    <!-- 🏝️ INTERACTIVE SANDBOX (Guest / Landing) -->
    <template v-else>
      <div class="landing-sandbox animated-fade-in">
        
        <!-- Hero Section -->
        <section class="hero-minimal">
          <h1 class="hero-title">Chess, <span class="text-gradient">Deconstructed.</span></h1>
          <p class="hero-desc">The high-fidelity laboratory for players who seek genuine mastery. No flashy marketing, just pure intelligence.</p>
          <div class="hero-btns">
            <button class="btn btn-primary btn-lg" @click="handleGetStarted">Join the Academy</button>
            <RouterLink to="/play" class="btn btn-ghost btn-lg">Enter as Guest</RouterLink>
          </div>
        </section>

        <!-- The Sandbox: Interactive Components -->
        <section class="sandbox-grid">
          
          <!-- Sandbox 1: The Oracle Preview -->
          <div class="sandbox-item glass oracle-preview">
            <div class="sandbox-header">
              <span class="badge badge-teal">LIVE PREVIEW</span>
              <h3>The Oracle's Insight</h3>
            </div>
            <div class="oracle-mock">
              <div class="mock-board">
                <!-- Simple 4x4 representation of a blunder position -->
                <div class="mini-grid">
                  <div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div>
                  <div class="mini-cell"></div><div class="mini-cell blunder-sq">♞</div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div>
                  <div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell best-sq">★</div><div class="mini-cell"></div><div class="mini-cell"></div>
                  <div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div>
                  <div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div>
                </div>
                <div class="blunder-line"></div>
              </div>
              <div class="mock-chat">
                <div class="coach-tag blunder">CRITICAL BLUNDER</div>
                <p class="typewriter">"By jumping the Knight to f6 here, you've abandoned control of the center. White's Bishop now has a direct path to your King..."</p>
              </div>
            </div>
            <p class="sandbox-footer muted">Our AI Coach doesn't just show the move; it explains the <i>why</i> in plain English.</p>
          </div>

          <!-- Sandbox 2: DNA Lab Preview -->
          <div class="sandbox-item glass dna-preview">
            <div class="sandbox-header">
              <span class="badge badge-rose">REAL ANALYTICS</span>
              <h3>Your Playstyle DNA</h3>
            </div>
            <div class="dna-visual">
              <!-- Radar Chart SVG -->
              <svg viewBox="0 0 200 200" class="radar-chart">
                <!-- Background Polygons (Grid) -->
                <polygon points="100,20 176,75 147,165 53,165 24,75" class="radar-grid" />
                <polygon points="100,60 138,87 123,132 77,132 62,87" class="radar-grid" />
                
                <!-- Axes -->
                <line x1="100" y1="100" x2="100" y2="20" class="radar-axis" />
                <line x1="100" y1="100" x2="176" y2="75" class="radar-axis" />
                <line x1="100" y1="100" x2="147" y2="165" class="radar-axis" />
                <line x1="100" y1="100" x2="53" y2="165" class="radar-axis" />
                <line x1="100" y1="100" x2="24" y2="75" class="radar-axis" />
                
                <!-- Data Area (The DNA) -->
                <polygon points="100,40 160,80 130,140 70,150 40,85" class="radar-data" />
                
                <!-- Points -->
                <circle cx="100" cy="40" r="3" class="radar-point" />
                <circle cx="160" cy="80" r="3" class="radar-point" />
                <circle cx="130" cy="140" r="3" class="radar-point" />
                <circle cx="70" cy="150" r="3" class="radar-point" />
                <circle cx="40" cy="85" r="3" class="radar-point" />
              </svg>

              <!-- Labels -->
              <div class="radar-label t">TACTICS</div>
              <div class="radar-label s">STRATEGY</div>
              <div class="radar-label e">ENDGAME</div>
              <div class="radar-label o">OPENING</div>
              <div class="radar-label a">AGGRESSION</div>
            </div>
            <p class="sandbox-footer muted">We scan your entire library to find the specific patterns holding you back.</p>
          </div>

        </section>

        <!-- Final CTA -->
        <section class="final-cta">
          <h2>Ready to become a Scholar?</h2>
          <button class="btn btn-primary" @click="handleGetStarted">Initialize My Journey</button>
        </section>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useCoachStore } from '../stores/coachStore'

const router = useRouter()
const userStore = useUserStore()
const libraryStore = useLibraryStore()
const coachStore = useCoachStore()

/**
 * 🎓 SCHOLAR'S DASHBOARD LOGIC
 */
const curriculum = [
  {
    title: 'Foundations',
    icon: '🏰',
    lessons: [
      { id: 'basics-board', name: 'The Board & Coordinates' },
      { id: 'basics-movement', name: 'Piece Movement' },
      { id: 'basics-principles', name: 'Opening Principles' }
    ]
  },
  {
    title: 'Tactical Mastery',
    icon: '⚔️',
    lessons: [
      { id: 'tactics-forks', name: 'Forks & Double Attacks' },
      { id: 'tactics-pins', name: 'Pins & Skewers' }
    ]
  },
  {
    title: 'Strategic Command',
    icon: '🧭',
    lessons: [
      { id: 'strategy-pawns', name: 'Pawn Structures' },
      { id: 'strategy-outposts', name: 'Outposts' }
    ]
  }
]

function isCompleted(id: string) {
  return userStore.completedLessons.includes(id)
}

function getSubjectProgress(subject: any) {
  return subject.lessons.filter((l: any) => isCompleted(l.id)).length
}

function getSubjectPct(subject: any) {
  return (getSubjectProgress(subject) / subject.lessons.length) * 100
}

function isSubjectDone(subject: any) {
  return getSubjectProgress(subject) === subject.lessons.length
}

function getSubjectStatus(subject: any) {
  const prog = getSubjectProgress(subject)
  if (prog === 0) return 'LOCKED'
  if (prog === subject.lessons.length) return 'MASTERED'
  return 'IN PROGRESS'
}

const totalCompleted = computed(() => userStore.completedLessons.length)

const scholarRank = computed(() => {
  const count = totalCompleted.value
  if (count > 15) return 'Arch-Scholar'
  if (count > 10) return 'Grand Sage'
  if (count > 5) return 'Adept'
  return 'Novice'
})

const nextLesson = computed(() => {
  for (const subject of curriculum) {
    for (const lesson of subject.lessons) {
      if (!isCompleted(lesson.id)) {
        return { ...lesson, subjectTitle: subject.title }
      }
    }
  }
  return null
})

/**
 * 🧬 DNA PULSE LOGIC
 */
const weaknesses = computed(() => {
  const report = coachStore.archetypeReport
  return [
    { label: report.label || 'Tactical Accuracy', pct: report.missRate || 15, icon: '🧬', color: 'var(--rose)' },
    { label: 'Time Control', pct: 22, icon: '⏱', color: 'var(--teal)' },
    { label: 'Positioning', pct: 18, icon: '♟', color: 'var(--gold)' }
  ]
})

function handleGetStarted() {
  document.dispatchEvent(new CustomEvent('open-auth', { detail: 'signup' }))
}
</script>

<style scoped>
.home-page {
  padding: var(--space-8);
  max-width: 1200px;
  margin: 0 auto;
}

/* --- SCHOLAR DASHBOARD --- */
.scholar-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--space-10);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--border);
}

.quick-stats {
  display: flex;
  gap: var(--space-6);
}

.mini-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.mini-stat .label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.1em; }
.mini-stat .val { font-size: 1.5rem; font-weight: 900; color: var(--accent-bright); }

.scholar-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-8);
}

.scholar-path-section {
  padding: var(--space-6);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}

.path-visualizer {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.path-node {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  transition: all 0.3s ease;
}

.path-node.completed { border-color: var(--teal-dim); background: rgba(45, 212, 191, 0.03); }

.node-icon {
  width: 48px;
  height: 48px;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.node-details { flex: 1; }
.node-title { font-weight: 700; margin-bottom: 4px; }

.node-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.progress-bar-bg { flex: 1; height: 4px; background: var(--border); border-radius: 2px; }
.progress-bar-fill { height: 100%; background: var(--accent); border-radius: 2px; }
.path-node.completed .progress-bar-fill { background: var(--teal); }

.node-status { font-size: 0.65rem; font-weight: 800; opacity: 0.6; }

.next-lesson-cta {
  background: linear-gradient(135deg, var(--accent-dim), transparent);
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  border: 1px solid var(--accent-dim);
}

.cta-label { font-size: 0.65rem; font-weight: 900; letter-spacing: 0.15em; margin-bottom: var(--space-4); color: var(--accent-bright); }
.cta-content { display: flex; align-items: center; gap: var(--space-6); }
.lesson-icon { font-size: 2rem; }
.lesson-text { flex: 1; }
.lesson-name { font-weight: 800; font-size: 1.1rem; }
.lesson-subject { font-size: 0.85rem; color: var(--text-muted); }

.scholar-sidebar { display: flex; flex-direction: column; gap: var(--space-6); }
.pulse-card, .records-card { padding: var(--space-5); }
.pulse-card h4, .records-card h4 { margin-bottom: var(--space-4); font-size: 0.9rem; }

.dna-mini-chart { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); }
.dna-label { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600; margin-bottom: 4px; }
.dna-bar { height: 3px; background: var(--border); border-radius: 1px; }
.dna-fill { height: 100%; border-radius: 1px; }

.records-list { display: flex; flex-direction: column; gap: var(--space-3); }
.record-item { display: flex; align-items: center; gap: var(--space-3); }
.record-icon { width: 32px; height: 32px; border-radius: 50%; border: 1px solid; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated); }
.record-name { font-size: 0.85rem; font-weight: 700; }
.record-date { font-size: 0.7rem; }

/* --- LANDING SANDBOX --- */
.hero-minimal { text-align: center; padding: var(--space-20) 0; }
.hero-title { font-size: 4rem; font-weight: 900; margin-bottom: var(--space-4); }
.hero-desc { font-size: 1.25rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto var(--space-10); line-height: 1.6; }
.hero-btns { display: flex; justify-content: center; gap: var(--space-4); }

.sandbox-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  margin-bottom: var(--space-20);
}

.sandbox-item { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-6); }
.sandbox-header { display: flex; flex-direction: column; gap: 4px; }

.oracle-mock { display: flex; gap: var(--space-6); align-items: center; }
.mini-grid {
  display: grid;
  grid-template-columns: repeat(5, 24px);
  grid-template-rows: repeat(5, 24px);
  border: 1px solid var(--border);
}
.mini-cell { border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 14px; }
.blunder-sq { background: rgba(244, 63, 94, 0.2); color: var(--rose); }
.best-sq { background: rgba(16, 185, 129, 0.1); color: var(--teal); font-size: 10px; box-shadow: inset 0 0 8px var(--teal-dim); }

.coach-tag { font-size: 0.6rem; font-weight: 900; padding: 2px 6px; border-radius: 4px; margin-bottom: 8px; width: fit-content; }
.coach-tag.blunder { background: var(--rose); color: white; }
.typewriter { font-size: 0.85rem; line-height: 1.5; font-style: italic; color: var(--text-muted); }

.dna-visual { 
  height: 220px; 
  position: relative; 
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, rgba(139, 92, 246, 0.08), transparent); 
  border-radius: var(--radius-md); 
  overflow: hidden;
}

.radar-chart {
  width: 180px;
  height: 180px;
  filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.2));
}

.radar-grid {
  fill: rgba(255, 255, 255, 0.02);
  stroke: rgba(255, 255, 255, 0.05);
  stroke-width: 1;
}

.radar-axis {
  stroke: rgba(255, 255, 255, 0.05);
  stroke-width: 1;
}

.radar-data {
  fill: rgba(139, 92, 246, 0.25);
  stroke: var(--accent);
  stroke-width: 2;
  filter: drop-shadow(0 0 5px var(--accent));
  animation: pulse-dna 4s infinite ease-in-out;
}

.radar-point {
  fill: var(--accent-bright);
}

.radar-label {
  position: absolute;
  font-size: 0.6rem;
  font-weight: 900;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.radar-label.t { top: 10px; left: 50%; transform: translateX(-50%); color: var(--accent-bright); }
.radar-label.s { top: 65px; right: 10px; }
.radar-label.e { bottom: 30px; right: 25px; }
.radar-label.o { bottom: 30px; left: 25px; }
.radar-label.a { top: 65px; left: 10px; }

@keyframes pulse-dna {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
}

.final-cta { text-align: center; padding: var(--space-12) 0; }
.final-cta h2 { margin-bottom: var(--space-6); font-size: 2rem; }

@media (max-width: 900px) {
  .scholar-grid, .sandbox-grid { grid-template-columns: 1fr; }
  .hero-title { font-size: 2.5rem; }
}

.full-width { width: 100%; justify-content: center; }
</style>
