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
