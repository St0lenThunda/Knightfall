/**
 * Lichess Public API Service
 * 
 * We use this to fetch a user's game history and move-by-move telemetry.
 * Lichess is very developer-friendly and provides evals/clocks directly in PGN/JSON.
 */
import { logger } from '../utils/logger'
import { Storage, StorageKey } from '../utils/storage'

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
 * Robust fetch wrapper with exponential backoff and rate-limit awareness.
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 2, backoff = 1000): Promise<Response | null> {
  // Check global rate limit "Sleep" state
  if (Date.now() < rateLimitResetTime) return null

  try {
    const response = await fetch(url, options)
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000
      logger.error(`[LichessApi] Rate Limit Hit (429). Backing off for ${waitTime/1000}s.`)
      rateLimitResetTime = Date.now() + waitTime
      return null
    }

    if (!response.ok && retries > 0 && response.status >= 500) {
      await new Promise(r => setTimeout(r, backoff))
      return fetchWithRetry(url, options, retries - 1, backoff * 2)
    }

    return response
  } catch (e) {
    if (retries > 0) {
      logger.warn(`[LichessApi] Network error, retrying... (${retries} left)`)
      await new Promise(r => setTimeout(r, backoff))
      return fetchWithRetry(url, options, retries - 1, backoff * 2)
    }
    logger.error(`[LichessApi] Fetch failed after retries: ${url}`, e)
    return null
  }
}

// --- Cache Layer (Persistent in session, survived by memory/HMR) ---
const _global = (window as any)
_global.__KNIGHTFALL_CLOUD_CACHE__ = _global.__KNIGHTFALL_CLOUD_CACHE__ || new Map<string, any>()
_global.__KNIGHTFALL_MASTERS_CACHE__ = _global.__KNIGHTFALL_MASTERS_CACHE__ || new Map<string, any>()

const cloudEvalCache: Map<string, any> = _global.__KNIGHTFALL_CLOUD_CACHE__
const mastersCache: Map<string, any> = _global.__KNIGHTFALL_MASTERS_CACHE__

/**
 * Fetches cloud evaluation for a given FEN.
 * Uses a persistent cache to prevent redundant requests for common positions.
 */
export async function fetchCloudEval(fen: string): Promise<any> {
  // 1. Check local cache first
  if (cloudEvalCache.has(fen)) return cloudEvalCache.get(fen)

  const response = await fetchWithRetry(`https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}`)
  
  if (!response || !response.ok) {
    // Cache the "missing" state to prevent redundant 404s in the same session
    cloudEvalCache.set(fen, null)
    return null
  }

  try {
    const data = await response.json()
    // 2. Cache successful results
    cloudEvalCache.set(fen, data)
    return data
  } catch (e) {
    cloudEvalCache.set(fen, null)
    return null
  }
}

export function isRateLimited(): boolean {
  return Date.now() < rateLimitResetTime
}

let isMastersTokenInvalid = false
let rateLimitResetTime = 0

/**
 * Lichess Opening Explorer
 * Fetches frequency and success rates for top-tier moves.
 * Uses a persistent cache to prevent redundant requests during bulk analysis.
 */
export async function fetchMasterMoves(fen: string): Promise<any> {
  // 1. Check local cache first
  if (mastersCache.has(fen)) return mastersCache.get(fen)

  const userToken = Storage.get(StorageKey.LICHESS_TOKEN, '')
  const envToken = import.meta.env.VITE_LICHESS_TOKEN
  const token = userToken || envToken
  
  // Choose endpoint based on token status
  const endpoint = (token && !isMastersTokenInvalid) ? 'masters' : 'lichess'
  
  const headers: Record<string, string> = {
    'Accept': 'application/json'
  }
  
  if (token && !isMastersTokenInvalid) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetchWithRetry(`https://explorer.lichess.org/${endpoint}?fen=${encodeURIComponent(fen)}&topGames=5`, {
    headers
  })
  
  if (!response) return null
  
  if (!response.ok) {
    if (response.status === 401 && endpoint === 'masters') {
      logger.warn('[LichessApi] Masters Explorer unauthorized. Pivoting to Public Lichess DNA.')
      isMastersTokenInvalid = true
      return fetchMasterMoves(fen) // Recursive retry with fallback endpoint
    }
    return null
  }
  
  try {
    const data = await response.json()
    // 2. Cache successful results
    if (data) mastersCache.set(fen, data)
    return data
  } catch (e) {
    return null
  }
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
 * Helper to fetch raw PGN from a Lichess URL.
 */
export async function importPgnFromUrl(url: string): Promise<string> {
  // Extract ID from URL (e.g. https://lichess.org/ABCDEFGH)
  const idMatch = url.match(/lichess\.org\/([a-zA-Z0-9]{8,12})/)
  const id = idMatch ? idMatch[1] : url

  const response = await fetch(`https://lichess.org/game/export/${id}?clocks=true&evals=true`, {
    headers: { 'Accept': 'application/x-chess-pgn' }
  })
  
  if (!response.ok) throw new Error('Failed to fetch PGN from Lichess')
  return await response.text()
}
