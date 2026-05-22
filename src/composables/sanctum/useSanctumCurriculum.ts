import { useUserStore } from '../../stores/userStore'

/**
 * Pillar Composable: useAcademyCurriculum
 * 
 * Manages the static curriculum data and provides utilities for 
 * tracking lesson completion and subject progress.
 */
export function useSanctumCurriculum() {
  const userStore = useUserStore()

  const curriculum = [
    {
      title: 'The Foundations',
      icon: '🏰',
      description: 'Learn the basic rules, piece movements, and foundational concepts of the game.',
      lessons: [
        { id: 'basics-board', name: 'The Board & Coordinates' },
        { id: 'basics-movement', name: 'Piece Movement & Value' },
        { id: 'basics-special', name: 'Special Rules (Castling, En Passant)' },
        { id: 'basics-checkmate', name: 'Check, Checkmate & Stalemate' },
        { id: 'basics-principles', name: 'Basic Opening Principles' }
      ]
    },
    {
      title: 'Tactical Mastery',
      icon: '⚔️',
      description: 'Master short-term operations to win material or deliver checkmate.',
      lessons: [
        { id: 'tactics-forks', name: 'Forks & Double Attacks' },
        { id: 'tactics-pins', name: 'Pins & Skewers' },
        { id: 'tactics-discovered', name: 'Discovered Attacks' },
        { id: 'tactics-defender', name: 'Removing the Defender' },
        { id: 'tactics-sacrifices', name: 'Sacrifices & The Greek Gift' }
      ]
    },
    {
      title: 'Strategic Command',
      icon: '🧭',
      description: 'Advanced positional theory, maneuvering, and long-term planning.',
      lessons: [
        { id: 'strategy-pawns', name: 'Pawn Structures & Weaknesses' },
        { id: 'strategy-outposts', name: 'Outposts & Blockades' },
        { id: 'strategy-prophylaxis', name: 'Prophylaxis & Restricting Counterplay' },
        { id: 'strategy-space', name: 'Space Advantage & Maneuvering' },
        { id: 'strategy-coordination', name: 'Piece Coordination & Favorable Exchanges' }
      ]
    },
    {
      title: 'The Final Stand',
      icon: '⏳',
      description: 'Essential endgame techniques required to convert advantages into victories.',
      lessons: [
        { id: 'endgame-basic-mates', name: 'Basic Checkmates (Ladder, K+Q, K+R)' },
        { id: 'endgame-pawns', name: 'King & Pawn Endgames (The Opposition)' },
        { id: 'endgame-rooks', name: 'Rook Endgames (Lucena & Philidor)' },
        { id: 'endgame-minor', name: 'Minor Piece Endgames' },
        { id: 'endgame-zugzwang', name: 'Zugzwang & Fortresses' }
      ]
    }
  ]

  /**
   * Checks if a specific lesson is marked as complete in the user's profile.
   */
  function isCompleted(id: string) {
    return userStore.completedLessons.includes(id)
  }

  /**
   * Calculates how many lessons in a subject have been completed.
   */
  function getSubjectProgress(subject: any) {
    return subject.lessons.filter((l: any) => isCompleted(l.id)).length
  }

  return {
    curriculum,
    isCompleted,
    getSubjectProgress
  }
}
