<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

/**
 * Interface definition for active move transitions.
 */
interface ActiveMove {
  startCol: number
  startRow: number
  targetCol: number
  targetRow: number
  startTime: number
  duration: number
  toSquare: string
  lastEchoTime?: number
}

/**
 * Interface representing individual particle states.
 */
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  maxSize: number
  life: number
  maxLife: number
  color: string
  type: 'fire' | 'smoke' | 'ice' | 'snow' | 'echo' | 'laser' | 'digit' | 'leaf' | 'spark'
  angle?: number
  spinSpeed?: number
  imgSrc?: string
}

/**
 * Component Props
 */
const props = withDefaults(
  defineProps<{
    /** Information about the last move made, containing standard board coordinates (e.g. e2, e4) */
    lastMove: { from: string; to: string; captured?: boolean | string } | null
    /** Flag indicating whether the board is currently flipped (Black on bottom) */
    flipped: boolean
    /** Active animation effect mode selection */
    effect: 'none' | 'fire' | 'ice' | 'chrono' | 'cyber' | 'leaves' | 'lightning'
    /** Density level of spawned particles (low, medium, or high count) */
    density?: 'low' | 'medium' | 'high'
    /** Lifetime length tier of spawned particles (short, normal, or long trails) */
    length?: 'short' | 'normal' | 'long'
  }>(),
  {
    density: 'medium',
    length: 'normal'
  }
)

const canvasRef = ref<HTMLCanvasElement | null>(null)
let resizeObserver: ResizeObserver | null = null
let animationFrameId: number | null = null

// Active move being animated
const activeMove = ref<ActiveMove | null>(null)

// Current active particles array
const particles = ref<Particle[]>([])

/**
 * Solves the cubic Bezier equation for time progress parameter x.
 * Used to match the piece sliding cubic-bezier(0.4, 0, 0.2, 1) transition curves.
 * 
 * @param x - Normalized time input (0.0 to 1.0)
 * @param p1x - Control Point 1 X
 * @param p1y - Control Point 1 Y
 * @param p2x - Control Point 2 X
 * @param p2y - Control Point 2 Y
 */
function solveBezier(x: number, p1x: number, p1y: number, p2x: number, p2y: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  
  let t = x
  // Perform Newton-Raphson approximation iteration to solve for parametric t
  for (let i = 0; i < 8; i++) {
    const currentX = 3 * Math.pow(1 - t, 2) * t * p1x + 3 * (1 - t) * Math.pow(t, 2) * p2x + Math.pow(t, 3) - x
    const derivativeX = 3 * Math.pow(1 - t, 2) * p1x + 6 * (1 - t) * t * (p2x - p1x) + 3 * Math.pow(t, 2) * (1 - p2x)
    if (Math.abs(derivativeX) < 1e-5) break
    t -= currentX / derivativeX
  }
  
  // Calculate resolved progress Y coordinate
  return 3 * Math.pow(1 - t, 2) * t * p1y + 3 * (1 - t) * Math.pow(t, 2) * p2y + Math.pow(t, 3)
}

/**
 * Maps a standard algebraic notation chess square (e.g. 'e2') to row and column indexes.
 * 
 * @param square - Two-character square string
 * @returns Object with row index (r) and column index (c)
 */
function squareToCoords(square: string): { r: number; c: number } {
  const file = square.charCodeAt(0) - 97 // 'a' -> 0, 'h' -> 7
  const rank = 8 - parseInt(square.charAt(1)) // '8' -> 0, '1' -> 7
  return {
    r: props.flipped ? 7 - rank : rank,
    c: props.flipped ? 7 - file : file
  }
}

// Image cache for Chrono Echo snapshot frames
const imageCache = new Map<string, HTMLImageElement>()

/**
 * Loads and caches an image element to prevent resource re-creation lags.
 */
function loadImage(src: string): HTMLImageElement {
  if (imageCache.has(src)) {
    return imageCache.get(src)!
  }
  const img = new Image()
  img.src = src
  imageCache.set(src, img)
  return img
}

