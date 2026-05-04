<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="landing-sandbox cathedral-theme animated-fade-in">
    <!-- God Rays Atmospheric Background -->
    <div class="god-rays" aria-hidden="true">
      <div class="ray"></div>
      <div class="ray"></div>
      <div class="ray"></div>
    </div>

    <!-- Hero Section -->
    <section class="hero-cathedral">
      <div class="arch-frame">
        <h1 class="hero-title">The <span class="text-gradient">Cathedral</span> of Combat</h1>
        <p class="hero-desc">The high-fidelity archive where every tactic is analyzed with surgical precision. Master the positional rites through spectral intelligence.</p>
        <div class="hero-btns">
          <button class="btn btn-primary btn-lg btn-glow" @click="router.push('/assessment')">Begin Your Assessment</button>
          <RouterLink to="/play" class="btn btn-ghost btn-lg">Enter as Guest</RouterLink>
        </div>
      </div>
    </section>

    <!-- Stained Glass Previews -->
    <section class="cathedral-grid" aria-labelledby="cathedral-title">
      <h2 id="cathedral-title" class="sr-only">The Strategic Instruments of Analysis</h2>
      
      <!-- Panel 1: The Oracle's Review -->
      <div class="cathedral-panel oracle-panel split-panel">
        <div class="panel-visual">
          <div class="gothic-window-frame">
            <div class="mini-board-stained">
              <div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div>
              <div class="cell"></div><div class="cell blunder-glass">♞</div><div class="cell"></div><div class="cell"></div><div class="cell"></div>
              <div class="cell"></div><div class="cell"></div><div class="cell grace-glass">★</div><div class="cell"></div><div class="cell"></div>
              <div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div>
              <div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div>
            </div>
          </div>
        </div>
        <div class="panel-content">
          <div class="panel-header">
            <span class="panel-ritual-tag">STRATEGIC DIVINATION</span>
            <h3>Divining the Blade</h3>
          </div>
          <div class="panel-copy">
            <p>The Oracle translates raw engine logic into a strategic narrative, bridging the gap between "The Best Move" and "The Best Understanding." It reconstructs the battle to reveal where your positional guard was dropped and how to forge a more resilient defense.</p>
          </div>
          <div class="spectral-whisper">
            <p>"The Knight blunder at f6 compromises the central defensive structure. The Bishop now possesses a decisive diagonal toward the King's flank."</p>
          </div>
        </div>
      </div>

      <!-- Panel 2: The Stained Glass DNA -->
      <div class="cathedral-panel dna-panel split-panel">
        <div class="panel-visual">
          <div class="stained-glass-container">
            <div class="stained-glass-dna">
              <svg viewBox="0 0 200 200" class="glass-radar" role="img" aria-labelledby="dna-title">
                <title id="dna-title">Stained Glass Playstyle DNA</title>
                <path d="M100,10 L180,70 L150,170 L50,170 L20,70 Z" class="glass-frame" />
                <path d="M100,40 L160,80 L130,140 L70,150 L40,85 Z" class="glass-data" />
                <line x1="100" y1="100" x2="100" y2="10" class="glass-lead" />
                <line x1="100" y1="100" x2="180" y2="70" class="glass-lead" />
                <line x1="100" y1="100" x2="150" y2="170" class="glass-lead" />
                <line x1="100" y1="100" x2="50" y2="170" class="glass-lead" />
                <line x1="100" y1="100" x2="20" y2="70" class="glass-lead" />
              </svg>
              <div class="glass-label t">TACTICS</div>
              <div class="glass-label s">STRATEGY</div>
              <div class="glass-label e">ENDGAME</div>
              <div class="glass-label o">OPENING</div>
              <div class="glass-label a">AGGRESSION</div>
            </div>
          </div>
        </div>
        <div class="panel-content">
          <div class="panel-header">
            <span class="panel-ritual-tag">THE SOUL'S ARCHITECTURE</span>
            <h3>The Warrior's Signature</h3>
          </div>
          <div class="panel-copy">
            <p>Stop fixing moves; start fixing your mind. By mapping your history across five core domains, we draft your DNA to expose the systemic weaknesses and behavioral patterns that hold your progress hostage and that the enemy will exploit.</p>
          </div>
          <p class="panel-footer">Your journey is analyzed across thousands of data points to find the patterns of mastery.</p>
        </div>
      </div>
    </section>

    <!-- Final Covenant -->
    <section class="final-covenant">
      <div class="covenant-seal">
        <h2>Enter the Command Center</h2>
        <p class="muted">The most advanced chess engine ever forged in the Shadow Realm.</p>
        <button class="btn btn-primary btn-glow" @click="router.push('/assessment')">Ascend to Mastery</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.cathedral-theme {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: #e2e8f0;
}

/* God Rays */
.god-rays {
  position: fixed;
  top: -20%;
  left: 0;
  width: 100%;
  height: 150%;
  pointer-events: none;
  z-index: 0;
}
.ray {
  position: absolute;
  top: 0;
  width: 400px;
  height: 100%;
  background: linear-gradient(to bottom, rgba(167, 139, 250, 0.15) 0%, transparent 70%);
  transform: rotate(-15deg);
  filter: blur(100px);
}
.ray:nth-child(1) { left: -5%; animation: drift 15s infinite ease-in-out; }
.ray:nth-child(2) { left: 40%; animation: drift 20s infinite ease-in-out reverse; }
.ray:nth-child(3) { left: 85%; animation: drift 12s infinite ease-in-out; }

@keyframes drift {
  0%, 100% { transform: rotate(-15deg) translateX(0); opacity: 0.3; }
  50% { transform: rotate(-10deg) translateX(80px); opacity: 0.7; }
}

