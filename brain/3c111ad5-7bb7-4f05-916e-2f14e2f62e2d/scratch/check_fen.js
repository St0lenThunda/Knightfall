import { Chess } from 'chess.js'

const fen = 'r2qk2r/3b1pp1/1pQ1pB1p/p2p4/2nPP3/2N2N2/PP3PPP/R3KB1R b KQkq - 0 1'
const chess = new Chess(fen)

console.log('FEN:', chess.fen())
console.log('Is Game Over?', chess.isGameOver())
console.log('Is Checkmate?', chess.isCheckmate())
console.log('Is Draw?', chess.isDraw())
console.log('Turn:', chess.turn())
console.log('Moves:', chess.moves().length)
