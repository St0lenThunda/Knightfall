import { ref } from 'vue'

export interface Bot {
  id: string
  name: string
  rating: number
  description: string
  avatar: string
  depth: number
  skillLevel: number // 0-20
  elo?: number // UCI_Elo target
  contempt: number // -100 to 100 (avoids draws)
  mortalArchetype?: string // Link to useMortalLogic archetypes
  backstory?: string
  traits?: string[]
}

export const BOTS: Bot[] = [
  { 
    id: 'leo', 
    name: 'Leo the Apprentice', 
    rating: 400, 
    description: 'A clockwork squire found in the ruins of the Iron Spire.', 
    avatar: '/bots/leo.png', 
    depth: 1, 
    skillLevel: 0, 
    elo: 400, 
    contempt: 0, 
    mortalArchetype: 'balanced',
    traits: ['Curious', 'Unpredictable', 'Hesitant'],
    backstory: "Leo mimics the movements of legendary knights with charming imprecision. He possesses a heart of gears and a mind that wanders toward the beauty of the stars rather than the strategy of the square. Be patient, for he is a soul discovering the rules of a forgotten world."
  },
  { 
    id: 'tanya', 
    name: 'Tanya of the Whispering Blade', 
    rating: 800, 
    description: 'Exiled combat specialist obsessed with explosive gambits.', 
    avatar: '/bots/tanya.png', 
    depth: 3, 
    skillLevel: 5, 
    elo: 800, 
    contempt: 50, 
    mortalArchetype: 'gambler',
    traits: ['Aggressive', 'Tactical', 'Impatient'],
    backstory: "Tanya treats the chessboard as a battlefield of shadows, seeking the shortest path to the enemy King through sacrifice and fire. Her moves are sharp, her patience thin, and her steel always hungry for a decisive strike. She views the board as a minefield and isn't afraid to step on a few mines."
  },
  { 
    id: 'maya', 
    name: 'Maya the Weaver', 
    rating: 1100, 
    description: 'Celestial oracle who views the 64 squares as a tapestry of destiny.', 
    avatar: '/bots/maya.png', 
    depth: 5, 
    skillLevel: 8, 
    elo: 1100, 
    contempt: 10, 
    mortalArchetype: 'balanced',
    traits: ['Balanced', 'Solid', 'Patient'],
    backstory: "Maya weaves her pieces into an unbreakable web of center control. She does not fight for space; she simply exists where the threads of the universe are strongest. To defeat her is to untangle the very fabric of logic that binds the Knightfall realm together."
  },
  { 
    id: 'boris', 
    name: 'Boris the Iron Sentinel', 
    rating: 1400, 
    description: 'Ancient golem protector carved from deep-mountain basalt.', 
    avatar: '/bots/boris.png', 
    depth: 8, 
    skillLevel: 12, 
    elo: 1400, 
    contempt: -20, 
    mortalArchetype: 'turtle',
    traits: ['Dogmatic', 'Stubborn', 'Classical'],
    backstory: "Boris plays with the weight of mountains, preferring solid structures and unbreakable defense over flashy attacks. Like a glacier, his strategy is slow, inevitable, and crushing to those who rush their fate. He is the wisdom of the elders given form in stone."
  },
  { 
    id: 'arthur', 
    name: 'Valkyrie Valeriana', 
    rating: 1700, 
    description: 'Reborn commander of the Sky-Legion and spirit of pure aggression.', 
    avatar: '/bots/arthur.png', 
    depth: 10, 
    skillLevel: 15, 
    elo: 1700, 
    contempt: 100, 
    mortalArchetype: 'aggressor',
    traits: ['Ruthless', 'Sacrificial', 'Chaos-driven'],
    backstory: "Valeriana values honor above all but considers the sacrifice of her own troops a necessary price for the total annihilation of her foe. Her presence is a thunderstorm of chaotic energy that leaves no room for hesitation. She will burn her own house down just to smoke you out."
  },
  { 
    id: 'elara', 
    name: 'Elara the Chronomancer', 
    rating: 2000, 
    description: 'Master of time who waits for the landscape of the endgame.', 
    avatar: '/bots/elara.png', 
    depth: 12, 
    skillLevel: 18, 
    elo: 2000, 
    contempt: -50, 
    mortalArchetype: 'turtle',
    traits: ['Precise', 'Cold', 'Unforgiving'],
    backstory: "Elara allows the opening and middlegame to pass like a dream, for she knows that as the pieces vanish, her absolute power grows. In the barren landscape of the endgame, she is the ultimate predator, calculating every stride with chilling perfection. Do not trade down with the Chronomancer."
  },
  { 
    id: 'magnus_mini', 
    name: 'Magnus the Arcane Prince', 
    rating: 2400, 
    description: 'Distillation of master-level intuition and arcane brilliance.', 
    avatar: '/bots/magnus.png', 
    depth: 14, 
    skillLevel: 20, 
    elo: 2400, 
    contempt: 20, 
    mortalArchetype: 'aggressor',
    traits: ['Genius', 'Relentless', 'Squeezing'],
    backstory: "The Prince does not seek the blunders of his enemies; he simply removes their oxygen, one square at a time, until they collapse from the pressure of his brilliance. He is the quiet before the storm that never ends, squeezing tiny 1% advantages into 100% victories."
  },
  { 
    id: 'gm', 
    name: 'The Obsidian Warden', 
    rating: 2800, 
    description: 'Final gatekeeper of the Neural Vault and construct of pure logic.', 
    avatar: '/bots/gm.png', 
    depth: 18, 
    skillLevel: 20, 
    elo: 2800, 
    contempt: 0, 
    mortalArchetype: 'balanced',
    traits: ['Flawless', 'Encyclopedic', 'Stoic'],
    backstory: "The Warden is a construct of pure logic and dark-glass, devoid of human frailty or doubt. He has memorized every ritual and rite recorded in the Codex of Rites, making him an encyclopedic force of nature. To challenge him is to face the cold, unblinking eye of the infinite itself."
  },
  { 
    id: 'nova', 
    name: 'The Celestial Event', 
    rating: 3200, 
    description: 'A collapse of logic into a singularity of pure mathematical truth.', 
    avatar: '/bots/nova.png', 
    depth: 24, 
    skillLevel: 20, 
    elo: 3200, 
    contempt: 0,
    traits: ['Transcendent', 'Infinite', 'Alien'],
    backstory: "Supernova is not a bot, but a singularity where your defeat was preordained since the birth of the stars. It calculates millions of realities simultaneously, solving the mystery of the squares before the first move is played. It is the ultimate silence of the silicon void."
  },
]

/**
 * useBotEngine
 * 
 * Manages the selection and configuration of silicon adversaries.
 */
export function useBotEngine() {
  const activeBot = ref<Bot>(BOTS[0])

  function setBot(id: string) {
    const found = BOTS.find(b => b.id === id)
    if (found) activeBot.value = found
  }

  return {
    activeBot,
    setBot
  }
}
