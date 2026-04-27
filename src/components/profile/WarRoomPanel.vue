<script setup lang="ts">
import WarRoomHero from './warroom/WarRoomHero.vue'
import WarRoomProgress from './warroom/WarRoomProgress.vue'
import WarRoomActivity from './warroom/WarRoomActivity.vue'
import WarRoomStats from './warroom/WarRoomStats.vue'
import WarRoomDNA from './warroom/WarRoomDNA.vue'
import WarRoomIntegrity from './warroom/WarRoomIntegrity.vue'
import WarRoomIntelligence from './warroom/WarRoomIntelligence.vue'

defineProps<{
  joinedDate: string
}>()

defineEmits(['showBadgeModal', 'showWipeConfirm', 'toggleIntel', 'deduplicateVault', 'switchTab'])
</script>

<template>
  <div class="overview-content">
    <!-- 1. Hero Showcase (Identity & Ratings) -->
    <WarRoomHero :joinedDate="joinedDate" />

    <!-- 2. XP & Level Progression -->
    <WarRoomProgress />

    <div class="dashboard-columns-v4">
      <!-- MAIN COLUMN (2/3) -->
      <div class="dash-col main-col">
        <!-- 3. Recent Activity Feed -->
        <WarRoomActivity @switchTab="$emit('switchTab', $event)" />

        <!-- 4. Performance Metrics (WLD & Rating Chart) -->
        <WarRoomStats />
      </div>

      <!-- SIDEBAR COLUMN (1/3) -->
      <div class="dash-col sidebar-col">
        <!-- 5. Coach Insights & DNA Mapping -->
        <WarRoomDNA 
          @showBadgeModal="$emit('showBadgeModal')" 
          @switchTab="$emit('switchTab', $event)" 
        />
      </div>
    </div>

    <!-- 6. Data Management Tools -->
    <WarRoomIntegrity 
      @deduplicateVault="$emit('deduplicateVault')" 
      @showWipeConfirm="$emit('showWipeConfirm')" 
    />

    <!-- 7. Global Intelligence HUD -->
    <WarRoomIntelligence @toggleIntel="$emit('toggleIntel')" />
  </div>
</template>

<style scoped>
.overview-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding-bottom: var(--space-10);
}

.dashboard-columns-v4 {
  display: flex;
  gap: var(--space-6);
  align-items: flex-start;
}

.dash-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.main-col {
  flex: 2;
  min-width: 0;
}

.sidebar-col {
  flex: 1;
  min-width: 0;
}

@media (max-width: 1200px) {
  .dashboard-columns-v4 {
    flex-direction: column;
  }
  .main-col, .sidebar-col {
    flex: none;
    width: 100%;
  }
}
</style>
