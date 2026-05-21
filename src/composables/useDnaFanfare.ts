import { ref, computed } from 'vue'

export function useDnaFanfare() {
  const containerRef = ref<HTMLElement | null>(null)
  const particleCanvas = ref<HTMLCanvasElement | null>(null)
  const eloIsRevealed = ref(false)
  const eloDisplayValue = ref(0)

  const computedElo = computed(() => {
    try {
      const raw = localStorage.getItem('knightfall_pending_dna')
      if (raw) {
        const dna = JSON.parse(raw)
        return (dna.rating ?? 1200) as number
      }
    } catch {
      // Silently fall back if localStorage is corrupted or unavailable
    }
    return 1200
  })

  const eloTier = computed(() => {
    const elo = computedElo.value
    if (elo >= 2000) return { id: 'tier-master',       label: '♛ Master' }
    if (elo >= 1600) return { id: 'tier-advanced',     label: '⚔️ Advanced' }
    if (elo >= 1200) return { id: 'tier-intermediate', label: '🛡️ Intermediate' }
    return                    { id: 'tier-beginner',    label: '🌱 Beginner' }
  })

  const eloPercentile = computed(() => {
    const elo = computedElo.value
    if (elo >= 2000) return 'You outperform ~95% of players in our network.'
    if (elo >= 1600) return 'You outperform ~75% of players in our network.'
    if (elo >= 1200) return 'You outperform ~45% of players in our network.'
    return 'You outperform ~15% of players in our network.'
  })

  function playRankUpChime() {
    try {
      const ctx = new AudioContext()
      const frequencies = [523.25, 659.25, 783.99]

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.type = 'sine'
        osc.frequency.value = freq

        const startAt = ctx.currentTime + i * 0.12
        const endAt = startAt + 0.3

        gain.gain.setValueAtTime(0, startAt)
        gain.gain.linearRampToValueAtTime(0.35, startAt + 0.02)
        gain.gain.linearRampToValueAtTime(0, endAt)

        osc.start(startAt)
        osc.stop(endAt)
      })
    } catch {
      // Web Audio not available
    }
  }

  function spawnParticles(accentColor: string) {
    const canvas = particleCanvas.value
    if (!canvas) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const PARTICLE_COUNT = 60

    const particles = Array.from({ length: PARTICLE_COUNT }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 3
      const radius = 2 + Math.random() * 4
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        radius
      }
    })

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      let anyAlive = false
      for (const p of particles) {
        if (p.alpha <= 0) continue
        anyAlive = true

        p.x += p.vx
        p.y += p.vy
        p.vy += 0.08
        p.alpha -= 0.018

        ctx!.globalAlpha = Math.max(0, p.alpha)
        ctx!.fillStyle = accentColor
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx!.fill()
      }

      ctx!.globalAlpha = 1
      if (anyAlive) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }

  function triggerFanfare() {
    if (eloIsRevealed.value) return
    eloIsRevealed.value = true

    playRankUpChime()

    const target = computedElo.value
    const DURATION_MS = 1500
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / DURATION_MS, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      eloDisplayValue.value = Math.round(eased * target)
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)

    setTimeout(() => {
      const accent = containerRef.value
        ? getComputedStyle(containerRef.value).getPropertyValue('--reveal-accent').trim()
        : ''
      spawnParticles(accent || '#a78bfa')
    }, 80)
  }

  return {
    containerRef,
    particleCanvas,
    eloIsRevealed,
    eloDisplayValue,
    computedElo,
    eloTier,
    eloPercentile,
    triggerFanfare
  }
}
