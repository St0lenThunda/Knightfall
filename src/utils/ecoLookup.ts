/**
 * ECO Code → Opening Name Lookup Table
 * 
 * The ECO (Encyclopaedia of Chess Openings) system classifies every
 * opening into a code from A00 to E99. Chess.com always includes
 * this in the PGN headers, making it the most reliable way to
 * identify an opening — even when the [Opening] tag is missing.
 * 
 * This table covers the most common codes. Unknown codes fall back
 * to a category name based on the letter prefix.
 */

const ECO_NAMES: Record<string, string> = {
  // A: Flank Openings
  'A00': 'Uncommon Opening', 'A01': 'Nimzo-Larsen Attack', 'A02': "Bird's Opening",
  'A04': 'Réti Opening', 'A05': 'Réti Opening', 'A06': 'Réti Opening',
  'A07': "King's Indian Attack", 'A08': "King's Indian Attack", 'A09': 'Réti Opening',
  'A10': 'English Opening', 'A13': 'English Opening', 'A15': 'English Opening',
  'A16': 'English Opening', 'A20': 'English Opening', 'A25': 'English Opening',
  'A30': 'English Symmetrical', 'A40': "Queen's Pawn Game", 'A41': "Queen's Pawn Game",
  'A43': 'Old Benoni', 'A45': "Queen's Pawn Game", 'A46': "Queen's Pawn Game",
  'A48': "King's Indian: London System", 'A49': "King's Indian: London System",
  'A50': "Queen's Pawn Game", 'A51': 'Budapest Gambit', 'A52': 'Budapest Gambit',
  'A53': 'Old Indian Defense', 'A56': 'Benoni Defense', 'A57': 'Benko Gambit',
  'A58': 'Benko Gambit Accepted', 'A60': 'Benoni Defense',

  // B: Semi-Open Games (1.e4, not 1...e5)
  'B00': 'Uncommon King Pawn', 'B01': 'Scandinavian Defense',
  'B02': "Alekhine's Defense", 'B03': "Alekhine's Defense", 'B04': "Alekhine's Defense",
  'B06': 'Modern Defense', 'B07': 'Pirc Defense', 'B08': 'Pirc Defense',
  'B09': 'Pirc: Austrian Attack', 'B10': 'Caro-Kann Defense', 'B12': 'Caro-Kann Defense',
  'B13': 'Caro-Kann: Exchange', 'B14': 'Caro-Kann: Panov-Botvinnik',
  'B15': 'Caro-Kann Defense', 'B17': 'Caro-Kann: Steinitz',
  'B18': 'Caro-Kann: Classical', 'B19': 'Caro-Kann: Classical',
  'B20': 'Sicilian Defense', 'B21': 'Sicilian: Smith-Morra Gambit',
  'B22': 'Sicilian: Alapin', 'B23': 'Sicilian: Closed', 'B25': 'Sicilian: Closed',
  'B27': 'Sicilian Defense', 'B30': 'Sicilian Defense', 'B31': 'Sicilian: Rossolimo',
  'B32': 'Sicilian: Löwenthal', 'B33': 'Sicilian: Sveshnikov',
  'B35': 'Sicilian: Accelerated Dragon', 'B36': 'Sicilian: Maróczy Bind',
  'B40': 'Sicilian Defense', 'B41': 'Sicilian: Kan', 'B44': 'Sicilian: Taimanov',
  'B45': 'Sicilian: Taimanov', 'B46': 'Sicilian: Taimanov',
  'B50': 'Sicilian Defense', 'B51': 'Sicilian: Moscow', 'B52': 'Sicilian: Canal',
  'B54': 'Sicilian Defense', 'B56': 'Sicilian Defense',
  'B57': 'Sicilian: Sozin', 'B60': 'Sicilian: Richter-Rauzer',
  'B63': 'Sicilian: Richter-Rauzer', 'B65': 'Sicilian: Richter-Rauzer',
  'B70': 'Sicilian: Dragon', 'B72': 'Sicilian: Dragon', 'B76': 'Sicilian: Dragon',
  'B77': 'Sicilian: Dragon Yugoslav', 'B78': 'Sicilian: Dragon Yugoslav',
  'B80': 'Sicilian: Scheveningen', 'B83': 'Sicilian: Scheveningen',
  'B84': 'Sicilian: Scheveningen', 'B85': 'Sicilian: Scheveningen',
  'B90': 'Sicilian: Najdorf', 'B92': 'Sicilian: Najdorf', 'B93': 'Sicilian: Najdorf',
  'B94': 'Sicilian: Najdorf', 'B96': 'Sicilian: Najdorf', 'B97': 'Sicilian: Najdorf Poisoned Pawn',
  'B99': 'Sicilian: Najdorf',

  // C: Open Games (1.e4 e5) & French
  'C00': 'French Defense', 'C01': 'French: Exchange', 'C02': 'French: Advance',
  'C03': 'French: Tarrasch', 'C05': 'French: Tarrasch', 'C06': 'French: Tarrasch',
  'C07': 'French: Tarrasch', 'C10': 'French Defense', 'C11': 'French: Classical',
  'C12': 'French: MacCutcheon', 'C13': 'French: Classical', 'C15': 'French: Winawer',
  'C16': 'French: Winawer', 'C17': 'French: Winawer', 'C18': 'French: Winawer',
  'C19': 'French: Winawer',
  'C20': "King's Pawn Game", 'C21': 'Center Game', 'C22': 'Center Game',
  'C23': "Bishop's Opening", 'C24': "Bishop's Opening",
  'C25': 'Vienna Game', 'C26': 'Vienna Game', 'C27': 'Vienna Game',
  'C28': 'Vienna Game', 'C29': 'Vienna Gambit',
  'C30': "King's Gambit", 'C33': "King's Gambit Accepted", 'C36': "King's Gambit Accepted",
  'C39': "King's Gambit", 'C40': "King's Pawn Game", 'C41': 'Philidor Defense',
  'C42': 'Petrov Defense', 'C43': 'Petrov Defense', 'C44': 'Scotch Game',
  'C45': 'Scotch Game', 'C46': 'Three Knights Game', 'C47': 'Four Knights Game',
  'C48': 'Four Knights Game', 'C49': 'Four Knights Game',
  'C50': 'Italian Game', 'C51': 'Evans Gambit', 'C52': 'Evans Gambit',
  'C53': 'Italian Game: Giuoco Piano', 'C54': 'Italian Game: Giuoco Piano',
  'C55': 'Italian Game: Two Knights', 'C56': 'Italian Game: Two Knights',
  'C57': 'Italian: Traxler/Fried Liver', 'C58': 'Italian Game: Two Knights',
  'C60': 'Ruy Lopez', 'C62': 'Ruy Lopez: Old Steinitz', 'C63': 'Ruy Lopez: Schliemann',
  'C64': 'Ruy Lopez: Classical', 'C65': 'Ruy Lopez: Berlin',
  'C66': 'Ruy Lopez: Berlin', 'C67': 'Ruy Lopez: Berlin',
  'C68': 'Ruy Lopez: Exchange', 'C69': 'Ruy Lopez: Exchange',
  'C70': 'Ruy Lopez', 'C72': 'Ruy Lopez', 'C74': 'Ruy Lopez',
  'C76': 'Ruy Lopez', 'C78': 'Ruy Lopez: Arkhangelsk',
  'C80': 'Ruy Lopez: Open', 'C82': 'Ruy Lopez: Open',
  'C84': 'Ruy Lopez: Closed', 'C86': 'Ruy Lopez: Worrall',
  'C88': 'Ruy Lopez: Closed', 'C89': 'Ruy Lopez: Marshall',
  'C90': 'Ruy Lopez: Closed', 'C92': 'Ruy Lopez: Closed',
  'C95': 'Ruy Lopez: Breyer', 'C96': 'Ruy Lopez: Chigorin',
  'C97': 'Ruy Lopez: Chigorin', 'C99': 'Ruy Lopez: Chigorin',

  // D: Closed & Semi-Closed Games
  'D00': "Queen's Pawn Game", 'D01': 'Richter-Veresov Attack', 'D02': "Queen's Pawn Game",
  'D03': 'Torre Attack', 'D04': "Queen's Pawn Game", 'D05': "Queen's Pawn: Colle System",
  'D06': "Queen's Gambit", 'D07': 'Chigorin Defense', 'D08': "Queen's Gambit: Albin Counter",
  'D10': "Queen's Gambit: Slav", 'D11': "Queen's Gambit: Slav",
  'D12': "Queen's Gambit: Slav", 'D13': "Queen's Gambit: Exchange Slav",
  'D15': "Queen's Gambit: Slav", 'D16': "Queen's Gambit: Slav",
  'D17': "Queen's Gambit: Slav", 'D20': "Queen's Gambit Accepted",
  'D21': "Queen's Gambit Accepted", 'D22': "Queen's Gambit Accepted",
  'D24': "Queen's Gambit Accepted", 'D25': "Queen's Gambit Accepted",
  'D26': "Queen's Gambit Accepted", 'D27': "Queen's Gambit Accepted",
  'D30': "Queen's Gambit Declined", 'D31': "Queen's Gambit Declined",
  'D32': "Queen's Gambit: Tarrasch", 'D34': "Queen's Gambit: Tarrasch",
  'D35': "Queen's Gambit: Exchange", 'D36': "Queen's Gambit: Exchange",
  'D37': "Queen's Gambit Declined", 'D38': "Queen's Gambit: Ragozin",
  'D40': "Queen's Gambit: Semi-Tarrasch", 'D43': "Queen's Gambit: Semi-Slav",
  'D44': "Queen's Gambit: Semi-Slav", 'D45': "Queen's Gambit: Semi-Slav",
  'D46': "Queen's Gambit: Semi-Slav Meran", 'D47': "Queen's Gambit: Semi-Slav Meran",
  'D50': "Queen's Gambit Declined", 'D52': "Queen's Gambit: Cambridge Springs",
  'D53': "Queen's Gambit Declined", 'D55': "Queen's Gambit Declined",
  'D56': "Queen's Gambit Declined", 'D60': "Queen's Gambit: Orthodox",
  'D70': 'Grünfeld Defense', 'D71': 'Grünfeld Defense', 'D76': 'Grünfeld: Russian',
  'D77': 'Grünfeld Defense', 'D78': 'Grünfeld Defense',
  'D80': 'Grünfeld Defense', 'D85': 'Grünfeld: Exchange',
  'D86': 'Grünfeld: Exchange Classical', 'D87': 'Grünfeld: Exchange',
  'D90': 'Grünfeld Defense', 'D93': 'Grünfeld Defense', 'D97': 'Grünfeld: Russian',

  // E: Indian Defenses
  'E00': 'Catalan Opening', 'E01': 'Catalan Opening', 'E04': 'Catalan: Open',
  'E05': 'Catalan: Open', 'E06': 'Catalan: Closed',
  'E10': 'Blumenfeld Gambit', 'E11': 'Bogo-Indian Defense', 'E12': "Queen's Indian Defense",
  'E14': "Queen's Indian Defense", 'E15': "Queen's Indian Defense",
  'E16': "Queen's Indian Defense", 'E17': "Queen's Indian Defense",
  'E20': 'Nimzo-Indian Defense', 'E21': 'Nimzo-Indian: Three Knights',
  'E24': 'Nimzo-Indian: Sämisch', 'E25': 'Nimzo-Indian: Sämisch',
  'E30': 'Nimzo-Indian: Leningrad', 'E32': 'Nimzo-Indian: Classical',
  'E33': 'Nimzo-Indian: Classical', 'E36': 'Nimzo-Indian: Classical',
  'E38': 'Nimzo-Indian: Classical', 'E40': 'Nimzo-Indian Defense',
  'E41': 'Nimzo-Indian: Hübner', 'E42': 'Nimzo-Indian: Hübner',
  'E43': 'Nimzo-Indian Defense', 'E46': 'Nimzo-Indian: Reshevsky',
  'E48': 'Nimzo-Indian Defense', 'E49': 'Nimzo-Indian: Normal',
  'E50': 'Nimzo-Indian Defense', 'E52': 'Nimzo-Indian: Main Line',
  'E53': 'Nimzo-Indian: Main Line', 'E54': 'Nimzo-Indian: Main Line',
  'E55': 'Nimzo-Indian: Main Line',
  'E60': "King's Indian Defense", 'E61': "King's Indian Defense",
  'E62': "King's Indian: Fianchetto", 'E63': "King's Indian: Fianchetto",
  'E67': "King's Indian: Fianchetto", 'E68': "King's Indian: Fianchetto",
  'E70': "King's Indian Defense", 'E71': "King's Indian Defense",
  'E73': "King's Indian: Averbakh", 'E76': "King's Indian: Four Pawns",
  'E77': "King's Indian: Four Pawns", 'E80': "King's Indian: Sämisch",
  'E81': "King's Indian: Sämisch", 'E83': "King's Indian: Sämisch",
  'E85': "King's Indian: Sämisch", 'E87': "King's Indian: Sämisch",
  'E90': "King's Indian: Classical", 'E92': "King's Indian: Classical",
  'E94': "King's Indian: Orthodox", 'E97': "King's Indian: Mar del Plata",
  'E98': "King's Indian: Mar del Plata", 'E99': "King's Indian: Mar del Plata",
}

