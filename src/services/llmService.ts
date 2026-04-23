import { logger } from '../utils/logger'
import { supabase } from '../api/supabaseClient'
import { TaggingService } from './taggingService'
import { useLibraryStore } from '../stores/libraryStore'
import { useAdminStore } from '../stores/adminStore'

/**
 * LLM SERVICE (The Coach Architecture)
 * 
 * Implements the "Trigger + Cache" pattern to manage AI costs while 
 * providing premium, high-contrast coaching.
 * 
 * DESIGN PRINCIPLES:
 * 1. ROLE → TASK → INPUT → CONSTRAINTS → OUTPUT FORMAT
 * 2. Deterministic First (Stockfish/Tagging before LLM)
 * 3. Global Caching by Position Hash
 */

export interface CoachingRequest {
  fen: string
  bestMove: string
  playedMove: string
  theme: string
  severity: string
  playerName?: string
  isManualTrigger?: boolean
  historyCount?: number // How many times this mistake appeared
}

export interface SessionSummaryRequest {
  themes: string[]
  strengths: string[]
  weaknesses: string[]
}

export class LlmService {
  private static API_KEY = import.meta.env.VITE_GEMINI_API_KEY
  private static resolvedModel: string | null = null
  private static blacklistedModels: Set<string> = new Set()
  private static canWriteToCache = true // Circuit breaker for 403s

