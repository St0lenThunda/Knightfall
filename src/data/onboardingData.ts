import type { Puzzle } from '../api/puzzleApi'

/**
 * Quick Win puzzle for onboarding Screen 2.
 * A simple Scholar's Mate in 1 designed to give new users an immediate success experience.
 */
export const QUICK_WIN_PUZZLE: Puzzle = {
  id: 'quick-win-scholars-mate',
  title: 'Checkmate in One',
  rating: 600,
  themes: ['mate', 'mateIn1', 'oneMoveMate', 'attack'],
  fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
  lastMove: 'Nc6',
  solution: ['f3f7'],
  category: 'Tactics',
  explanation: 'The Queen on f3 and Bishop on c4 both target the weak f7 pawn, delivering an immediate checkmate.'
}
