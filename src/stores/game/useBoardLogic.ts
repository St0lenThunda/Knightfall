import { ref, computed, shallowRef } from 'vue'
import { Chess, type Square, type Color, type PieceSymbol } from 'chess.js'
import { safeLoadPgn } from '../../utils/pgnParser'
import { ensureKingsExist } from '../../utils/fenUtils'

/**
 * useBoardLogic
 * 
 * Manages the reactive board state and Chess.js interactions.
 * Handles move execution, undoing, and board navigation.
 */
export function useBoardLogic() {
  const chess = shallowRef(new Chess())
  const boardTrigger = ref(0)
  const selectedSquare = ref<Square | null>(null)
  const legalMoveSquares = ref<Square[]>([])
  
  /**
   * Tracks coordinates of dummy kings injected for chess.js compatibility.
   * These squares will be hidden in the UI and not interactive.
   */
  const dummyKingSquares = ref<Square[]>([])
  const lastMove = ref<{ from: string; to: string } | null>(null)
  const moveHistory = ref<any[]>([])
  const viewIndex = ref(-1)
  const playerColor = ref<Color>('w')
  const isThinking = ref(false)
  const promotionPending = ref<{ from: Square; to: Square } | null>(null)
  const originalPgn = ref<string>('')
  const drillSolution = ref<string[]>([])
  const drillIndex = ref(0)
  const mistakeCount = ref(0)

  // --- COMPUTED ---
  const fen = computed(() => { boardTrigger.value; return chess.value.fen() })
  const pgn = computed(() => { 
    boardTrigger.value; 
    // If we have an original PGN (e.g. in Analysis mode), use it as the source of truth
    // so that navigation doesn't wipe the moves from telemetry snapshots.
    if (originalPgn.value) return originalPgn.value;
    return chess.value.pgn(); 
  })
  const turn = computed(() => { boardTrigger.value; return chess.value.turn() as Color })
  const board = computed(() => { boardTrigger.value; return chess.value.board() })
  const isCheck = computed(() => { boardTrigger.value; return chess.value.isCheck() })
  const isCheckmate = computed(() => { boardTrigger.value; return chess.value.isCheckmate() })
  const isStalemate = computed(() => { boardTrigger.value; return chess.value.isStalemate() })
  const isDraw = computed(() => { boardTrigger.value; return chess.value.isDraw() })
  const isThreefoldRepetition = computed(() => { boardTrigger.value; return chess.value.isThreefoldRepetition() })
  const isInsufficientMaterial = computed(() => { boardTrigger.value; return chess.value.isInsufficientMaterial() })
  const isGameOver = computed(() => { boardTrigger.value; return chess.value.isGameOver() })

  // --- ACTIONS ---
  function goToMove(index: number) {
    if (index < -1 || index >= moveHistory.value.length) return
    viewIndex.value = index
    
    // Preserve headers across loads
    let headers = chess.value.header()
    
    // Fallback: If headers are empty but we have an original PGN, extract them from there
    if (Object.keys(headers).length === 0 && originalPgn.value) {
      const temp = new Chess()
      safeLoadPgn(temp, originalPgn.value)
      headers = temp.header()
    }
    
    if (index === -1) {
      // Starting Position
      if (originalPgn.value) {
        const temp = new Chess()
        safeLoadPgn(temp, originalPgn.value)
        // If the PGN has a FEN tag, use it, otherwise use default
        const startFen = temp.header().FEN || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        chess.value.load(startFen)
      } else {
        chess.value.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
      }
    } else {
      chess.value.load(moveHistory.value[index].fen)
    }

    // Re-apply headers
    for (const [k, v] of Object.entries(headers)) {
      chess.value.header(k, v as string)
    }
    
    boardTrigger.value++
  }

  function stepBack() {
    if (viewIndex.value > -1) goToMove(viewIndex.value - 1)
  }

  function stepForward() {
    if (viewIndex.value < moveHistory.value.length - 1) goToMove(viewIndex.value + 1)
  }

  function loadPgn(pgn: string, mode: 'live' | 'puzzle' | 'analysis' = 'live', _id?: string, extra?: { evals?: any[], tags?: any[], moveTags?: string[] }) {
    try {
      safeLoadPgn(chess.value, pgn)
      const history = chess.value.history({ verbose: true })
      
      // Reconstruct history with FENs and Move Numbers
      const tempChess = new Chess()
      moveHistory.value = history.map((move, idx) => {
        const moveNum = tempChess.moveNumber()
        tempChess.move(move)
        return { 
          ...move, 
          fen: tempChess.fen(),
          moveNumber: moveNum,
          eval: extra?.evals ? (
            typeof extra.evals[idx] === 'object' && extra.evals[idx] !== null
              ? (extra.evals[idx].isMate 
                  ? `M${Math.abs(Math.round(extra.evals[idx].score / 10000))}` 
                  : extra.evals[idx].score / 100)
              : extra.evals[idx]
          ) : undefined,
          tag: extra?.moveTags ? extra.moveTags[idx] : (extra?.tags ? extra.tags[idx] : undefined)
        }
      })
      
      if (mode === 'analysis') {
        originalPgn.value = pgn
        // Start at the end of the game for analysis, rather than rewinding to -1
        const finalIdx = moveHistory.value.length - 1
        goToMove(finalIdx)
      } else {
        viewIndex.value = moveHistory.value.length - 1
        boardTrigger.value++
      }
      return true
    } catch (e) {
      return false
    }
  }

  function selectSquare(sq: Square) {
    selectedSquare.value = sq
    legalMoveSquares.value = chess.value.moves({ square: sq, verbose: true }).map(m => m.to as Square)
  }

  function setDrill(solution: string[]) {
    drillSolution.value = solution
    drillIndex.value = 0
  }

  function clearSelection() {
    selectedSquare.value = null
    legalMoveSquares.value = []
  }

  function makeMove(fromOrUci: any, to?: Square, promotion: PieceSymbol = 'q') {
    try {
      let moveParams: any = { promotion }
      let from: Square, finalTo: Square
      
      if (typeof fromOrUci === 'string' && !to) {
        // UCI format (e.g., "e2e4")
        from = fromOrUci.slice(0, 2) as Square
        finalTo = fromOrUci.slice(2, 4) as Square
        if (fromOrUci.length > 4) {
          moveParams.promotion = fromOrUci[4] as PieceSymbol
        }
        moveParams.from = from
        moveParams.to = finalTo
      } else {
        from = fromOrUci
        finalTo = to!
        moveParams.from = from
        moveParams.to = finalTo
      }

      // Check if a pawn is moving to its promotion rank (8th rank for White, 1st rank for Black).
      // Standard engines like chess.js reject promotion moves if a promotion piece symbol is missing
      // or invalid. To prevent failures in browser environments, we dynamically enforce a default of 'q'.
      const piece = chess.value.get(from)
      if (piece && piece.type === 'p') {
        const destRank = finalTo.charAt(1)
        const isPromotionRank = (piece.color === 'w' && destRank === '8') || (piece.color === 'b' && destRank === '1')
        if (isPromotionRank) {
          const isValidPiece = ['q', 'r', 'b', 'n'].includes(moveParams.promotion)
          if (!isValidPiece) {
            moveParams.promotion = 'q'
          }
        }
      }

      const moveNum = chess.value.moveNumber()
      const move = chess.value.move(moveParams)
      if (move) {
        lastMove.value = { from, to: finalTo }
        // Ensure every move in history carries its resulting FEN and move number for UI/Analysis navigation
        moveHistory.value.push({ ...move, fen: chess.value.fen(), moveNumber: moveNum })
        viewIndex.value = moveHistory.value.length - 1
        boardTrigger.value++
        clearSelection()

        // Drill Validation
        // If there is an active puzzle solution (drill) configured:
        if (drillSolution.value.length > 0) {
          // Construct the move in UCI format (e.g., "e2e4" or "e7e8q" for promotion).
          // We use `finalTo` because `to` parameter might be undefined if fromOrUci was a UCI string.
          const uci = from + finalTo + (move.san.includes('=') ? promotion : '')
          const expected = drillSolution.value[drillIndex.value]
          
          // Verify if the played move matches the expected solution step.
          // We check `expected` first to avoid a TypeError (cannot read properties of undefined reading 'slice')
          // if the user makes a move after the solution is already fully completed.
          if (expected && (uci === expected || uci.slice(0, 4) === expected.slice(0, 4))) {
            drillIndex.value++
            // If we reached the end of the solution list, the puzzle is solved.
            if (drillIndex.value >= drillSolution.value.length) return 'complete'
            return 'correct'
          } else {
            // Incorrect move in drill: Undo it from the chess engine and local history.
            chess.value.undo()
            moveHistory.value.pop()
            viewIndex.value = moveHistory.value.length - 1
            boardTrigger.value++
            mistakeCount.value++
            return 'incorrect'
          }
        }

        return move
      }
    } catch (e) {
      return null
    }
    return null
  }

  function undoMove() {
    const move = chess.value.undo()
    if (move) {
      moveHistory.value.pop()
      viewIndex.value = moveHistory.value.length - 1
      boardTrigger.value++
      return move
    }
    return null
  }


  /**
   * Loads a specific position from a FEN string.
   * If the FEN does not contain kings, we sanitize it by injecting dummy kings.
   * 
   * @param fen - The FEN string to load
   * @param mode - The game mode for the loaded position
   */
  function loadPosition(fen: string, mode: 'live' | 'puzzle' | 'analysis' = 'live') {
    // Sanitize position FEN to ensure it contains both a White and Black King.
    // This is required for chess.js stability since loading king-less positions throws.
    const { sanitizedFen, dummySquares } = ensureKingsExist(fen)
    chess.value.load(sanitizedFen)
    dummyKingSquares.value = dummySquares as Square[]

    boardTrigger.value++
    moveHistory.value = []
    viewIndex.value = -1
    lastMove.value = null
    drillSolution.value = []
    drillIndex.value = 0
    mistakeCount.value = 0
    playerColor.value = mode === 'live' ? playerColor.value : (sanitizedFen.split(' ')[1] as Color)
    isThinking.value = false
    if (mode !== 'analysis') originalPgn.value = ''
  }

  return {
    chess, boardTrigger, selectedSquare, legalMoveSquares,
    lastMove, moveHistory, viewIndex,    playerColor, isThinking,
    promotionPending, originalPgn,
    drillSolution, drillIndex, mistakeCount,
    dummyKingSquares,
    fen, pgn, turn, board, isCheck, isCheckmate, isStalemate, isDraw, 
    isThreefoldRepetition, isInsufficientMaterial, isGameOver,
    selectSquare, clearSelection, makeMove, undoMove, loadPosition,
    goToMove, stepBack, stepForward, loadPgn, setDrill
  }
}
