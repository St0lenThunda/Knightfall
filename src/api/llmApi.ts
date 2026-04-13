export interface CoachingRequest {
  fen: string
  evalNumber: number
  pv: string[]
  moveSan?: string | null
  moveNumber?: number | null
  side?: string
  bestMove?: string
}

const MOCK_RESPONSES = [
  "The move you played keeps central tension alive — a solid practical choice. The engine's recommendation aims to seize outpost control on d5, which would give you a permanent structural advantage. Focus on piece activity over material here.",
  "This was a sharp moment! The engine actually prefers a more aggressive approach here, using the pin to win a tempo. Your move is playable, but the best line capitalizes on the tactical pressure before your opponent can consolidate.",
  "The evaluation shift here reveals a positional concession — your move released central tension too early. Holding the tension longer forces your opponent into a passive setup, giving you more long-term pressure.",
]

export async function generateCoaching(req: CoachingRequest): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000))
    return MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]
  }

  const prompt = `You are a Grandmaster chess coach reviewing a SPECIFIC MOVE from a game with a 1200-rated student.

Position (FEN) before the move: ${req.fen}
The student played: ${req.moveSan}
The engine's best recommendation was: ${req.bestMove ?? 'unknown'}
Engine's recommended line: ${req.pv.slice(0, 5).join(' ')}
Evaluation after engine's best move: ${req.evalNumber > 0 ? '+' : ''}${req.evalNumber.toFixed(2)}

In 2-3 concise, actionable sentences: 
1. Directly compare the move played (${req.moveSan}) with the best move (${req.bestMove}).
2. Explain specifically "WHY" the engine prefers its choice — what does it achieve that the student's move misses? (e.g., control of a key square, a tactical threat, or better structure).
3. Provide a clear takeaway for the student.`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.candidates[0].content.parts[0].text.trim()
  } catch (err) {
    console.error("LLM Generation failed:", err)
    return "The AI coach is currently unavailable. Focus on developing your pieces toward active squares and keeping your king safe!"
  }
}
