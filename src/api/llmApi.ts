import { logger } from '../utils/logger'
import { supabase } from './supabaseClient'
import { TaggingService } from '../services/taggingService'

export interface CoachingRequest {
  fen: string
  theme?: string
  mistakeType?: string
  evalNumber: number
  pv: string[]
  moveSan?: string | null
  moveNumber?: number | null
  side?: string
  bestMove?: string
  playerName?: string
  opponentName?: string
  isUserMove?: boolean
}

/**
 * DETERMINISTIC COACHING ENGINE (Offline Fallback)
 * 
 * This fires when no Gemini API key is available. Instead of generic filler,
 * it uses the actual position data (eval, best move, move number, side) to
 * produce context-aware coaching insights.
 */
function generateMockCoaching(req: CoachingRequest): string {
  const move = req.moveSan || '??'
  const best = req.bestMove || 'unknown'
  const isUser = req.isUserMove
  const player = isUser ? "You" : (req.playerName || 'The opponent')
  const opponent = isUser ? (req.opponentName || 'The opponent') : "you"
  const evalAbs = Math.abs(req.evalNumber)
  const evalStr = `${req.evalNumber > 0 ? '+' : ''}${req.evalNumber.toFixed(1)}`
  const moveNum = req.moveNumber || 0

  // Classify the move quality based on eval context
  const isBestMove = move === best || best === 'unknown'
  const isExcellent = isBestMove || evalAbs < 0.3
  const isGood = !isBestMove && evalAbs < 0.8
  const isInaccuracy = !isBestMove && evalAbs >= 0.8 && evalAbs < 2.0

  // Phase detection
  const phase = moveNum <= 10 ? 'opening' : moveNum <= 30 ? 'middlegame' : 'endgame'
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

  // --- EXCELLENT / BEST MOVE ---
  if (isExcellent) {
    return pick([
      `**${move}** is the engine's top choice. ${isUser ? "You've found" : `${player} found`} the strongest continuation — the evaluation remains at **${evalStr}**.`,
      `Strong play! **${move}** is precisely what Stockfish recommends. ${isUser ? "Your" : `${player}'s`} piece coordination keeps the initiative firmly in hand.`,
      `**${move}** — textbook ${phase} play. ${isUser ? "You" : player} correctly prioritized ${phase === 'opening' ? 'development' : 'activity'}.`,
    ])
  }

  // --- GOOD BUT NOT BEST ---
  if (isGood) {
    return pick([
      `**${move}** is a solid choice (${evalStr}), though the engine prefers **${best}**. ${isUser ? "You" : player} kept the position stable, but **${best}** was a slightly sharper path.`,
      `Not the top pick, but **${move}** is perfectly playable. Stockfish suggests **${best}** for ${isUser ? "you" : player} to maintain more pressure.`,
    ])
  }

  // --- INACCURACY / MISTAKE ---
  if (isInaccuracy) {
    return pick([
      `**${move}** is an inaccuracy (${evalStr}). The engine prefers **${best}**. ${isUser ? "You missed" : `${player} missed`} the chance to ${pick([`exploit a tactical vulnerability`, `activate a key piece` ])}.`,
      `A missed opportunity. **${move}** allows ${isUser ? "the opponent" : "you"} to equalize. The key idea was **${best}**, which ${pick(['attacks a pinned piece', 'opens a critical file'])}.`,
    ])
  }

  // --- BLUNDER ---
  return pick([
    `**${move}** is a serious mistake — the eval swings to **${evalStr}**. ${isUser ? "You" : player} missed **${best}**, which was critical to ${pick([`prevent a tactical sequence`, 'defend against a threat'])}.`,
    `This is the turning point. **${move}** drops **${evalAbs.toFixed(1)}** pawns. ${isUser ? "You" : player} needed **${best}** to stay competitive.`,
  ])
}

/**
 * Shared helper to call the Gemini API and parse the response text.
 */
