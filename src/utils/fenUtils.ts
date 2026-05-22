/**
 * FEN (Forsyth-Edwards Notation) Utilities
 *
 * This module provides helper functions to sanitize and manipulate FEN strings.
 * Standard chess engines (including chess.js) expect every position to contain
 * exactly one White King and exactly one Black King. However, introductory chess
 * lessons often focus on isolated concepts (such as an empty board, a single knight,
 * or pawn-only formations) which naturally lack kings.
 *
 * To avoid chess.js parsing/validation errors on these positions, we use this
 * utility to programmatically insert "dummy kings" onto empty squares of the board.
 * We track the coordinates of these dummy kings so that the board renderer can
 * filter them out, keeping them invisible to the student.
 *
 * @module fenUtils
 */

/**
 * The standard size of a chess board rank or file (8x8 grid).
 * Used to iterate through rows and columns when parsing board states.
 */
const BOARD_SIZE = 8

/**
 * Checks a FEN string and ensures both the White King (K) and Black King (k) exist.
 * If either is missing, it dynamically places them on safe, unoccupied squares
 * (prioritizing corner squares that do not touch other existing pieces) to avoid
 * breaking chess.js rules.
 *
 * @param fen - The raw FEN string representing the position
 * @returns An object containing the sanitized FEN string and the coordinates of any added dummy kings
 */
export function ensureKingsExist(fen: string): { sanitizedFen: string; dummySquares: string[] } {
  // A FEN string is divided into space-separated fields.
  // The first field is the board configuration (piece placement).
  const parts = fen.split(' ')
  const boardPart = parts[0]

  // Expand the FEN row representation into an 8x8 character grid.
  // In FEN, rows are separated by '/' and numbers (e.g. '8') represent consecutive empty cells.
  const rows = boardPart.split('/')
  const grid: string[][] = []

  for (const row of rows) {
    const gridRow: string[] = []
    for (const char of row) {
      // If the character is a digit, it represents a number of empty squares.
      if (/\d/.test(char)) {
        const emptyCount = parseInt(char, 10)
        for (let i = 0; i < emptyCount; i++) {
          gridRow.push('.') // '.' represents an empty square in our expanded grid
        }
      } else {
        // Otherwise, it is a piece character (e.g. 'p', 'N', 'R', etc.)
        gridRow.push(char)
      }
    }
    grid.push(gridRow)
  }

  // Check if either king is already present on the board
  let hasWhiteKing = false
  let hasBlackKing = false
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (grid[r][c] === 'K') hasWhiteKing = true
      if (grid[r][c] === 'k') hasBlackKing = true
    }
  }

  // Coordinates of the newly added dummy kings (e.g. 'a8', 'h1')
  const dummySquares: string[] = []
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']

  /**
   * Helper to verify if a square is empty and has no adjacent pieces.
   * This prevents dummy kings from attacking or blocking active lesson pieces.
   */
  const isSafeSquare = (r: number, c: number): boolean => {
    if (grid[r][c] !== '.') return false

    // Check all 8 surrounding squares (3x3 grid neighborhood)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr
        const nc = c + dc

        // Stay within the boundaries of the board
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          const neighbor = grid[nr][nc]
          // If there is any non-empty square (that is not another king), it is unsafe
          if (neighbor !== '.' && neighbor !== 'K' && neighbor !== 'k') {
            return false
          }
        }
      }
    }
    return true
  }

  /**
   * Dynamically places a king on the board.
   * We prioritize corner squares to keep the dummy kings as isolated as possible.
   */
  const placeKingPiece = (kingChar: string): void => {
    // Corner squares (a8, h8, a1, h1) are ideal locations for inactive/dummy kings
    const prioritySquares = [
      { r: 0, c: 0 }, // a8
      { r: 0, c: BOARD_SIZE - 1 }, // h8
      { r: BOARD_SIZE - 1, c: 0 }, // a1
      { r: BOARD_SIZE - 1, c: BOARD_SIZE - 1 }, // h1
    ]

    // Fill the search queue with corners first, then all remaining squares
    const searchQueue = [...prioritySquares]
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const alreadyInQueue = searchQueue.some(p => p.r === r && p.c === c)
        if (!alreadyInQueue) {
          searchQueue.push({ r, c })
        }
      }
    }

    // First pass: try to find a square that has no adjacent pieces
    for (const { r, c } of searchQueue) {
      if (isSafeSquare(r, c)) {
        grid[r][c] = kingChar
        dummySquares.push(`${files[c]}${ranks[r]}`)
        return
      }
    }

    // Fallback pass: simply find the first empty square if no fully isolated square is available
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (grid[r][c] === '.') {
          grid[r][c] = kingChar
          dummySquares.push(`${files[c]}${ranks[r]}`)
          return
        }
      }
    }
  }

  // Inject dummy kings as needed
  if (!hasWhiteKing) {
    placeKingPiece('K')
  }
  if (!hasBlackKing) {
    placeKingPiece('k')
  }

  // Re-compress the 8x8 character grid back into FEN's row format.
  const compressedRows: string[] = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    let rowStr = ''
    let emptyCount = 0

    for (let c = 0; c < BOARD_SIZE; c++) {
      if (grid[r][c] === '.') {
        emptyCount++
      } else {
        // Output any accumulated empty count before writing the piece
        if (emptyCount > 0) {
          rowStr += emptyCount.toString()
          emptyCount = 0
        }
        rowStr += grid[r][c]
      }
    }

    if (emptyCount > 0) {
      rowStr += emptyCount.toString()
    }
    compressedRows.push(rowStr)
  }

  // Reassemble the complete FEN string with the updated board configuration
  parts[0] = compressedRows.join('/')
  const sanitizedFen = parts.join(' ')

  return {
    sanitizedFen,
    dummySquares
  }
}