/**
 * Procedurally draws a jagged lightning bolt using midpoint displacement steps.
 */
function drawLightning(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.shadowBlur = 8
  ctx.shadowColor = color
  
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  
  const steps = 4
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const targetX = x1 + (x2 - x1) * t
    const targetY = y1 + (y2 - y1) * t
    
    // Displace intermediate points to create a jagged look
    const displaceX = i === steps ? 0 : (Math.random() - 0.5) * 10
    const displaceY = i === steps ? 0 : (Math.random() - 0.5) * 10
    
    ctx.lineTo(targetX + displaceX, targetY + displaceY)
  }
  
  ctx.stroke()
  ctx.restore()
}

/**
 * Spawns fire/smoke particles at a coordinate source.
 */
function spawnFireParticles(x: number, y: number, count: number) {
  // Determine particle lifetime multiplier based on the length prop
  let lifeMultiplier = 1.0
  if (props.length === 'short') {
    lifeMultiplier = 0.5
  } else if (props.length === 'long') {
    lifeMultiplier = 1.8
  }

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 1.5 + 0.2
    
    // Spawns 70% flame particles and 30% rising smoke particles
    if (Math.random() > 0.3) {
      // Flame particles (Additive glow)
      particles.value.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed * 0.4 + (Math.random() - 0.5) * 0.2,
        vy: -Math.random() * 1.2 - 0.4, // Rising velocity
        size: Math.random() * 6 + 6,
        maxSize: 12,
        life: 0,
        maxLife: (Math.random() * 20 + 15) * lifeMultiplier,
        color: `hsl(${Math.random() * 35 + 15}, 100%, 55%)`, // Hot yellow-orange
        type: 'fire'
      })
    } else {
      // Rising dark gray smoke particles
      particles.value.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.8 - 0.2,
        size: Math.random() * 4 + 4,
        maxSize: 10,
        life: 0,
        maxLife: (Math.random() * 30 + 20) * lifeMultiplier,
        color: 'rgba(70, 65, 75, 0.4)',
        type: 'smoke'
      })
    }
  }
}

/**
 * Spawns ice crystal/snow particles at a coordinate source.
 */
function spawnIceParticles(x: number, y: number, count: number) {
  // Determine particle lifetime multiplier based on the length prop
  let lifeMultiplier = 1.0
  if (props.length === 'short') {
    lifeMultiplier = 0.5
  } else if (props.length === 'long') {
    lifeMultiplier = 1.8
  }

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 1.2 + 0.3
    
    if (Math.random() > 0.4) {
      // Ice crystal diamond sparkles (Additive glow)
      particles.value.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed * 0.3,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 3 + 3,
        maxSize: 6,
        life: 0,
        maxLife: (Math.random() * 25 + 20) * lifeMultiplier,
        color: 'rgba(34, 211, 238, 0.325)', // 50% reduced glow opacity cyan (0.65 -> 0.325)
        type: 'ice',
        angle: Math.random() * Math.PI,
        spinSpeed: (Math.random() - 0.5) * 0.05
      })
    } else {
      // Falling slow drift snow particles
      particles.value.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 0.2,
        vy: Math.random() * 0.5 + 0.2, // Drifting down slowly
        size: Math.random() * 2 + 1.5,
        maxSize: 4,
        life: 0,
        maxLife: (Math.random() * 40 + 30) * lifeMultiplier,
        color: 'rgba(255, 255, 255, 0.5)',
        type: 'snow'
      })
    }
  }
}

/**
 * Spawns cyber laser sparks and falling digit rain particles.
 */
