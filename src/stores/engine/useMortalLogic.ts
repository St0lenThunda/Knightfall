import { logger } from '../../utils/logger'

/**
 * Defines a human-like personality for the Mortal Engine.
 */
export interface MortalArchetype {
  id: string
  name: string
  description: string
  icon: string
  // UCI Options
  skillLevel: number    // 0-20
  elo?: number          // 1350-2850
  contempt: number      // -100 to 100
  depthLimit?: number   // Hard limit on nodes/depth
  // Behavioral Flags
  sharpness: number     // 0-1 (High = prefers complex lines)
  blunderRate: number   // 0-1 (Probability of an intentional human error)
}

/**
 * The Library of Mortal Archetypes.
 */
export const MORTAL_ARCHETYPES: Record<string, MortalArchetype> = {
  aggressor: {
    id: 'aggressor',
    name: 'The Aggressor',
    description: 'Relentless attacker. Prefers sharp lines and tactical complications over positional safety.',
    icon: '⚔️',
    skillLevel: 14,
    elo: 1600,
    contempt: 50,
    sharpness: 0.9,
    blunderRate: 0.1
  },
  turtle: {
    id: 'turtle',
    name: 'The Turtle',
    description: 'Hyper-defensive. Plays for stability and waits for you to overextend.',
    icon: '🐢',
    skillLevel: 12,
    elo: 1400,
    contempt: -20,
    sharpness: 0.2,
    blunderRate: 0.05
  },
  gambler: {
    id: 'gambler',
    name: 'The Gambler',
    description: 'Tricky and unpredictable. Will play objectively worse lines if they create practical problems.',
    icon: '🎲',
    skillLevel: 10,
    elo: 1200,
    contempt: 80,
    sharpness: 1.0,
    blunderRate: 0.2
  },
  balanced: {
    id: 'balanced',
    name: 'The Mortal',
    description: 'A standard human-like presence. Plays solid but makes common errors.',
    icon: '👤',
    skillLevel: 11,
    elo: 1350,
    contempt: 0,
    sharpness: 0.5,
    blunderRate: 0.15
  }
}

/**
 * Mortal Logic Pillar.
 * Handles the "Humanization" of engine parameters and move selection.
 */
export function useMortalLogic() {
  /**
   * Translates an archetype into raw UCI commands.
   * 
   * @param archetypeId - The ID of the personality to apply
   * @returns string[] - A list of UCI 'setoption' commands
   */
  function getUciCommands(archetypeId: string): string[] {
    const archetype = MORTAL_ARCHETYPES[archetypeId] || MORTAL_ARCHETYPES.balanced
    const commands: string[] = []

    commands.push(`setoption name Skill Level value ${archetype.skillLevel}`)
    commands.push(`setoption name Contempt value ${archetype.contempt}`)
    
    if (archetype.elo) {
      commands.push('setoption name UCI_LimitStrength value true')
      commands.push(`setoption name UCI_Elo value ${archetype.elo}`)
    } else {
      commands.push('setoption name UCI_LimitStrength value false')
    }

    logger.info(`[Mortal] Applied personality: ${archetype.name}`)
    return commands
  }

  /**
   * Decides if the engine should intentionally play a "Human Mistake".
   * This is calculated based on the archetype's blunder rate and the 
   * current position's complexity.
   * 
   * @param archetypeId - Current active personality
   * @returns boolean - True if we should blunder
   */
  function shouldBlunder(archetypeId: string): boolean {
    const archetype = MORTAL_ARCHETYPES[archetypeId] || MORTAL_ARCHETYPES.balanced
    return Math.random() < archetype.blunderRate
  }

  return {
    ARCHETYPES: MORTAL_ARCHETYPES,
    getUciCommands,
    shouldBlunder
  }
}
