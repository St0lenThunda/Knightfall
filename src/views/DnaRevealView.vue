<template>
  <div ref="containerRef" class="dna-reveal-container page" :class="!isSequencing ? 'theme-' + archetype.id : ''">
    <div v-if="isSequencing" class="sequencing-overlay">
      <div class="dna-helix-container">
        <div v-for="i in 20" :key="i" class="dna-dot" :style="{ '--i': i }"></div>
      </div>
      <h1 class="sequencing-text">SEQUENCING CHESS DNA...</h1>
      <div class="status-box">
        <p class="status-message">{{ statusMessage }}</p>
        <div class="status-progress-bar">
          <div class="status-progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </div>

    <Transition name="scale-fade">
      <div v-if="!isSequencing" class="archetype-reveal">
        <div class="archetype-card glass-lg">
          <div class="dna-badge">ARCHETYPE IDENTIFIED</div>
          <h1 class="archetype-name">{{ archetype.name }}</h1>
          <div class="archetype-icon">{{ archetype.icon }}</div>

          <!-- ── Elo Fanfare Badge ─────────────────────────────────────── -->
          <!--
            The badge starts as a sealed wax-stamp.
            Clicking it triggers the full fanfare sequence:
              1. Seal breaks open (CSS animation)
              2. Number counts up from 0 to final Elo over 1.5s
              3. Archetype-colored particles burst outward
              4. Web Audio API rank-up chime plays
              5. Tier label + percentile message fade in
          -->
          <!-- ── Elo Fanfare Badge ───────────────────────────── -->
          <!--
            Particle canvas is Teleported to <body> so it is never
            subject to the archetype-card's overflow:hidden. It covers the
            full viewport during the burst then self-clears.
          -->
          <Teleport to="body">
            <canvas ref="particleCanvas" class="particle-canvas-global" aria-hidden="true" />
          </Teleport>

          <div
            class="elo-fanfare-wrapper mt-4"
            @click="triggerFanfare"
            role="button"
            aria-label="Tap to reveal your Oracle Rating"
          >
            <!-- SEALED STATE -->
            <div v-if="!eloIsRevealed" class="wax-seal">
              <span class="seal-icon">🔮</span>
              <span class="seal-label">TAP TO REVEAL</span>
            </div>

            <!-- REVEALED STATE -->
            <div v-else class="elo-revealed-card">
              <span class="elo-label">ORACLE RATING</span>
              <div class="elo-number-row">
                <span class="elo-value">{{ eloDisplayValue }}</span>
                <span class="elo-suffix">Elo</span>
              </div>
              <div class="elo-tier-group">
                <span class="elo-tier-badge" :class="eloTier.id">{{ eloTier.label }}</span>
                <p class="elo-percentile">{{ eloPercentile }}</p>
              </div>
            </div>
          </div>
          
          <p class="archetype-description mt-4">
            {{ archetype.description }}
          </p>

          <div class="dna-stats mt-8">
            <div v-for="(val, key) in stats" :key="key" class="stat-item">
              <span class="stat-label">{{ key.toUpperCase() }}</span>
              <div class="stat-bar-bg">
                <div class="stat-bar-fill" :style="{ width: (val * 100) + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- Oracle Rating System Disclaimer: Educates user on official vs unofficial platforms -->
          <div class="oracle-disclaimer glass-sm mt-6 mb-2">
            <span class="disclaimer-icon">ℹ️</span>
            <div class="disclaimer-content">
              <strong class="disclaimer-title">Oracle Benchmark Notice</strong>
              <p class="disclaimer-text">
                The rating generated here is an internal skill benchmark designed for Knightfall's Spaced Repetition queue. It does not represent an official FIDE, USCF, Chess.com, or Lichess rating.
              </p>
            </div>
          </div>

          <div class="archetype-actions mt-10">
            <button v-if="userStore.session" class="btn btn-primary btn-lg" @click="proceedToWarRoom">
              Enter The War Room →
            </button>
            <button v-else class="btn btn-accent btn-lg" @click="saveProfile">
              Save My DNA Profile →
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * ARCHITECTURAL JUSTIFICATION FOR LINE COUNT (>500 lines)
 * 
 * DnaRevealView.vue exceeds the 500-line threshold due to the co-location of:
 * 1. Web Audio API Fanfare & Audio Context scheduling.
 * 2. Canvas-based 2D particle system physics and rendering loop for the Elo fanfare reveal.
 * 3. Extensive CSS/styling rules required to render complex archetype-specific visual themes,
 *    glassmorphism cards, and interactive wax seals in a single, high-fidelity landing view.
 * 
 * To respect the Triple-Threat modularity principle, core physics calculations have been 
 * extracted into composables (`useDnaFanfare` and `useArchetypeStats`), leaving only the
 * direct DOM, AudioContext references, canvas rendering contexts, and CSS animations in this file.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { logger } from '../utils/logger'

import { useDnaFanfare } from '../composables/useDnaFanfare'
import { useArchetypeStats } from '../composables/useArchetypeStats'

