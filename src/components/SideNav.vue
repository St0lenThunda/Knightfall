<template>
  <nav class="sidenav" :class="{ collapsed }">
    <!-- Logo -->
    <div class="sidenav-logo">
      <div class="logo-icon">♞</div>
      <span class="logo-text" v-show="!collapsed">Knightfall</span>
      <button class="btn btn-icon collapse-btn" @click="collapsed = !collapsed" :title="collapsed ? 'Expand' : 'Collapse'">
        {{ collapsed ? '›' : '‹' }}
      </button>
    </div>

    <!-- User card -->
    <div class="sidenav-user" v-show="!collapsed" v-if="userStore.session">
      <div class="user-avatar">
        <span>{{ userStore.profile?.username?.charAt(0).toUpperCase() || '?' }}</span>
        <div class="online-dot"></div>
      </div>
      <div class="user-info" style="cursor: pointer;" @click="handleLogout" data-tooltip="Click to sign out">
        <div class="user-name">{{ userStore.profile?.username || 'Player' }}</div>
        <div class="user-rating">
          <span class="badge badge-gold">♔ {{ libraryStore.performanceRating }}</span>
        </div>
      </div>
    </div>
    
    <div class="sidenav-user" v-show="!collapsed" v-else>
      <div style="display: flex; gap: var(--space-2); width: 100%;">
        <button class="btn btn-primary btn-sm" style="flex: 1;" @click="handleLogin">Login</button>
        <button class="btn btn-ghost btn-sm" style="flex: 1;" @click="handleSignup">Sign Up</button>
      </div>
    </div>
    <div class="avatar-collapsed" v-show="collapsed">
      <div class="user-avatar" v-if="userStore.session" @click="handleLogout" style="cursor: pointer;" data-tooltip="Sign out">
        <span>{{ userStore.profile?.username?.charAt(0).toUpperCase() || '?' }}</span>
        <div class="online-dot"></div>
      </div>
      <div class="user-avatar" v-else @click="handleLogin" style="cursor: pointer;" data-tooltip="Login">
        <span>?</span>
      </div>
    </div>

    <!-- Navigation sections -->
    <div class="sidenav-sections">
      <div 
        v-for="section in navSections" 
        :key="section.title" 
        class="nav-section"
        :class="{ 'section-collapsed': collapsedSections.has(section.title) }"
      >
        <div 
          class="section-header" 
          v-show="!collapsed && section.showTitle"
          @click="toggleSection(section.title)"
        >
          <span class="section-title">{{ section.title }}</span>
          <span class="section-chevron">{{ collapsedSections.has(section.title) ? '⌃' : '⌄' }}</span>
        </div>
        
        <div class="section-items-wrapper" v-show="!collapsedSections.has(section.title) || collapsed">
          <RouterLink v-for="item in section.items" :key="item.path"
            :to="item.path"
            class="nav-link"
            :class="{ active: route.path === item.path }"
            :data-tooltip="collapsed ? item.label : undefined"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label" v-show="!collapsed">{{ item.label }}</span>
            <span 
              class="nav-badge" 
              v-if="item.badge && !collapsed"
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
    </div>

    <!-- Bottom actions -->
    <div class="sidenav-bottom" v-show="!collapsed">
      <div class="sidenav-footer">
        <span class="muted" style="font-size: 0.75rem;">v0.1.0 prototype</span>
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
    </Teleport>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useCoachStore } from '../stores/coachStore'
import AuthModal from './AuthModal.vue'
import LogoutModal from './LogoutModal.vue'

const userStore = useUserStore()
const libraryStore = useLibraryStore()
const coachStore = useCoachStore()

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

const route = useRoute()
const collapsed = ref(false)

// Accordion State
const collapsedSections = ref(new Set<string>())

function toggleSection(title: string) {
  if (collapsedSections.value.has(title)) {
    collapsedSections.value.delete(title)
  } else {
    collapsedSections.value.add(title)
  }
}

// Auto-expand sections when navigating
const ensureSectionExpanded = () => {
  const activeSection = navSections.value.find(s => 
    s.items.some(i => i.path === route.path)
  )
  if (activeSection) {
    collapsedSections.value.delete(activeSection.title)
  }
}

onMounted(() => {
  ensureSectionExpanded()
})