function spawnCyberParticles(x: number, y: number, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 2 + 0.5
    
    if (Math.random() > 0.4) {
      particles.value.push({
        x,
        y,
        vx: Math.cos(angle) * speed * 0.5,
        vy: Math.sin(angle) * speed * 0.5,
        size: Math.random() * 3 + 2,
        maxSize: 5,
        life: 0,
        maxLife: Math.random() * 20 + 10,
        color: Math.random() > 0.5 ? '#10b981' : '#06b6d4',
        type: 'laser'
      })
    } else {
      particles.value.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: 0,
        vy: Math.random() * 0.8 + 0.4,
        size: Math.random() * 4 + 8,
        maxSize: 12,
        life: 0,
        maxLife: Math.random() * 30 + 15,
        color: '#10b981',
        type: 'digit'
      })
    }
  }
}

/**
 * Spawns autumn leaf particles that sway and drift down.
 */
function spawnLeafParticles(x: number, y: number, count: number) {
  let lifeMultiplier = 1.0
  if (props.length === 'short') {
    lifeMultiplier = 0.5
  } else if (props.length === 'long') {
    lifeMultiplier = 1.8
  }

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 1.5 + 0.3
    const hues = [25, 45, 80, 15] // Autumn colors
    const hue = hues[Math.floor(Math.random() * hues.length)]
    
    particles.value.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed * 0.4 + (Math.random() - 0.5) * 0.1,
      vy: Math.random() * 0.6 + 0.2,
      size: Math.random() * 5 + 4,
      maxSize: 9,
      life: 0,
      maxLife: (Math.random() * 40 + 20) * lifeMultiplier,
      color: `hsl(${hue}, 85%, ${Math.random() * 20 + 35}%)`,
      type: 'leaf',
      angle: Math.random() * Math.PI,
      spinSpeed: (Math.random() - 0.5) * 0.08
    })
  }
}

/**
 * Spawns lightning spark particles that shoot out.
 */
function spawnLightningParticles(x: number, y: number, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 3 + 1
    
    particles.value.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 2 + 1.5,
      maxSize: 4,
      life: 0,
      maxLife: Math.random() * 15 + 10,
      color: Math.random() > 0.5 ? '#a78bfa' : '#8b5cf6',
      type: 'spark'
    })
  }
}

/**
 * Primary particle updates and rendering loop. Runs at 60fps.
 */
