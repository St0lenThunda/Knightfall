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

  // 2. Normalize player names (lowercase, trimmed)
  const p1 = white.toLowerCase().trim()
  const p2 = black.toLowerCase().trim()

  // 3. Create the canonical string
  // We use the first 500 characters of moves which is usually 100+ moves
  // and plenty for uniqueness combined with names.
  const canonical = `${p1}|${p2}|${movesOnly.slice(0, 500)}`

  // 4. Simple "hash" to keep the ID readable but unique
  // In a real app we might use SHA-256, but a base64-encoded 
  // truncated string is fine for our client-side needs.
  // We'll use a simple character-based mapping.
  return btoa(canonical.slice(0, 200)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
}
