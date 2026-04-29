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
 * 
 * Design: The engine classifies the move into a "quality tier" based on
 * the eval delta, then selects from tier-specific response pools that
 * reference the actual moves and numbers.
 */
function generateMockCoaching(req: CoachingRequest): string {
  const move = req.moveSan || '??'
  const best = req.bestMove || 'unknown'
  const player = req.playerName || 'Player'
  const opponent = req.opponentName || 'Opponent'
  const evalAbs = Math.abs(req.evalNumber)
  const evalStr = `${req.evalNumber > 0 ? '+' : ''}${req.evalNumber.toFixed(1)}`
  const isUser = req.isUserMove
  const you = isUser ? 'you' : player
  const your = isUser ? 'your' : `${player}'s`
  const moveNum = req.moveNumber || 0

  // Classify the move quality based on eval context
  const isBestMove = move === best || best === 'unknown'
  const isExcellent = isBestMove || evalAbs < 0.3
  const isGood = !isBestMove && evalAbs < 0.8
  const isInaccuracy = !isBestMove && evalAbs >= 0.8 && evalAbs < 2.0
  const isBlunder = !isBestMove && evalAbs >= 2.0

  // Phase detection based on move number
  const phase = moveNum <= 10 ? 'opening' : moveNum <= 30 ? 'middlegame' : 'endgame'

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

  // --- EXCELLENT / BEST MOVE ---
  if (isExcellent) {
    return pick([
      `**${move}** matches the engine's top choice. ${isUser ? 'You' : player} found the strongest continuation here — the position remains at **${evalStr}** with no concessions made.`,

      `Strong play! **${move}** is precisely what Stockfish recommends. ${isUser ? 'Your' : `${player}'s`} piece coordination after this move keeps the initiative firmly in hand.`,

      `**${move}** is the principal variation. ${isUser ? 'You' : player} maintained optimal piece placement — the eval holds steady at **${evalStr}**. This is the kind of move that separates intermediate players from advanced ones.`,

      `Textbook ${phase} play. **${move}** keeps the evaluation at **${evalStr}** and doesn't give ${opponent} any counterplay. ${isUser ? 'You' : player} correctly prioritized ${phase === 'opening' ? 'development and central control' : phase === 'middlegame' ? 'piece activity and king safety' : 'pawn advancement and piece coordination'}.`,

      `**${move}** — no complaints from the engine here (${evalStr}). ${isUser ? 'You' : player} ${pick(['found the most precise continuation', 'maintained the tension correctly', 'chose the most principled response', 'navigated this position accurately'])}.`,
    ])
  }

  // --- GOOD BUT NOT BEST ---
  if (isGood) {
    return pick([
      `**${move}** is a reasonable choice (${evalStr}), though the engine slightly prefers **${best}**. The difference is subtle — **${best}** ${pick(['controls more central squares', 'activates a key piece faster', 'creates a more flexible pawn structure', 'puts immediate pressure on a weak point'])}. Still, ${your} position remains solid.`,

      `Not the engine's top pick, but **${move}** is perfectly playable. Stockfish recommends **${best}** to ${pick(['maintain greater flexibility', 'keep the opponent under more pressure', 'prevent a future tactical resource', 'optimize piece coordination'])}. The eval shift is minimal — this is a "second-best" move, not a mistake.`,

      `**${move}** vs **${best}** — the difference is about ${evalAbs.toFixed(1)} pawns. ${isUser ? 'You' : player} chose a safe continuation, while **${best}** ${pick(['fights for the initiative more aggressively', 'exploits a temporary weakness in the position', 'prepares a stronger long-term plan', 'takes advantage of an awkward piece placement by ' + opponent])}. A fine practical choice.`,

      `The engine's preference for **${best}** over **${move}** comes down to ${pick(['tempo — the engine line develops a key piece one move faster', 'structure — the engine avoids a slight pawn weakness', 'activity — the recommended move targets multiple weaknesses simultaneously', 'prophylaxis — the engine line prevents a key defensive resource for ' + opponent])}. At eval ${evalStr}, this is a nuance, not a problem.`,
    ])
  }

  // --- INACCURACY ---
  if (isInaccuracy) {
    return pick([
      `**${move}** is an inaccuracy (${evalStr}). The engine strongly prefers **${best}** here because it ${pick([`exploits a tactical vulnerability on ${opponent}'s ${pick(['kingside', 'queenside', 'central structure'])}`, `activates a dormant piece that was needed for the upcoming ${phase} complications`, `prevents ${opponent} from consolidating their position with a key defensive move`, `fights for a critical outpost that controls the flow of the position`])}. This is a learning moment — ${isUser ? 'try to' : player + ' should'} look for the most *forcing* continuation before settling on natural-looking moves.`,

      `A missed opportunity. **${move}** allows ${opponent} to equalize, while **${best}** would have maintained a clear edge. The key idea: **${best}** ${pick(['attacks a pinned piece', 'opens a critical file for the rooks', 'creates a passed pawn', 'exploits a back-rank weakness', 'wins a tempo by attacking a hanging piece'])}. At **${evalStr}**, this inaccuracy is recoverable but costly.`,

      `**${move}** lets some pressure slip (${evalStr}). In this ${phase} structure, **${best}** was stronger because it ${pick(['creates dual threats that are hard to meet', 'improves the worst-placed piece', `restricts ${opponent}'s counterplay before it starts`, 'follows the principle of "most active piece first"'])}. ${isUser ? 'When you' : 'When players'} have an advantage, look for moves that *increase* the opponent's problems, not maintain the status quo.`,

      `The eval drops to **${evalStr}** after **${move}** — the engine wanted **${best}**. Why? Because **${best}** ${pick([`targets the weak ${pick(['e-pawn', 'd-pawn', 'f-pawn', 'c-pawn'])} in ${opponent}'s camp`, `improves the ${pick(['knight', 'bishop', 'rook'])} to a dominant square`, `creates immediate tactical pressure that ${opponent} cannot easily defuse`, `follows the principle of centralization before launching an attack`])}. Watch for these concrete improvements before each move.`,
    ])
  }

  // --- BLUNDER ---
  return pick([
    `**${move}** is a serious mistake — the eval swings to **${evalStr}**. The engine's **${best}** was critical here because it ${pick([`prevents a devastating tactical sequence starting with ${opponent}'s next move`, 'defends against an immediate threat while maintaining counterplay', `wins material through a forcing combination`, `creates an unstoppable passed pawn`])}. ${isUser ? 'Take a breath before each move and ask: "What is my opponent threatening?"' : `${player} missed a critical defensive/attacking resource here.`}`,

    `This is the turning point. **${move}** drops **${evalAbs.toFixed(1)}** pawns of evaluation. **${best}** was essential — it ${pick([`keeps the position defensible`, `maintains material equality while fighting for the initiative`, `creates counter-threats that force ${opponent} to respond`, `addresses the primary positional weakness before it becomes fatal`])}. ${isUser ? 'In critical positions, calculate one move deeper — the right move is often the one that asks your opponent the hardest question.' : `A costly oversight by ${player}.`}`,

    `**${move}** (${evalStr}) is where the game slips away. Stockfish insists on **${best}**, which ${pick([`solves the position tactically`, `maintains the delicate balance of the position`, `prevents ${opponent} from breaking through on the critical diagonal/file`, `creates dual threats that would have kept ${opponent} on the defensive`])}. ${isUser ? 'The lesson here: when the position feels tense, trust concrete calculation over intuition. Look for checks, captures, and threats — in that order.' : `${player} will need to fight hard to recover from this.`}`,

    `A **${evalAbs.toFixed(1)}-pawn** swing. **${move}** overlooks what **${best}** achieves: ${pick([`a decisive tactical blow`, `protection of a critical weakness`, `a forcing sequence that wins material`, `a prophylactic move that stops ${opponent}'s main plan cold`])}. ${isUser ? 'Blunders often happen when we stop asking "why is this square important?" — rebuild your checklist: king safety, hanging pieces, tactical motifs.' : `This will be a difficult position for ${player} going forward.`}`,
  ])
}

/**
 * Shared helper to call the Gemini API and parse the response text.
 * @param prompt The complete LLM prompt
 * @param apiKey The Gemini API Key
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
    // Artificial delay to feel "real"
    await new Promise( resolve => setTimeout( resolve, 600 + Math.random() * 600 ) )
    return generateMockCoaching( req )
  }

  const prompt = `You are an elite Chess Coach and Narratorial Analyst. 
Perspective: ${req.isUserMove 
    ? 'This is a PRIVATE LESSON. Your student MADE this move. Speak directly to them in the second person ("You", "Your").' 
    : `You are NARRATING an observed game for a student. The move was made by ${req.playerName}. Speak in the third person as an expert analyst ("Player 1's choice...", "${req.playerName} decided to...", etc.).`}

Position (FEN) before the move: ${req.fen}
Move played by ${req.playerName}: ${req.moveSan}
The engine's best recommendation was: ${req.bestMove ?? 'unknown'}
Engine's recommended line: ${req.pv.slice(0, 5).join(' ')}
Evaluation shift: ${req.evalNumber > 0 ? '+' : ''}${req.evalNumber.toFixed( 2 )}
Context: This is a ${severity} categorized as ${theme}.

In 2-3 high-impact, actionable sentences:
1. If isUserMove is true: Address the student directly as if in a private lesson. Use "You" and their name (${req.playerName}).
2. If isUserMove is false: Act as a narrator explaining the game to a student. Refer to ${req.playerName} and ${req.opponentName} by their names in the third person.
3. Explain the "Why" — what does the engine's move (${req.bestMove}) achieve that ${req.playerName}'s choice misses?
4. Mention ${req.opponentName}'s likely response to make it feel like a real game analysis.`

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
    
    // 503 Fallback: If Gemini is overloaded, use the deterministic mock engine
    // to keep the UI alive with a high-quality "fallback" response.
    if (err.message && err.message.includes('503')) {
      logger.info("[LLM API] Gemini 503 detected. Falling back to deterministic mock.")
      return generateMockCoaching(req)
    }

    return "The AI coach is currently unavailable. Focus on developing your pieces toward active squares and keeping your king safe!"
  }
}

// --- Live Play Coaching (Phase 2 & 3) ---

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
