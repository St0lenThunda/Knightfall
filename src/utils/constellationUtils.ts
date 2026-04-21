import { Chess } from 'chess.js'
import type { LibraryGame, OpeningNode } from '../stores/libraryStore'

/**
 * Builds a recursive Opening Tree (Trie) from a list of PGN games.
 * This is the core logic for the "Constellation" feature.
 * 
 * @param games - List of games to process
 * @param onProgress - Optional callback for reporting progress (0-1)
 * @returns Promise<OpeningNode> - The root of the opening tree
 */
export async function buildOpeningTree(
    games: LibraryGame[], 
    onProgress?: (progress: number) => void
): Promise<OpeningNode> {
    const root: OpeningNode = { 
        san: 'Root', 
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 
        weight: games.length, 
        children: {} 
    }
    
    const chess = new Chess()
    
    // We process in chunks to avoid blocking the main UI thread.
    // Chess.js PGN parsing is synchronous and CPU-heavy.
    const CHUNK_SIZE = 100
    const total = games.length

    for (let i = 0; i < total; i++) {
        const game = games[i]
        try {
            // We use a temporary chess instance to extract history
            chess.loadPgn(game.pgn)
            const history = chess.history({ verbose: true })
            
            let currentNode = root
            // Limit depth to 10 moves to keep the visualization manageable and save memory
            const depth = Math.min(history.length, 10)
            
            for (let j = 0; j < depth; j++) {
                const move = history[j]
                const san = move.san
                const fen = move.after
                
                if (!currentNode.children[san]) {
                    currentNode.children[san] = { 
                        san, 
                        fen, 
                        weight: 0, 
                        children: {} 
                    }
                }
                
                currentNode.children[san].weight++
                currentNode = currentNode.children[san]
            }
        } catch (e) {
            // Skip invalid PGNs without crashing the entire mapping process
        }

        // Yield control back to the browser every CHUNK_SIZE games
        if (i > 0 && i % CHUNK_SIZE === 0) {
            if (onProgress) onProgress(i / total)
            await new Promise(r => setTimeout(r, 0))
        }
    }

    return root
}
