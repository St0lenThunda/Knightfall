<script setup lang="ts">
/**
 * ArrowLayer: Renders engine suggestions and threats as SVG arrows.
 * Handles coordinate transformation based on board flip state.
 */
import { computed } from 'vue'

export interface ArrowDef {
  from: string
  to: string
  type: 'suggestion' | 'suggestion-alt' | 'threat'
}

interface Props {
  arrows: ArrowDef[]
  flipped: boolean
}

const props = defineProps<Props>()

const files = ['a','b','c','d','e','f','g','h']
const ranks = ['8','7','6','5','4','3','2','1']

/**
 * Resolves coordinate percentages for the SVG lines.
 */
const resolvedArrows = computed(() => {
  return props.arrows.map(a => {
    const fromCoord = getCoords(a.from)
    const toCoord = getCoords(a.to)
    
    // Shorten the line slightly so the arrowhead lands better
    const dx = toCoord.x - fromCoord.x
    const dy = toCoord.y - fromCoord.y
    const angle = Math.atan2(dy, dx)
    const length = Math.sqrt(dx * dx + dy * dy)
    
    // Shorten by about 2 units (2% of board)
    const shortenAmount = 2.5
    const x2 = fromCoord.x + Math.cos(angle) * (length - shortenAmount)
    const y2 = fromCoord.y + Math.sin(angle) * (length - shortenAmount)

    const color = a.type === 'threat' ? 'url(#grad-threat)' : 'url(#grad-suggestion)'
    const marker = a.type === 'threat' ? 'url(#arrowhead-threat)' : 'url(#arrowhead-suggestion)'

    return {
      x1: fromCoord.x,
      y1: fromCoord.y,
      x2,
      y2,
      color,
      marker
    }
  })
})

function getCoords(sq: string) {
  const f = sq[0]
  const r = sq[1]
  let colIdx = files.indexOf(f)
  let rowIdx = ranks.indexOf(r)

  if (props.flipped) {
    colIdx = 7 - colIdx
    rowIdx = 7 - rowIdx
  }

  return {
    x: colIdx * 12.5 + 6.25,
    y: rowIdx * 12.5 + 6.25
  }
}
</script>

<template>
  <svg class="arrows-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
    <defs>
      <!-- Glow Filter -->
      <filter id="arrow-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="0.4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <!-- Gradients -->
      <linearGradient id="grad-suggestion" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:rgba(16, 185, 129, 0.4)" />
        <stop offset="100%" style="stop-color:rgba(16, 185, 129, 0.9)" />
      </linearGradient>
      <linearGradient id="grad-threat" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:rgba(244, 63, 94, 0.4)" />
        <stop offset="100%" style="stop-color:rgba(244, 63, 94, 0.9)" />
      </linearGradient>

      <!-- Arrowheads (Sharper and Smaller) -->
      <marker id="arrowhead-suggestion" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
        <path d="M0,0 L6,2 L0,4 Z" fill="rgba(16, 185, 129, 0.95)" />
      </marker>
      <marker id="arrowhead-threat" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
        <path d="M0,0 L6,2 L0,4 Z" fill="rgba(244, 63, 94, 0.95)" />
      </marker>
    </defs>

    <line 
      v-for="(arrow, i) in resolvedArrows" 
      :key="'arrow-'+i"
      :x1="arrow.x1" :y1="arrow.y1" 
      :x2="arrow.x2" :y2="arrow.y2"
      :stroke="arrow.color"
      stroke-width="1.2"
      :marker-end="arrow.marker"
      stroke-linecap="round"
      filter="url(#arrow-glow)"
    />
  </svg>
</template>

<style scoped>
.arrows-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: var(--z-arrows, 15);
  overflow: visible; /* Ensure arrowhead doesn't clip if at edge */
}
</style>