const navSections = computed(() => {
  const critRx = coachStore.dnaPrescriptions.filter(r => r.severity === 'critical').length +
                 coachStore.openingPrescriptions.filter(r => r.severity === 'critical').length
  
  const warnRx = coachStore.dnaPrescriptions.filter(r => r.severity === 'warning').length +
                 coachStore.openingPrescriptions.filter(r => r.severity === 'warning').length

  return [
    {
      title: 'Arena',
      showTitle: true,
      items: [
        { path: '/',          icon: '⬡',  label: 'Dashboard',  badge: null,   auth: false },
        { path: '/path',      icon: '🛣️',  label: 'Learning Path', badge: 'LEVEL 1', auth: true },
        { path: '/play',      icon: '♟',  label: 'Play Now',   badge: 'LIVE', auth: false },
        { path: '/puzzles',   icon: '⚡',  label: 'Puzzles',    badge: 'NEW',  auth: false },
        { path: '/gauntlet',  icon: '🔥',  label: 'Gauntlet',   badge: null,   auth: true  },
      ].filter(i => !i.auth || !!userStore.session)
    },
    {
      title: 'The Clinic',
      showTitle: true,
      items: [
        { path: '/dna',       icon: '🧬',  label: 'DNA Lab',     badge: critRx > 0 ? 'CRITICAL' : (warnRx > 0 ? 'ACTIVE' : null), auth: true  },
        { path: '/opening-lab', icon: '📖', label: 'Opening Lab',  badge: null,   auth: true  },
        { path: '/analysis',  icon: '🔬', label: 'Game Analysis', badge: null,   auth: true  },
      ].filter(i => !i.auth || !!userStore.session)
    },
    {
      title: 'Identity',
      showTitle: true,
      items: [
        { path: '/profile',   icon: '👤', label: 'My Profile',   badge: libraryStore.performanceRating > 0 ? `♔ ${libraryStore.performanceRating}` : null, auth: true  },
        { path: '/settings',  icon: '⚙️',  label: 'Settings',     badge: null,   auth: false },
      ].filter(i => !i.auth || !!userStore.session)
    }
  ]
})
</script>

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
  gap: var(--space-4);
  padding: var(--space-5);
  z-index: 200;
  transition: width var(--duration) var(--ease);
  overflow: hidden;
}
.sidenav.collapsed { width: 72px; }

.sidenav-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--border);
  position: relative;
  flex-shrink: 0;
}
.sidenav.collapsed .sidenav-logo { justify-content: center; }
.logo-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
  filter: drop-shadow(0 0 8px var(--accent));
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
.collapse-btn {
  margin-left: auto;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.sidenav.collapsed .collapse-btn {
  position: absolute;
  right: -12px;
  top: var(--space-5);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  z-index: 10;
}

.sidenav-user, .avatar-collapsed {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}
.avatar-collapsed { justify-content: center; }
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  position: relative;
  flex-shrink: 0;
}
.online-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 9px;
  height: 9px;
  background: var(--green);
  border-radius: 50%;
  border: 2px solid var(--bg-surface);
}
.user-name { font-weight: 600; font-size: 0.88rem; white-space: nowrap; }

.sidenav-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}
.sidenav-sections::-webkit-scrollbar { width: 4px; }
.sidenav-sections::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.nav-section { display: flex; flex-direction: column; gap: 2px; }
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: var(--space-3);
  cursor: pointer;
  user-select: none;
  margin-bottom: var(--space-1);
}
.section-header:hover .section-title { color: var(--text-primary); }
.section-header:hover .section-chevron { color: var(--accent-bright); }

.section-title {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-left: var(--space-3);
  transition: color 0.2s;
}
.section-chevron {
  font-size: 0.8rem;
  color: var(--text-muted);
  transition: all 0.2s;
  font-weight: 800;
}

.section-items-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all var(--duration) var(--ease);
  white-space: nowrap;
  position: relative;
}
.sidenav.collapsed .nav-link {
  justify-content: center;
  padding: var(--space-3) 0;
}
.nav-link:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}
.nav-link.active {
  background: var(--accent-dim);
  color: var(--accent-bright);
}
.nav-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  background: var(--accent);
  border-radius: 0 4px 4px 0;
}
.sidenav.collapsed .nav-link.active::before { display: none; }

.nav-icon { 
  font-size: 1.2rem; 
  flex-shrink: 0; 
  width: 24px; 
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sidenav.collapsed .nav-icon { margin: 0; }
.nav-label { flex: 1; }
.nav-badge {
  font-size: 0.6rem;
  font-weight: 800;
  padding: 2px 6px;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  letter-spacing: 0.05em;
  border: 1px solid var(--border);
}
.nav-link:hover .nav-badge { border-color: var(--accent-dim); }
.nav-link.active .nav-badge { background: var(--accent); color: white; border-color: transparent; }

/* Intelligence Overrides */
.badge-critical { background: var(--rose) !important; color: white !important; border-color: transparent !important; box-shadow: 0 0 10px var(--rose-dim); }
.badge-active { background: var(--teal) !important; color: white !important; border-color: transparent !important; }
.badge-live { background: var(--green) !important; color: white !important; border-color: transparent !important; }


.sidenav-bottom {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  flex-shrink: 0;
}
.sidenav-footer {
  text-align: center;
  padding-top: var(--space-2);
}

@media (max-width: 900px) {
  .sidenav {
    transform: translateX(-100%);
    width: 240px;
  }
  .sidenav.open {
    transform: translateX(0);
  }
}
</style>
