export interface LibraryGame {
  id: string
  pgn: string
  white: string
  black: string
  result: string
  date: string
  event: string
  eco: string
  movesCount: number
  addedAt: number
  isCurated?: boolean
  whiteElo?: string
  blackElo?: string
  tags?: string[]
  analysisCache?: Record<string, string>
  clocks?: number[]
  evals?: any[]
  acpl?: number
  missedWins?: number
  theoreticalAccuracy?: number
  cloudId?: string // Native Supabase UUID for cloud push
  telemetry?: {
    blurCount: number
    suspicionScore: number
    isBusted: boolean
  }
  userSide?: 'white' | 'black' | 'none'
}

export interface OpeningNode {
  san: string
  fen: string
  weight: number
  wins: number
  losses: number
  draws: number
  children: Record<string, OpeningNode>
}

export interface GraphNode extends OpeningNode {
  id: string
  x: number
  y: number
  isWhite: boolean
  depth: number
  wins: number
  losses: number
  draws: number
}

export interface GraphEdge {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  weight: number
  d: string // SVG Path data
}

export interface ConstellationLayout {
  nodes: GraphNode[]
  edges: GraphEdge[]
  maxWeight: number
}
