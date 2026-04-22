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

/**
 * Fetches the "Daily Gauntlet" — a consistent set of 5 puzzles 
 * that is the same for every user on a given day.
 * 
 * We use the current date (YYYY-MM-DD) as a seed to ensure 
 * global synchronization for the leaderboard.
 * 
 * @returns Promise<Puzzle[]> - The 5 puzzles for today
 */
export async function fetchDailyGauntlet(): Promise<Puzzle[]> {
  // We generate a seed from the current date (e.g., "2026-04-21")
  const today = new Date().toISOString().split('T')[0];
  
  // A simple hashing function to turn the date string into a number
  let seed = 0;
  for (let i = 0; i < today.length; i++) {
    seed = (seed << 5) - seed + today.charCodeAt(i);
    seed |= 0; // Convert to 32bit integer
  }

  // Use the seed to pick a starting point in the puzzles array
  const totalPuzzles = puzzles.length;
  const startIndex = Math.abs(seed) % totalPuzzles;
  
  // Select 5 consecutive puzzles (wrapping around if needed)
  const gauntlet: Puzzle[] = [];
  for (let i = 0; i < 5; i++) {
    const index = (startIndex + i) % totalPuzzles;
    gauntlet.push(puzzles[index]);
  }
  
  // Artificial delay to simulate network fetch
  return new Promise((resolve) => setTimeout(() => resolve(gauntlet), 300));
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
