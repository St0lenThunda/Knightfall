import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../api/supabaseClient'
import { logger } from '../utils/logger'

/**
 * Admin Store
 * 
 * Tracks system-level metrics for the Ghostly Terminal (HUD).
 * This store is only intended to be active for users with the 'isAdmin' flag.
 */
export const useAdminStore = defineStore('admin', () => {
  // --- AI CACHE METRICS ---
  const cacheCount = ref(0)
  const cacheHits = ref(Number(localStorage.getItem('admin_cache_hits') || 0))
  const cacheMisses = ref(Number(localStorage.getItem('admin_cache_misses') || 0))
  
  // --- ENGINE METRICS ---
  const engineNps = ref(0)
  const engineThreads = ref(navigator.hardwareConcurrency || 4)
  const engineMemory = ref(0) // MB

  // --- API METRICS ---
  const lastApiLatency = ref(0) // ms
  const totalTokensUsed = ref(Number(localStorage.getItem('admin_total_tokens') || 0))
  const ttfr = ref(0) // Time to First Recommendation (ms)
  const avgDepth = ref(0)
  const depthStability = ref(100) // % consistency
  
  // --- LLM QUALITY METRICS ---
  const totalResponses = ref(Number(localStorage.getItem('admin_total_responses') || 0))
  const avgResponseLength = ref(Number(localStorage.getItem('admin_avg_len') || 0))
  
  // --- BEHAVIORAL & WARDEN ---
  const suspicionPeak = ref(0)
  const suspicionVelocity = ref(0) // points per move
  const engineCorrelation = ref(100) // %
  const blurEvents = ref(0)
  
  // --- INFRASTRUCTURE ---
  const vaultSizeBytes = ref(0)
  const coldBootLatency = ref(0)
  const syncQueueSize = ref(0)
  
  // --- SESSION DYNAMICS ---
  const sessionStartTime = ref(Date.now())
  const movesPlayed = ref(0)
  const movesAnalyzed = ref(0)
  
  // --- STATUS ---
  const isFetching = ref(false)
  const lastUpdated = ref<Date | null>(null)

  // --- COMPUTED ---
  const hitRate = computed(() => {
    const total = cacheHits.value + cacheMisses.value
    if (total === 0) return 0
    return Math.round((cacheHits.value / total) * 100)
  })

  const estimatedCost = computed(() => {
    // Rough estimate for Gemini 1.5 Flash ($0.1 / 1M tokens)
    return (totalTokensUsed.value / 1000000) * 0.1
  })

  const cacheSavings = computed(() => {
    // Estimate $0.0001 per coaching response if it were an LLM call
    return cacheHits.value * 0.0001
  })

  const costPerCall = computed(() => {
    const totalCalls = cacheHits.value + cacheMisses.value
    if (totalCalls === 0) return 0
    return estimatedCost.value / totalCalls
  })

  const sessionDuration = computed(() => {
    return Math.floor((Date.now() - sessionStartTime.value) / 1000)
  })

  const analysisToPlayRatio = computed(() => {
    if (movesPlayed.value === 0) return movesAnalyzed.value
    return (movesAnalyzed.value / movesPlayed.value).toFixed(2)
  })

  const vaultSizeMb = computed(() => (vaultSizeBytes.value / (1024 * 1024)).toFixed(2))

  // --- ACTIONS ---

  async function fetchCacheCount() {
    isFetching.value = true
    try {
      const { count, error } = await supabase
        .from('coaching_cache')
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      
      cacheCount.value = count || 0
      lastUpdated.value = new Date()
    } catch (err) {
      logger.error('[Admin] Failed to fetch cache count:', err)
    } finally {
      isFetching.value = false
    }
  }

  function recordCacheHit() {
    cacheHits.value++
    movesAnalyzed.value++
    localStorage.setItem('admin_cache_hits', cacheHits.value.toString())
  }

  function recordCacheMiss(tokens = 0, latency = 0) {
    cacheMisses.value++
    totalTokensUsed.value += tokens
    lastApiLatency.value = latency
    totalResponses.value++
    movesAnalyzed.value++
    
    // Update Avg Length
    const currentTotal = avgResponseLength.value * (totalResponses.value - 1)
    avgResponseLength.value = Math.round((currentTotal + tokens) / totalResponses.value)
    
    localStorage.setItem('admin_cache_misses', cacheMisses.value.toString())
    localStorage.setItem('admin_total_tokens', totalTokensUsed.value.toString())
    localStorage.setItem('admin_total_responses', totalResponses.value.toString())
    localStorage.setItem('admin_avg_len', avgResponseLength.value.toString())
  }

  function updateEngineMetrics(nps: number, memory = 0, depth = 0, ttfrMs = 0) {
    engineNps.value = nps
    engineMemory.value = memory
    
    if (depth > 0) {
      // Depth Stability: how much the new depth deviates from the average
      if (avgDepth.value > 0) {
        const jitter = Math.abs(depth - avgDepth.value) / avgDepth.value
        const currentStability = Math.max(0, 100 - (jitter * 100))
        depthStability.value = Math.round((depthStability.value + currentStability) / 2)
      }
      avgDepth.value = Math.round((avgDepth.value + depth) / 2)
    }
    
    if (ttfrMs > 0) ttfr.value = ttfrMs
  }

  function recordSuspicion(score: number, isBlur = false) {
    const prevScore = suspicionPeak.value
    if (score > suspicionPeak.value) suspicionPeak.value = score
    
    // Velocity: Average growth per interaction
    const delta = Math.max(0, score - prevScore)
    suspicionVelocity.value = Number(((suspicionVelocity.value + delta) / 2).toFixed(2))
    
    if (isBlur) blurEvents.value++
  }

  return {
    cacheCount,
    cacheHits,
    cacheMisses,
    hitRate,
    engineNps,
    engineThreads,
    engineMemory,
    lastApiLatency,
    totalTokensUsed,
    estimatedCost,
    cacheSavings,
    costPerCall,
    isFetching,
    lastUpdated,
    fetchCacheCount,
    recordCacheHit,
    recordCacheMiss,
    updateEngineMetrics,
    recordSuspicion,
    ttfr,
    avgDepth,
    depthStability,
    totalResponses,
    avgResponseLength,
    suspicionPeak,
    suspicionVelocity,
    engineCorrelation,
    blurEvents,
    vaultSizeBytes,
    vaultSizeMb,
    coldBootLatency,
    syncQueueSize,
    sessionStartTime,
    sessionDuration,
    movesPlayed,
    movesAnalyzed,
    analysisToPlayRatio
  }
})
