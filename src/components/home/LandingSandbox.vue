<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="landing-sandbox animated-fade-in">
    <!-- Hero Section -->
    <section class="hero-minimal">
      <h1 class="hero-title">Chess, <span class="text-gradient">Deconstructed.</span></h1>
      <p class="hero-desc">The high-fidelity laboratory for players who seek genuine mastery. No flashy marketing, just pure intelligence.</p>
      <div class="hero-btns">
        <button class="btn btn-primary btn-lg" @click="router.push('/assessment')">Start Free Assessment</button>
        <RouterLink to="/play" class="btn btn-ghost btn-lg">Enter as Guest</RouterLink>
      </div>
    </section>

    <!-- The Sandbox: Interactive Components -->
    <section class="sandbox-grid" aria-labelledby="sandbox-title">
      <h2 id="sandbox-title" class="sr-only">Interactive Intelligence Previews</h2>
      
      <!-- Sandbox 1: The Oracle Preview -->
      <div class="sandbox-item glass oracle-preview">
        <div class="sandbox-header">
          <span class="badge badge-teal">LIVE PREVIEW</span>
          <h3>The Oracle's Insight</h3>
        </div>
        <div class="oracle-mock">
          <div class="mock-board">
            <div class="mini-grid">
              <div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div>
              <div class="mini-cell"></div><div class="mini-cell blunder-sq">♞</div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div>
              <div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell best-sq">★</div><div class="mini-cell"></div><div class="mini-cell"></div>
              <div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div>
              <div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div><div class="mini-cell"></div>
            </div>
            <div class="blunder-line"></div>
          </div>
          <div class="mock-chat">
            <div class="coach-tag blunder">CRITICAL BLUNDER</div>
            <p class="typewriter">"By jumping the Knight to f6 here, you've abandoned control of the center. White's Bishop now has a direct path to your King..."</p>
          </div>
        </div>
        <p class="sandbox-footer muted">Our AI Coach doesn't just show the move; it explains the <i>why</i> in plain English.</p>
      </div>

      <!-- Sandbox 2: DNA Lab Preview -->
      <div class="sandbox-item glass dna-preview">
        <div class="sandbox-header">
          <span class="badge badge-rose">REAL ANALYTICS</span>
          <h3>Your Playstyle DNA</h3>
        </div>
        <div class="dna-visual">
          <svg viewBox="0 0 200 200" class="radar-chart" role="img" aria-labelledby="radar-title radar-desc">
            <title id="radar-title">Playstyle Radar Chart</title>
            <desc id="radar-desc">A radar chart showing player performance across tactics, strategy, endgame, opening, and aggression.</desc>
            <polygon points="100,20 176,75 147,165 53,165 24,75" class="radar-grid" />
            <polygon points="100,60 138,87 123,132 77,132 62,87" class="radar-grid" />
            <line x1="100" y1="100" x2="100" y2="20" class="radar-axis" />
            <line x1="100" y1="100" x2="176" y2="75" class="radar-axis" />
            <line x1="100" y1="100" x2="147" y2="165" class="radar-axis" />
            <line x1="100" y1="100" x2="53" y2="165" class="radar-axis" />
            <line x1="100" y1="100" x2="24" y2="75" class="radar-axis" />
            <polygon points="100,40 160,80 130,140 70,150 40,85" class="radar-data" />
            <circle cx="100" cy="40" r="3" class="radar-point" />
            <circle cx="160" cy="80" r="3" class="radar-point" />
            <circle cx="130" cy="140" r="3" class="radar-point" />
            <circle cx="70" cy="150" r="3" class="radar-point" />
            <circle cx="40" cy="85" r="3" class="radar-point" />
          </svg>
          <div class="radar-label t">TACTICS</div>
          <div class="radar-label s">STRATEGY</div>
          <div class="radar-label e">ENDGAME</div>
          <div class="radar-label o">OPENING</div>
          <div class="radar-label a">AGGRESSION</div>
        </div>
        <p class="sandbox-footer muted">We scan your entire library to find the specific patterns holding you back.</p>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="final-cta">
      <h2>Ready to become a Scholar?</h2>
      <button class="btn btn-primary" @click="router.push('/assessment')">Start My Assessment</button>
    </section>
  </div>
</template>

<style scoped>
.hero-minimal { text-align: center; padding: var(--space-20) 0; }
.hero-title { font-size: 4rem; font-weight: 900; margin-bottom: var(--space-4); }
.hero-desc { font-size: 1.25rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto var(--space-10); line-height: 1.6; }
.hero-btns { display: flex; justify-content: center; gap: var(--space-4); }

.sandbox-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); margin-bottom: var(--space-20);
}
.sandbox-item { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-6); }
.oracle-mock { display: flex; gap: var(--space-6); align-items: center; }
.mini-grid { display: grid; grid-template-columns: repeat(5, 24px); grid-template-rows: repeat(5, 24px); border: 1px solid var(--border); }
.mini-cell { border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 14px; }
.blunder-sq { background: rgba(244, 63, 94, 0.2); color: var(--rose); }
.best-sq { background: rgba(16, 185, 129, 0.1); color: var(--teal); font-size: 10px; box-shadow: inset 0 0 8px var(--teal-dim); }
.coach-tag { font-size: 0.6rem; font-weight: 900; padding: 2px 6px; border-radius: 4px; margin-bottom: 8px; width: fit-content; }
.coach-tag.blunder { background: #881337; color: #ffffff; }
.typewriter { font-size: 0.85rem; line-height: 1.5; font-style: italic; color: var(--text-secondary); }

.dna-visual { 
  height: 220px; position: relative; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at center, rgba(139, 92, 246, 0.08), transparent); 
  border-radius: var(--radius-md); overflow: hidden;
}
.radar-chart { width: 180px; height: 180px; filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.2)); }
.radar-grid, .radar-axis { fill: rgba(255, 255, 255, 0.02); stroke: rgba(255, 255, 255, 0.05); stroke-width: 1; }
.radar-data {
  fill: rgba(139, 92, 246, 0.25); stroke: var(--accent); stroke-width: 2;
  filter: drop-shadow(0 0 5px var(--accent)); animation: pulse-dna 4s infinite ease-in-out;
}
.radar-point { fill: var(--accent-bright); }
.radar-label { position: absolute; font-size: 0.6rem; font-weight: 900; color: var(--text-secondary); letter-spacing: 0.05em; }
.radar-label.t { top: 10px; left: 50%; transform: translateX(-50%); color: var(--accent-bright); }
.radar-label.s { top: 65px; right: 10px; }
.radar-label.e { bottom: 30px; right: 25px; }
.radar-label.o { bottom: 30px; left: 25px; }
.radar-label.a { top: 65px; left: 10px; }

@keyframes pulse-dna {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
}

.final-cta { text-align: center; padding: var(--space-12) 0; }
.final-cta h2 { margin-bottom: var(--space-6); font-size: 2rem; }

@media (max-width: 900px) {
  .sandbox-grid { grid-template-columns: 1fr; }
  .hero-title { font-size: 2.5rem; }
}
</style>
