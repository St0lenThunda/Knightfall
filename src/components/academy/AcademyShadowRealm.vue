<script setup lang="ts">
/**
 * Academy Shadow Realm
 * 
 * Displays personalized drills harvested from the user's losses.
 * This is the primary "High Cohesion" training loop.
 */
defineProps<{
  puzzles: any[]
  isProcessing: boolean
}>()

defineEmits(['openPuzzle', 'scan'])
</script>

<template>
  <div class="shadow-realm-container">
    <!-- Priority Path Indicator -->
    <div v-if="puzzles.length > 0" class="subject-card glass shadow-realm priority-path">
      <div class="priority-tag">ACTIVE PATH</div>
      <div class="subject-header">
        <div class="subject-icon shadow-icon">⚔️</div>
        <div class="subject-info">
          <h2 class="subject-title">The Shadow Realm</h2>
          <p class="subject-desc text-muted">Your active training priority. These drills target the specific patterns that caused your recent losses.</p>
        </div>
      </div>
    </div>

    <!-- Personalized Drills Card -->
    <div class="subject-card glass shadow-realm" :class="{ 'empty-state': puzzles.length === 0 }">
      <div class="subject-header">
        <div class="subject-icon shadow-icon">👤</div>
        <div class="subject-info">
          <h2 class="subject-title">Tactical Sanctuaries</h2>
          <p class="subject-desc text-muted">
            <template v-if="puzzles.length > 0">
              Conquer your ghosts. These drills are generated directly from your recent blunders.
            </template>
            <template v-else>
              Your personalized tactical sanctuary is currently empty. Analyze your games to harvest new drills.
            </template>
          </p>
        </div>
        
        <div class="subject-progress" v-if="puzzles.length > 0">
          <div class="progress-text">{{ puzzles.length }} Drills Ready</div>
        </div>
      </div>
      
      <div v-if="puzzles.length > 0" class="lessons-grid">
        <div 
          v-for="(puzzle, pIdx) in puzzles" 
          :key="puzzle.id" 
          class="lesson-item personal-drill" 
          :class="[`severity-${puzzle.severity}`]"
        >
          <div class="lesson-number">#{{ pIdx + 1 }}</div>
          <div class="lesson-details" @click="$emit('openPuzzle', puzzle.id)">
            <div class="lesson-name">{{ puzzle.title }}</div>
            <div class="lesson-status">
              {{ puzzle.severity ? puzzle.severity.toUpperCase() : 'DRILL' }} • {{ (puzzle.themes && puzzle.themes[2]) || 'Position' }}
            </div>
          </div>
          <div class="drill-tag">{{ puzzle.severity === 'blunder' ? '🔥' : '⚡' }}</div>
        </div>
      </div>

      <div v-else class="empty-realm-cta">
        <p class="text-muted small">No ghosts detected. Run a <strong>Cloud Intel Pass</strong> to populate this realm.</p>
        <button 
          class="btn btn-outline btn-sm" 
          @click="$emit('scan')"
          :disabled="isProcessing"
        >
          Scan for Mistakes
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.subject-card {
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  transition: transform 0.2s ease, border-color 0.2s ease;
  margin-bottom: var(--space-8);
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

.shadow-realm {
  background: linear-gradient(135deg, rgba(88, 28, 135, 0.15), rgba(30, 27, 75, 0.2));
  border-color: var(--accent-dim);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.1);
  animation: void-pulse 8s infinite ease-in-out;
  position: relative;
}

.priority-path { border: 1px solid var(--accent) !important; }

.priority-tag {
  position: absolute;
  top: -10px;
  right: 20px;
  background: var(--accent);
  color: white;
  font-size: 0.6rem;
  font-weight: 900;
  padding: 2px 10px;
  border-radius: 10px;
  letter-spacing: 0.1em;
}

.shadow-icon {
  background: rgba(139, 92, 246, 0.2) !important;
  color: var(--accent-bright);
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
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

.lesson-item:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: var(--accent);
  transform: translateY(-2px);
}

.lesson-number {
  font-family: var(--font-mono);
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-muted);
  width: 24px;
  text-align: center;
}

.lesson-details { flex: 1; cursor: pointer; }
.lesson-name { font-weight: 700; font-size: 0.95rem; margin-bottom: 2px; }
.lesson-status { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; color: var(--text-muted); }

.severity-blunder { border-left: 3px solid var(--rose); }
.severity-mistake { border-left: 3px solid var(--gold); }
.severity-inaccuracy { border-left: 3px solid var(--teal); }

.drill-tag { font-size: 1.2rem; opacity: 0.8; }

.empty-realm-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
  text-align: center;
  gap: var(--space-4);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.02);
}

@keyframes void-pulse {
  0%, 100% { border-color: rgba(139, 92, 246, 0.3); box-shadow: 0 0 20px rgba(139, 92, 246, 0.1); }
  50% { border-color: rgba(139, 92, 246, 0.6); box-shadow: 0 0 35px rgba(139, 92, 246, 0.2); }
}

@media (max-width: 768px) {
  .subject-header { flex-direction: column; text-align: center; }
  .subject-progress { align-items: center; width: 100%; }
  .lessons-grid { grid-template-columns: 1fr; }
}
</style>
