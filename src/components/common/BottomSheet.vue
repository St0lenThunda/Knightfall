<template>
  <!-- Desktop Fallback: Render as a normal inline container, letting the desktop layouts flow as they originally did. -->
  <div v-if="!isMobile" class="desktop-sheet-fallback">
    <slot name="peek"></slot>
    <slot></slot>
  </div>

  <!-- Mobile Implementation: A draggable, snapping bottom sheet with gothic styling. -->
  <div v-else class="mobile-bottom-sheet-wrapper">
    <!-- Semi-transparent backdrop when sheet is pulled up past half height -->
    <div 
      class="sheet-backdrop" 
      :style="{ opacity: backdropOpacity }" 
      @click="snapTo('peek')"
    ></div>

    <div 
      ref="sheetRef"
      class="bottom-sheet glass"
      :class="{ 'dragging': isDragging }"
      :style="sheetStyle"
    >
      <!-- Drag Handle & Peek Header -->
      <div 
        class="sheet-header" 
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <div class="drag-handle"></div>
        <div class="header-peek-content">
          <slot name="peek">
            <span class="sheet-title">{{ title }}</span>
          </slot>
        </div>
      </div>

      <!-- Scrollable Sheet Content -->
      <div class="sheet-content" ref="contentRef">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMobileDetect } from '../../composables/useMobileDetect'

/**
 * Reusable Gothic Bottom Sheet Component
 * 
 * Provides a draggable drawer at the bottom of the screen on mobile devices.
 * Implements 3 snap points (peek, half-expanded, fully-expanded) to balance 
 * chess board visibility and content interaction.
 */
const props = withDefaults(
  defineProps<{
    /** The title displayed in the header if no custom peek slot is provided */
    title?: string
    /** Height in pixels when fully collapsed at the bottom */
    peekHeight?: number
    /** Height in vh (viewport height %) for the middle snap point */
    halfHeight?: number
    /** Height in vh (viewport height %) for the top snap point */
    fullHeight?: number
    /** Starting position ('peek', 'half', or 'full') */
    defaultPosition?: 'peek' | 'half' | 'full'
  }>(),
  {
    title: 'Intel panel',
    peekHeight: 80,
    halfHeight: 45,
    fullHeight: 85,
    defaultPosition: 'peek'
  }
)

const emit = defineEmits<{
  (e: 'position-change', position: 'peek' | 'half' | 'full'): void
}>()

const { isMobile } = useMobileDetect()

// Gesture state variables
const isDragging = ref(false)
const sheetHeight = ref(0) // current height in pixels
const currentPosition = ref<'peek' | 'half' | 'full'>(props.defaultPosition)

// Touch tracking variables
let touchStartY = 0
let touchStartHeight = 0
let lastTouchY = 0
let touchStartTime = 0

// Calculated pixel values for the snap points
const peekPx = computed(() => props.peekHeight)
const halfPx = computed(() => (window.innerHeight * props.halfHeight) / 100)
const fullPx = computed(() => (window.innerHeight * props.fullHeight) / 100)

/**
 * Compute the style object for the sheet.
 * When dragging, we set height directly and disable transitions.
 * When stationary, the height transitions smoothly.
 */
const sheetStyle = computed(() => {
  if (!isMobile.value) return {}
  return {
    height: `${sheetHeight.value}px`,
    transform: 'translateY(0)',
    transition: isDragging.value ? 'none' : 'height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
  }
})

/**
 * Calculates the opacity of the dimming backdrop.
 * It ranges from 0 (at peek/collapsed) to 0.6 (fully open).
 */
const backdropOpacity = computed(() => {
  if (!isMobile.value || sheetHeight.value <= peekPx.value) return 0
  const range = fullPx.value - peekPx.value
  const progress = (sheetHeight.value - peekPx.value) / range
  return Math.min(0.6, progress * 0.7)
})

/**
 * Snaps the bottom sheet to a target position.
 * 
 * @param pos - Target snap point ('peek', 'half', or 'full')
 */
function snapTo(pos: 'peek' | 'half' | 'full') {
  currentPosition.value = pos
  if (pos === 'peek') sheetHeight.value = peekPx.value
  else if (pos === 'half') sheetHeight.value = halfPx.value
  else if (pos === 'full') sheetHeight.value = fullPx.value
  
  emit('position-change', pos)
}

/**
 * Touch start event handler.
 * Prepares the gesture state.
 */
