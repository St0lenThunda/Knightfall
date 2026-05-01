<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../../stores/userStore'
import { useLibraryStore } from '../../../stores/libraryStore'
import { useCoachStore } from '../../../stores/coachStore'

defineProps<{
  joinedDate: string
}>()

const router = useRouter()
const userStore = useUserStore()
const libraryStore = useLibraryStore()
const coachStore = useCoachStore()

onMounted(() => {
  userStore.syncGlobalIntelligence()
})
</script>

<template>
  <div class="profile-header">
    <div class="profile-hero glass">
      <div class="profile-avatar">{{ userStore.profile?.username?.charAt(0).toUpperCase() || 'P' }}</div>
      <div class="profile-info">
        <div style="display:flex; align-items:center; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-2);">
          <h2 style="margin: 0;">{{ userStore.profile?.username || 'Player' }}</h2>
          <span class="title-badge" :style="{ color: coachStore.achievements.title.color, borderColor: coachStore.achievements.title.color }">
            {{ coachStore.achievements.title.symbol }}
          </span>
          <button class="btn-edit-inline" @click="router.push('/settings?tab=identity')" title="Laboratory Settings">⚙️ Settings</button>
        </div>
        <p class="muted" style="font-size: 0.9rem; margin-bottom: var(--space-3);">
          Joined {{ joinedDate }}<span v-if="userStore.profile?.location"> · {{ userStore.profile.location }}</span>
        </p>
        
        <div class="identity-connections mt-4">
          <div v-if="userStore.profile?.chesscom_handle" class="connection-pill chess-com" :data-tooltip="`Chess.com: ${userStore.profile.global_stats?.chesscom?.blitz || '?'} Blitz | ${userStore.profile.global_stats?.chesscom?.puzzle || '?'} Puzzles`">
            <span class="icon">♟</span>
            <span class="name">{{ userStore.profile.chesscom_handle }}</span>
            <span class="platform">Chess.com</span>
          </div>
          <div v-if="userStore.profile?.lichess_handle" class="connection-pill lichess" :data-tooltip="`Lichess: ${userStore.profile.global_stats?.lichess?.blitz || '?'} Blitz | ${userStore.profile.global_stats?.lichess?.puzzle || '?'} Puzzles`">
            <span class="icon">♘</span>
            <span class="name">{{ userStore.profile.lichess_handle }}</span>
            <span class="platform">Lichess</span>
          </div>
          <div v-if="!userStore.profile?.chesscom_handle && !userStore.profile?.lichess_handle" class="muted-xs" style="margin-top: var(--space-2);">
            No external DNA sources linked.
          </div>
        </div>
      </div>

      <div class="profile-rating-showcase">
        <div class="rating-big">
          <div class="label">
            Global IQ
            <span class="stat-info-trigger" data-tooltip="Consolidated cross-platform tactical and competitive proficiency.">ⓘ</span>
          </div>
          <div class="rating-num" style="color: var(--accent-bright);">🧠 {{ Math.max(userStore.profile?.global_stats?.lichess?.puzzle || 0, userStore.profile?.global_stats?.chesscom?.puzzle || 0, userStore.profile?.puzzle_rating || 0) || 1200 }}</div>
        </div>
        <div class="rating-big">
          <div class="label">
            Knightfall Elo
            <span class="stat-info-trigger" data-tooltip="A performance rating synthesized from all games in your vault.">ⓘ</span>
          </div>
          <div class="rating-num text-gradient">♔ {{ libraryStore.performanceRating }}</div>
        </div>
        <div class="rating-big">
          <div class="label">
            Rapid Rating
            <span class="stat-info-trigger" data-tooltip="Your live Rapid rating synchronized from external platforms.">ⓘ</span>
          </div>
          <div class="rating-num" style="color: var(--teal);">{{ userStore.profile?.global_stats?.lichess?.rapid || userStore.profile?.global_stats?.chesscom?.rapid || userStore.profile?.rating || 1200 }}</div>
        </div>
        <div class="rating-big">
          <div class="label">
            Total XP
            <span
              class="stat-info-trigger"
              data-tooltip="Total experience points earned through training and matches."
            >ⓘ</span>
          </div>
          <div
            class="rating-num"
            style="color: var(--accent);"
          >✨ {{ userStore.xp }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-header { position: relative; z-index: 100; }
.profile-hero { display: flex; align-items: center; gap: var(--space-6); padding: var(--space-6); margin-bottom: var(--space-6); border-radius: var(--radius-xl); position: relative; }
.profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: var(--accent-gradient); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; box-shadow: 0 0 32px rgba(139,92,246,0.3); z-index: 2; }
.profile-rating-showcase { display: flex; gap: var(--space-8); margin-left: auto; z-index: 2; }
.rating-big { text-align: center; }
.rating-num { font-size: 2rem; font-weight: 800; }
.label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; position: relative; }

/* Tooltip System - Global Persistence */
[data-tooltip] {
  position: relative;
  cursor: help;
}

[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  padding: 8px 12px;
  background: rgba(15, 15, 20, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

[data-tooltip]:hover::after {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

.stat-info-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  background: rgba(255,255,255,0.1);
  border-radius: 50%;
  font-size: 9px;
  margin-left: 4px;
  opacity: 0.8;
}

.title-badge {
  padding: 2px 10px;
  border: 1px solid;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}

.btn-edit-inline {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--text-muted);
  font-size: 0.7rem;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-edit-inline:hover { background: rgba(255,255,255,0.1); color: white; }

.identity-connections { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.connection-pill { display: flex; align-items: center; gap: var(--space-2); padding: 4px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-md); font-size: 0.85rem; }
.connection-pill .platform { opacity: 0.5; font-size: 0.7rem; margin-left: 4px; }

.lichess { border-left: 3px solid #fff; }
.chess-com { border-left: 3px solid #81b64c; }
</style>
