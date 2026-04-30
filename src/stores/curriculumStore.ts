import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../api/supabaseClient'
import { Chess } from 'chess.js'
import { TaggingService } from '../services/taggingService'
import { useUserStore } from './userStore'
import { useUiStore } from './uiStore'
import { useLibraryStore } from './libraryStore'
import { logger } from '../utils/logger'

export interface SkillNode {
  id: string
  title: string
  category: 'Opening' | 'Tactics' | 'Endgame' | 'Positional'
  requirements: string[]
  icon: string
  status: 'locked' | 'unlocked' | 'completed'
  xp_reward: number
}

export const useCurriculumStore = defineStore('curriculum', () => {
  const viewMode = ref<'overworld' | 'island'>('overworld')
  const selectedIslandId = ref<string | null>(null)

  const realms = ref([
    { 
      id: 'tactics-realm', 
      name: 'The Iron Marches', 
      icon: '⚔️', 
      description: 'Where steel is sharpened and calculations are absolute.',
      x: 200, y: 150,
      categories: ['Tactics', 'Mate']
    },
    { 
      id: 'strategy-realm', 
      name: 'Highgarden Citadel', 
      icon: '🏰', 
      description: 'The seat of strategic wisdom and long-term planning.',
      x: 600, y: 200,
      categories: ['Positional']
    },
    { 
      id: 'endgame-realm', 
      name: 'The Silent Shores', 
      icon: '⏳', 
      description: 'The final destination where masters are made.',
      x: 400, y: 500,
      categories: ['Endgame']
    },
    { 
      id: 'opening-realm', 
      name: 'The Kings Landing', 
      icon: '🗺️', 
      description: 'The royal docks where every journey begins.',
      x: 100, y: 450,
      categories: ['Opening']
    },
    {
      id: 'personal-realm',
      name: 'The Shadow Realm',
      icon: '👤',
      description: 'The echoes of your own past — conquer your ghosts.',
      x: 350, y: 350,
      categories: ['Personal Mistake']
    }
  ])

  const nodes = ref<SkillNode[]>([
    { id: 'forks-101', title: 'Tactics: Forks', category: 'Tactics', requirements: [], icon: '🍴', status: 'completed', xp_reward: 50 },
    { id: 'pins-101', title: 'Tactics: Pins', category: 'Tactics', requirements: [], icon: '📍', status: 'completed', xp_reward: 50 },
    { id: 'skewers-101', title: 'Tactics: Skewers', category: 'Tactics', requirements: ['forks-101'], icon: '🍢', status: 'unlocked', xp_reward: 50 },
    { id: 'outposts-201', title: 'Position: Outposts', category: 'Positional', requirements: ['pins-101'], icon: '🏰', status: 'locked', xp_reward: 75 },
    { id: 'zwischenzug-301', title: 'Expert: Zwischenzug', category: 'Tactics', requirements: ['skewers-101'], icon: '⚡', status: 'locked', xp_reward: 100 },
    { id: 'x-ray-101', title: 'Tactics: X-Ray', category: 'Tactics', requirements: ['zwischenzug-301'], icon: '🩻', status: 'locked', xp_reward: 50 },
    { id: 'smothered-mate', title: 'Mate: Smothered', category: 'Tactics', requirements: ['x-ray-101'], icon: '🐎', status: 'locked', xp_reward: 80 },
    { id: 'back-rank-mate', title: 'Mate: Back Rank', category: 'Tactics', requirements: ['smothered-mate'], icon: '🧱', status: 'locked', xp_reward: 60 },
    { id: 'greek-gift', title: 'Sacrifice: Greek Gift', category: 'Tactics', requirements: ['back-rank-mate'], icon: '🎁', status: 'locked', xp_reward: 90 },
    { id: 'knight-endings', title: 'Endgame: Knights', category: 'Endgame', requirements: ['greek-gift'], icon: '🐴', status: 'locked', xp_reward: 70 },
    { id: 'rook-endings', title: 'Endgame: Rooks', category: 'Endgame', requirements: ['knight-endings'], icon: '🏯', status: 'locked', xp_reward: 75 },
    { id: 'pawn-promotion', title: 'Endgame: Pawns', category: 'Endgame', requirements: ['rook-endings'], icon: '👑', status: 'locked', xp_reward: 65 },
    { id: 'opposition-201', title: 'Endgame: Opposition', category: 'Endgame', requirements: ['pawn-promotion'], icon: '⚖️', status: 'locked', xp_reward: 85 },
    { id: 'e4-opening', title: 'Opening: King Pawn', category: 'Opening', requirements: ['opposition-201'], icon: '👑', status: 'locked', xp_reward: 50 },
    { id: 'd4-opening', title: 'Opening: Queen Pawn', category: 'Opening', requirements: ['e4-opening'], icon: '👸', status: 'locked', xp_reward: 50 },
    { id: 'sicilian-defense', title: 'Opening: Sicilian', category: 'Opening', requirements: ['d4-opening'], icon: '🐉', status: 'locked', xp_reward: 70 },
    { id: 'caro-kann', title: 'Opening: Caro-Kann', category: 'Opening', requirements: ['sicilian-defense'], icon: '🐢', status: 'locked', xp_reward: 65 },
    { id: 'french-defense', title: 'Opening: French', category: 'Opening', requirements: ['caro-kann'], icon: '🥖', status: 'locked', xp_reward: 60 },
    { id: 'ruy-lopez', title: 'Opening: Ruy Lopez', category: 'Opening', requirements: ['french-defense'], icon: '🇪🇸', status: 'locked', xp_reward: 75 },
    { id: 'grandmaster-peak', title: 'The Peak', category: 'Tactics', requirements: ['ruy-lopez'], icon: '⛰️', status: 'locked', xp_reward: 250 },
  ])



  const completedNodeIds = ref<string[]>([])

  /**
   * Fetches the user's completed nodes from Supabase.
   */
  async function fetchProgress(userId: string) {
    const { data, error } = await supabase
      .from('user_skill_progress')
      .select('node_id')
      .eq('user_id', userId)
    
    if (!error && data) {
      completedNodeIds.value = data.map(d => d.node_id)
      updateNodeStatuses()
      generatePersonalLessons() // Refresh personalized content
    }
  }

  function updateNodeStatuses() {
    nodes.value.forEach(node => {
      if (completedNodeIds.value.includes(node.id)) {
        node.status = 'completed'
      } else if (node.requirements.every(reqId => completedNodeIds.value.includes(reqId))) {
        node.status = 'unlocked'
      } else {
        node.status = 'locked'
      }
    })
  }

  async function completeNode(userId: string, nodeId: string) {
    const { error } = await supabase
      .from('user_skill_progress')
      .insert([{ user_id: userId, node_id: nodeId }])
    
    if (!error) {
      completedNodeIds.value.push(nodeId)
      updateNodeStatuses()
    }
  }

  const personalPuzzles = ref<any[]>([])
  const isGenerating = ref(false)

  /**
   * Removes a corrupt or invalid puzzle from the user's queue.
   */
  async function discardPuzzle(puzzleId: string) {
    const userStore = useUserStore()
    const uiStore = useUiStore()
    const userId = userStore.profile?.id
    if (!userId) return

    try {
      // 1. Remove from local state
      personalPuzzles.value = personalPuzzles.value.filter(p => p.id !== puzzleId)
      
      // 2. Remove from Supabase queue
      const { error } = await supabase
        .from('puzzle_queue')
        .delete()
        .eq('user_id', userId)
        .eq('puzzle_id', puzzleId)

      if (error) throw error
      
      logger.info(`[Curriculum] Discarded corrupt drill: ${puzzleId}`)
      uiStore.addToast('Drill discarded from Shadow Realm.', 'success')
    } catch (err) {
      logger.error(`[Curriculum] Failed to discard drill ${puzzleId}:`, err)
      uiStore.addToast('Failed to discard drill.', 'error')
    }
  }

  /**
   * THE INTELLIGENCE ENGINE (Dynamic Puzzle Generation)
   * Scans the user's analyzed games for significant mistakes and transforms
   * them into personalized puzzles using the coaching_cache and TaggingService.
   */
  async function generatePersonalPuzzles() {
    const { fetchPuzzleBatch } = await import('../api/puzzleApi')
    const library = useLibraryStore()
    
    isGenerating.value = true
    const newPuzzles: any[] = []

    try {
      // 1. Try to fetch from Supabase (Production Path)
      const dbPuzzles = await fetchPuzzleBatch('Personal Mistake', 20)
      if (dbPuzzles.length > 0) {
        personalPuzzles.value = dbPuzzles
        logger.info(`[Curriculum] Fetched ${dbPuzzles.length} drills from Shadow Realm vault.`)
        return
      }

      // 2. Fallback to In-Memory Generation (Legacy/Dev Path)
      if (library.games.length === 0) return

      for (const game of library.games) {
        if (!game.evals || game.evals.length === 0) continue

        const chess = new Chess()
        chess.loadPgn(game.pgn)
        const moves = chess.history({ verbose: true })
        
        // Iterate through evals and find significant mistakes
        const evals = game.evals || []
        evals.forEach((ev, i) => {
          if (!ev || !ev.bestMove || i >= moves.length) return

          const fenBefore = moves[i].before
          const fenAfter = moves[i].after
          const evalBefore = i > 0 ? (evals[i-1]?.score || 0.3) : 0.3
          const evalAfter = ev.score || 0

          // Use TaggingService for deterministic classification
          const tag = TaggingService.identifyMistake(
            fenBefore,
            fenAfter,
            evalBefore,
            evalAfter,
            moves[i].lan,
            ev.bestMove
          )

          if (tag) {
            newPuzzles.push({
              id: `personal-${game.id}-${i}`,
              title: tag.theme,
              rating: Math.round(Number(game.whiteElo || 1200)),
              themes: [tag.category, tag.theme, moves[i].piece],
              severity: tag.severity,
              evalDrop: tag.evalDrop,
              fen: fenBefore,
              lastMove: i > 0 ? moves[i-1].lan : '',
              solution: [ev.bestMove],
              category: 'Personal Mistake',
              explanation: tag.explanation || game.analysisCache?.[fenBefore] || 'Find the best continuation.'
            })
          }
        })
      }

      // SRS Priority: Blunders first, then Mistakes, then Inaccuracies
      const severityMap: Record<string, number> = { blunder: 3, mistake: 2, inaccuracy: 1 }
      personalPuzzles.value = newPuzzles
        .sort((a, b) => (severityMap[b.severity] || 0) - (severityMap[a.severity] || 0))
        .slice(0, 15)

      logger.info(`[Curriculum] Harvested ${personalPuzzles.value.length} high-priority drills from vault.`)
    } catch (err) {
      logger.error('[Curriculum] Failed to generate personal puzzles:', err)
    } finally {
      isGenerating.value = false
    }
  }

  const personalLessons = ref<any[]>([])

  /**
   * Generates thematic lessons by grouping personal puzzles by theme.
   */
  async function generatePersonalLessons() {
    if (personalPuzzles.value.length === 0) {
      await generatePersonalPuzzles()
    }

    const themeGroups: Record<string, any[]> = {}
    personalPuzzles.value.forEach(p => {
      const mainTheme = p.themes[0] || 'General Improvement'
      if (!themeGroups[mainTheme]) themeGroups[mainTheme] = []
      themeGroups[mainTheme].push(p)
    })

    const newLessons: any[] = []
    Object.entries(themeGroups).forEach(([theme, puzzles]) => {
      if (puzzles.length >= 2) {
        newLessons.push({
          id: `lesson-${theme.toLowerCase().replace(/\s+/g, '-')}`,
          title: `Focus: ${theme}`,
          category: puzzles[0].category,
          icon: '🎓',
          puzzles: puzzles.slice(0, 5),
          xp_reward: puzzles.length * 20
        })
      }
    })

    personalLessons.value = newLessons
    logger.info(`[Curriculum] Generated ${personalLessons.value.length} thematic lessons.`)
  }

  const nextNodes = computed(() => nodes.value.filter(n => n.status === 'unlocked'))

  return {
    nodes,
    completedNodeIds,
    fetchProgress,
    completeNode,
    nextNodes,
    viewMode,
    selectedIslandId,
    realms,
    personalPuzzles,
    personalLessons,
    isGenerating,
    generatePersonalPuzzles,
    generatePersonalLessons,
    discardPuzzle
  }
})
