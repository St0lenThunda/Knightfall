<script setup lang="ts">
import { onMounted } from 'vue'
import { useCurriculumStore, type SkillNode } from '../stores/curriculumStore'
import { useUserStore } from '../stores/userStore'
import { useRouter } from 'vue-router'

const curriculum = useCurriculumStore()
const userStore = useUserStore()
const router = useRouter()

onMounted(async () => {
  if (userStore.profile?.id) {
    await curriculum.fetchProgress(userStore.profile.id)
  }
})

function handleNodeClick(node: SkillNode) {
  if (node.status === 'locked') return
  router.push(`/lesson/${node.id}`)
}

function getNodeClass(node: SkillNode) {
  return {
    'node-locked': node.status === 'locked',
    'node-unlocked': node.status === 'unlocked',
    'node-completed': node.status === 'completed',
  }
}
</script>

<template>
  <div class="page path-page ghostly-path">
    <!-- Atmospheric B&W Background -->
    <div class="background-ghost"></div>
    <div class="vignette-overlay"></div>
    
    <header class="path-header">
      <div class="header-glass">
        <div class="header-top-row">
          <h1 class="title-lg text-gold">Knight's Path</h1>
          <div class="header-stats-mini">
            <span class="badge badge-primary">✨ {{ userStore.xp }} XP</span>
            <span class="badge badge-gold">🔥 {{ userStore.streak }}d</span>
          </div>
        </div>
        <p class="text-white opacity-80">Master your craft in the echoes of the grand game.</p>
      </div>
    </header>

    <div class="path-container">
      <div 
        v-for="(node, index) in curriculum.nodes" 
        :key="node.id"
        class="node-row"
        :class="`row-align-${index % 4}`"
      >
        <!-- High-Contrast Gold Trail -->
        <div v-if="index < curriculum.nodes.length - 1" class="gold-trail"></div>

        <div 
          class="quest-node"
          :class="getNodeClass(node)"
          @click="handleNodeClick(node)"
        >
          <div class="node-inner-glow">
            <span v-if="node.status === 'completed'" class="status-marker">🏆</span>
            <span v-else-if="node.status === 'locked'" class="status-marker">🔒</span>
            <span v-else class="node-icon-main">{{ node.icon }}</span>
          </div>
          
          <div class="node-meta">
            <span class="node-idx">{{ index + 1 }}</span>
            <span class="node-title-short">{{ node.title.split(': ')[1] || node.title }}</span>
          </div>

          <!-- Bouncing Gold Knight -->
          <div v-if="node.status === 'unlocked' && !curriculum.completedNodeIds.includes(node.id)" class="active-indicator">
            ♘
          </div>
        </div>
      </div>
    </div>
    
    <!-- THE SHADOW ECHOES (Personalized Challenges) -->
    <div v-if="curriculum.personalLessons.length > 0" class="shadow-realm-section animated-fade-in">
      <div class="shadow-header">
        <h2 class="text-gold">Shadow Echoes</h2>
        <p class="muted">Master the mistakes of your past self.</p>
      </div>
      
      <div class="shadow-lessons-grid">
        <div 
          v-for="lesson in curriculum.personalLessons" 
          :key="lesson.id" 
          class="shadow-card glass"
          @click="router.push(`/lesson/${lesson.id}`)"
        >
          <div class="shadow-card-icon">{{ lesson.icon }}</div>
          <div class="shadow-card-info">
            <div class="shadow-title">{{ lesson.title }}</div>
            <div class="shadow-meta">
              <span class="badge badge-rose">{{ lesson.puzzles.length }} Ghost{{ lesson.puzzles.length > 1 ? 's' : '' }}</span>
              <span class="badge badge-gold">+{{ lesson.xp_reward }} XP</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contrast Stats Bar -->
    <div class="progress-bar-fixed">
      <div class="progress-content">
        <div class="stats-box">
          <div class="stat-item">
            <span class="stat-val text-gold">{{ userStore.xp }}</span>
            <span class="stat-lbl">GOLD XP</span>
          </div>
          <div class="stat-item">
            <span class="stat-val">{{ curriculum.completedNodeIds.length }} / 20</span>
            <span class="stat-lbl">PROGRESS</span>
          </div>
        </div>
        <div class="progress-track-outer">
          <div class="progress-track-inner" :style="{ width: (curriculum.completedNodeIds.length / curriculum.nodes.length * 100) + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.path-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding-bottom: 200px;
  position: relative;
  overflow-x: hidden;
  background: #000;
}

