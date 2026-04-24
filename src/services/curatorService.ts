import { fetchMasterMoves } from '../api/lichessApi'
import { logger } from '../utils/logger'
import { type LibraryGame } from '../stores/libraryStore'

/**
 * Lichess Curator Service
 * 
 * Responsible for gathering "Ideal Move DNA" from Lichess Masters 
 * and providing comparative analysis data.
 */
export class LichessCurator {
  /**
   * Compares a given FEN against the Lichess Masters database.
   * Returns a "Theory Report" showing how many masters played the user's move
   * vs. the most popular theory.
   */
  static async getTheoryReport(fen: string, userMove: string) {
    try {
      const data = await fetchMasterMoves(fen)
      if (!data || !data.moves) return null

      const masterMoves = data.moves
      const topMove = masterMoves[0]
      const userMoveData = masterMoves.find((m: any) => m.uci === userMove || m.san === userMove)

      return {
        isTheory: !!userMoveData,
        popularity: userMoveData ? (userMoveData.white + userMoveData.draws + userMoveData.black) : 0,
        topMove: topMove ? topMove.san : null,
        totalGames: data.white + data.draws + data.black,
        moves: masterMoves.slice(0, 3).map((m: any) => ({
          san: m.san,
          games: m.white + m.draws + m.black,
          winRate: Math.round((m.white / (m.white + m.draws + m.black)) * 100)
        }))
      }
    } catch (err) {
      logger.error('[LichessCurator] Theory fetch failed', err)
      return null
    }
  }

  /**
   * Fetches a collection of Master Games for a specific opening (ECO).
   * This is used to build "Curated Paths" for the user.
   */
  static async getOpeningMasterClass(eco: string, limit = 5): Promise<LibraryGame[]> {
    try {
      // We use the Lichess Games API but filtered by 'masters' and 'eco'
      // Note: Lichess games API doesn't filter masters by eco directly in one call 
      // without a specific endpoint, so we fetch games from a known master collection.
      const response = await fetch(`https://lichess.org/api/games/user/lichess?max=${limit}&eco=${eco}&opening=true`)
      if (!response.ok) throw new Error('Master Class fetch failed')
      
      const text = await response.text()
      const lines = text.trim().split('\n')
      const games = lines.map(line => {
        const lg = JSON.parse(line)
        return {
          id: `master-${lg.id}`,
          pgn: lg.pgn || '',
          white: lg.players.white.user?.name || 'Master',
          black: lg.players.black.user?.name || 'Master',
          result: lg.winner === 'white' ? '1-0' : (lg.winner === 'black' ? '0-1' : '1/2-1/2'),
          date: new Date(lg.createdAt).toISOString().split('T')[0],
          event: `Master Class: ${lg.opening?.name || eco}`,
          eco: lg.opening?.eco || eco,
          movesCount: lg.moves.split(' ').length,
          addedAt: Date.now(),
          isCurated: true,
          tags: ['Master Class', 'Curated', eco]
        }
      })
      return games
    } catch (err) {
      logger.error('[LichessCurator] Master Class failed', err)
      return []
    }
  }
}
