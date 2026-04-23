/**
 * Lichess Public API Service
 * 
 * We use this to fetch a user's game history and move-by-move telemetry.
 * Lichess is very developer-friendly and provides evals/clocks directly in PGN/JSON.
 */

export interface LichessGame {
  id: string
  rated: boolean
  variant: string
  speed: string
  perf: string
  createdAt: number
  lastMoveAt: number
  status: string
  players: {
    white: { user: { name: string, id: string }, rating: number, ratingDiff: number }
    black: { user: { name: string, id: string }, rating: number, ratingDiff: number }
  }
  winner?: string
  opening?: { eco: string, name: string, ply: number }
  moves: string
  pgn: string
  clocks?: number[]
  evals?: any[]
}

/**
 * Fetches recent games for a Lichess user.
 * 
 * @param username - Lichess username
 * @param limit - Max games to fetch (default 20)
 * @returns Array of games with PGN and basic metadata
 */
export async function fetchRecentLichessGames(username: string, limit = 20): Promise<LichessGame[]> {
  // We use the JSON format for easier integration.
  // Note: NDJSON is preferred for large exports, but for "recent" checks, 
  // we can use the JSON array format by setting 'application/json' header.
  const response = await fetch(`https://lichess.org/api/games/user/${username}?max=${limit}&opening=true&clocks=true&evals=true`, {
    headers: {
      'Accept': 'application/x-ndjson'
    }
  })

  if (!response.ok) {
    throw new Error(`Lichess API error: ${response.statusText}`)
  }

  // Parse NDJSON (Newline Delimited JSON)
  const text = await response.text()
  const lines = text.trim().split('\n')
  return lines.map(line => JSON.parse(line))
}

/**
 * Fetches a single game by ID with full analysis.
 */
export async function getLichessGameById(gameId: string): Promise<LichessGame> {
  const response = await fetch(`https://lichess.org/game/export/${gameId}?clocks=true&evals=true`, {
    headers: {
      'Accept': 'application/json'
    }
  })
  
  if (!response.ok) throw new Error('Could not find Lichess game')
  return await response.json()
}

/**
 * Fetches basic user profile and ratings.
 */
export async function getLichessUserStats(username: string): Promise<any> {
  const response = await fetch(`https://lichess.org/api/user/${username}`)
  if (!response.ok) return null
  return await response.json()
}
