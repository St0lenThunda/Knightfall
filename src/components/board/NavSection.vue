<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useUiStore } from '../../stores/uiStore'
import type { NavSection } from '../../composables/useNavigation'

const props = defineProps<{
  section: NavSection
  isCollapsed: boolean
  isLinkActive: (path: string) => boolean
}>()

const emit = defineEmits(['toggle', 'close'])
const uiStore = useUiStore()
</script>

<template>
  <div 
    class="nav-section"
    :class="{ 'section-collapsed': isCollapsed }"
  >
    <button 
      class="section-header" 
      v-show="!uiStore.isSidebarCollapsed && section.showTitle"
      @click="$emit('toggle', section.title)"
      :aria-expanded="!isCollapsed"
      :aria-controls="'section-' + section.title.toLowerCase().replace(/\s+/g, '-')"
    >
      <div class="section-titles">
        <span class="section-title">{{ section.title }}</span>
      </div>
      <span class="section-chevron" aria-hidden="true">{{ isCollapsed ? '⌃' : '⌄' }}</span>
    </button>
    
    <div :id="'section-' + section.title.toLowerCase().replace(/\s+/g, '-')" class="section-items-wrapper" v-show="!isCollapsed || uiStore.isSidebarCollapsed">
      <RouterLink v-for="item in section.items" :key="item.path"
        :to="item.path"
        class="nav-link"
        :class="{ active: isLinkActive(item.path), 'is-collapsed': uiStore.isSidebarCollapsed }"
        :data-tooltip="uiStore.isSidebarCollapsed ? item.label : undefined"
        @click="$emit('close')"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label" v-show="!uiStore.isSidebarCollapsed">{{ item.label }}</span>
        <span 
          class="nav-badge" 
          v-if="item.badge && !uiStore.isSidebarCollapsed"
          :class="[
            item.badge === 'CRITICAL' ? 'badge-critical' : '',
            item.badge === 'ACTIVE' ? 'badge-active' : '',
            item.badge === 'LIVE' ? 'badge-live' : ''
          ]"
        >
          {{ item.badge }}
        </span>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.nav-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.section-header {
  width: 100%;
  background: none;
  border: none;
  padding: 0 var(--space-2);
  margin-bottom: var(--space-2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
  font-family: inherit;
}

.section-header:hover {
  opacity: 1;
}

.section-title {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #94a3b8; /* Increased contrast for WCAG AA compliance */
}

.section-chevron {
  font-size: 0.7rem;
}

.section-items-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 12px;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 0.82rem;
  transition: all 0.2s;
  position: relative;
  white-space: nowrap;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  transform: translateX(4px);
}

.nav-link.is-collapsed:hover {
  transform: none; /* Don't shift when collapsed */
  background: rgba(255, 255, 255, 0.1);
}

.nav-link.is-collapsed {
  padding: 12px 0;
  justify-content: center;
  gap: 0;
  width: 100%;
}

.nav-link.active {
  background: rgba(167, 139, 250, 0.1);
  color: var(--accent-bright);
}

.nav-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  height: 60%;
  width: 3px;
  background: var(--accent);
  border-radius: 0 4px 4px 0;
}

.nav-icon {
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
}

.nav-badge {
  margin-left: auto;
  font-size: 0.6rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  font-weight: 800;
}

.badge-critical { background: var(--rose-dim); color: var(--rose); border-color: var(--rose); }
.badge-active { background: rgba(16, 185, 129, 0.1); color: var(--green); border-color: var(--green); }
.badge-live { background: rgba(6, 182, 212, 0.1); color: var(--teal); border-color: var(--teal); }
</style>
