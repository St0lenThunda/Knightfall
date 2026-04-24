/**
 * Generates a unique, stable fingerprint for a chess game.
 * We use this as the ID to ensure that the same game imported
 * multiple times (or from different devices) doesn't create
 * duplicate records in IndexedDB or Supabase.
 * 
 * @param white - Name of the white player
 * @param black - Name of the black player
 * @param pgn - The raw PGN text
 * @returns string - A stable hash-like fingerprint
 */
export function generateGameFingerprint(white: string, black: string, pgn: string): string {
  // 1. Extract only the moves (strip all [Headers] and {comments})
  const movesOnly = pgn
    .replace(/\[.*?\]\s*/g, '')   // Remove header tags
    .replace(/\{[^}]*\}/g, '')    // Remove comments
    .replace(/\s+/g, ' ')         // Collapse whitespace
    .trim()

  // 2. Extract Date if available
  const dateMatch = pgn.match(/\[Date "(.*?)"\]/)
  const date = dateMatch ? dateMatch[1] : 'unknown'

  // 3. Normalize metadata
  const p1 = white.toLowerCase().trim()
  const p2 = black.toLowerCase().trim()

  // 4. Create a robust canonical string
  const rawId = `${p1}|${p2}|${date}|${movesOnly}`
  
  // 5. DJB2-like hash for uniqueness
  let hash = 5381
  for (let i = 0; i < rawId.length; i++) {
    hash = (hash * 33) ^ rawId.charCodeAt(i)
  }
  
  const hexHash = (hash >>> 0).toString(16)
  const shortNames = btoa(`${p1.slice(0, 5)}|${p2.slice(0, 5)}`).replace(/[^a-zA-Z]/g, '')
  
  return `${shortNames}${hexHash}${movesOnly.length}`.slice(0, 32)
}