async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  })
  
  if (!response.ok) {
    const errorBody = await response.text();
    logger.error(`Gemini API Error Body:`, errorBody);
    throw new Error(`Gemini API error: ${response.statusText} - ${errorBody}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text.trim()
}

export async function generateCoaching(req: CoachingRequest): Promise<string> {
  logger.info( `[LLM API] generateCoaching entered for move: ${req.moveSan}` )
  
  // 1. GENERATE HASH FOR CACHE CHECK
  const theme = req.theme || 'General Analysis'
  const severity = req.evalNumber > 2.0 ? 'blunder' : req.evalNumber > 0.8 ? 'mistake' : 'inaccuracy'
  const hash = await TaggingService.generatePositionHash(req.fen, theme, severity, req.playerName)

  // 2. CHECK SUPABASE CACHE
  try {
    const { data: cached } = await supabase
      .from('coaching_cache')
      .select('explanation_text')
      .eq('position_hash', hash)
      .maybeSingle()

    if (cached) {
      logger.info(`[LLM API] Cache Hit! Returning precomputed explanation.`)
      return cached.explanation_text
    }
  } catch (err) {
    logger.warn('[LLM API] Cache check failed:', err)
  }

  // 3. FALLBACK TO LLM GENERATION
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    await new Promise( resolve => setTimeout( resolve, 600 + Math.random() * 600 ) )
    return generateMockCoaching( req )
  }

  const sideLong = req.side === 'White' || req.side === 'w' ? 'White' : 'Black'
  
  const prompt = `You are an elite Chess Coach giving a PRIVATE LESSON to your student.
  
PERSPECTIVE RULES:
1. Always speak DIRECTLY to your student in the second person ("You", "Your").
2. The student ("You") is playing as ${sideLong}.
3. The opponent is ${req.isUserMove ? req.opponentName : req.playerName}.
4. NARATION LOGIC (CRITICAL):
   - If req.isUserMove is true: It was the student's turn. Use "You played ${req.moveSan}", "Your move...", etc.
   - If req.isUserMove is false: It was the opponent's turn. Use "The opponent played ${req.moveSan}", "They chose...", etc.
5. NO HYPOTHETICALS: Use "You played", "The opponent played", "You missed", "They missed". Do NOT say "You should have" or "It would have been better if". Be direct.
6. If the opponent (${req.isUserMove ? req.opponentName : req.playerName}) just moved, explain to the student how it affects THEIR position.

SITUATION:
- Move: **${req.moveSan}** by ${req.isUserMove ? 'the student (You)' : 'the opponent'}.
- Student Color: ${sideLong}
- FEN: ${req.fen}
- Engine Best Move: ${req.bestMove ?? 'unknown'}
- Engine Recommendation: ${req.pv.slice(0, 5).join(' ')}
- Evaluation: ${req.evalNumber > 0 ? '+' : ''}${req.evalNumber.toFixed(2)}
- Quality: This move is a ${severity} (${theme}).

INSTRUCTIONS:
In 2-3 actionable sentences, mentor the student. 
- If the student moved, explain the quality of their choice.
- If the opponent moved, explain the threat they created or the opportunity they gave the student.
- Evaluation Interpretation: ${sideLong === 'White' ? 'Positive score (+) means you (White) are winning.' : 'Negative score (-) means you (Black) are winning.'} Speak accordingly.`

  try {
    logger.info( `LLM API Request: ${prompt}` )
    const responseText = await callGemini(prompt, apiKey)
    logger.info( `LLM API Response: ${responseText}` )

    // 4. PERSIST TO CACHE FOR FUTURE USERS
    supabase.from('coaching_cache').insert([{
      position_hash: hash,
      fen: req.fen,
      theme,
      mistake_type: req.mistakeType,
      explanation_text: responseText,
      metadata: { severity, player: req.playerName }
    }]).then(({ error }) => {
      if (error) logger.warn('[LLM API] Failed to persist to cache:', error)
    })

    return responseText
  } catch (err: any) {
    logger.error("LLM Generation failed:", err)
    
    if (err.message && err.message.includes('503')) {
      logger.info("[LLM API] Gemini 503 detected. Falling back to deterministic mock.")
      return generateMockCoaching(req)
    }

    return "The AI coach is currently unavailable. Focus on developing your pieces toward active squares and keeping your king safe!"
  }
}

export async function generateBlunderAlert(fen: string, moveSan: string, evalBefore: number, evalAfter: number, bestMove: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  const evalDrop = Math.abs(evalAfter - evalBefore).toFixed(1)

  if (!apiKey) {
    await new Promise(r => setTimeout(r, 400 + Math.random() * 400))
    const msgs = [
      `**Blunder detected!** ${moveSan} drops ${evalDrop} pawns. The engine preferred **${bestMove}** — look for tactics that exploit your opponent's weaknesses before committing.`,
      `**Careful!** ${moveSan} was a ${parseFloat(evalDrop) > 2 ? 'serious' : 'notable'} mistake (−${evalDrop}). **${bestMove}** kept the position sharp. Watch for hanging pieces and undefended squares.`,
      `**Inaccuracy alert:** ${moveSan} cost you ${evalDrop} evaluation points. The key idea was **${bestMove}**, which maintained pressure on the critical files and diagonals.`,
    ]
    return msgs[Math.floor(Math.random() * msgs.length)]
  }

  const prompt = `You are a chess coach giving URGENT live feedback during a game. The student just made a mistake.

Position (FEN): ${fen}
Move played: ${moveSan}
Engine best move: ${bestMove}
Eval before: ${evalBefore > 0 ? '+' : ''}${evalBefore.toFixed(1)}
Eval after: ${evalAfter > 0 ? '+' : ''}${evalAfter.toFixed(1)}

In 1-2 SHORT sentences with markdown:
1. Name the mistake type (tactical blunder, positional error, etc.)
2. Briefly say what ${bestMove} achieved that ${moveSan} missed
3. Give one concrete thing to watch for in the next 2-3 moves
Keep it encouraging but direct. Use **bold** for key moves/concepts.`

  try {
    return await callGemini(prompt, apiKey)
  } catch (err) {
    logger.error("[BlunderAlert] LLM failed:", err)
    return `**${moveSan}** was inaccurate (−${evalDrop}). The engine preferred **${bestMove}**. Stay alert for tactical opportunities!`
  }
}