/**
 * Category names for unknown ECO codes, based on the letter prefix.
 */
const ECO_CATEGORIES: Record<string, string> = {
  'A': 'Flank Opening',
  'B': 'Semi-Open Game',
  'C': 'Open Game',
  'D': 'Closed Game',
  'E': 'Indian Defense',
}

/**
 * Educational descriptions for opening categories and major systems.
 */
const ECO_DESCRIPTIONS: Record<string, string> = {
  // Categories
  'A': 'Flank openings (like the English or Bird) avoid the center early to strike later.',
  'B': 'Semi-Open games occur when White plays 1.e4 and Black responds with anything other than 1...e5.',
  'C': 'Open games (1.e4 e5) are the most classical battleground for central control.',
  'D': 'Closed games (1.d4 d5) tend toward strategic maneuvering and solid structures.',
  'E': 'Indian Defenses (1.d4 Nf6) are hypermodern systems that allow White central space to attack it later.',

  // Specific Major Systems (Examples)
  'B90': 'The Najdorf is the "Cadillac of Openings" — sharp, tactical, and incredibly complex.',
  'C50': 'The Italian Game is a timeless classical battle, focusing on development and the f7 square.',
  'B10': 'The Caro-Kann is the "Iron Wall" — a rock-solid defense that prepares a strong counter-strike.',
  'C00': 'The French Defense creates an asymmetrical battle where Black solidifies the center and counter-attacks.',
  'D10': 'The Slav is one of the most reliable ways to meet 1.d4, creating a very solid pawn chain.',
  'E60': "The King's Indian is a high-risk, high-reward system aimed at a massive kingside attack.",
}

/**
 * Looks up a human-readable opening name for a given ECO code.
 * Falls back to the letter-category if the exact code isn't mapped.
 *
 * @param eco - The ECO code (e.g. "B90", "C50")
 * @returns A human-readable opening name
 */
export function ecoToName(eco: string): string {
  if (!eco) return 'Unknown Opening'
  const code = eco.trim().toUpperCase()
  if (ECO_NAMES[code]) return ECO_NAMES[code]
  // Fall back to the letter category
  const letter = code.charAt(0)
  return ECO_CATEGORIES[letter] || 'Unknown Opening'
}

/**
 * Looks up a brief educational description for a given ECO code.
 *
 * @param eco - The ECO code (e.g. "B90", "C50")
 * @returns A short description of the opening
 */
export function ecoToDescription(eco: string): string {
  if (!eco) return 'A mysterious sequence of moves.'
  const code = eco.trim().toUpperCase()
  if (ECO_DESCRIPTIONS[code]) return ECO_DESCRIPTIONS[code]
  
  // Fall back to the category description
  const letter = code.charAt(0)
  return ECO_DESCRIPTIONS[letter] || 'A strategic battle for control of the board.'
}
