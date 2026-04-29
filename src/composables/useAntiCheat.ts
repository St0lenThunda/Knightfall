import { computed, ref } from 'vue'
import { logger } from '../utils/logger'

/**
 * Knightfall Anti-Cheat Engine (The Warden)
 * 
 * Inspired by Lichess (Irwin) and Chess.com detection methods.
 * This composable analyzes behavioral and temporal signals to detect engine assistance.
 * 
 * Signals tracked:
 * 1. Window Blurs/Visibility (Page Visibility API)
 * 2. Move Time Variance (Robotic consistency check)
 * 3. Engine Correlation (Match rate with Stockfish PV)
 */
export function useAntiCheat() {
  const blurCount = ref(0)
  const moveTimes = ref<number[]>([])
  const lastMoveTimestamp = ref(Date.now())
  
  // Engine Correlation signals
  const engineMatches = ref(0)
  const totalAnalyzedMoves = ref(0)
  const totalCpLoss = ref(0)

  // Weights for different violations (Total 100 = Busted)
  const WEIGHTS = {
    BLUR: 30,           // Tab switched (3.3 blurs = busted)
    ROBOTIC_RHYTHM: 40, // Low variance in move times
    CORRELATION: 50     // High match rate with top engine moves
  }

  /**
   * Calculates the Standard Deviation of move times.
   */
  const moveTimeVariance = computed(() => {
    if (moveTimes.value.length < 6) return 1000
    
    const n = moveTimes.value.length
    const mean = moveTimes.value.reduce((a, b) => a + b, 0) / n
    const variance = moveTimes.value.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n
    return Math.sqrt(variance)
  })

  /**
   * Robotic score based on timing consistency.
   */
  const roboticScore = computed(() => {
    if (moveTimes.value.length < 8) return 0
    const stdDev = moveTimeVariance.value
    // If stdDev < 1.2s across 8+ moves, it's robotic
    if (stdDev < 1200) return Math.min(100, ((1200 - stdDev) / 1000) * 100)
    return 0
  })

  /**
   * Engine Correlation Score (0-100)
   * High match rate (> 85%) after 10+ moves is extremely suspicious.
   */
  const correlationScore = computed(() => {
    if (totalAnalyzedMoves.value < 10) return 0
    const matchRate = (engineMatches.value / totalAnalyzedMoves.value) * 100
    
    // Humans rarely exceed 75-80% top-move matching in complex positions
    if (matchRate > 85) return Math.min(100, (matchRate - 85) * 6)
    return 0
  })

  /**
   * The aggregate suspicion score (0-100).
   */
  const suspicionScore = computed(() => {
    // We allow blurs to reach 100 (busted) after 4 violations
    const blurScore = Math.min(100, blurCount.value * WEIGHTS.BLUR)
    const rythmPenalty = (roboticScore.value / 100) * WEIGHTS.ROBOTIC_RHYTHM
    const correlationPenalty = (correlationScore.value / 100) * WEIGHTS.CORRELATION
    
    const total = Math.min(100, blurScore + rythmPenalty + correlationPenalty)
    
    // Update Admin Telemetry
    import('../stores/adminStore').then(({ useAdminStore }) => {
      useAdminStore().recordSuspicion(total)
    })

    return total
  })

  const isCheaterBusted = computed(() => suspicionScore.value >= 100)

  /** Records the time taken for the current move. */
  function recordMoveTime() {
    const now = Date.now()
    const elapsed = now - lastMoveTimestamp.value
    moveTimes.value.push(elapsed)
    lastMoveTimestamp.value = now
  }

  /**
   * Records if the player's move matched the engine's suggested best move.
   */
  function recordEngineMatch(isMatch: boolean) {
    totalAnalyzedMoves.value++
    if (isMatch) engineMatches.value++
    
    import('../stores/adminStore').then(({ useAdminStore }) => {
      const store = useAdminStore()
      const matchRate = (engineMatches.value / totalAnalyzedMoves.value) * 100
      store.engineCorrelation = Math.round(matchRate)
    })

    logger.info(`[Anti-Cheat] Engine match: ${isMatch}. Rate: ${((engineMatches.value / totalAnalyzedMoves.value) * 100).toFixed(1)}%`)
  }

  function registerBlur() {
    blurCount.value++
    
    // Fire UI Toast Alert (Longer duration as requested)
    import('../stores/uiStore').then(({ useUiStore }) => {
      const ui = useUiStore()
      ui.addToast(`[WARDEN] Visibility Violation Detected. (Count: ${blurCount.value})`, 'warning', 6000)
    })

    import('../stores/adminStore').then(({ useAdminStore }) => {
      useAdminStore().recordSuspicion(suspicionScore.value, true)
    })
    logger.warn(`[Anti-Cheat] Visibility violation. Count: ${blurCount.value}. Score: ${suspicionScore.value}`)
  }

  function reset() {
    blurCount.value = 0
    moveTimes.value = []
    engineMatches.value = 0
    totalAnalyzedMoves.value = 0
    totalCpLoss.value = 0
    lastMoveTimestamp.value = Date.now()
  }

  return {
    blurCount,
    moveTimes,
    engineMatches,
    totalAnalyzedMoves,
    suspicionScore,
    isCheaterBusted,
    roboticScore,
    correlationScore,
    recordMoveTime,
    recordEngineMatch,
    registerBlur,
    reset
  }
}
