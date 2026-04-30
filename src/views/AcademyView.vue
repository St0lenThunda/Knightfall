<template>
  <div class="view-container">
    <div class="header-section">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 class="view-title">The Scholar's Sanctum</h1>
          <p class="view-subtitle text-muted">Master the art of chess from the basic foundations to advanced theory and practice.</p>
        </div>
        
        <div style="display: flex; gap: var(--space-4); align-items: center;">
          <!-- Refresh Drills Button -->
          <button 
            class="btn btn-secondary btn-sm" 
            @click="curriculumStore.generatePersonalPuzzles"
            :disabled="curriculumStore.isGenerating"
          >
            <span v-if="curriculumStore.isGenerating">🎛 Harvesting...</span>
            <span v-else>🔄 Refresh Drills</span>
          </button>

          <!-- Badges Display -->
          <div class="badges-container" v-if="userStore.badges && userStore.badges.length > 0">
            <div v-for="badge in userStore.badges" :key="badge.id" class="academy-badge" :style="{ borderColor: badge.color }" :title="badge.name">
              <span class="badge-icon">{{ badge.icon }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="scroll-container neon-scroll">
      <div class="academy-content">
        
        <!-- THE SHADOW REALM: Personalized Drills -->
        <div v-if="curriculumStore.personalPuzzles.length > 0" class="subject-card glass shadow-realm">
          <div class="subject-header">
            <div class="subject-icon shadow-icon">👤</div>
            <div class="subject-info">
              <h2 class="subject-title">Echoes of Your Past</h2>
              <p class="subject-desc text-muted">Conquer your ghosts. These drills are generated directly from your recent blunders.</p>
            </div>
            
            <div class="subject-progress">
              <div class="progress-text">{{ curriculumStore.personalPuzzles.length }} Drills Ready</div>
            </div>
          </div>
          
          <div class="lessons-grid">
            <div 
              v-for="(puzzle, pIdx) in curriculumStore.personalPuzzles" 
              :key="puzzle.id" 
              class="lesson-item personal-drill" 
              :class="[`severity-${puzzle.severity}`]"
            >
              <div class="lesson-number">#{{ pIdx + 1 }}</div>
              <div class="lesson-details" @click="openPersonalPuzzle(puzzle.id)">
                <div class="lesson-name">{{ puzzle.title }}</div>
                <div class="lesson-status">
                  {{ puzzle.severity ? puzzle.severity.toUpperCase() : 'DRILL' }} • {{ (puzzle.themes && puzzle.themes[2]) || 'Position' }}
                </div>
              </div>
              <div class="drill-tag">{{ puzzle.severity === 'blunder' ? '🔥' : '⚡' }}</div>
            </div>
          </div>
        </div>

        <div v-for="(subject, idx) in curriculum" :key="idx" class="subject-card glass">
          <div class="subject-header">
            <div class="subject-icon">{{ subject.icon }}</div>
            <div class="subject-info">
              <h2 class="subject-title">{{ subject.title }}</h2>
              <p class="subject-desc text-muted">{{ subject.description }}</p>
            </div>
            
            <!-- Subject Progress -->
            <div class="subject-progress">
              <div class="progress-text">{{ getSubjectProgress(subject) }} / {{ subject.lessons.length }}</div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" :style="{ width: (getSubjectProgress(subject) / subject.lessons.length * 100) + '%' }"></div>
              </div>
            </div>
          </div>
          
          <div class="lessons-grid">
            <div 
              v-for="(lesson, lIdx) in subject.lessons" 
              :key="lIdx" 
              class="lesson-item" 
              :class="{ 'is-completed': isCompleted(lesson.id) }"
            >
              <div class="lesson-number">{{ lIdx + 1 }}</div>
              <div class="lesson-details" @click="openLesson(lesson.id)">
                <div class="lesson-name">{{ lesson.name }}</div>
                <div class="lesson-status" :class="isCompleted(lesson.id) ? 'text-green' : 'text-muted'">
                  {{ isCompleted(lesson.id) ? 'Completed' : 'Not Started' }}
                </div>
              </div>
              
              <button 
                class="btn btn-ghost btn-icon lesson-action" 
                @click="toggleComplete(lesson.id)"
                :title="isCompleted(lesson.id) ? 'Completed' : 'Mark as Complete'"
              >
                {{ isCompleted(lesson.id) ? '✅' : '▶' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { useCurriculumStore } from '../stores/curriculumStore'

const router = useRouter()
const userStore = useUserStore()
const curriculumStore = useCurriculumStore()

const curriculum = [
  {
    title: 'The Foundations',
    icon: '🏰',
    description: 'Learn the basic rules, piece movements, and foundational concepts of the game.',
    lessons: [
      { id: 'basics-board', name: 'The Board & Coordinates' },
      { id: 'basics-movement', name: 'Piece Movement & Value' },
      { id: 'basics-special', name: 'Special Rules (Castling, En Passant)' },
      { id: 'basics-checkmate', name: 'Check, Checkmate & Stalemate' },
      { id: 'basics-principles', name: 'Basic Opening Principles' }
    ]
  },
  {
    title: 'Tactical Mastery',
    icon: '⚔️',
    description: 'Master short-term operations to win material or deliver checkmate.',
    lessons: [
      { id: 'tactics-forks', name: 'Forks & Double Attacks' },
      { id: 'tactics-pins', name: 'Pins & Skewers' },
      { id: 'tactics-discovered', name: 'Discovered Attacks' },
      { id: 'tactics-defender', name: 'Removing the Defender' },
      { id: 'tactics-sacrifices', name: 'Sacrifices & The Greek Gift' }
    ]
  },
  {
    title: 'Strategic Command',
    icon: '🧭',
    description: 'Advanced positional theory, maneuvering, and long-term planning.',
    lessons: [
      { id: 'strategy-pawns', name: 'Pawn Structures & Weaknesses' },
      { id: 'strategy-outposts', name: 'Outposts & Blockades' },
      { id: 'strategy-prophylaxis', name: 'Prophylaxis & Restricting Counterplay' },
      { id: 'strategy-space', name: 'Space Advantage & Maneuvering' },
      { id: 'strategy-coordination', name: 'Piece Coordination & Favorable Exchanges' }
    ]
  },
  {
    title: 'The Final Stand',
    icon: '⏳',
    description: 'Essential endgame techniques required to convert advantages into victories.',
    lessons: [
      { id: 'endgame-basic-mates', name: 'Basic Checkmates (Ladder, K+Q, K+R)' },
      { id: 'endgame-pawns', name: 'King & Pawn Endgames (The Opposition)' },
      { id: 'endgame-rooks', name: 'Rook Endgames (Lucena & Philidor)' },
      { id: 'endgame-minor', name: 'Minor Piece Endgames' },
      { id: 'endgame-zugzwang', name: 'Zugzwang & Fortresses' }
    ]
  }
]

onMounted(async () => {
  if (userStore.session?.user.id) {
    await curriculumStore.fetchProgress(userStore.session.user.id)
  }
  // Auto-generate drills if empty
  if (curriculumStore.personalPuzzles.length === 0) {
    await curriculumStore.generatePersonalPuzzles()
  }
})

function isCompleted(id: string) {
  return userStore.completedLessons.includes(id)
}

function getSubjectProgress(subject: any) {
  return subject.lessons.filter((l: any) => isCompleted(l.id)).length
}

function toggleComplete(id: string) {
  if (!isCompleted(id)) {
    userStore.markLessonComplete(id)
  }
}

function openLesson(id: string) {
  router.push(`/lesson/${id}`)
}

function openPersonalPuzzle(id: string) {
  // Logic to load the specific harvested blunder into the puzzle viewer
  router.push(`/puzzles?personal=${id}`)
}
</script>

<style scoped>
.view-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
}

.header-section {
  padding: var(--space-8);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: radial-gradient(circle at top right, rgba(139, 92, 246, 0.05), transparent 50%);
}

.view-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: var(--space-2);
  background: linear-gradient(135deg, var(--accent-bright), var(--teal));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.badges-container {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  background: rgba(0,0,0,0.2);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}

.academy-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  border: 2px solid;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transition: transform 0.2s;
}
.academy-badge:hover { transform: scale(1.1); }

.scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-8);
}

