/**
 * Lichess Public API Service
 * 
 * We use this to fetch a user's game history and move-by-move telemetry.
 * Lichess is very developer-friendly and provides evals/clocks directly in PGN/JSON.
 */
import { logger } from '../utils/logger'

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
/**
 * Lichess Opening Explorer (Masters)
 * Fetches frequency and success rates for top-tier moves.
 */
export async function fetchMasterMoves(fen: string): Promise<any> {
  const token = import.meta.env.VITE_LICHESS_TOKEN
  
  // We use the official .org endpoint. 
  // Note: Lichess now requires a PAT (Personal Access Token) for API explorer access.
  const headers: Record<string, string> = {
    'Accept': 'application/json'
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`https://explorer.lichess.org/masters?fen=${encodeURIComponent(fen)}&topGames=5`, {
    headers
  })
  
  if (!response.ok) {
    if (response.status === 401) {
      logger.warn('[LichessApi] Opening Explorer requires a valid PAT. Skipping theory DNA.')
    }
    return null
  }
  return await response.json()
}

/**
 * Lichess Puzzles by Theme
 * Note: Lichess doesn't have a direct "Theme Search" public API for 1 puzzle, 
 * but we can use their puzzle DB or thematic export links if needed.
 * For now, we fetch the Daily Puzzle as a "Curated" entry.
 */
export async function fetchDailyPuzzle(): Promise<any> {
  const response = await fetch('https://lichess.org/api/puzzle/daily')
  if (!response.ok) return null
  return await response.json()
}

/**
 * Lichess Cloud Evaluation
 * Fetches pre-calculated Stockfish evals for a specific FEN.
 * This is incredibly powerful for speeding up analysis on known positions.
 */
export async function fetchCloudEval(fen: string): Promise<any> {
  // Cloud evals are public and don't require a token, but we'll use the same 
  // hardening just in case.
  const response = await fetch(`https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}`, {
    headers: {
      'Accept': 'application/json'
    }
  })
  
  if (!response.ok) return null
  return await response.json()
}
