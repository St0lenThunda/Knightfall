import fs from 'fs';
import { Chess } from 'chess.js';

const puzzles = JSON.parse(fs.readFileSync('./src/data/puzzles.json', 'utf8'));
const broken = [];

console.log(`Checking ${puzzles.length} puzzles...`);

puzzles.forEach(p => {
  const chess = new Chess(p.fen);
  let step = 0;
  
  for (const move of p.solution) {
    let result = null;
    
    // Attempt 1: Standard move (SAN or UCI string)
    try {
      result = chess.move(move);
    } catch (e) {}

    // Attempt 2: Explicit UCI Object (if string failed)
    if (!result && move.length >= 4) {
      try {
        const from = move.substring(0, 2);
        const to = move.substring(2, 4);
        const promotion = move.substring(4, 5) || undefined;
        result = chess.move({ from, to, promotion });
      } catch (e) {}
    }

    if (!result) {
      broken.push({ 
        id: p.id, 
        title: p.title, 
        step, 
        move, 
        fen: chess.fen(),
        reason: `Illegal move at step ${step}: ${move}` 
      });
      break;
    }
    step++;
  }
});

if (broken.length > 0) {
  console.log('\n--- CONFIRMED BROKEN PUZZLES ---');
  console.log(JSON.stringify(broken, null, 2));
} else {
  console.log('\nAll puzzles are tactically sound!');
}
