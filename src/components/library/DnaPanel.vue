<script setup lang="ts">
import { useCoachStore } from '../../stores/coachStore'
import { useDnaMetrics } from '../../composables/library/useDnaMetrics'
import { useDnaStats } from '../../composables/library/useDnaStats'

// Sub-components (Organs)
import DnaIntelBar from './DnaIntelBar.vue'
import DnaRadarChart from './DnaRadarChart.vue'
import DnaTraitCard from './DnaTraitCard.vue'
import DnaPrescriptionItem from './DnaPrescriptionItem.vue'

/**
 * DNA Panel (Consolidated Dashboard Version)
 * 
 * This component acts as the high-level orchestrator for behavioral intelligence.
 * It uses the "Pillar Architecture" to delegate logic to dedicated composables
 * and UI fragments to specialized sub-components.
 */

const coachStore = useCoachStore()

// Behavioral Metrics (Aggression, Stability, etc.)
const { dnaTraits } = useDnaMetrics()

// Intelligence Stats & Phase Metrics
const { phaseVulnerability } = useDnaStats()
</script>

<template>
  <div class="dna-panel-v4">
    <!-- TOP-LEVEL METRICS (extracted organ) -->
    <DnaIntelBar />

    <!-- MAIN HERO GRID: ARCHETYPE & RADAR -->
    <div class="dna-hero-grid">
      <!-- Playstyle Narrative Card -->
      <div class="glass card-dna-main">
        <div class="dna-profile-header">
          <div class="dna-avatar-glow">🧬</div>
          <div class="dna-title-block">
            <h2 class="text-gradient">{{ coachStore.playstyleNarrative.title }}</h2>
            <p class="muted">{{ coachStore.playstyleNarrative.desc }}</p>
          </div>
        </div>

        <!-- Bottleneck Insight -->
        <div class="dna-insight-box mt-6">
          <div class="insight-badge">CRITICAL INSIGHT</div>
          <p>
            Your <strong>{{ coachStore.archetypeReport.label }}</strong> is your primary bottleneck. 
            You currently exhibit a <strong>{{ coachStore.archetypeReport.missRate }}%</strong> accuracy gap in this phase.
          </p>
        </div>

        <!-- Trait Progress Grid (Using specialized card component) -->
        <div class="dna-traits-grid mt-8">
          <DnaTraitCard 
            v-for="t in dnaTraits" 
            :key="t.label" 
            :trait="t" 
          />
        </div>
      </div>

      <!-- Performance Fingerprint (Radar extracted organ) -->
      <div class="glass card-radar-main">
        <div class="card-header-dna">
          <h4>Performance Fingerprint</h4>
          <span class="muted-xs">BEHAVIORAL MAPPING</span>
        </div>
        
        <DnaRadarChart />
      </div>
    </div>

    <!-- SECONDARY GRID: PRESCRIPTIONS & VULNERABILITY -->
    <div class="dna-secondary-grid mt-6">
      <!-- The Clinic: DNA Prescriptions -->
      <div class="glass card-dna-prescriptions">
        <div class="card-header-dna">
          <h4>🧬 Behavioral Prescriptions</h4>
        </div>
        <div class="rx-list-dna mt-4">
          <DnaPrescriptionItem 
            v-for="rx in coachStore.dnaPrescriptions" 
            :key="rx.id" 
            :rx="rx" 
          />
        </div>
      </div>

      <!-- Phase Vulnerability Bars -->
      <div class="glass card-dna-phases">
        <div class="card-header-dna">
          <h4>Phase Vulnerability</h4>
        </div>
        <div class="phase-list mt-6">
          <div v-for="p in phaseVulnerability" :key="p.label" class="phase-item">
            <div class="phase-meta">
              <span class="phase-name">{{ p.label }}</span>
              <span class="phase-pct">{{ p.pct }}%</span>
            </div>
            <div class="phase-bar-bg">
              <div 
                class="phase-bar-fill" 
                :style="{ width: p.pct + '%', background: p.color }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Opening Specific DNA -->
        <div class="card-header-dna mt-10">
          <h4>Opening DNA</h4>
        </div>
        <div class="rx-list-dna mt-4">
          <DnaPrescriptionItem 
            v-for="rx in coachStore.openingPrescriptions.slice(0, 2)" 
            :key="rx.id" 
            :rx="rx" 
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dna-panel-v4 {
  padding: var(--space-4);
  animation: fadeIn 0.4s var(--ease);
}

.dna-hero-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: var(--space-6);
}

.dna-secondary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
}

@media (max-width: 1200px) {
  .dna-hero-grid, .dna-secondary-grid { 
    grid-template-columns: 1fr; 
  }
}

/* Base Glass Cards */
.glass {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  transition: all 0.3s var(--ease);
}
.glass:hover { border-color: rgba(139, 92, 246, 0.2); transform: translateY(-2px); }

.card-header-dna {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.card-header-dna h4 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(255,255,255,0.1);
}

/* Playstyle Hero */
.dna-profile-header {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.dna-avatar-glow {
  width: 90px;
  height: 90px;
  background: var(--accent-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.8rem;
  box-shadow: var(--glow-accent);
  flex-shrink: 0;
  position: relative;
}
.dna-avatar-glow::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid var(--accent-bright);
  opacity: 0.3;
  animation: pulse-energy 2s infinite ease-in-out;
}

.dna-title-block h2 {
  margin: 0 0 4px 0;
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.dna-insight-box {
  padding: var(--space-6);
  background: rgba(139, 92, 246, 0.03);
  border-left: 4px solid var(--accent-bright);
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  box-shadow: inset 10px 0 20px -10px rgba(139,92,246,0.1);
}

.insight-badge {
  font-size: 0.7rem;
  font-weight: 900;
  color: var(--accent-bright);
  letter-spacing: 0.1em;
  margin-bottom: 8px;
  text-shadow: var(--glow-accent);
}

/* Trait Indicators Grid */
.dna-traits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-4);
}

/* Behavioral Prescriptions (The Clinic) */
.rx-list-dna { 
  display: flex; 
  flex-direction: column; 
  gap: var(--space-4); 
}

/* Vulnerability Bars */
.phase-list { 
  display: flex; 
  flex-direction: column; 
  gap: var(--space-6); 
}

.phase-meta { 
  display: flex; 
  justify-content: space-between; 
  margin-bottom: 8px; 
}

.phase-name { 
  font-weight: 800; 
  font-size: 1rem; 
  color: var(--text-primary);
}

.phase-pct { 
  font-family: var(--font-mono); 
  font-weight: 800; 
  color: var(--accent-bright);
  text-shadow: var(--glow-accent);
}

.phase-bar-bg { 
  height: 10px; 
  background: rgba(255, 255, 255, 0.03); 
  border-radius: 5px; 
  overflow: hidden; 
  border: 1px solid rgba(255,255,255,0.05);
}

.phase-bar-fill { 
  height: 100%; 
  border-radius: 5px; 
  transition: width 1.5s var(--ease); 
  position: relative;
  overflow: hidden;
}
.phase-bar-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  animation: shine 3s infinite;
}

.muted-xs { 
  font-size: 0.65rem; 
  font-weight: 800; 
  color: var(--text-muted); 
  text-transform: uppercase; 
  letter-spacing: 0.1em;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shine {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}
</style>
