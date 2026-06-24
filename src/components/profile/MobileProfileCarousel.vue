<template>
  <div class="mobile-carousel-container">
    <!-- Horizontal Snap Scroll Wrapper -->
    <div 
      class="carousel-track" 
      ref="trackRef"
      @scroll="onTrackScroll"
    >
      <!-- CARD 1: THE SIGIL -->
      <div class="carousel-card-slide scroll-snap-align-start">
        <div class="card-title-prefix">Card I — The Sigil</div>
        <div class="glass mobile-profile-card hero-card">
          <div class="profile-hero-top">
            <div class="profile-avatar shadow-accent">
              {{ userStore.profile?.username?.charAt(0).toUpperCase() || 'P' }}
            </div>
            <div class="profile-meta-center">
              <h3>{{ userStore.profile?.username || 'Player' }}</h3>
              <span 
                class="title-badge" 
                :style="{ color: userStore.currentRankColor, borderColor: userStore.currentRankColor }"
              >
                {{ userStore.currentRankSymbol }}
              </span>
              <p class="muted subtitle text-xs">Joined {{ joinedDate }}</p>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Weakness DNA Progress Bars -->
          <DNAWeakness @switchTab="$emit('switchTab', $event)" />
        </div>
      </div>

      <!-- CARD 2: THE COMBAT LOG -->
      <div class="carousel-card-slide scroll-snap-align-start">
        <div class="card-title-prefix">Card II — The Combat Log</div>
        <div class="glass mobile-profile-card">
          <!-- Stats Ratio & Sparkline Rating History -->
          <StatsRatio />
          <div style="margin-top: var(--space-4);">
            <StatsHistory />
          </div>
        </div>
      </div>

      <!-- CARD 3: THE RELIQUARY -->
      <div class="carousel-card-slide scroll-snap-align-start">
        <div class="card-title-prefix">Card III — The Reliquary</div>
        <div class="glass mobile-profile-card">
          <!-- Badges showcase -->
          <DNABadges @showBadgeModal="$emit('showBadgeModal')" />
        </div>
      </div>
    </div>

    <!-- Navigation Dot Indicators -->
    <div class="carousel-dots">
      <span 
        v-for="idx in 3" 
        :key="idx" 
        class="dot"
        :class="{ active: activeSlideIndex === idx - 1 }"
        @click="scrollToSlide(idx - 1)"
      ></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '../../stores/userStore'

// Import the subcomponents directly to reuse their existing designs
import DNAWeakness from './warroom/DNAWeakness.vue'
import StatsRatio from './warroom/StatsRatio.vue'
import StatsHistory from './warroom/StatsHistory.vue'
import DNABadges from './warroom/DNABadges.vue'

defineProps<{
  joinedDate: string
}>()

defineEmits(['showBadgeModal', 'switchTab'])

const userStore = useUserStore()
const trackRef = ref<HTMLElement | null>(null)
const activeSlideIndex = ref(0)

/**
 * Handle scrolling events to update dot indicators.
 */
function onTrackScroll() {
  if (!trackRef.value) return
  const track = trackRef.value
  // Calculate index based on scrolled width divided by client width
  const index = Math.round(track.scrollLeft / track.clientWidth)
  activeSlideIndex.value = index
}

/**
 * Smoothly scroll to a specific card index.
 */
function scrollToSlide(index: number) {
  if (!trackRef.value) return
  const track = trackRef.value
  track.scrollTo({
    left: index * track.clientWidth,
    behavior: 'smooth'
  })
  activeSlideIndex.value = index
}

onMounted(() => {
  // Sync logic on mount
  userStore.syncGlobalIntelligence()
})
</script>

<style scoped>
.mobile-carousel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  overflow: hidden;
}

.carousel-track {
  display: flex;
  width: 100%;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none; /* Hide scrollbar Firefox */
  -ms-overflow-style: none; /* Hide scrollbar IE */
  -webkit-overflow-scrolling: touch;
}

.carousel-track::-webkit-scrollbar {
  display: none; /* Hide scrollbar Chrome/Safari */
}

.carousel-card-slide {
  flex: 0 0 100%;
  width: 100%;
  box-sizing: border-box;
  padding: 0 var(--space-4) var(--space-6) var(--space-4);
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-title-prefix {
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: var(--space-3);
  text-align: center;
  text-shadow: var(--shadow-glow);
}

.mobile-profile-card {
  width: 100%;
  max-width: 460px;
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  min-height: 480px;
  display: flex;
  flex-direction: column;
}

.hero-card {
  gap: var(--space-4);
}

.profile-hero-top {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.profile-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 1.6rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-meta-center {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.profile-meta-center h3 {
  margin: 0;
  font-size: 1.1rem;
}

.title-badge {
  font-size: 0.6rem;
  font-weight: 800;
  padding: 1px var(--space-2);
  border: 1px solid;
  border-radius: var(--radius-full);
}

/* Dots navigation indicators */
.carousel-dots {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
  margin-bottom: var(--space-6);
}

.carousel-dots .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s var(--ease);
}

.carousel-dots .dot.active {
  background: var(--accent-bright);
  box-shadow: 0 0 8px var(--accent);
  transform: scale(1.2);
}
</style>
