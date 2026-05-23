<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useUserStore } from '../../stores/userStore'
import { useCoachStore } from '../../stores/coachStore'
import { useCurriculumStore } from '../../stores/curriculumStore'
import { useLibraryStore } from '../../stores/libraryStore'

const router = useRouter()
const userStore = useUserStore()
const coachStore = useCoachStore()
const curriculumStore = useCurriculumStore()
const libraryStore = useLibraryStore()

// Filter out Shadow Realm from standard curriculum for dashboard display
const activeRealms = computed(() => {
  return curriculumStore.realms.filter(r => r.id !== 'personal-realm')
})

/**
 * Checks the completion progress for a given realm.
 * 
 * @param realm - The realm object
 * @returns number - The count of completed quests in the realm
 */
function getSubjectProgress(realm: any) {
  return curriculumStore.getRealmProgress(realm.id)
}

/**
 * Calculates the percentage of completed quests in a realm.
 * 
 * @param realm - The realm object
 * @returns number - Percentage from 0 to 100
 */
function getSubjectPct(realm: any) {
  const total = curriculumStore.questsByRealm[realm.id]?.length || 1
  return (getSubjectProgress(realm) / total) * 100
}

/**
 * Checks if all quests in a realm are completed.
 * 
 * @param realm - The realm object
 * @returns boolean - True if the realm is fully completed
 */
function isSubjectDone(realm: any) {
  const total = curriculumStore.questsByRealm[realm.id]?.length || 0
  return getSubjectProgress(realm) === total
}

/**
 * Gets a user-friendly status string for a realm based on progress.
 * 
 * @param realm - The realm object
 * @returns string - 'LOCKED' | 'MASTERED' | 'IN PROGRESS'
 */
function getSubjectStatus(realm: any) {
  const total = curriculumStore.questsByRealm[realm.id]?.length || 0
  const prog = getSubjectProgress(realm)
  if (prog === 0) return 'LOCKED'
  if (prog === total) return 'MASTERED'
  return 'IN PROGRESS'
}

// Total number of completed quests
const totalCompleted = computed(() => curriculumStore.completedQuestIds.length)

// Display rank of the scholar (removed manual logic, uses userStore.currentLevelName)

// Dynamically compute the next recommended quest for the player to pursue
const nextLesson = computed(() => {
  const nextQ = curriculumStore.quests.find(q => q.status === 'unlocked' && !curriculumStore.isQuestCompleted(q.id))
  if (!nextQ) return null
  const realm = curriculumStore.realms.find(r => r.id === nextQ.realmId)
  return {
    id: nextQ.id,
    name: nextQ.title.split(': ')[1] || nextQ.title,
    subjectTitle: realm ? realm.name : 'The Sanctum',
    questType: nextQ.questType
  }
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
    <!-- Onboarding Assessment Banner for Legacy Members -->
    <div v-if="userStore.profile && !userStore.profile.archetype" class="legacy-sync-banner glass">
      <div class="banner-accent-border"></div>
      <div class="banner-content">
        <div class="banner-text-group">
          <h3 class="banner-title">
            <span class="pulse-amber">⚠️</span> Profile Calibration Required
          </h3>
          <p class="banner-description">
            To ensure schema parity with our new Chess DNA engine and unlock highly accurate personalized lesson prescriptions, you must calibrate your profile.
          </p>
          <div class="oracle-disclaimer">
            <strong>Oracle Benchmark Notice:</strong> The ratings generated here are platform-specific skill benchmarks used by our AI curriculum engine to deliver customized challenges, and are not affiliated with official FIDE, USCF, or Chess.com/Lichess rating systems.
          </div>
        </div>
        <div class="banner-actions">
          <button class="btn btn-primary" @click="router.push('/assessment')">
            Calibrate Chess DNA (7-Min)
          </button>
        </div>
      </div>
    </div>

    <!-- Welcome Header -->
    <header class="scholar-header">
      <div class="welcome-text">
        <h1 class="text-gradient">Welcome back, Scholar {{ userStore.profile?.username }}</h1>
        <p class="muted">Your curriculum is waiting. You've completed {{ totalCompleted }} quests this week.</p>
      </div>
      <div class="quick-stats">
        <div class="mini-stat">
          <span class="label">RANK</span>
          <span class="val">{{ userStore.currentLevelName }}</span>
        </div>
        <div class="mini-stat">
          <span class="label">PERFORMANCE RATING</span>
          <span class="val">{{ libraryStore.stats?.performanceRating || 1200 }}</span>
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
          <h3>🏛️ The Sanctum</h3>
          <RouterLink to="/sanctum" class="btn btn-ghost btn-sm">Enter Sanctum →</RouterLink>
        </div>
        
        <div class="path-visualizer">
          <div v-for="realm in activeRealms" :key="realm.id" class="path-node" :class="{ 'completed': isSubjectDone(realm) }">
            <div class="node-icon">{{ realm.icon }}</div>
            <div class="node-details">
              <div class="node-title">{{ realm.name }}</div>
              <div class="node-progress">
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" :style="{ width: getSubjectPct(realm) + '%' }"></div>
                </div>
                <span>{{ getSubjectProgress(realm) }}/{{ curriculumStore.questsByRealm[realm.id]?.length || 0 }}</span>
              </div>
            </div>
            <div class="node-status">{{ getSubjectStatus(realm) }}</div>
          </div>
        </div>

        <!-- Next Recommended Quest -->
        <div class="next-lesson-cta" v-if="nextLesson">
          <div class="cta-label">CONTINUE STUDYING</div>
          <div class="cta-content">
            <div class="lesson-icon">📖</div>
            <div class="lesson-text">
              <div class="lesson-name">{{ nextLesson.name }}</div>
              <div class="lesson-subject">{{ nextLesson.subjectTitle }}</div>
            </div>
            <button class="btn btn-primary" @click="nextLesson.questType === 'chronicle' ? router.push('/learn/' + nextLesson.id) : router.push('/lesson/' + nextLesson.id)">Resume Quest</button>
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

/* Legacy Calibration Banner Styles */
.legacy-sync-banner {
  position: relative;
  display: flex;
  margin-bottom: var(--space-8);
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid rgba(245, 158, 11, 0.25);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(20, 20, 28, 0.8) 100%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(245, 158, 11, 0.05);
  animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.banner-accent-border {
  width: 4px;
  background: linear-gradient(180deg, #f59e0b 0%, transparent 100%);
  flex-shrink: 0;
}

.banner-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-6) var(--space-8);
  gap: var(--space-6);
  width: 100%;
}

.banner-text-group {
  flex: 1;
}

.banner-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 1.15rem;
  font-weight: 800;
  color: #f59e0b;
  margin-bottom: var(--space-2);
}

.pulse-amber {
  animation: pulse 2s infinite ease-in-out;
}

.banner-description {
  font-size: 0.9rem;
  line-height: 1.5;
  color: #f3f4f6;
  margin-bottom: var(--space-3);
}

.oracle-disclaimer {
  font-size: 0.78rem;
  color: #9ca3af;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
  padding-left: var(--space-3);
  font-style: italic;
}

.banner-actions {
  flex-shrink: 0;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

@media (max-width: 768px) {
  .banner-content {
    flex-direction: column;
    align-items: stretch;
    padding: var(--space-5);
  }
  .banner-actions {
    margin-top: var(--space-2);
  }
}
</style>
