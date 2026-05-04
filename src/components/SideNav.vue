<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { useUiStore } from '../stores/uiStore'

// --- COMPONENTS ---
import UserCard from './board/UserCard.vue'
import NavSectionComponent from './board/NavSection.vue'
import AuthModal from './AuthModal.vue'
import LogoutModal from './LogoutModal.vue'

// --- COMPOSABLES ---
import { useNavigation } from '../composables/useNavigation'

const props = defineProps<{
  mobileOpen?: boolean
}>()

const emit = defineEmits(['toggle', 'close'])

const userStore = useUserStore()
const uiStore = useUiStore()
const { collapsedSections, toggleSection, isLinkActive, navSections } = useNavigation()

const showAuthModal = ref(false)
const showLogoutModal = ref(false)
const authMode = ref<'login' | 'signup'>('login')

function handleLogin() {
  authMode.value = 'login'
  showAuthModal.value = true
}

function handleSignup() {
  authMode.value = 'signup'
  showAuthModal.value = true
}

async function handleLogout() {
  showLogoutModal.value = true
}

const handleOpenAuth = (e: any) => {
  authMode.value = e.detail || 'login'
  showAuthModal.value = true
}

onMounted(() => {
  document.addEventListener('open-auth', handleOpenAuth)
})

onUnmounted(() => {
  document.removeEventListener('open-auth', handleOpenAuth)
})

const version = __APP_VERSION__
const isDev = import.meta.env.DEV
</script>

<template>
  <nav class="sidenav" :class="{ collapsed: uiStore.isSidebarCollapsed, open: mobileOpen }">
    <!-- Logo -->
    <div class="sidenav-header">
      <RouterLink to="/" class="sidenav-logo" aria-label="Knightfall Home">
        <div class="logo-icon logo-glow" aria-hidden="true">♞</div>
        <span class="logo-text" v-show="!uiStore.isSidebarCollapsed">Knightfall</span>
      </RouterLink>
    </div>

    <!-- Floating Toggle -->
    <button 
      class="collapse-toggle-btn" 
      @click.prevent.stop="uiStore.toggleSidebar()" 
      :aria-label="uiStore.isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      :title="uiStore.isSidebarCollapsed ? 'Expand' : 'Collapse'"
      :class="{ 'is-collapsed': uiStore.isSidebarCollapsed }"
    >
      <span class="toggle-icon">{{ uiStore.isSidebarCollapsed ? '›' : '‹' }}</span>
    </button>

    <!-- User Section -->
    <UserCard 
      @login="handleLogin" 
      @signup="handleSignup" 
      @logout="handleLogout" 
    />
    
    <!-- Navigation sections -->
    <div class="sidenav-sections custom-scroll">
      <NavSectionComponent 
        v-for="section in navSections" 
        :key="section.title"
        :section="section"
        :isCollapsed="collapsedSections.has(section.title)"
        :isLinkActive="isLinkActive"
        @toggle="toggleSection"
        @close="$emit('close')"
      />
    </div>

    <!-- Bottom actions -->
    <div class="sidenav-bottom" v-show="!uiStore.isSidebarCollapsed">
      <div class="sidenav-footer">
        <button 
          class="telemetry-trigger muted" 
          @click="(userStore.isAdmin || isDev) ? uiStore.isTelemetryOpen = true : null"
          :title="(userStore.isAdmin || isDev) ? 'Open Telemetry' : ''"
          :disabled="!(userStore.isAdmin || isDev)"
        >
          v{{ version }} prototype
        </button>
      </div>
    </div>

    <Teleport to="body">
      <AuthModal 
        v-if="showAuthModal" 
        :initialMode="authMode" 
        @close="showAuthModal = false"
      />
      <LogoutModal
        v-if="showLogoutModal"
        @close="showLogoutModal = false"
      />
      <!-- Admin/Dev Heart Refill -->
      <div v-if="userStore.isAdmin" style="position: fixed; bottom: 20px; left: 240px; z-index: 999; pointer-events: auto;">
        <button 
          class="btn btn-xs btn-primary" 
          @click="userStore.addXP(0); userStore.profile!.hearts = 5"
          style="opacity: 0.5; font-size: 10px;"
        >
          ❤️ REFILL
        </button>
      </div>
    </Teleport>
  </nav>
</template>

<style scoped>
.sidenav {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 240px;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6) var(--space-5);
  z-index: 2000; /* Elevated above all overlays including setup-overlay */
  transition: all var(--duration) var(--ease);
}
.sidenav.collapsed { 
  width: 72px; 
  padding: var(--space-6) 0;
  gap: var(--space-4);
}

/* Mobile logic */
@media (max-width: 1024px) {
  .sidenav {
    transform: translateX(-100%);
    box-shadow: 20px 0 50px rgba(0,0,0,0.5);
  }
  .sidenav.open {
    transform: translateX(0);
  }
}

.sidenav-header {
  display: flex;
  align-items: center;
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--border);
  position: relative;
  flex-shrink: 0;
}

.sidenav-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  min-width: 44px; /* Ensure solid hit box */
  min-height: 44px;
  padding: 0 4px;
}
.sidenav.collapsed .sidenav-logo {
  width: 100%;
  justify-content: center;
}
.sidenav.collapsed .sidenav-header { justify-content: flex-start; padding-left: 14px; }

.logo-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--accent-bright), var(--teal));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 12px rgba(167, 139, 250, 0.4));
  font-weight: 900;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-glow {
  text-shadow: 0 0 15px rgba(167, 139, 250, 0.6);
  filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.4));
}
.logo-text {
  font-size: 1.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent-bright), var(--teal));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}
.collapse-toggle-btn {
  position: absolute;
  top: 32px;
  right: -16px;
  width: 32px;
  height: 32px;
  background: var(--accent);
  border: 2px solid var(--bg-surface);
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 300; /* Above everything */
  box-shadow: 0 0 20px rgba(167, 139, 250, 0.4);
  transition: all 0.3s var(--ease);
  font-size: 1.2rem;
  line-height: 1;
}

.collapse-toggle-btn:hover {
  background: var(--accent-bright);
  transform: scale(1.1) translateX(2px);
  box-shadow: 0 0 25px rgba(167, 139, 250, 0.6);
}

.collapse-toggle-btn.is-collapsed {
  right: -16px;
}

.toggle-icon {
  margin-bottom: 2px;
}

.sidenav-sections {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.sidenav-bottom {
  margin-top: auto;
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.sidenav-footer {
  display: flex;
  justify-content: center;
}

.telemetry-trigger {
  background: none;
  border: none;
  font-size: 0.75rem;
  cursor: pointer;
  font-family: var(--font-mono);
  padding: var(--space-1);
  transition: opacity 0.2s;
}

.telemetry-trigger:not(:disabled):hover {
  opacity: 1;
  color: var(--accent-bright);
}

.telemetry-trigger:disabled {
  cursor: default;
}
</style>