/* Hero */
.hero-cathedral {
  text-align: center;
  padding: var(--space-20) 0;
  position: relative;
  z-index: 1;
}
.hero-title {
  font-size: 5rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  margin-bottom: var(--space-4);
  text-shadow: 0 0 40px rgba(139, 92, 246, 0.4);
}
.hero-desc {
  font-size: 1.4rem;
  color: var(--text-secondary);
  max-width: 700px;
  margin: 0 auto var(--space-12);
  line-height: 1.6;
}

.btn-glow {
  box-shadow: 0 0 25px rgba(139, 92, 246, 0.4);
  transition: all 0.3s;
}
.btn-glow:hover {
  box-shadow: 0 0 50px rgba(139, 92, 246, 0.7);
  transform: scale(1.05);
}

/* Grid & Panels */
.cathedral-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  padding: 0 var(--space-8);
  margin-bottom: var(--space-20);
  position: relative;
  z-index: 1;
}

.cathedral-panel {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 40px 40px 10px 10px;
  padding: var(--space-12);
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  align-items: center;
  gap: var(--space-16);
  transition: all 0.3s ease;
}

/* Z-Pattern: Flip even panels */
.cathedral-panel:nth-child(even) {
  grid-template-columns: 1fr 1.2fr;
}
.cathedral-panel:nth-child(even) .panel-visual {
  order: 2;
}
.cathedral-panel:nth-child(even) .panel-content {
  order: 1;
}

.cathedral-panel:hover {
  border-color: var(--accent);
  background: rgba(15, 23, 42, 0.9);
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.panel-copy p {
  font-size: 1.25rem;
  line-height: 1.8;
  color: var(--text-secondary);
  font-weight: 400;
}

.panel-ritual-tag {
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.4em;
  color: var(--accent-bright);
}

.panel-footer {
  font-size: 0.9rem;
  color: var(--text-dim);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: var(--space-6);
  font-style: italic;
}

@media (max-width: 1100px) {
  .cathedral-panel, .cathedral-panel:nth-child(even) {
    grid-template-columns: 1fr;
    gap: var(--space-10);
    padding: var(--space-8);
  }
  .cathedral-panel:nth-child(even) .panel-visual {
    order: 1;
  }
  .cathedral-panel:nth-child(even) .panel-content {
    order: 2;
  }
  .hero-title { font-size: 3.5rem; }
}

/* Oracle Visual */
.gothic-window-frame {
  width: 100%;
  max-width: 400px;
  height: 300px;
  background: #050505;
  border: 4px solid #1e293b;
  border-radius: 50% 50% 0 0 / 40% 40% 0 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 50px rgba(139, 92, 246, 0.1);
  margin: 0 auto;
}

.mini-board-stained {
  display: grid;
  grid-template-columns: repeat(5, 45px);
  gap: 1px;
  background: rgba(255,255,255,0.1);
  padding: 1px;
}
.cell { 
  width: 45px; height: 45px; 
  background: #0a0a0a;
  border: 1px solid rgba(255,255,255,0.08); 
  display: flex; align-items: center; justify-content: center; 
}
.blunder-glass { background: rgba(244, 63, 94, 0.4); color: #fff; text-shadow: 0 0 10px var(--rose); }
.grace-glass { background: rgba(16, 185, 129, 0.3); color: var(--teal-bright); text-shadow: 0 0 10px var(--teal); }

.spectral-whisper {
  margin-top: var(--space-4);
  padding: var(--space-6);
  background: rgba(139, 92, 246, 0.05);
  border-left: 2px solid var(--accent);
  border-radius: 0 12px 12px 0;
  position: relative;
  overflow: hidden;
}

.spectral-whisper::before {
  content: '';
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.1), transparent);
  transform: translateX(-100%);
  animation: pulse-sweep 3s infinite;
}

@keyframes pulse-sweep {
  100% { transform: translateX(100%); }
}

.spectral-whisper p {
  font-family: 'Inter', sans-serif;
  font-style: italic;
  font-size: 0.95rem;
  color: var(--accent-bright);
  line-height: 1.6;
}

/* Stained Glass DNA */
.stained-glass-container {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stained-glass-dna {
  position: relative;
  width: 220px;
  height: 220px;
}
.glass-radar {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.3));
}
.glass-frame {
  fill: rgba(30, 41, 59, 0.4);
  stroke: #475569;
  stroke-width: 3;
}
.glass-lead {
  stroke: #334155;
  stroke-width: 2;
}
.glass-data {
  fill: rgba(139, 92, 246, 0.4);
  stroke: var(--accent-bright);
  stroke-width: 2;
  filter: url(#glow);
  animation: breathe-glass 5s infinite ease-in-out;
}

@keyframes breathe-glass {
  0%, 100% { fill-opacity: 0.4; transform: scale(1); }
  50% { fill-opacity: 0.6; transform: scale(1.03); }
}

.glass-label {
  position: absolute;
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: #94a3b8;
}
.glass-label.t { top: -10px; left: 50%; transform: translateX(-50%); color: var(--accent-bright); }
.glass-label.s { top: 60px; right: -15px; }
.glass-label.e { bottom: 20px; right: 0; }
.glass-label.o { bottom: 20px; left: 0; }
.glass-label.a { top: 60px; left: -15px; }

/* Final Covenant */
.final-covenant {
  text-align: center;
  padding: var(--space-20) 0;
  background: radial-gradient(circle at center, rgba(139, 92, 246, 0.05), transparent);
}
.covenant-seal h2 {
  font-size: 3rem;
  font-weight: 900;
  margin-bottom: var(--space-4);
}

@media (max-width: 1000px) {
  .hero-title { font-size: 3rem; }
  .cathedral-grid { grid-template-columns: 1fr; }
}
</style>
