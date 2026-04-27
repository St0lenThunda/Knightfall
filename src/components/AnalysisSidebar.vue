<script setup lang="ts">
/**
 * ANALYSIS SIDEBAR
 * 
 * Orchestrates the analytical panes: Insights, Opening Explorer, and Game Review.
 * Handles tab switching and the positional health footer.
 */
import { ref } from 'vue'

interface HealthMetrics {
  material: number
  activity: number
  safety: number
}

interface HealthDiagnosis {
  material: string
  activity: string
  safety: string
}

const props = defineProps<{
  metrics: HealthMetrics
  diagnosis: HealthDiagnosis
  isCollapsed: boolean
}>()

const emit = defineEmits(['update:isCollapsed', 'showLegend'])

const activeTab = ref('insights')
const tabs = [
  { id: 'insights', label: 'Insights', icon: '🧠' },
  { id: 'review', label: 'Review', icon: '📊' }
]
</script>

<template>
  <aside class="analysis-sidebar" :class="{ collapsed: isCollapsed }">
    <!-- Collapse Toggle -->
    <button class="collapse-btn" @click="emit('update:isCollapsed', !isCollapsed)">
      {{ isCollapsed ? '≫' : '≪' }}
    </button>

    <div class="sidebar-inner" v-if="!isCollapsed">
      <!-- Tabs Navigation -->
      <nav class="sidebar-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="icon">{{ tab.icon }}</span>
          <span class="label">{{ tab.label }}</span>
        </button>
      </nav>

      <!-- Tab Content -->
      <div class="tab-content">
        <slot :activeTab="activeTab"></slot>
      </div>

      <!-- Positional Health Footer -->
      <footer class="sidebar-footer glass-sm">
        <div class="footer-header" @click="emit('showLegend')">
          <span class="title">POSITIONAL HEALTH</span>
          <span class="info-icon">ⓘ</span>
        </div>
        
        <div class="health-bars">
          <!-- Material -->
          <div class="health-item" :title="diagnosis.material">
            <div class="label">MAT</div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: metrics.material + '%', background: 'var(--accent-bright)' }"></div>
            </div>
          </div>
          <!-- Activity -->
          <div class="health-item" :title="diagnosis.activity">
            <div class="label">ACT</div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: metrics.activity + '%', background: 'var(--teal)' }"></div>
            </div>
          </div>
          <!-- Safety -->
          <div class="health-item" :title="diagnosis.safety">
            <div class="label">KGS</div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: metrics.safety + '%', background: 'var(--rose)' }"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </aside>
</template>

<style scoped>
.analysis-sidebar {
  width: 400px;
  height: 100%;
  background: linear-gradient(180deg, var(--bg-surface) 0%, rgba(10, 10, 12, 0.95) 100%);
  border-left: 1px solid var(--border);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(20px);
  box-shadow: -10px 0 30px rgba(0,0,0,0.3);
}

.analysis-sidebar.collapsed {
  width: 0;
  border-left: none;
  box-shadow: none;
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.collapse-btn {
  position: absolute;
  left: -28px;
  top: var(--space-4);
  width: 28px;
  height: 40px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-right: none;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  color: var(--text-muted);
  cursor: pointer;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  box-shadow: -4px 0 12px rgba(0,0,0,0.2);
}

.collapse-btn:hover {
  color: var(--accent-bright);
  background: var(--bg-card);
}

.sidebar-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: rgba(0,0,0,0.2);
  border-bottom: 1px solid var(--border);
}

.tab-btn {
  padding: var(--space-4) 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover { color: white; background: rgba(255,255,255,0.03); }
.tab-btn.active { 
  color: var(--accent-bright); 
  background: rgba(255,255,255,0.05);
  border-bottom-color: var(--accent-bright);
}

.tab-btn .icon { font-size: 1.2rem; }
.tab-btn .label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }

.tab-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.sidebar-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--border);
  background: rgba(0,0,0,0.3);
}

.footer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
  cursor: pointer;
  opacity: 0.8;
}
.footer-header:hover { opacity: 1; }
.footer-header .title { font-size: 0.65rem; font-weight: 900; letter-spacing: 0.1em; color: var(--text-muted); }
.footer-header .info-icon { font-size: 0.8rem; }

.health-bars {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.health-item {
  display: grid;
  grid-template-columns: 35px 1fr;
  align-items: center;
  gap: var(--space-3);
}

.health-item .label {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 900;
  color: var(--text-muted);
}

.bar-track {
  height: 6px;
  background: rgba(0,0,0,0.4);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}
</style>
