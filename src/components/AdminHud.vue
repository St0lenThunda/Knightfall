<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { useUserStore } from '../stores/userStore'
import { useAdminStore } from '../stores/adminStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useUiStore } from '../stores/uiStore'

// --- COMPONENTS ---
import HudMetrics from './admin/HudMetrics.vue'
import HudActions from './admin/HudActions.vue'

const userStore = useUserStore()
const adminStore = useAdminStore()
const version = __APP_VERSION__
const libraryStore = useLibraryStore()
const uiStore = useUiStore()

const isCollapsed = ref(true)
const startTime = Date.now()
const uptime = ref('00:00:00')

const lastSyncTime = computed(() => {
  if (!adminStore.lastUpdated) return 'NO_SYNC'
  return adminStore.lastUpdated.toLocaleTimeString([], { hour12: false })
})

let timer: any = null
let poll: any = null

const startTelemetry = () => {
  adminStore.fetchCacheCount()
  libraryStore.fetchWardenReport()

  if (timer || poll) return
  timer = setInterval(() => {
    const diff = Math.floor((Date.now() - startTime) / 1000)
    const h = Math.floor(diff / 3600).toString().padStart(2, '0')
    const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0')
    const s = (diff % 60).toString().padStart(2, '0')
    uptime.value = `${h}:${m}:${s}`
  }, 1000)
  poll = setInterval(() => {
    adminStore.fetchCacheCount()
    libraryStore.fetchWardenReport()
  }, 120000)
}

watch(() => userStore.isAdmin, (val) => { if (val) startTelemetry() }, { immediate: true })

watch(isCollapsed, (collapsed) => {
  if (!collapsed && userStore.isAdmin) {
    libraryStore.fetchWardenReport()
  }
})

if (userStore.isAdmin) {
  libraryStore.fetchWardenReport()
}

onUnmounted(() => { clearInterval(timer); clearInterval(poll); })
</script>

<template>
  <Transition name="slide-up">
    <div v-if="userStore.isAdmin" class="admin-hud-wrapper" :class="{ expanded: !isCollapsed }">
      <!-- Toggle Tab -->
      <button class="hud-toggle glass-sm" @click="isCollapsed = !isCollapsed" :title="isCollapsed ? 'Open Diagnostics' : 'Minimize Terminal'">
        <span class="pulse-icon" :class="{ active: !isCollapsed }"></span>
      </button>

      <!-- Main Panel (The Console) -->
      <Transition name="hud-expand">
        <div v-if="!isCollapsed" class="admin-hud glass-heavy">
          <header class="console-header">
            <div class="header-left" @click="uiStore.isTelemetryOpen = true" style="cursor: pointer;" title="Open Full Session Intelligence">
              <span class="title">GHOSTLY TERMINAL</span>
              <span class="version">v{{ version }}.STABLE</span>
            </div>
            <div class="header-right">
              <span class="uptime">UPTIME: {{ uptime }}</span>
              <button class="refresh-btn" @click="() => { adminStore.fetchCacheCount(); libraryStore.fetchWardenReport(); }" :class="{ spinning: adminStore.isFetching }">
                ↻
              </button>
            </div>
          </header>

          <div class="console-content custom-scroll">
            <HudMetrics />
            <div class="action-grid">
              <HudActions />
              <!-- Future User Management Cards would go here -->
            </div>
          </div>

          <footer class="console-footer">
            <div class="status-left">
              <span class="dot"></span> SYSTEM_NOMINAL
            </div>
            <div class="status-right">
              NODE_24.11.0 // {{ lastSyncTime }}
            </div>
          </footer>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.admin-hud-wrapper {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-3);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.admin-hud-wrapper.expanded {
  width: 60vw;
  height: 50vh;
}

.hud-toggle {
  background: rgba(10, 10, 12, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: all;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.hud-toggle:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: var(--accent);
  transform: scale(1.1);
}

.admin-hud {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(10, 10, 12, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 30px 100px rgba(0,0,0,0.8);
  pointer-events: all;
}

.console-header {
  padding: var(--space-4) var(--space-6);
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.header-left { display: flex; align-items: center; gap: 12px; }
.header-left .title { font-weight: 900; font-size: 0.8rem; letter-spacing: 0.3em; color: var(--accent); }
.header-left .version { font-size: 0.6rem; color: var(--text-muted); }

.header-right { display: flex; align-items: center; gap: 16px; font-size: 0.7rem; color: var(--text-muted); }

.console-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: var(--space-6);
}

.action-grid {
  padding: 0 var(--space-6);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
}

.console-footer {
  padding: var(--space-3) var(--space-6);
  background: rgba(0,0,0,0.3);
  display: flex;
  justify-content: space-between;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  flex-shrink: 0;
}

.status-left { display: flex; align-items: center; gap: 8px; }
.status-left .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); }

.pulse-icon {
  width: 8px; height: 8px; background: var(--accent); border-radius: 50%;
  box-shadow: 0 0 12px var(--accent);
}
.pulse-icon.active { animation: pulse 2s infinite; }

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

.refresh-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 1rem; }
.refresh-btn.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.hud-expand-enter-active, .hud-expand-leave-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.hud-expand-enter-from, .hud-expand-leave-to { transform: translateY(40px) scale(0.9); opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(20px); opacity: 0; }
</style>