/* GHOSTLY BACKGROUND ENGINE */
.background-ghost {
  position: fixed;
  inset: 0;
  background-image: url('/assets/ghostly_knight_bg.webp');
  background-size: cover;
  background-position: center;
  z-index: 1;
  opacity: 0.5; /* Ghostly opacity */
  filter: grayscale(1) contrast(1.2) brightness(0.8);
}

.vignette-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.9) 100%);
  z-index: 2;
  pointer-events: none;
}

/* HEADER */
.path-header {
  position: relative;
  z-index: 10;
  margin-top: 80px;
  margin-bottom: 60px;
}

.header-glass {
  background: rgba(10, 10, 12, 0.85);
  backdrop-filter: blur(12px);
  padding: var(--space-6) var(--space-10);
  border-bottom: 1px solid rgba(251, 191, 36, 0.1);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.header-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-stats-mini {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.text-gold {
  color: #fbbf24;
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.4);
}

/* THE PATH */
.path-container {
  display: flex;
  flex-direction: column;
  gap: 50px;
  width: 100%;
  max-width: 800px;
  position: relative;
  z-index: 10;
}

.node-row {
  position: relative;
  width: 100%;
  display: flex;
}

.row-align-0 { justify-content: center; transform: translateX(-120px); }
.row-align-1 { justify-content: center; transform: translateX(0); }
.row-align-2 { justify-content: center; transform: translateX(120px); }
.row-align-3 { justify-content: center; transform: translateX(0); }

/* QUEST NODES */
.quest-node {
  width: 100px;
  height: 100px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid rgba(251, 191, 36, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  backdrop-filter: blur(5px);
}

.quest-node:hover:not(.node-locked) {
  transform: scale(1.15);
  border-color: #fbbf24;
  box-shadow: 0 0 30px rgba(251, 191, 36, 0.3);
}

.node-inner-glow { font-size: 2.5rem; filter: drop-shadow(0 0 10px rgba(255,255,255,0.2)); }

.node-unlocked {
  border-color: #fbbf24;
  background: rgba(0, 0, 0, 0.8);
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.2);
}

.node-completed {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.node-locked {
  opacity: 0.4;
  border-color: #334155;
}

/* GOLD TRAIL */
.gold-trail {
  position: absolute;
  top: 100px;
  left: 50%;
  width: 2px;
  height: 50px;
  background: linear-gradient(to bottom, #fbbf24, transparent);
  transform: translateX(-50%);
  z-index: -1;
  opacity: 0.6;
}

.node-meta {
  position: absolute;
  top: 110%;
  display: flex;
  flex-direction: column;
  align-items: center;
  white-space: nowrap;
}

.node-idx { font-size: 0.7rem; color: #fbbf24; font-weight: 900; opacity: 0.6; }
.node-title-short { font-size: 0.8rem; font-weight: 800; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }

.active-indicator {
  position: absolute;
  top: -70px;
  font-size: 3.5rem;
  color: #fbbf24;
  animation: bounceGhost 3s infinite ease-in-out;
  filter: drop-shadow(0 0 15px #fbbf24);
}

/* PROGRESS BAR */
.progress-bar-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, #000, transparent);
  padding: 40px 0;
  z-index: 100;
  display: flex;
  justify-content: center;
}

.progress-content {
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(251, 191, 36, 0.2);
  padding: 20px 50px;
  border-radius: 30px;
  width: 500px;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0,0,0,0.8);
}

.stats-box {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-val { font-size: 1.6rem; font-weight: 950; color: #fff; }
.stat-lbl { font-size: 0.65rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }

.progress-track-outer {
  height: 8px;
  background: #1e293b;
  border-radius: 4px;
  overflow: hidden;
}

.progress-track-inner {
  height: 100%;
  background: #fbbf24;
  box-shadow: 0 0 15px rgba(251, 191, 36, 0.6);
}

@keyframes bounceGhost {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.1); }
}

/* SHADOW REALM SECTION */
.shadow-realm-section {
  width: 100%;
  max-width: 800px;
  margin-top: 100px;
  position: relative;
  z-index: 10;
  text-align: center;
}

.shadow-header { margin-bottom: var(--space-8); }
.shadow-header h2 { font-size: 2.5rem; letter-spacing: 0.1em; text-transform: uppercase; }

.shadow-lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-4);
}

.shadow-card {
  padding: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.shadow-card:hover {
  transform: translateY(-5px);
  border-color: var(--gold);
  box-shadow: 0 10px 30px rgba(251, 191, 36, 0.15);
}

.shadow-card-icon {
  font-size: 2rem;
  background: rgba(255,255,255,0.05);
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
}

.shadow-title { font-weight: 800; font-size: 0.95rem; margin-bottom: 4px; }
.shadow-meta { display: flex; gap: var(--space-2); }

.animated-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
