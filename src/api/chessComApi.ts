/**
 * Chess.com Public API Service
 */
import { logger } from '../utils/logger'

export interface ChesscomPuzzle {
  title: string
  url: string
  publish_time: number
  fen: string
  pgn: string
  image: string
}

/**
 * Fetches the Chess.com Daily Puzzle.
 */
export async function fetchChesscomDailyPuzzle(): Promise<ChesscomPuzzle | null> {
  try {
    const response = await fetch('https://api.chess.com/pub/puzzle')
    if (!response.ok) return null
    return await response.json()
  } catch (err) {
    logger.error('[ChesscomApi] Failed to fetch daily puzzle:', err)
    return null
  }
}

/**
 * Fetches recent games for a Chess.com user.
 * Note: Chess.com archives games by month.
 */
export async function fetchRecentChesscomGames(username: string): Promise<any[]> {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    
    const response = await fetch(`https://api.chess.com/pub/player/${username}/games/${year}/${month}`)
    if (!response.ok) return []
    const data = await response.json()
    return data.games || []
  } catch (err) {
    logger.error('[ChesscomApi] Failed to fetch games:', err)
    return []
  }
}

/**
 * Fetches Chess.com user stats.
 */
export async function getChesscomUserStats(username: string): Promise<any> {
  try {
    const response = await fetch(`https://api.chess.com/pub/player/${username}/stats`)
    if (!response.ok) return null
    return await response.json()
  } catch (err) {
    logger.error('[ChesscomApi] Failed to fetch stats:', err)
    return null
  }
}