export async function generatePositionExplain(fen: string, evalNum: number, pv: string[], lastMove: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    await new Promise(r => setTimeout(r, 500 + Math.random() * 500))
    const side = evalNum > 0.3 ? 'White' : evalNum < -0.3 ? 'Black' : 'Neither side'
    return `### Position Assessment\n\n**Evaluation:** ${evalNum > 0 ? '+' : ''}${evalNum.toFixed(1)}\n\n${side} has a ${Math.abs(evalNum) > 2 ? 'decisive' : Math.abs(evalNum) > 0.5 ? 'clear' : 'slight'} advantage. The engine's top line is **${pv.slice(0, 4).join(' ')}**, focusing on ${evalNum > 0 ? 'maintaining pressure' : 'finding counterplay'}. Key factors: piece activity, king safety, and pawn structure.`
  }

  const prompt = `You are a Grandmaster explaining a chess position to a student during a live game.

Position (FEN): ${fen}
Last move played: ${lastMove}
Engine evaluation: ${evalNum > 0 ? '+' : ''}${evalNum.toFixed(2)}
Engine's top line: ${pv.slice(0, 6).join(' ')}

Give a rich **markdown** breakdown in 3-5 sentences:
1. **Who stands better and why** (material, structure, king safety, piece activity)
2. **Key squares and plans** for both sides
3. **What to watch for** in the next few moves
Use ### headings, **bold** for key concepts, and bullet points where helpful. Be insightful but concise.`

  try {
    return await callGemini(prompt, apiKey)
  } catch (err) {
    logger.error("[PositionExplain] LLM failed:", err)
    return `### Position Assessment\n\nEvaluation: **${evalNum > 0 ? '+' : ''}${evalNum.toFixed(1)}**. Unable to generate detailed analysis at this time.`
  }
}
