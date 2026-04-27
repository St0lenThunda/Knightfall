<script setup lang="ts">
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
          <div v-if="userStore.profile?.chesscom_handle" class="connection-pill chess-com">
            <span class="icon">♟</span>
            <span class="name">{{ userStore.profile.chesscom_handle }}</span>
            <span class="platform">Chess.com</span>
          </div>
          <div v-if="userStore.profile?.lichess_handle" class="connection-pill lichess">
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
        <div class="rating-big" title="Total experience points earned through training and matches.">
          <div class="label">Total XP</div>
          <div class="rating-num" style="color: var(--accent);">✨ {{ userStore.xp }}</div>
        </div>
        <div class="rating-big" title="A performance rating synthesized from all games in your vault using Knightfall intelligence algorithms.">
          <div class="label">Knightfall Elo</div>
          <div class="rating-num text-gradient">♔ {{ libraryStore.performanceRating }}</div>
        </div>
        <div class="rating-big" title="Your current live Rapid rating synchronized from external platforms.">
          <div class="label">Rapid Rating</div>
          <div class="rating-num" style="color: var(--teal);">{{ userStore.profile?.rating || 1200 }}</div>
        </div>
        <div class="rating-big" title="Your estimated puzzle-solving proficiency based on processed tactical scenarios.">
          <div class="label">Puzzle Rating</div>
          <div class="rating-num" style="color: var(--gold);">{{ userStore.profile?.puzzle_rating ?? 1200 }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-hero { display: flex; align-items: center; gap: var(--space-6); padding: var(--space-6); margin-bottom: var(--space-6); border-radius: var(--radius-xl); }
.profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: var(--accent-gradient); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; box-shadow: 0 0 32px rgba(139,92,246,0.3); }
.profile-rating-showcase { display: flex; gap: var(--space-8); margin-left: auto; }
.rating-big { text-align: center; }
.rating-num { font-size: 2rem; font-weight: 800; }
.label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; }

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
</style>
