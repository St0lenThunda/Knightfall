<script setup lang="ts">
/**
 * Academy Subject Card
 * 
 * A reusable container for a curriculum subject, displaying 
 * its title, description, and list of lessons with completion status.
 */
defineProps<{
  subject: {
    title: string
    icon: string
    description: string
    lessons: Array<{ id: string, name: string }>
  }
  progress: number
  isCompleted: (id: string) => boolean
}>()

defineEmits(['openLesson', 'toggleComplete'])
</script>

<template>
  <div class="subject-card glass">
    <div class="subject-header">
      <div class="subject-icon">{{ subject.icon }}</div>
      <div class="subject-info">
        <h2 class="subject-title">{{ subject.title }}</h2>
        <p class="subject-desc text-muted">{{ subject.description }}</p>
      </div>
      
      <!-- Subject Progress -->
      <div class="subject-progress">
        <div class="progress-text">{{ progress }} / {{ subject.lessons.length }}</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" :style="{ width: (progress / subject.lessons.length * 100) + '%' }"></div>
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
        <div class="lesson-details" @click="$emit('openLesson', lesson.id)">
          <div class="lesson-name">{{ lesson.name }}</div>
          <div class="lesson-status" :class="isCompleted(lesson.id) ? 'text-green' : 'text-muted'">
            {{ isCompleted(lesson.id) ? 'Completed' : 'Not Started' }}
          </div>
        </div>
        
        <button 
          class="btn btn-ghost btn-icon lesson-action" 
          @click="$emit('toggleComplete', lesson.id)"
          :title="isCompleted(lesson.id) ? 'Completed' : 'Mark as Complete'"
        >
          {{ isCompleted(lesson.id) ? '✅' : '▶' }}
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
}

.subject-card:hover { border-color: var(--accent-dim); }

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
  opacity: 0.7;
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
.lesson-status { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; }

.text-green { color: var(--green); }
.text-muted { color: var(--text-muted); }

@media (max-width: 768px) {
  .subject-header { flex-direction: column; text-align: center; }
  .subject-progress { align-items: center; width: 100%; }
  .lessons-grid { grid-template-columns: 1fr; }
}
</style>
