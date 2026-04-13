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
  const batch = await fetchPuzzleBatch(category, 1)
  return batch[0]
}

export async function fetchPuzzleBatch(category?: string, count: number = 3): Promise<Puzzle[]> {
  await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
  let pool = puzzles
  if (category && category !== 'mixed') {
    pool = puzzles.filter(p => p.category === category)
    if (pool.length === 0) pool = puzzles
  }
  
  const shuffled = [...pool].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

export async function fetchPuzzleById(id: string): Promise<Puzzle | null> {
  await new Promise(r => setTimeout(r, 100))
  return puzzles.find(p => p.id === id) || null
}

export async function fetchMultiplePuzzlesById(ids: string[]): Promise<Puzzle[]> {
  await new Promise(r => setTimeout(r, 100))
  return puzzles.filter(p => ids.includes(p.id))
}