function onTouchStart(e: TouchEvent) {
  isDragging.value = true
  touchStartY = e.touches[0].clientY
  lastTouchY = touchStartY
  touchStartHeight = sheetHeight.value
  touchStartTime = Date.now()
}

/**
 * Touch move event handler.
 * Dynamically adjusts sheet height as the user drags.
 */
function onTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  
  const currentY = e.touches[0].clientY
  const deltaY = touchStartY - currentY // Upward drag = positive delta Y
  
  // Calculate new height, boundary-checked
  let targetHeight = touchStartHeight + deltaY
  
  // Apply a rubber-banding resistance if dragging above fullPx
  if (targetHeight > fullPx.value) {
    const overflow = targetHeight - fullPx.value
    targetHeight = fullPx.value + overflow * 0.3
  }
  // Apply resistance if dragging below peekPx
  if (targetHeight < peekPx.value) {
    const underflow = peekPx.value - targetHeight
    targetHeight = peekPx.value - underflow * 0.3
  }
  
  sheetHeight.value = targetHeight
  lastTouchY = currentY
}

/**
 * Touch end event handler.
 * Snaps the sheet to the closest snap point based on distance and velocity.
 */
function onTouchEnd() {
  isDragging.value = false
  
  const duration = Date.now() - touchStartTime
  const deltaY = touchStartY - lastTouchY
  const velocity = Math.abs(deltaY) / duration // px per ms

  // If drag was fast (flick), snap based on direction
  if (velocity > 0.4) {
    if (deltaY > 0) {
      // Flicked up
      if (currentPosition.value === 'peek') snapTo('half')
      else snapTo('full')
    } else {
      // Flicked down
      if (currentPosition.value === 'full') snapTo('half')
      else snapTo('peek')
    }
    return
  }

  // Otherwise, snap to the closest target position based on raw height
  const distToPeek = Math.abs(sheetHeight.value - peekPx.value)
  const distToHalf = Math.abs(sheetHeight.value - halfPx.value)
  const distToFull = Math.abs(sheetHeight.value - fullPx.value)

  const min = Math.min(distToPeek, distToHalf, distToFull)

  if (min === distToPeek) snapTo('peek')
  else if (min === distToHalf) snapTo('half')
  else snapTo('full')
}

// Ensure sheet is properly sized when mobile state changes or on mount
onMounted(() => {
  if (isMobile.value) {
    snapTo(props.defaultPosition)
  }
})

// Keep snap heights updated on window resize (e.g. orientation changes)
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    if (isMobile.value) {
      snapTo(currentPosition.value)
    }
  })
}

// Watch for mobile toggle and reset heights accordingly
watch(isMobile, (mobile) => {
  if (mobile) {
    snapTo(props.defaultPosition)
  }
})
</script>

<style scoped>
/* Desktop representation */
.desktop-sheet-fallback {
  display: contents;
}

/* Mobile Bottom Sheet Styles */
.mobile-bottom-sheet-wrapper {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  pointer-events: none; /* Let clicks pass through to board when collapsed */
  z-index: 2000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.sheet-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: auto; /* Allow backdrop clicks to collapse sheet */
}

/* Let the backdrop click collapse only if the sheet is expanded */
.mobile-bottom-sheet-wrapper:has(.bottom-sheet:not([style*="height: 80px"])) .sheet-backdrop {
  pointer-events: auto;
}
.mobile-bottom-sheet-wrapper:has(.bottom-sheet[style*="height: 80px"]) .sheet-backdrop {
  pointer-events: none;
}

.bottom-sheet {
  position: relative;
  width: 100%;
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  background: rgba(13, 13, 20, 0.94);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  pointer-events: auto; /* Interactable drawer */
  will-change: height;
  overflow: hidden;
  border-bottom: none;
}

/* Remove default glass styling border on sides/bottom */
.bottom-sheet.glass {
  border-left: none;
  border-right: none;
  border-bottom: none;
}

/* Drag Handle Area */
.sheet-header {
  padding: var(--space-3) var(--space-4) var(--space-2) var(--space-4);
  cursor: grab;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
  touch-action: none; /* Keep dragging clean */
  background: linear-gradient(to bottom, rgba(20, 20, 30, 0.5) 0%, transparent 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.sheet-header:active {
  cursor: grabbing;
}

.drag-handle {
  width: 36px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-2);
}

.header-peek-content {
  width: 100%;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.sheet-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-light);
  text-shadow: var(--shadow-glow);
}

/* Scrollable Inner Content */
.sheet-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  -webkit-overflow-scrolling: touch;
}
</style>