.academy-content {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding-bottom: var(--space-12);
}

.subject-card {
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.subject-card:hover {
  border-color: var(--accent-dim);
}

.subject-header {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.subject-icon {
  font-size: 3rem;
  background: rgba(0,0,0,0.2);
  width: 80px;
  height: 80px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
}

.subject-info { flex: 1; }

.subject-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.subject-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
  min-width: 120px;
}
.progress-text {
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.progress-bar-bg {
  width: 100%;
  height: 6px;
  background: rgba(255,255,255,0.05);
  border-radius: 3px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: var(--accent-gradient);
  transition: width 0.4s ease;
}

.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.lesson-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.lesson-item:not(.is-completed):hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: var(--accent);
  transform: translateY(-2px);
}

.lesson-item.is-completed {
  background: rgba(45, 212, 191, 0.05);
  border-color: rgba(45, 212, 191, 0.2);
}

.lesson-number {
  font-family: var(--font-mono);
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-muted);
  width: 24px;
  text-align: center;
}

.lesson-details {
  flex: 1;
  cursor: pointer;
}

.lesson-name {
  font-weight: 700;
  font-size: 0.95rem;
  margin-bottom: 2px;
}

.lesson-status {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 800;
}

.text-green { color: var(--green); }

@media (max-width: 768px) {
  .header-section {
    padding: var(--space-5);
  }
  
  .header-section > div {
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .scroll-container {
    padding: var(--space-4);
  }
  
  .subject-header {
    flex-direction: column;
    text-align: center;
  }
  
  .subject-progress {
    align-items: center;
    width: 100%;
  }
  
  .lessons-grid {
    grid-template-columns: 1fr;
  }
}
.subject-card.shadow-realm {
  background: linear-gradient(135deg, rgba(88, 28, 135, 0.15), rgba(30, 27, 75, 0.2));
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.1);
  animation: void-pulse 8s infinite ease-in-out;
}

@keyframes void-pulse {
  0%, 100% { border-color: rgba(139, 92, 246, 0.3); box-shadow: 0 0 20px rgba(139, 92, 246, 0.1); }
  50% { border-color: rgba(139, 92, 246, 0.6); box-shadow: 0 0 35px rgba(139, 92, 246, 0.2); }
}

.shadow-icon {
  background: rgba(139, 92, 246, 0.2) !important;
  color: var(--accent-bright);
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
}

.lesson-item.personal-drill {
  position: relative;
  overflow: hidden;
}

.severity-blunder { border-left: 3px solid var(--rose); }
.severity-mistake { border-left: 3px solid var(--gold); }
.severity-inaccuracy { border-left: 3px solid var(--teal); }

.drill-tag {
  font-size: 1.2rem;
  opacity: 0.8;
}

.is-completed {
  opacity: 0.7;
}
</style>
