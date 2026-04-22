/**
 * Chess.com Public API Service
 * 
 * We use this to fetch a user's game history for DNA analysis.
 * Chess.com PubAPI is rate-limited and read-only, but doesn't require an API key.
 */

export interface ChessComGame {
  url: string
  pgn: string
  time_control: string
  end_time: number
  rated: boolean
  white: { username: string, rating: number, result: string }
  black: { username: string, rating: number, result: string }
}

export interface ChessComArchive {
  archives: string[]
}

/**
 * Fetches the list of monthly archives for a player.
 * Each archive URL points to games for a specific month.
 */
export async function getPlayerArchives(username: string): Promise<string[]> {
  const response = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`)
  if (!response.ok) throw new Error('Could not find Chess.com player')
  const data: ChessComArchive = await response.json()
  return data.archives
}

/**
 * Fetches games from a specific archive URL.
 */
export async function getGamesFromArchive(archiveUrl: string): Promise<ChessComGame[]> {
  const response = await fetch(archiveUrl)
  if (!response.ok) return []
  const data = await response.json()
  return data.games || []
}

/**
 * High-level function to fetch recent history (last X months).
 */
export async function fetchRecentChessComGames(username: string, months = 3): Promise<ChessComGame[]> {
  const archives = await getPlayerArchives(username)
  const recentArchives = archives.slice(-months) // Take last N months
  
  const allGames: ChessComGame[] = []
  
  for (const url of recentArchives) {
    const games = await getGamesFromArchive(url)
    allGames.push(...games)
  }
  
  return allGames
}

/**
 * Fetches player statistics (ratings, W/L/D) from Chess.com.
 */
export async function getPlayerStats(username: string): Promise<any> {
  const response = await fetch(`https://api.chess.com/pub/player/${username}/stats`)
  if (!response.ok) return null
  return await response.json()
}
