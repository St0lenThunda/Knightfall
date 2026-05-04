<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useUserStore } from '../../stores/userStore'
import { useCoachStore } from '../../stores/coachStore'

const router = useRouter()
const userStore = useUserStore()
const coachStore = useCoachStore()

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

const hasData = computed(() => userStore.pastGames.length > 0 || userStore.puzzleAttempts.length > 0)

const weaknesses = computed(() => {
  if (!hasData.value) return []
  const report = coachStore.archetypeReport
  return [
    { label: report.label || 'Tactical Accuracy', pct: report.missRate || 0, icon: '🧬', color: 'var(--rose)' },
    { label: 'Strategic Depth', pct: 0, icon: '🧭', color: 'var(--teal)' },
    { label: 'Endgame Precision', pct: 0, icon: '♟', color: 'var(--gold)' }
  ]
})
</script>

<template>
  <div class="scholar-dashboard animated-fade-in">
    <!-- Welcome Header -->
    <header class="scholar-header">
      <div class="welcome-text">
        <h1 class="text-gradient">Welcome back, Scholar {{ userStore.profile?.username }}</h1>
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
          <h3>🏛️ The Academy</h3>
          <RouterLink to="/academy" class="btn btn-ghost btn-sm">Enter Academy →</RouterLink>
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

      <!-- Side Intel: DNA & Records -->
      <aside class="scholar-sidebar">
        <div class="glass pulse-card">
          <h4>🧬 DNA Pulse</h4>
          <div v-if="hasData" class="dna-mini-chart">
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
          <div v-else class="dna-empty">
            <p class="muted" style="font-size: 0.8rem; margin-bottom: var(--space-4);">
              Insufficient data for analysis. Play games or solve puzzles to calibrate your soul map.
            </p>
          </div>
          <RouterLink to="/profile?tab=dna" class="btn btn-ghost btn-xs full-width">Detailed Soul Map</RouterLink>
        </div>

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

<style scoped>
.scholar-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--space-10);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--border);
}

.quick-stats { display: flex; gap: var(--space-6); }
.mini-stat { display: flex; flex-direction: column; align-items: flex-end; }
.mini-stat .label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.1em; }
.mini-stat .val { font-size: 1.5rem; font-weight: 900; color: var(--accent-bright); }

.scholar-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-8);
}

.scholar-path-section { padding: var(--space-6); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); }

.path-visualizer { display: flex; flex-direction: column; gap: var(--space-4); margin-bottom: var(--space-8); }
.path-node {
  display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4);
  background: rgba(255, 255, 255, 0.02); border-radius: var(--radius-lg);
  border: 1px solid var(--border); transition: all 0.3s ease;
}
.path-node.completed { border-color: var(--teal-dim); background: rgba(45, 212, 191, 0.03); }

.node-icon {
  width: 48px; height: 48px; background: var(--bg-elevated); border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
}
.node-details { flex: 1; }
.node-title { font-weight: 700; margin-bottom: 4px; }
.node-progress { display: flex; align-items: center; gap: 12px; font-size: 0.75rem; color: var(--text-muted); }
.progress-bar-bg { flex: 1; height: 4px; background: var(--border); border-radius: 2px; }
.progress-bar-fill { height: 100%; background: var(--accent); border-radius: 2px; }
.path-node.completed .progress-bar-fill { background: var(--teal); }
.node-status { font-size: 0.65rem; font-weight: 800; opacity: 0.6; }

.next-lesson-cta {
  background: linear-gradient(135deg, var(--accent-dim), transparent);
  padding: var(--space-6); border-radius: var(--radius-xl); border: 1px solid var(--accent-dim);
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
.record-icon {
  width: 32px; height: 32px; border-radius: 50%; border: 1px solid;
  display: flex; align-items: center; justify-content: center; background: var(--bg-elevated);
}
.record-name { font-size: 0.85rem; font-weight: 700; }
.record-date { font-size: 0.7rem; }
.full-width { width: 100%; justify-content: center; }

@media (max-width: 900px) {
  .scholar-grid { grid-template-columns: 1fr; }
}
</style>
