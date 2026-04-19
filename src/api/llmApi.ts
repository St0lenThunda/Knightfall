export interface CoachingRequest {
  fen: string
  evalNumber: number
  pv: string[]
  moveSan?: string | null
  moveNumber?: number | null
  side?: string
  bestMove?: string
  playerName?: string
  opponentName?: string
}

function generateMockCoaching ( req: CoachingRequest ): string {
  const isGood = req.evalNumber > -0.5 && req.evalNumber < 0.5 || ( req.side === 'White' ? req.evalNumber > 0 : req.evalNumber < 0 )

  const intros = [
    `${req.playerName}, analyzing ${req.moveSan}: `,
    `Regarding ${req.playerName}'s choice of ${req.moveSan}, `,
    `In this position, ${req.playerName} played ${req.moveSan}. `,
    `The move ${req.moveSan} was an interesting choice by ${req.playerName}. `,
  ]

  const evaluations = isGood
    ? [
      `maintains a strong position. It keeps the pressure on the opponent while developing key squares.`,
      `is a solid prophylactic choice that prevents the engine's feared counterplay.`,
      `shows good positional awareness, though the engine slightly prefers ${req.bestMove} for tactical reasons.`,
      `is very playable! It leads to a balanced middle-game where your piece activity remains high.`
    ]
    : [
      `allows a significant tactical shift. The engine identifies a vulnerability that ${req.bestMove} would have covered.`,
      `concedes some central control. By missing ${req.bestMove}, you gave your opponent a chance to consolidate.`,
      `is a bit premature in this structure. The engine's recommendation of ${req.bestMove} aims for better long-term outposts.`,
      `is a tough concession. The eval shift of ${Math.abs( req.evalNumber ).toFixed( 1 )} suggests a missed opportunity for higher pressure.`
    ]

  const closings = [
    ` Focus on king safety and central control in the coming moves.`,
    ` Watch out for the opponent's next knight maneuver!`,
    ` This leads to a complex line where tactical precision will be key.`,
    ` A good learning moment—always look for the most active square first.`
  ]

  const getRand = ( arr: any[] ) => arr[Math.floor( Math.random() * arr.length )]

  return `${getRand( intros )}${getRand( evaluations )}${getRand( closings )}`
}

export async function generateCoaching(req: CoachingRequest): Promise<string> {
  console.log( `[LLM API] generateCoaching entered for move: ${req.moveSan}` )
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    // Artificial delay to feel "real"
    await new Promise( resolve => setTimeout( resolve, 600 + Math.random() * 600 ) )
    return generateMockCoaching( req )
  }

  const prompt = `You are a Grandmaster chess coach reviewing a SPECIFIC MOVE from a game between ${req.playerName} (Student) and ${req.opponentName}.

Position (FEN) before the move: ${req.fen}
The student (${req.playerName}) played: ${req.moveSan}
The engine's best recommendation was: ${req.bestMove ?? 'unknown'}
Engine's recommended line: ${req.pv.slice(0, 5).join(' ')}
Evaluation shift: ${req.evalNumber > 0 ? '+' : ''}${req.evalNumber.toFixed( 2 )}

In 2-3 high-impact, actionable sentences:
1. Explictly state the difference between ${req.playerName}'s move (${req.moveSan}) and the best move (${req.bestMove}).
2. Explain the "Why" — what does the engine's move achieve that the played move misses? Be specific about tactical threats, piece activity, or structural changes.
3. Don't just say what is better; explain the relative cost of the chosen move.
4. Keep the tone encouraging but scientifically precise.`

  try {
    const response = await fetch( `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    })
    console.log( `LLM API Request: ${prompt}` )
    if (!response.ok) {
      const errorBody = await response.text();
      console.error( `Gemini API Error Body:`, errorBody );
      throw new Error( `Gemini API error: ${response.statusText} - ${errorBody}` )
    }

    const data = await response.json()
    const dataContent = data.candidates[0].content.parts[0].text.trim()
    console.log( `LLM API Response: ${dataContent}` )
    return dataContent
  } catch (err) {
    console.error("LLM Generation failed:", err)
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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })
    if (!response.ok) throw new Error(`API ${response.status}`)
    const data = await response.json()
    return data.candidates[0].content.parts[0].text.trim()
  } catch (err) {
    console.error("[BlunderAlert] LLM failed:", err)
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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })
    if (!response.ok) throw new Error(`API ${response.status}`)
    const data = await response.json()
    return data.candidates[0].content.parts[0].text.trim()
  } catch (err) {
    console.error("[PositionExplain] LLM failed:", err)
    return `### Position Assessment\n\nEvaluation: **${evalNum > 0 ? '+' : ''}${evalNum.toFixed(1)}**. Unable to generate detailed analysis at this time.`
  }
}