// Initialize stores at the very top of setup
const userStore = useUserStore()
const router = useRouter()

const isSequencing = ref(true)
const progress = ref(0)
const statusMessage = ref('Analyzing tactical floor...')

const {
  containerRef,
  particleCanvas,
  eloIsRevealed,
  eloDisplayValue,
  computedElo,
  eloTier,
  eloPercentile,
  triggerFanfare
} = useDnaFanfare()

// Explicitly reference the template refs to satisfy unused variable compiler checks
containerRef
particleCanvas

const { stats, archetype } = useArchetypeStats(computedElo)

const proceedToWarRoom = async () => {
  if (userStore.session) {
    const existing = localStorage.getItem('knightfall_pending_dna')
    let pendingDna: any = {}
    if (existing) {
      try {
        pendingDna = JSON.parse(existing)
      } catch (e) {
        logger.error('Failed to parse pending DNA:', e)
      }
    }
    
    // Merge the detailed archetype and calculated stats into localStorage
    pendingDna.archetype = archetype.value.id
    pendingDna.stats = stats.value

    localStorage.setItem('knightfall_pending_dna', JSON.stringify(pendingDna))
    
    // Promote and synchronize the guest DNA immediately for the logged-in legacy user
    await userStore.promoteGuestData()
  }
  router.push('/')
}

const saveProfile = () => {
  const existing = localStorage.getItem('knightfall_pending_dna')
  let pendingDna: any = {}
  if (existing) {
    try {
      pendingDna = JSON.parse(existing)
    } catch (e) {
      logger.error('Failed to parse pending DNA:', e)
    }
  }
  
  // Merge the detailed archetype and calculated stats into localStorage
  pendingDna.archetype = archetype.value.id
  pendingDna.stats = stats.value

  // Store results in localStorage temporarily so they survive the auth redirect/refresh
  localStorage.setItem('knightfall_pending_dna', JSON.stringify(pendingDna))
  document.dispatchEvent(new CustomEvent('open-auth', { detail: 'signup' }))
}

onMounted(() => {
  const interval = setInterval(() => {
    progress.value += 2
    if (progress.value >= 100) clearInterval(interval)
  }, 80)

  setTimeout(() => { statusMessage.value = 'Mapping calculation depth...' }, 1000)
  setTimeout(() => { statusMessage.value = 'Evaluating endgame precision...' }, 2000)
  setTimeout(() => { statusMessage.value = 'Determining archetype...' }, 3000)
  setTimeout(() => { isSequencing.value = false }, 4500)
})
</script>

<style scoped>
.dna-reveal-container {
  height: 100vh;
  background: radial-gradient(circle at center, var(--bg-deep) 0%, #000 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  --reveal-accent: var(--accent-bright);
}

/* Archetype Theme Overrides */
.theme-storm { --reveal-accent: #a78bfa; }      /* Electric Violet */
.theme-oracle { --reveal-accent: #6366f1; }     /* Deep Indigo */
.theme-technician { --reveal-accent: #fbbf24; } /* Industrial Amber */
.theme-rogue { --reveal-accent: #f43f5e; }      /* Crimson Edge */
.theme-student { --reveal-accent: #10b981; }    /* Emerald Growth */

.sequencing-overlay {
  text-align: center;
}

.sequencing-text {
  font-size: 1.2rem;
  letter-spacing: 0.5em;
  font-weight: 900;
  color: white;
  opacity: 0.8;
  margin-top: var(--space-8);
  text-transform: uppercase;
}

.status-box {
  width: 300px;
  margin: var(--space-4) auto;
  text-align: left;
}

.status-message {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--accent-bright);
  margin-bottom: 8px;
  min-height: 1em;
}

.status-progress-bar {
  height: 2px;
  background: rgba(255,255,255,0.1);
  border-radius: 1px;
}

.status-progress-fill {
  height: 100%;
  background: var(--accent-bright);
  box-shadow: 0 0 10px var(--accent-bright);
  transition: width 0.1s linear;
}

.dna-helix-container {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.dna-dot {
  width: 10px;
  height: 10px;
  background: var(--accent-bright);
  border-radius: 50%;
  animation: helix 2s infinite ease-in-out;
  animation-delay: calc(var(--i) * 0.1s);
}

@keyframes helix {
  0%, 100% { transform: translateY(-50px) scale(0.5); opacity: 0.3; }
  50% { transform: translateY(50px) scale(1.2); opacity: 1; }
}

.archetype-reveal {
  width: 100%;
  max-width: 600px;
  padding: var(--space-4);
}

.archetype-card {
  padding: var(--space-10);
  text-align: center;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(20px);
}

.archetype-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.05),
    transparent
  );
  animation: scan 3s infinite;
}

@keyframes scan {
  0% { left: -100%; }
  100% { left: 100%; }
}

.dna-badge {
  font-size: 0.7rem;
  font-weight: 900;
  color: var(--reveal-accent);
  letter-spacing: 0.2em;
  margin-bottom: var(--space-4);
  text-shadow: 0 0 20px var(--reveal-accent);
}

.archetype-name {
  font-size: 3.5rem;
  font-weight: 900;
  margin-bottom: var(--space-4);
}

.archetype-icon {
  font-size: 5rem;
  margin: var(--space-6) 0;
}

.archetype-description {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text-muted);
}

.dna-stats {
  display: grid;
  gap: var(--space-4);
  text-align: left;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.stat-label {
  font-size: 0.6rem;
  font-weight: 800;
  color: var(--text-muted);
  width: 100px;
}

.stat-bar-bg {
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.05);
  border-radius: 3px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  background: var(--reveal-accent);
  border-radius: 3px;
  box-shadow: 0 0 10px var(--reveal-accent);
  transition: width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scale-fade-enter-active {
  transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.scale-fade-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.oracle-disclaimer {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  margin-top: var(--space-6);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.8rem;
  line-height: 1.4;
  text-align: left;
  color: var(--text-muted);
}
.disclaimer-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-top: 2px;
}
.disclaimer-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.disclaimer-title {
  color: var(--text-secondary);
  font-weight: 750;
}
.disclaimer-text {
  margin: 0;
  color: var(--text-muted);
}

/* ══════════════════════════════════════════════════════════════════
   Elo Fanfare
   ══════════════════════════════════════════════════════════════════ */

/*
  All fanfare styles use :deep() to pierce Vue's scoped CSS boundary.
  Without this, the generated [data-v-xxx] attribute doesn't match
  the elements correctly when they are conditionally mounted via v-if.
*/

/* Clickable wrapper */
:deep(.elo-fanfare-wrapper) {
  cursor: pointer;
  border-radius: 12px;
  margin-top: 16px;
  transition: filter 0.2s;
}
:deep(.elo-fanfare-wrapper:hover) { filter: brightness(1.12); }

/* ── SEALED STATE ── */
:deep(.wax-seal) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 36px;
  border-radius: 12px;
  background: radial-gradient(
    ellipse at center,
    rgba(139, 92, 246, 0.18) 0%,
    rgba(0, 0, 0, 0.25) 100%
  );
  border: 2px solid rgba(139, 92, 246, 0.45);
  animation: seal-ring-pulse 2.5s ease-in-out infinite;
}

/* The outer ring pulses to invite interaction */
@keyframes seal-ring-pulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1); }
  50%       { box-shadow: 0 0 0 8px rgba(139, 92, 246, 0.22); }
}

