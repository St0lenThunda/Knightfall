import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../api/supabaseClient'

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

  const nextNodes = computed(() => nodes.value.filter(n => n.status === 'unlocked'))

  return {
    nodes,
    completedNodeIds,
    fetchProgress,
    completeNode,
    nextNodes,
    viewMode,
    selectedIslandId,
    realms
  }
})