function updateAndRender() {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  const width = canvas.width
  const sqSize = width / 8
  
  const now = performance.now()
  let hasActiveMove = false
  
  // 1. Process Active Move Trajectory & Emitter Position
  if (activeMove.value) {
    const move = activeMove.value
    const elapsed = now - move.startTime
    const progress = Math.min(elapsed / move.duration, 1)
    
    let currentX = 0
    let currentY = 0
    
    // Query parent DOM element to find the moving piece undergoing CSS transition.
    // The moving piece has data-square set to the destination square immediately upon FEN update.
    const canvas = canvasRef.value
    const parentEl = canvas?.parentElement?.parentElement
    const pieceEl = parentEl?.querySelector(`[data-square="${move.toSquare}"]`)
    
    if (pieceEl) {
      const pieceRect = pieceEl.getBoundingClientRect()
      const canvasRect = canvas!.getBoundingClientRect()
      
      // Calculate coordinates relative to the canvas overlay top-left
      currentX = pieceRect.left + pieceRect.width / 2 - canvasRect.left
      currentY = pieceRect.top + pieceRect.height / 2 - canvasRect.top
    } else {
      // Fallback: Use mathematical bezier interpolation (e.g. inside customization modal)
      const easeProgress = solveBezier(progress, 0.4, 0, 0.2, 1)
      
      const startX = (move.startCol + 0.5) * sqSize
      const startY = (move.startRow + 0.5) * sqSize
      const targetX = (move.targetCol + 0.5) * sqSize
      const targetY = (move.targetRow + 0.5) * sqSize
      
      currentX = startX + (targetX - startX) * easeProgress
      currentY = startY + (targetY - startY) * easeProgress
    }
    
    // Determine spawn count based on the density prop
    let spawnCount = 4
    if (props.density === 'low') {
      spawnCount = 2
    } else if (props.density === 'high') {
      spawnCount = 8
    }

    // Resolve target piece image for Chrono Echo snapshot caching
    let imgEl = pieceEl?.querySelector('img')
    if (!imgEl && parentEl) {
      const targetIdx = move.targetRow * 8 + move.targetCol
      const squares = parentEl.querySelectorAll('.board-square')
      if (squares[targetIdx]) {
        imgEl = squares[targetIdx].querySelector('img')
      }
    }
    const imgSrc = imgEl?.src

    // Spawn particles at the current interpolated coordinate if effect is enabled
    if (props.effect === 'fire') {
      spawnFireParticles(currentX, currentY, spawnCount)
    } else if (props.effect === 'ice') {
      spawnIceParticles(currentX, currentY, spawnCount)
    } else if (props.effect === 'cyber') {
      spawnCyberParticles(currentX, currentY, spawnCount)
    } else if (props.effect === 'leaves') {
      spawnLeafParticles(currentX, currentY, spawnCount)
    } else if (props.effect === 'lightning') {
      spawnLightningParticles(currentX, currentY, spawnCount)
      
      // Draw lightning bolt 40% of the time per frame to random nearby points
      if (Math.random() > 0.6) {
        const offsetAngle = Math.random() * Math.PI * 2
        const offsetDist = Math.random() * 30 + 15
        const lx = currentX + Math.cos(offsetAngle) * offsetDist
        const ly = currentY + Math.sin(offsetAngle) * offsetDist
        drawLightning(ctx, currentX, currentY, lx, ly, '#a78bfa')
      }
    } else if (props.effect === 'chrono' && imgSrc) {
      const nowMs = performance.now()
      // Spawn a ghost snapshot clone at regular time intervals (approx every 120ms)
      if (!move.lastEchoTime || nowMs - move.lastEchoTime > 120) {
        move.lastEchoTime = nowMs
        particles.value.push({
          x: currentX,
          y: currentY,
          vx: 0,
          vy: 0,
          size: sqSize * 0.82,
          maxSize: sqSize * 0.82,
          life: 0,
          maxLife: 20,
          color: '',
          type: 'echo',
          imgSrc: imgSrc
        })
      }
    }
    
    if (progress < 1) {
      hasActiveMove = true
    } else {
      activeMove.value = null // Clear when slide completes
    }
  }
  
  // 2. Update and Draw Particles
  for (let i = particles.value.length - 1; i >= 0; i--) {
    const p = particles.value[i]
    p.life++
    
    if (p.life >= p.maxLife) {
      particles.value.splice(i, 1)
      continue
    }
    
    // Update velocity and positions
    p.x += p.vx
    p.y += p.vy
    
    const lifeRatio = p.life / p.maxLife
    
    if (p.type === 'fire') {
      // Flame particles expand slightly then shrink quickly
      p.size = p.maxSize * (1 - lifeRatio)
      
      // Draw flame using additive screen composite mode for hot glow blends
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
      grad.addColorStop(0, p.color)
      grad.addColorStop(0.3, p.color)
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)') // Fades to transparent red
      
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    } 
    else if (p.type === 'smoke') {
      // Smoke grows in size and fades out
      p.size = p.maxSize * lifeRatio * 1.5 + 2
      ctx.fillStyle = `rgba(80, 75, 85, ${0.3 * (1 - lifeRatio)})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    } 
    else if (p.type === 'ice') {
      // Spin crystal angle
      if (p.angle !== undefined && p.spinSpeed !== undefined) {
        p.angle += p.spinSpeed
      }
      p.size = p.maxSize * (1 - lifeRatio)
      
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      
      ctx.translate(p.x, p.y)
      if (p.angle !== undefined) {
        ctx.rotate(p.angle)
      }
      
      // Draw glowing diamond ice shape
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.moveTo(0, -p.size)
      ctx.lineTo(p.size * 0.7, 0)
      ctx.lineTo(0, p.size)
      ctx.lineTo(-p.size * 0.7, 0)
      ctx.closePath()
      ctx.fill()
      
      // Small core sparkle highlight
      ctx.fillStyle = `rgba(255, 255, 255, ${0.45 * (1 - lifeRatio)})`
      ctx.beginPath()
      ctx.arc(0, 0, p.size * 0.35, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.restore()
    } 
    else if (p.type === 'snow') {
      // Snow drifts horizontally using slow sine sways
      p.vx += Math.sin(p.life * 0.1) * 0.02
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * (1 - lifeRatio)})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
    else if (p.type === 'echo' && p.imgSrc) {
      const img = loadImage(p.imgSrc)
      if (img.complete && img.naturalWidth > 0) {
        ctx.save()
        ctx.globalAlpha = 0.35 * (1 - lifeRatio) // Ghost shadow transparency fade
        ctx.drawImage(img, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
        ctx.restore()
      }
    }
    else if (p.type === 'laser') {
      p.size = p.maxSize * (1 - lifeRatio)
      ctx.save()
      ctx.fillStyle = p.color
      ctx.shadowBlur = 6
      ctx.shadowColor = p.color
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
      ctx.restore()
    }
    else if (p.type === 'digit') {
      ctx.save()
      ctx.fillStyle = `rgba(34, 197, 94, ${0.75 * (1 - lifeRatio)})`
      ctx.font = `bold ${p.size}px monospace`
      ctx.fillText(Math.random() > 0.5 ? '1' : '0', p.x, p.y)
      ctx.restore()
    }
    else if (p.type === 'leaf') {
      if (p.angle !== undefined && p.spinSpeed !== undefined) {
        p.angle += p.spinSpeed
        p.vx += Math.sin(p.life * 0.08) * 0.02
      }
      p.size = p.maxSize * (1 - lifeRatio)
      
      ctx.save()
      ctx.translate(p.x, p.y)
      if (p.angle !== undefined) {
        ctx.rotate(p.angle)
      }
      
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(-p.size, 0)
      ctx.lineTo(p.size, 0)
      ctx.stroke()
      
      ctx.restore()
    }
    else if (p.type === 'spark') {
      p.size = p.maxSize * (1 - lifeRatio)
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.fillStyle = p.color
      ctx.shadowBlur = 4
      ctx.shadowColor = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }
  
  // Continue requestAnimationFrame loop if animations or active particles remain
  if (hasActiveMove || particles.value.length > 0) {
    animationFrameId = requestAnimationFrame(updateAndRender)
  } else {
    animationFrameId = null
  }
}

// Watch lastMove triggers to start trajectories
watch(() => props.lastMove, (newVal) => {
  // Only trigger the trail effect if there is an active effect selection AND the move is a capture
  if (!newVal || props.effect === 'none' || !newVal.captured) {
    activeMove.value = null
    return
  }
  
  const fromCoords = squareToCoords(newVal.from)
  const toCoords = squareToCoords(newVal.to)
  
  // Start the move transition
  activeMove.value = {
    startCol: fromCoords.c,
    startRow: fromCoords.r,
    targetCol: toCoords.c,
    targetRow: toCoords.r,
    startTime: performance.now(),
    duration: 750, // Matches piece transition length
    toSquare: newVal.to
  }
  
  // Start particle loop if currently idle
  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(updateAndRender)
  }
})

// Setup ResizeObserver on Canvas container mount to handle responsive canvas boundary sizing
onMounted(() => {
  const canvas = canvasRef.value
  if (canvas && canvas.parentElement) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Retrieve viewport bounds
        const { width, height } = entry.contentRect
        canvas.width = width
        canvas.height = height
      }
    })
    resizeObserver.observe(canvas.parentElement)
  }
})

// Teardown observer and loop frames on unmount
onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<template>
  <!-- Absolute-positioned transparent overlay block -->
  <div class="move-trail-container">
    <canvas ref="canvasRef" class="trail-canvas"></canvas>
  </div>
</template>

<style scoped>
.move-trail-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: var(--z-move-trails, 5); /* Placed above board squares but below pieces layer */
}

.trail-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
