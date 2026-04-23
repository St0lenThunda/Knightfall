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
    localStorage.setItem('admin_cache_hits', cacheHits.value.toString())
  }

  function recordCacheMiss(tokens = 0, latency = 0) {
    cacheMisses.value++
    totalTokensUsed.value += tokens
    lastApiLatency.value = latency
    localStorage.setItem('admin_cache_misses', cacheMisses.value.toString())
    localStorage.setItem('admin_total_tokens', totalTokensUsed.value.toString())
  }

  function updateEngineMetrics(nps: number, memory = 0) {
    engineNps.value = nps
    engineMemory.value = memory
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
    isFetching,
    lastUpdated,
    fetchCacheCount,
    recordCacheHit,
    recordCacheMiss,
    updateEngineMetrics
  }
})
