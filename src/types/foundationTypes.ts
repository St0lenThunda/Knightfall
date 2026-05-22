/**
 * Foundation Lesson Type Definitions
 *
 * These interfaces define the data structure for the "Mentor's Path" —
 * Knightfall's beginner lesson system that teaches chess from absolute zero.
 *
 * The foundation system uses a 3-phase pedagogical model:
 *   Phase 1 (Story)  → FoundationSlide with narrative + interactive board
 *   Phase 2 (Do)     → FoundationChallenge with guided board interaction
 *   Phase 3 (Confirm) → QuizQuestion for comprehension check
 *
 * Why separate types? These are architecturally distinct from the existing
 * puzzle-drill system (which uses `Puzzle` from puzzleApi). Foundation lessons
 * are narrative-first, not solution-first.
 */

/**
 * A single guided challenge embedded within a lesson slide.
 *
 * Challenges validate ONE specific move on the board (from → to).
 * They're low-stakes — no hearts, no penalty — designed to build
 * muscle memory through guided discovery rather than testing.
 *
 * @example
 * {
 *   instruction: "Move the knight from g1 to f3",
 *   from: "g1",
 *   to: "f3",
 *   successMessage: "The knight leaps into action!"
 * }
 */
export interface FoundationChallenge {
  /** Human-readable prompt shown to the user (e.g., "Move the knight to f3") */
  instruction: string

  /** Source square in algebraic notation (e.g., 'g1') */
  from: string

  /** Target square in algebraic notation (e.g., 'f3') */
  to: string

  /** Celebration message shown via toast on successful completion */
  successMessage: string
}

/**
 * One "page" of a foundation lesson — the primary content unit.
 *
 * Each slide contains narrative text, a board position, and optionally
 * a historical note and/or guided challenge. The user reads the story,
 * explores the board freely, then (if a challenge exists) completes a
 * single guided move before advancing.
 *
 * Why this structure? Expert chess tutors teach in exactly this pattern:
 * tell a story → show the position → let the student explore → guide one move.
 */
export interface FoundationSlide {
  /** Slide heading displayed prominently above the narrative */
  title: string

  /**
   * The main lesson content — 2-4 paragraphs of storytelling explanation.
   * Written for absolute beginners who have never seen a chess board.
   * Supports newlines for paragraph separation.
   */
  narrative: string

  /**
   * Optional "Did You Know?" sidebar — a surprising historical fact
   * that makes the concept memorable and shareable.
   * Displayed in a gold-bordered callout card.
   */
  historicalNote?: string

  /**
   * Valid FEN string representing the board position for this slide.
   * The ChessBoard component renders this position and allows free exploration.
   *
   * Why FEN? It's the universal standard for encoding chess positions.
   * Example: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
   */
  fen: string

  /**
   * Caption text displayed below or near the board — tells the user
   * what to notice in the position (e.g., "Look at how the knight
   * can reach 8 different squares from the center").
   */
  boardDescription: string

  /**
   * Optional hint encouraging the user to interact with the board
   * in exploration mode (e.g., "Try dragging the knight around").
   * Displayed as a subtle prompt near the board.
   */
  explorationHint?: string

  /**
   * Optional guided challenge — if present, the slide enters "challenge mode"
   * after the user reads the narrative. The board validates only the specific
   * from → to move. No penalty for wrong attempts.
   */
  challenge?: FoundationChallenge
}

/**
 * A multiple-choice comprehension question shown at the end of a lesson.
 *
 * Phase 3 of the Mentor's Path — "The Check-In."
 * No score penalty, no hearts — purely educational. The explanation
 * is shown regardless of whether the user answers correctly.
 *
 * Why multiple choice? It's the lowest-friction comprehension check.
 * True understanding will be tested later in the puzzle-drill system.
 */
export interface QuizQuestion {
  /** The question text (e.g., "Which piece can jump over others?") */
  question: string

  /** Array of 3-4 answer choices */
  options: string[]

  /**
   * Zero-based index of the correct answer in the `options` array.
   * Example: if options = ['Pawn', 'Knight', 'Bishop'] and the answer
   * is 'Knight', then correctIndex = 1.
   */
  correctIndex: number

  /**
   * Educational explanation shown after the user answers (right or wrong).
   * Should explain WHY the answer is correct, not just confirm it.
   * Example: "The knight is the only piece that can jump because it
   * represents cavalry — horses could leap over infantry on the battlefield."
   */
  explanation: string
}

/**
 * A complete foundation lesson — maps 1:1 with a curriculum Quest.
 *
 * Each FoundationLesson contains all the content needed for one
 * session of the Mentor's Path: narrative slides, guided challenges,
 * and a comprehension quiz.
 *
 * The `id` must match the corresponding Quest id in the
 * curriculumStore (e.g., 'found-origins', 'found-pawns').
 */
export interface FoundationLesson {
  /** Unique identifier — must match the curriculum Quest id */
  id: string

  /** Display title for the lesson header */
  title: string

  /**
   * Ordered array of lesson slides (Phase 1: Story + Phase 2: Do).
   * Each slide may optionally include a guided challenge.
   * Minimum 2 slides per lesson.
   */
  slides: FoundationSlide[]

  /**
   * Comprehension questions (Phase 3: Confirm).
   * Shown after all slides are completed.
   * Minimum 2 questions per lesson.
   */
  quiz: QuizQuestion[]
}
