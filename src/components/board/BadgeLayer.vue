<script setup lang="ts">
/**
 * BadgeLayer: Renders tactical quality indicators (!!, ??, etc.) above the pieces.
 * Positioned absolutely relative to the board grid.
 */
import { computed } from 'vue'
import type { MoveQuality } from '../../utils/analysisUtils'

interface Props {
  quality: MoveQuality | null
  lastMove: { from: string; to: string } | null
  flipped: boolean
}

const props = defineProps<Props>()

const files = ['a','b','c','d','e','f','g','h']
const ranks = ['8','7','6','5','4','3','2','1']

/**
 * Calculates coordinates for the badge based on the 'to' square of the move.
 */
const badgeData = computed(() => {
  if (!props.quality || props.quality.id === 'good' || !props.lastMove) return null
  
  const sq = props.lastMove.to
  const f = sq[0]
  const r = sq[1]
  
  let colIdx = files.indexOf(f)
  let rowIdx = ranks.indexOf(r)

  if (props.flipped) {
    colIdx = 7 - colIdx
    rowIdx = 7 - rowIdx
  }

  return {
    ...props.quality,
    x: colIdx * 12.5 + 6.25,
    y: rowIdx * 12.5 + 6.25
  }
})
</script>

<template>
  <div class="badges-layer">
    <div v-if="badgeData" 
         class="quality-badge animated-pop-in"
         :style="{ 
           backgroundColor: badgeData.color,
           left: badgeData.x + '%',
           top: badgeData.y + '%'
         }"
    >
      {{ badgeData.icon }}
    </div>
  </div>
</template>

<style scoped>
.badges-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: var(--z-badges, 25);
}

.quality-badge {
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 900;
  color: white;
  transform: translate(-50%, -50%);
  margin-top: -20px;
  margin-left: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  pointer-events: none;
}

.animated-pop-in {
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  from { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
</style>