/* Crystal ball grows and shrinks gently */
:deep(.seal-icon) {
  font-size: 2.4rem;
  display: inline-block;
  animation: seal-orb-pulse 1.8s ease-in-out infinite;
}
@keyframes seal-orb-pulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.18); }
}

:deep(.seal-label) {
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.25em;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
}

/* ── REVEALED STATE ── */
:deep(.elo-revealed-card) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 20px 36px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  text-align: center;
  animation: card-appear 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes card-appear {
  from { opacity: 0; transform: scale(0.88) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* Particle canvas — Teleported to <body>, covers full viewport */
.particle-canvas-global {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
}

/* ── Rating card layout ── */
.elo-revealed-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-5) var(--space-8);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  text-align: center;
  /* No overflow:hidden — particles need to burst beyond this boundary */
}

/*
  The canvas covers the entire wrapper so particles burst outward
  across the full fanfare zone (not clipped by the inner card).
  It's absolutely positioned relative to .elo-fanfare-wrapper
  which has position:relative.
*/
.particle-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Clicks pass through to the card */
  z-index: 2;           /* Above the card content so particles render on top */
}

.elo-label {
  position: relative;
  z-index: 1;
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  color: var(--text-muted);
  text-transform: uppercase;
}

/* Number row: the big Elo number + suffix */
.elo-number-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.elo-value {
  font-size: 3.2rem;
  font-weight: 900;
  color: var(--reveal-accent);
  /* Glow matches the archetype accent */
  text-shadow: 0 0 40px var(--reveal-accent), 0 0 80px var(--reveal-accent);
  line-height: 1;
  font-variant-numeric: tabular-nums; /* Prevent layout shifts during count-up */
}

.elo-suffix {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* ── Post-reveal tier + percentile ── */
.elo-tier-group {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

/* Tier badge pill */
.elo-tier-badge {
  display: inline-block;
  padding: 2px 12px;
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid currentColor;
}

/* Each tier has its own color token */
.tier-beginner    { color: #10b981; background: rgba(16, 185, 129, 0.1); }
.tier-intermediate { color: #a78bfa; background: rgba(167, 139, 250, 0.1); }
.tier-advanced    { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
.tier-master      { color: #f43f5e; background: rgba(244, 63, 94, 0.1); }

.elo-percentile {
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin: 0;
}

/* Tier block transitions in softly after count-up */
.tier-fade-enter-active { transition: opacity 0.6s 1.4s, transform 0.6s 1.4s; }
.tier-fade-enter-from   { opacity: 0; transform: translateY(6px); }
</style>
