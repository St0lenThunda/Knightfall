import { logger } from '../utils/logger'
import { supabase } from '../api/supabaseClient'
import { TaggingService } from './taggingService'
import { useLibraryStore } from '../stores/libraryStore'

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
      
      // PERSIST TO CLOUD CACHE
      supabase.from('coaching_cache').insert([{
        position_hash: hash,
        fen,
        theme,
        explanation_text: explanation,
        metadata: { severity, playedMove, bestMove }
      }]).then(() => logger.info(`[LlmService] Cached new explanation for ${theme}`))

      return explanation
    } catch (err) {
      logger.error('[LlmService] LLM Call failed', err)
      return "The coach is studying the position... focus on king safety for now!"
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

  private static async callGemini(prompt: string): Promise<string> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    })
    
    if (!response.ok) throw new Error(`Gemini Error: ${response.statusText}`)
    const data = await response.json()
    return data.candidates[0].content.parts[0].text.trim()
  }
}
