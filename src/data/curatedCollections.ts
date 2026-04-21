export interface CuratedCollection {
  id: string
  name: string
  category: 'players' | 'openings' | 'events' | 'narrative'
  url: string
  description: string
  gameCount?: number
  sourceWebsite?: string
}

export const TOP_50_COLLECTIONS: CuratedCollection[] = [
  // --- PLAYERS ---
  { id: 'kasparov', name: 'Garry Kasparov', category: 'players', url: '/libraries/Kasparov.zip', description: 'Dynamic complexity and aggressive perfection.', gameCount: 2478, sourceWebsite: 'pgnmentor.com' },
  { id: 'fischer', name: 'Bobby Fischer', category: 'players', url: '/libraries/Fischer.zip', description: 'Absolute clarity and relentless will to win.', gameCount: 973, sourceWebsite: 'pgnmentor.com' },
  { id: 'carlsen', name: 'Magnus Carlsen', category: 'players', url: '/libraries/Carlsen.zip', description: 'Modern precision and endgame squeezing.', gameCount: 2200, sourceWebsite: 'pgnmentor.com' },
  { id: 'tal', name: 'Mikhail Tal', category: 'players', url: '/libraries/Tal.zip', description: 'Tactical fireworks and creative sacrifices.', gameCount: 2800, sourceWebsite: 'pgnmentor.com' },
  { id: 'capablanca', name: 'Jose Capablanca', category: 'players', url: '/libraries/Capablanca.zip', description: 'The "Chess Machine". Positional purity.', gameCount: 600, sourceWebsite: 'pgnmentor.com' },
  { id: 'alekhine', name: 'Alexander Alekhine', category: 'players', url: '/libraries/Alekhine.zip', description: 'Attacking genius and calculated aggression.', gameCount: 2100, sourceWebsite: 'pgnmentor.com' },
  { id: 'karpov', name: 'Anatoly Karpov', category: 'players', url: '/libraries/Karpov.zip', description: 'Suffocating positional dominance.', gameCount: 3500, sourceWebsite: 'pgnmentor.com' },
  { id: 'morphy', name: 'Paul Morphy', category: 'players', url: '/libraries/Morphy.zip', description: 'The pride and sorrow of chess. Classical principles.', gameCount: 400, sourceWebsite: 'pgnmentor.com' },
  { id: 'nakamura', name: 'Hikaru Nakamura', category: 'players', url: '/libraries/Nakamura.zip', description: 'Tactical speed and modern resilience.', sourceWebsite: 'pgnmentor.com' },
  { id: 'anand', name: 'Viswanathan Anand', category: 'players', url: '/libraries/Anand.zip', description: 'Intuitive speed and universal mastery.', sourceWebsite: 'pgnmentor.com' },
  { id: 'polgar', name: 'Judit Polgar', category: 'players', url: '/libraries/Polgar.zip', description: 'Strongest woman ever. Ferociously tactical.', sourceWebsite: 'pgnmentor.com' },
  { id: 'botvinnik', name: 'Mikhail Botvinnik', category: 'players', url: '/libraries/Botvinnik.zip', description: 'The "Patriarch" of Soviet chess strategy.', sourceWebsite: 'pgnmentor.com' },
  { id: 'petrosian', name: 'Tigran Petrosian', category: 'players', url: '/libraries/Petrosian.zip', description: 'The "Iron Tigran". Deep prophylaxis.', sourceWebsite: 'pgnmentor.com' },
  { id: 'spassky', name: 'Boris Spassky', category: 'players', url: '/libraries/Spassky.zip', description: 'Universal playing style at its finest.', sourceWebsite: 'pgnmentor.com' },
  { id: 'smyslov', name: 'Vasily Smyslov', category: 'players', url: '/libraries/Smyslov.zip', description: 'Endgame harmony and positional flow.', sourceWebsite: 'pgnmentor.com' },
  { id: 'korchnoi', name: 'Viktor Korchnoi', category: 'players', url: '/libraries/Korchnoi.zip', description: 'The "Terrible". Relentless counter-attack.', sourceWebsite: 'pgnmentor.com' },
  { id: 'giri', name: 'Anish Giri', category: 'players', url: '/libraries/Giri.zip', description: 'Modern theory and rock-solid technique.', sourceWebsite: 'pgnmentor.com' },
  
  // --- OPENINGS ---
  { id: 'sicilian', name: 'Sicilian Defense', category: 'openings', url: '/libraries/Sicilian.zip', description: 'Sharp and complex counter-attacking.', sourceWebsite: 'pgnmentor.com' },
  { id: 'ruylopez', name: 'Ruy Lopez', category: 'openings', url: '/libraries/RuyLopez.zip', description: 'The absolute standard of classical theory.', sourceWebsite: 'pgnmentor.com' },
  { id: 'kingsindian', name: 'King\'s Indian', category: 'openings', url: '/libraries/KingsIndian.zip', description: 'Aggressive counterplay against 1.d4', sourceWebsite: 'pgnmentor.com' },
  { id: 'london', name: 'London System', category: 'openings', url: '/libraries/London.zip', description: 'The reliable and flexible modern setup.', sourceWebsite: 'pgnmentor.com' },
  { id: 'carokann', name: 'Caro-Kann', category: 'openings', url: '/libraries/CaroKann.zip', description: 'Maximum solidity and reliability.', sourceWebsite: 'pgnmentor.com' },
  { id: 'french', name: 'French Defense', category: 'openings', url: '/libraries/French.zip', description: 'Strategic pawn chains and central tension.', sourceWebsite: 'pgnmentor.com' },
  { id: 'slav', name: 'Slav Defense', category: 'openings', url: '/libraries/Slav.zip', description: 'Durable and solid foundation for Black.', sourceWebsite: 'pgnmentor.com' },
  { id: 'english', name: 'English Opening', category: 'openings', url: '/libraries/English.zip', description: 'Flank pressure and creative versatility.', sourceWebsite: 'pgnmentor.com' },
  { id: 'catalan', name: 'Catalan Opening', category: 'openings', url: '/libraries/Catalan.zip', description: 'Subtle positional pressure with the fianchetto.', sourceWebsite: 'pgnmentor.com' },
  { id: 'evans', name: 'Evans Gambit', category: 'openings', url: '/libraries/EvansGambit.zip', description: 'The "Gift of the Gods". Romantic attacking.', sourceWebsite: 'pgnmentor.com' },

  // --- EVENTS ---
  { id: 'candidates2024', name: 'Candidates 2024', category: 'events', url: '/libraries/Candidates2024.zip', description: 'The dramatic race to the crown.', sourceWebsite: 'theweekinchess.com' },
  { id: 'worldch2023', name: 'World Championship 23', category: 'events', url: '/libraries/WorldCh2023.zip', description: 'Ding Liren vs Ian Nepomniachtchi.', sourceWebsite: 'theweekinchess.com' },
  { id: 'worldch2021', name: 'World Championship 21', category: 'events', url: '/libraries/WorldCh2021.zip', description: 'Magnus Carlsen vs Ian Nepomniachtchi.', sourceWebsite: 'theweekinchess.com' },
  { id: 'wijk2024', name: 'Wijk aan Zee 2024', category: 'events', url: '/libraries/Wijk2024.zip', description: 'Legendary elite super-tournament.', sourceWebsite: 'theweekinchess.com' },
  { id: 'tatasteel2024', name: 'Tata Steel 2024', category: 'events', url: '/libraries/TataSteel2024.zip', description: 'The "Wimbledon of Chess".', sourceWebsite: 'theweekinchess.com' },

  // --- NARRATIVE & HISTORY ---
  { id: 'popularculture', name: 'Chess in Popular Culture', category: 'narrative', url: '/libraries/PopularCulture.zip', description: 'Games found in movies, books, and TV shows.', sourceWebsite: 'chessgames.com' },
  { id: 'cheating', name: 'Cheating Scandals', category: 'narrative', url: '/libraries/CheatingScandals.zip', description: 'Historic computer-assisted cheating cases.', sourceWebsite: 'chessgames.com' },
  { id: 'womens1927', name: 'Womens World Ch 1927', category: 'narrative', url: '/libraries/WomensWorldCh1927.zip', description: 'The first official women\'s world championship.', sourceWebsite: 'chess.com' },
  { id: 'hastings1895', name: 'Hastings 1895', category: 'narrative', url: '/libraries/Hastings1895.zip', description: 'The strongest tournament of the 19th century.', sourceWebsite: 'chessgames.com' },
  { id: 'linares2010', name: 'Linares 2010', category: 'narrative', url: '/libraries/Linares2010.zip', description: 'Deep study of the elite Linares tradition.', sourceWebsite: 'chessgames.com' },
  { id: 'uschess', name: 'US Chess Life Archive', category: 'narrative', url: '/libraries/USChessLifeMagazine.zip', description: 'Massive archive of games from Chess Life Magazine.', sourceWebsite: 'newinchess.com' }
]
