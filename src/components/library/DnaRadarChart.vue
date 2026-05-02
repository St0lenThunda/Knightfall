<script setup lang="ts">
import { useDnaRadar } from '../../composables/library/useDnaRadar'

/**
 * DNA Radar Chart Component
 * 
 * A specialized SVG visualization that maps the user's performance across 
 * different game dimensions (Opening, Tactics, etc.).
 */
const { 
  cx, 
  cy, 
  r, 
  axes, 
  radarPoints, 
  getAxisLabelPos 
} = useDnaRadar()
</script>

<template>
  <div class="radar-container mt-4">
    <svg viewBox="0 0 300 300" class="radar-svg">
      <!-- Rings: Background guide circles -->
      <circle 
        v-for="i in 4" 
        :key="i" 
        :cx="cx" 
        :cy="cy" 
        :r="r * (i * 0.25)" 
        class="radar-ring" 
      />
      
      <!-- Axes: Radial guide lines -->
      <line 
        v-for="(_, i) in axes" 
        :key="'ax'+i"
        :x1="cx" 
        :y1="cy"
        :x2="cx + r * Math.cos((Math.PI * 2 * i / axes.length) - Math.PI / 2)"
        :y2="cy + r * Math.sin((Math.PI * 2 * i / axes.length) - Math.PI / 2)"
        class="radar-axis"
      />

      <!-- Labels: Axis names (e.g., Opening, Tactics) -->
      <text 
        v-for="(ax, i) in axes" 
        :key="'lbl'+i"
        :x="getAxisLabelPos(i).x"
        :y="getAxisLabelPos(i).y"
        class="radar-label"
        text-anchor="middle"
        alignment-baseline="middle"
      >
        {{ ax.label }}
      </text>

      <!-- Data: The "Fingerprint" Polygon -->
      <polygon :points="radarPoints" class="radar-poly" />
      
      <!-- Data Points: Individual vertices for clarity -->
      <circle 
        v-for="(p, i) in radarPoints.split(' ')" 
        :key="'pt'+i"
        :cx="p.split(',')[0]" 
        :cy="p.split(',')[1]" 
        r="4" 
        class="radar-pt"
      />
    </svg>
  </div>
</template>

<style scoped>
.radar-container { 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  padding: var(--space-4); 
}

.radar-svg { 
  width: 100%; 
  max-width: 320px; 
  filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.1)); 
}

.radar-ring { 
  fill: none; 
  stroke: rgba(255, 255, 255, 0.05); 
  stroke-width: 1; 
}

.radar-axis { 
  stroke: rgba(255, 255, 255, 0.08); 
  stroke-width: 1; 
}

.radar-label { 
  font-size: 10px; 
  font-weight: 800; 
  fill: var(--text-muted); 
  text-transform: uppercase; 
  letter-spacing: 0.05em; 
}

.radar-poly { 
  fill: rgba(139, 92, 246, 0.2); 
  stroke: var(--accent); 
  stroke-width: 2.5; 
  stroke-linejoin: round; 
}

.radar-pt { 
  fill: var(--accent-bright); 
}
</style>
