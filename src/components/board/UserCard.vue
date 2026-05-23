<script setup lang="ts">
import { useUserStore } from '../../stores/userStore'
import { useLibraryStore } from '../../stores/libraryStore'
import { useUiStore } from '../../stores/uiStore'

const userStore = useUserStore()
const libraryStore = useLibraryStore()
const uiStore = useUiStore()

const emit = defineEmits(['login', 'signup', 'logout'])
</script>

<template>
  <div class="user-container">
    <!-- EXPANDED STATE -->
    <template v-if="!uiStore.isSidebarCollapsed">
      <div class="sidenav-user" v-if="userStore.session">
        <div class="user-avatar">
          <span>{{ userStore.profile?.username?.charAt(0).toUpperCase() || '?' }}</span>
          <div class="online-dot"></div>
        </div>
        <div class="user-info" @click="$emit('logout')" data-tooltip="Click to sign out">
          <div class="user-name">{{ userStore.profile?.username || 'Player' }}</div>
          <div class="user-rating">
            <span class="badge badge-gold" data-tooltip="Your overall performance rating.">
              ♔ {{ libraryStore.stats?.performanceRating || 1200 }} 
            </span>
            <span class="badge badge-primary" data-tooltip="Your total scholar experience.">
              ✨ {{ userStore.xp || 0 }} XP 
            </span>
            <span class="badge badge-rose" data-tooltip="Your remaining lives. Play lessons or gauntlet to restore.">
              ❤️ {{ userStore.profile?.hearts ?? 5 }} / 5
            </span>
          </div>
        </div>
      </div>
      
      <div class="sidenav-user guest-actions" v-else>
        <div class="guest-buttons">
          <button class="btn btn-primary btn-sm" @click="$emit('login')">Login</button>
          <button class="btn btn-ghost btn-sm" @click="$emit('signup')">Sign Up</button>
        </div>
      </div>
    </template>

    <!-- COLLAPSED STATE -->
    <div class="avatar-collapsed" v-else>
      <div class="user-avatar" v-if="userStore.session" @click="$emit('logout')" style="cursor: pointer;" data-tooltip="Sign out">
        <span>{{ userStore.profile?.username?.charAt(0).toUpperCase() || '?' }}</span>
        <div class="online-dot"></div>
      </div>
      <div class="user-avatar" v-else @click="$emit('login')" style="cursor: pointer;" data-tooltip="Login">
        <span>?</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-container {
  width: 100%;
}

.sidenav-user, .avatar-collapsed {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.avatar-collapsed { 
  justify-content: center; 
}

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
  color: white;
}

.online-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background: var(--green);
  border: 2px solid var(--bg-surface);
  border-radius: 50%;
}

.user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  flex: 1;
}

.user-name {
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text);
}

.user-rating {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.guest-actions {
  padding: 0;
}

.guest-buttons {
  display: flex;
  gap: var(--space-2);
  width: 100%;
}

.guest-buttons button {
  flex: 1;
  font-size: 0.75rem;
  padding: 6px;
}

.badge-rose {
  background: rgba(244, 63, 94, 0.15);
  color: var(--rose);
  border-color: rgba(244, 63, 94, 0.3);
}
</style>
