export interface CuratedCollection {
  id: string
  name: string
  category: 'players' | 'openings' | 'events' | 'narrative'
  url: string
  description: string
  gameCount?: number
}

export const TOP_50_COLLECTIONS: CuratedCollection[] = [
  // --- PLAYERS ---
  { id: 'kasparov', name: 'Garry Kasparov', category: 'players', url: '/libraries/Kasparov.zip', description: 'Dynamic complexity and aggressive perfection.', gameCount: 2478 },
  { id: 'fischer', name: 'Bobby Fischer', category: 'players', url: '/libraries/Fischer.zip', description: 'Absolute clarity and relentless will to win.', gameCount: 973 },
  { id: 'carlsen', name: 'Magnus Carlsen', category: 'players', url: '/libraries/Carlsen.zip', description: 'Modern precision and endgame squeezing.', gameCount: 2200 },
  { id: 'tal', name: 'Mikhail Tal', category: 'players', url: '/libraries/Tal.zip', description: 'Tactical fireworks and creative sacrifices.', gameCount: 2800 },
  { id: 'capablanca', name: 'Jose Capablanca', category: 'players', url: '/libraries/Capablanca.zip', description: 'The "Chess Machine". Positional purity.', gameCount: 600 },
  { id: 'alekhine', name: 'Alexander Alekhine', category: 'players', url: '/libraries/Alekhine.zip', description: 'Attacking genius and calculated aggression.', gameCount: 2100 },
  { id: 'karpov', name: 'Anatoly Karpov', category: 'players', url: '/libraries/Karpov.zip', description: 'Suffocating positional dominance.', gameCount: 3500 },
  { id: 'morphy', name: 'Paul Morphy', category: 'players', url: '/libraries/Morphy.zip', description: 'The pride and sorrow of chess. Classical principles.', gameCount: 400 },
  { id: 'nakamura', name: 'Hikaru Nakamura', category: 'players', url: '/libraries/Nakamura.zip', description: 'Tactical speed and modern resilience.' },
  { id: 'anand', name: 'Viswanathan Anand', category: 'players', url: '/libraries/Anand.zip', description: 'Intuitive speed and universal mastery.' },
  { id: 'polgar', name: 'Judit Polgar', category: 'players', url: '/libraries/Polgar.zip', description: 'Strongest woman ever. Ferociously tactical.' },
  { id: 'botvinnik', name: 'Mikhail Botvinnik', category: 'players', url: '/libraries/Botvinnik.zip', description: 'The "Patriarch" of Soviet chess strategy.' },
  { id: 'petrosian', name: 'Tigran Petrosian', category: 'players', url: '/libraries/Petrosian.zip', description: 'The "Iron Tigran". Deep prophylaxis.' },
  { id: 'spassky', name: 'Boris Spassky', category: 'players', url: '/libraries/Spassky.zip', description: 'Universal playing style at its finest.' },
  { id: 'smyslov', name: 'Vasily Smyslov', category: 'players', url: '/libraries/Smyslov.zip', description: 'Endgame harmony and positional flow.' },
  { id: 'korchnoi', name: 'Viktor Korchnoi', category: 'players', url: '/libraries/Korchnoi.zip', description: 'The "Terrible". Relentless counter-attack.' },
  { id: 'giri', name: 'Anish Giri', category: 'players', url: '/libraries/Giri.zip', description: 'Modern theory and rock-solid technique.' },
  
  // --- OPENINGS ---
  { id: 'sicilian', name: 'Sicilian Defense', category: 'openings', url: '/libraries/Sicilian.zip', description: 'Sharp and complex counter-attacking.' },
  { id: 'ruylopez', name: 'Ruy Lopez', category: 'openings', url: '/libraries/RuyLopez.zip', description: 'The absolute standard of classical theory.' },
  { id: 'kingsindian', name: 'King\'s Indian', category: 'openings', url: '/libraries/KingsIndian.zip', description: 'Aggressive counterplay against 1.d4' },
  { id: 'london', name: 'London System', category: 'openings', url: '/libraries/London.zip', description: 'The reliable and flexible modern setup.' },
  { id: 'carokann', name: 'Caro-Kann', category: 'openings', url: '/libraries/CaroKann.zip', description: 'Maximum solidity and reliability.' },
  { id: 'french', name: 'French Defense', category: 'openings', url: '/libraries/French.zip', description: 'Strategic pawn chains and central tension.' },
  { id: 'slav', name: 'Slav Defense', category: 'openings', url: '/libraries/Slav.zip', description: 'Durable and solid foundation for Black.' },
  { id: 'english', name: 'English Opening', category: 'openings', url: '/libraries/English.zip', description: 'Flank pressure and creative versatility.' },
  { id: 'catalan', name: 'Catalan Opening', category: 'openings', url: '/libraries/Catalan.zip', description: 'Subtle positional pressure with the fianchetto.' },
  { id: 'evans', name: 'Evans Gambit', category: 'openings', url: '/libraries/EvansGambit.zip', description: 'The "Gift of the Gods". Romantic attacking.' },

  // --- EVENTS ---
  { id: 'candidates2024', name: 'Candidates 2024', category: 'events', url: '/libraries/Candidates2024.zip', description: 'The dramatic race to the crown.' },
  { id: 'worldch2023', name: 'World Championship 23', category: 'events', url: '/libraries/WorldCh2023.zip', description: 'Ding Liren vs Ian Nepomniachtchi.' },
  { id: 'worldch2021', name: 'World Championship 21', category: 'events', url: '/libraries/WorldCh2021.zip', description: 'Magnus Carlsen vs Ian Nepomniachtchi.' },
  { id: 'wijk2024', name: 'Wijk aan Zee 2024', category: 'events', url: '/libraries/Wijk2024.zip', description: 'Legendary elite super-tournament.' },
  { id: 'tatasteel2024', name: 'Tata Steel 2024', category: 'events', url: '/libraries/TataSteel2024.zip', description: 'The "Wimbledon of Chess".' },

  // --- NARRATIVE & HISTORY ---
  { id: 'popularculture', name: 'Chess in Popular Culture', category: 'narrative', url: '/libraries/PopularCulture.zip', description: 'Games found in movies, books, and TV shows.' },
  { id: 'cheating', name: 'Cheating Scandals', category: 'narrative', url: '/libraries/CheatingScandals.zip', description: 'Historic computer-assisted cheating cases.' },
  { id: 'womens1927', name: 'Womens World Ch 1927', category: 'narrative', url: '/libraries/WomensWorldCh1927.zip', description: 'The first official women\'s world championship.' },
  { id: 'hastings1895', name: 'Hastings 1895', category: 'narrative', url: '/libraries/Hastings1895.zip', description: 'The strongest tournament of the 19th century.' },
  { id: 'linares2010', name: 'Linares 2010', category: 'narrative', url: '/libraries/Linares2010.zip', description: 'Deep study of the elite Linares tradition.' }
]
