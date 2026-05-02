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
}

export const BOTS: Bot[] = [
  { id: 'leo', name: 'Learner Leo', rating: 400, description: 'Still learning how the pieces move.', avatar: '/bots/leo.png', depth: 1, skillLevel: 0, elo: 400, contempt: 0, mortalArchetype: 'balanced' },
  { id: 'tanya', name: 'Tactical Tanya', rating: 800, description: 'Focuses on early attacks.', avatar: '/bots/tanya.png', depth: 3, skillLevel: 5, elo: 800, contempt: 50, mortalArchetype: 'gambler' },
  { id: 'maya', name: 'Mid-range Maya', rating: 1100, description: 'Loves development and center control.', avatar: '/bots/maya.png', depth: 5, skillLevel: 8, elo: 1100, contempt: 10, mortalArchetype: 'balanced' },
  { id: 'boris', name: 'Boris', rating: 1400, description: 'Solid positional player.', avatar: '/bots/boris.png', depth: 8, skillLevel: 12, elo: 1400, contempt: -20, mortalArchetype: 'turtle' },
  { id: 'arthur', name: 'Aggressive Arthur', rating: 1700, description: 'Will sacrifice material for an attack.', avatar: '/bots/arthur.png', depth: 10, skillLevel: 15, elo: 1700, contempt: 100, mortalArchetype: 'aggressor' },
  { id: 'elara', name: 'Endgame Elara', rating: 2000, description: 'Expert at technical endgame conversion.', avatar: '/bots/elara.png', depth: 12, skillLevel: 18, elo: 2000, contempt: -50, mortalArchetype: 'turtle' },
  { id: 'magnus_mini', name: 'Mini Magnus', rating: 2400, description: 'Squeezes tiny positional advantages.', avatar: '/bots/magnus.png', depth: 14, skillLevel: 20, elo: 2400, contempt: 20, mortalArchetype: 'aggressor' },
  { id: 'gm', name: 'GM Sentinel', rating: 2800, description: 'Near perfect master-level play.', avatar: '/bots/gm.png', depth: 18, skillLevel: 20, elo: 2800, contempt: 0, mortalArchetype: 'balanced' },
  { id: 'nova', name: 'Supernova', rating: 3200, description: 'The ultimate silicon calculation engine.', avatar: '/bots/nova.png', depth: 24, skillLevel: 20, elo: 3200, contempt: 0 },
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