  /**
   * Dynamically resolves the best available Flash model for the current API key.
   * Excludes models that have recently failed with a 503 or 404.
   */
  private static async getBestModel(): Promise<string> {
    // If we have a resolved model that isn't blacklisted, use it
    if (this.resolvedModel && !this.blacklistedModels.has(this.resolvedModel)) {
      return this.resolvedModel
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.API_KEY}`)
      if (!response.ok) throw new Error("Failed to list models")
      
      const data = await response.json()
      const models = data.models || []

      // Heuristic: Find 'flash' models supporting generateContent, excluding blacklisted ones
      const flashModels = models
        .filter((m: any) => 
          m.name.toLowerCase().includes('flash') && 
          m.supportedGenerationMethods.includes('generateContent') &&
          !this.blacklistedModels.has(m.name)
        )
        .sort((a: any, b: any) => {
          const vA = parseFloat(a.name.match(/\d+\.\d+/) || [0])
          const vB = parseFloat(b.name.match(/\d+\.\d+/) || [0])
          return vB - vA
        })

      if (flashModels.length > 0) {
        // Prefer 'latest' aliases only if they aren't blacklisted
        const latestAlias = flashModels.find((m: any) => m.name.includes('latest'))
        const selected = latestAlias ? latestAlias.name : flashModels[0].name
        this.resolvedModel = selected
        
        logger.info(`[LlmService] Dynamic Discovery: Selected ${selected} (Blacklist size: ${this.blacklistedModels.size})`)
        return selected
      }

      // If all Flash models are blacklisted, clear blacklist and try once more or fallback to Pro
      if (this.blacklistedModels.size > 0) {
        logger.warn("[LlmService] All Flash models blacklisted. Resetting blacklist.")
        this.blacklistedModels.clear()
        return this.getBestModel()
      }

      return "models/gemini-2.5-flash"
    } catch (err) {
      logger.warn("[LlmService] Discovery failed, using fallback:", err)
      return "models/gemini-2.5-flash"
    }
  }

  /**
   * Explains a specific mistake using the "Coach-first" tiered approach.
   * Level 1: Deterministic Tag (Instant, Free)
   * Level 2: Local/Cloud Cache (Instant, Free)
   * Level 3: LLM Generation (Latency, Cost)
   */
  static async explainMistake(req: CoachingRequest): Promise<string> {
    const { fen, theme, severity, playedMove, bestMove, isManualTrigger, historyCount = 1 } = req
    
    // 1. GENERATE CACHE KEY
    const hash = await TaggingService.generatePositionHash(fen, theme, severity)
    
    // 2. CHECK LOCAL ANALYSIS CACHE (LibraryStore)
    const library = useLibraryStore()
    // Find if any game in the map has this FEN cached
    const localHit = Array.from(library.gamesMap.values())
      .find(g => g.analysisCache?.[fen])?.analysisCache?.[fen]
    
    if (localHit) {
      logger.info(`[LlmService] Local Cache Hit for ${hash.substring(0, 8)}`)
      useAdminStore().recordCacheHit()
      return localHit
    }

    // 3. CHECK CLOUD CACHE (Supabase)
    try {
      const { data: cloudHit } = await supabase
        .from('coaching_cache')
        .select('explanation_text')
        .eq('position_hash', hash)
        .maybeSingle()
      
      if (cloudHit) {
        logger.info(`[LlmService] Cloud Cache Hit for ${hash.substring(0, 8)}`)
        useAdminStore().recordCacheHit()
        return cloudHit.explanation_text
      }
    } catch (err) {
      logger.warn('[LlmService] Cloud cache check failed', err)
    }

    // 4. TRIGGER LOGIC: Should we call the LLM?
    const shouldCallLlm = isManualTrigger || historyCount >= 3 || severity === 'blunder'
    
    if (!shouldCallLlm) {
      // Level 1: Deterministic fallback if not "high-value" enough
      return `You blundered with ${playedMove}. The engine preferred ${bestMove} as it maintains piece activity and tactical safety.`
    }

    // 5. CALL LLM (GEMINI)
    if (!this.API_KEY) {
      logger.warn('[LlmService] No API key, returning Level 1 fallback.')
      return `Mistake detected: ${theme}. Try to find why ${bestMove} is stronger.`
    }

    // SELECT TEMPLATE (From Local Rules)
    const promptTemplate = historyCount >= 3 ? this.getPatternPrompt(req) : this.getBasicPrompt(req)
    
    try {
      const explanation = await this.callGemini(promptTemplate)
      
      // PERSIST TO CLOUD CACHE (Global Library) - Only if circuit breaker is healthy
      if (this.canWriteToCache) {
        const { error: persistError } = await supabase.from('coaching_cache').insert([{
          position_hash: hash,
          fen,
          theme,
          mistake_type: severity,
          explanation_text: explanation,
          metadata: { severity, playedMove, bestMove }
        }])

        if (persistError) {
          if (persistError.code === '42501') { // Supabase RLS error
            this.canWriteToCache = false
            logger.warn(`[LlmService] Persistence disabled for session: 403 Forbidden. Your Supabase 'coaching_cache' table needs an INSERT policy for the 'anon' role.`)
          } else {
            logger.warn('[LlmService] Could not persist to cloud cache:', persistError.message)
          }
        } else {
          logger.info(`[LlmService] Globally cached new explanation for ${theme}`)
        }
      }

      return explanation
    } catch (err) {
      logger.error('[LlmService] LLM Call failed', err)
      return "The coach is studying the position... focus on piece activity for now!"
    }
  }

  /**
   * Generates a high-ROI session summary.
   */
  static async generateSessionSummary(req: SessionSummaryRequest): Promise<string> {
    if (!this.API_KEY) return "Great session! You're making progress in tactical awareness."

    const prompt = `
ROLE: Supportive Chess Coach
TASK: Summarize a training session
INPUT:
- Top mistakes: ${req.themes.join(', ')}
- Strengths: ${req.strengths.join(', ')}
- Weaknesses: ${req.weaknesses.join(', ')}

CONSTRAINTS:
- Encouraging tone
- Max 5 sentences total
- 1 focus goal for next session

OUTPUT FORMAT: Structured summary.
`
    return this.callGemini(prompt)
  }

  // --- PROMPT TEMPLATES (Strictly following .agent/rules/prompt-library.md) ---

  private static getBasicPrompt(req: CoachingRequest): string {
    return `
ROLE: Chess Coach
TASK: Explain why the move is a mistake
INPUT:
- Position (FEN): ${req.fen}
- Best move: ${req.bestMove}
- Played move: ${req.playedMove}
- Theme: ${req.theme}

CONSTRAINTS:
- Max 2 sentences
- No chess notation beyond moves given
- Focus on the main idea only

OUTPUT: Short explanation.
`
  }

  private static getPatternPrompt(req: CoachingRequest): string {
    return `
ROLE: Senior Chess Coach
TASK: Help a player fix RECURRING mistakes in ${req.theme}
INPUT:
- Theme: ${req.theme}
- Mistake: ${req.playedMove}
- Best move: ${req.bestMove}

CONSTRAINTS:
- Max 3 sentences
- Emphasize recognition patterns
- Include 1 actionable tip

OUTPUT: Coaching-style explanation.
`
  }

  // --- INTERNAL UTILS ---

  /**
   * Executes the Gemini call with exponential backoff and model failover.
   * Resilient against 503 (Overloaded) and 429 (Rate Limit) errors.
   */
  private static async callGemini(prompt: string, attempt: number = 0): Promise<string> {
    const MAX_ATTEMPTS = 5 // Increased for better stability during outages
    const model = await this.getBestModel()
    const urlModel = model.startsWith('models/') ? model : `models/${model}`

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${urlModel}:generateContent?key=${this.API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      })

      // SUCCESS PATH
      if (response.ok) {
        const start = Date.now()
        const data = await response.json()
        const latency = Date.now() - start
        const tokens = data.usageMetadata?.totalTokenCount || 0
        
        useAdminStore().recordCacheMiss(tokens, latency)
        return data.candidates[0].content.parts[0].text.trim()
      }

      // ERROR HANDLING
      if (response.status === 404) {
        // Model retired or deleted - blacklist and force re-discovery
        this.blacklistedModels.add(model)
        this.resolvedModel = null
        if (attempt < MAX_ATTEMPTS) return this.callGemini(prompt, attempt + 1)
      }

      if (response.status === 503 || response.status === 429) {
        // Service overloaded or rate limited
        if (attempt < MAX_ATTEMPTS) {
          const delay = Math.pow(2, attempt) * 1000
          logger.warn(`[LlmService] ${response.status} detected on ${model}. Rotating model and retrying in ${delay}ms... (Attempt ${attempt + 1}/${MAX_ATTEMPTS})`)
          
          // ZERO-TOLERANCE ROTATION: Blacklist immediately on first 503/429
          this.blacklistedModels.add(model)
          this.resolvedModel = null

          await new Promise(resolve => setTimeout(resolve, delay))
          return this.callGemini(prompt, attempt + 1)
        }
      }

      throw new Error(`Gemini Error: ${response.status} ${response.statusText}`)
    } catch (err) {
      if (attempt < MAX_ATTEMPTS && err instanceof Error && !err.message.includes('404')) {
        return this.callGemini(prompt, attempt + 1)
      }
      throw err
    }
  }
}
