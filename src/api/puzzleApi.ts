import puzzlesData from '../data/puzzles.json'

export interface Puzzle {
  id: string
  title: string
  rating: number
  themes: string[]
  fen: string
  fen_before?: string
  lastMove: string
  solution: string[]
  category: string
}

const puzzles = puzzlesData as Puzzle[]

export async function fetchRandomPuzzle(category?: string): Promise<Puzzle> {
  // Simulate network latency (200-500ms)
  await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
  
  let pool = puzzles
  if (category && category !== 'mixed') {
    pool = puzzles.filter(p => p.category === category)
    if (pool.length === 0) pool = puzzles // fallback
  }
  
  // Return a random puzzle from the pool
  const randomIndex = Math.floor(Math.random() * pool.length)
  return pool[randomIndex]
}
