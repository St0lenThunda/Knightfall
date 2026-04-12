export interface CoachingRequest {
  fen: string
  evalNumber: number
  pv: string[]
}

const MOCK_RESPONSES = [
  "Stockfish evaluation here indicates a solid advantage. The recommended principal variation focuses on developing the minor pieces while restricting the opponent's central breaks. If you follow this line, you solidify control of the center.",
  "This is a sharp position! The evaluation is completely balanced, but the suggested engine move aims to create immediate tactical complications. Taking the offered pawn looks dangerous but the engine proves it's playable if you calculate precisely.",
  "Look closely at the evaluation — it's heavily in White's favor without an immediate material advantage. This means the advantage is strictly positional. By playing the engine's suggested move, you restrict Black's counterplay and slowly squeeze them."
]

export async function generateCoaching(req: CoachingRequest): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    // Simulate network latency if no API key is provided
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000))
    return MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]
  }

  // If we have an API key, call the Gemini REST API
  const prompt = `You are a Grandmaster chess coach. Look at the following position data:
FEN: ${req.fen}
Evaluation: ${req.evalNumber} pawns
Engine Recommended Moves (PV): ${req.pv.join(", ")}

In one short, actionable paragraph (maximum 3 sentences), explain to a 1200-rated player WHY the engine recommends this plan. Do not just restate the moves; explain the strategic idea behind them.`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
    return "The AI coach is currently unavailable due to network issues. Keep focusing on developing your pieces and controlling the center!"
  }
}
