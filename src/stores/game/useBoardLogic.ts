import { ref, computed, shallowRef } from 'vue'
import { Chess, type Square, type Color, type PieceSymbol } from 'chess.js'
import { safeLoadPgn } from '../../utils/pgnParser'

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
  const pgn = computed(() => { boardTrigger.value; return chess.value.pgn() })
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
    if (index === -1) {
      if (originalPgn.value) {
        chess.value.loadPgn(originalPgn.value)
      } else {
        chess.value.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
      }
    } else {
      chess.value.load(moveHistory.value[index].fen)
    }
    boardTrigger.value++
  }

  function stepBack() {
    if (viewIndex.value > -1) goToMove(viewIndex.value - 1)
  }

  function stepForward() {
    if (viewIndex.value < moveHistory.value.length - 1) goToMove(viewIndex.value + 1)
  }

  function loadPgn(pgn: string, mode: 'live' | 'puzzle' | 'analysis' = 'live', _id?: string) {
    try {
      safeLoadPgn(chess.value, pgn)
      moveHistory.value = chess.value.history({ verbose: true })
      viewIndex.value = moveHistory.value.length - 1
      if (mode === 'analysis') originalPgn.value = pgn
      boardTrigger.value++
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

      const move = chess.value.move(moveParams)
      if (move) {
        lastMove.value = { from, to: finalTo }
        moveHistory.value.push(move)
        viewIndex.value = moveHistory.value.length - 1
        boardTrigger.value++
        clearSelection()

        // Drill Validation
        if (drillSolution.value.length > 0) {
          const uci = from + to + (move.san.includes('=') ? promotion : '')
          const expected = drillSolution.value[drillIndex.value]
          
          if (uci === expected || uci.slice(0,4) === expected.slice(0,4)) {
            drillIndex.value++
            if (drillIndex.value >= drillSolution.value.length) return 'complete'
            return 'correct'
          } else {
            // Incorrect move in drill: Undo it
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


  function loadPosition(fen: string, mode: 'live' | 'puzzle' | 'analysis' = 'live') {
    chess.value.load(fen)
    boardTrigger.value++
    moveHistory.value = []
    viewIndex.value = -1
    lastMove.value = null
    drillSolution.value = []
    drillIndex.value = 0
    mistakeCount.value = 0
    if (mode !== 'analysis') originalPgn.value = ''
  }

  return {
    chess, boardTrigger, selectedSquare, legalMoveSquares,
    lastMove, moveHistory, viewIndex,    playerColor, isThinking,
    promotionPending, originalPgn,
    drillSolution, drillIndex, mistakeCount,
    fen, pgn, turn, board, isCheck, isCheckmate, isStalemate, isDraw, 
    isThreefoldRepetition, isInsufficientMaterial, isGameOver,
    selectSquare, clearSelection, makeMove, undoMove, loadPosition,
    goToMove, stepBack, stepForward, loadPgn, setDrill
  }
}
