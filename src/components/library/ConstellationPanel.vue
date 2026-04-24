<template>
  <div class="constellation-panel">
    <div class="constellation-header glass-sm">
      <div class="info">
        <h3>Repertoire Constellation</h3>
        <p class="muted">A visual map of your common opening branches.</p>
      </div>
      <div class="header-controls">
        <div class="perspective-toggle glass-xs">
          <button 
            class="side-btn" 
            :class="{ active: libraryStore.filterPerspective === 'all' }"
            @click="libraryStore.changePerspectiveAndMap('all')"
          >
            All
          </button>
          <button 
            class="side-btn" 
            :class="{ active: libraryStore.filterPerspective === 'white' }"
            @click="libraryStore.changePerspectiveAndMap('white')"
          >
            White
          </button>
          <button 
            class="side-btn" 
            :class="{ active: libraryStore.filterPerspective === 'black' }"
            @click="libraryStore.changePerspectiveAndMap('black')"
          >
            Black
          </button>
        </div>
      </div>
    </div>
    
    <!-- Floating Bottom Legend -->
    <div class="constellation-legend glass-sm">
      <div class="legend-item"><span class="dot white"></span> White</div>
      <div class="legend-item"><span class="dot black"></span> Black</div>
    </div>

    <div class="canvas-container" ref="containerEl" @mousedown="startDrag" @mousemove="onDrag" @mouseup="endDrag" @mouseleave="endDrag" @wheel="onWheel">
      <svg :width="width" :height="height" class="constellation-svg">
        <g :transform="`translate(${viewBox.x}, ${viewBox.y}) scale(${viewBox.scale})`">
          <!-- Edges (Paths) -->
          <path 
            v-for="(edge, i) in edges" 
            :key="'edge-'+i" 
            :d="edge.d" 
            class="constellation-edge"
            :style="{ opacity: 0.1 + (edge.weight / maxWeight) * 0.5 }"
          />

          <!-- Nodes (Stars) -->
          <g 
            v-for="(node, i) in nodes" 
            :key="'node-'+i" 
            class="constellation-node"
            @mouseenter="hoverNode = node"
            @mouseleave="hoverNode = null"
            @click="selectNode(node)"
          >
            <circle 
              :cx="node.x" 
              :cy="node.y" 
              :r="4 + (node.weight / maxWeight) * 12" 
              class="star"
              :class="node.isWhite ? 'star-white' : 'star-black'"
            />
            <text 
              v-if="node.weight > maxWeight * 0.1 || viewBox.scale > 1.5"
              :x="node.x" 
              :y="node.y + 18" 
              class="star-label"
            >
              {{ node.san }}
            </text>
            
            <!-- Glow effect for hovered node -->
            <circle 
              v-if="hoverNode?.id === node.id"
              :cx="node.x" 
              :cy="node.y" 
              :r="10 + (node.weight / maxWeight) * 15" 
              class="star-glow"
            />
          </g>
        </g>
      </svg>

      <!-- Tooltip -->
      <div v-if="hoverNode" class="node-tooltip glass-sm" :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }">
        <div class="tooltip-title">{{ hoverNode.san }}</div>
        <div class="tooltip-stat">Games: {{ hoverNode.weight }}</div>
        <div class="tooltip-hint">Click to filter Vault</div>
      </div>

        <!-- Loading / Empty / Stale Overlay -->
        <Transition name="fade">
          <div v-if="libraryStore.isGeneratingTree || !libraryStore.openingTree || libraryStore.isConstellationStale" class="constellation-loading-overlay">
            <div class="loader-content" v-if="libraryStore.isGeneratingTree">
              <div class="neon-spinner"></div>
              <p>Mapping Repertoire Constellation...</p>
              <span class="muted" style="font-size: 0.7rem;">Processing {{ libraryStore.importProgress }}%</span>
            </div>
            <div class="loader-content" v-else>
               <div class="constellation-empty">{{ libraryStore.openingTree ? '🔄' : '✨' }}</div>
               <h3>{{ libraryStore.openingTree ? 'Map Out of Date' : 'Constellation Offline' }}</h3>
               <p class="muted" style="max-width: 300px; margin: 8px 0 20px;">
                 {{ libraryStore.openingTree ? 'The map below does not reflect your new filters.' : 'Generate a visual map of your current filtered collection.' }}
               </p>
               <button class="btn btn-primary" @click="libraryStore.generateOpeningTree()">
                 🔬 {{ libraryStore.openingTree ? 'Re-map Results' : 'Analyze Collection' }}
               </button>
            </div>
          </div>
        </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLibraryStore, type OpeningNode } from '../../stores/libraryStore'
import { logger } from '../../utils/logger'

/**
 * Visual Graph Node representation.
 * Combines opening data with SVG-specific coordinates for rendering.
 */
interface GraphNode extends OpeningNode {
  id: string
  x: number
  y: number
  isWhite: boolean
}

const libraryStore = useLibraryStore()

const containerEl = ref<HTMLElement | null>(null)
const width = ref(1000)
const height = ref(800)
const viewBox = ref({ x: 500, y: 700, scale: 1.0 })
const hoverNode = ref<GraphNode | null>(null)
const tooltipPos = ref({ x: 0, y: 0 })

// Dragging state
const isDragging = ref(false)
const lastMousePos = ref({ x: 0, y: 0 })

function startDrag(e: MouseEvent) {
    isDragging.value = true
    lastMousePos.value = { x: e.clientX, y: e.clientY }
}
function onDrag(e: MouseEvent) {
    if (!isDragging.value) {
        if (hoverNode.value) {
            tooltipPos.value = { x: e.clientX + 15, y: e.clientY + 15 }
        }
        return
    }
    const dx = e.clientX - lastMousePos.value.x
    const dy = e.clientY - lastMousePos.value.y
    viewBox.value.x += dx
    viewBox.value.y += dy
    lastMousePos.value = { x: e.clientX, y: e.clientY }
}
function endDrag() { isDragging.value = false }
function onWheel(e: WheelEvent) {
    e.preventDefault()
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1
    viewBox.value.scale *= scaleFactor
}

// Graph Generation
const maxWeight = computed(() => {
    if (!libraryStore.openingTree) return 1
    let max = 1
    const findMax = (node: OpeningNode) => {
        if (node.weight > max) max = node.weight
        Object.values(node.children).forEach(findMax)
    }
    findMax(libraryStore.openingTree)
    return max
})

const graphData = computed(() => {
    const nodes: GraphNode[] = []
    const edges: any[] = []
    
    // Layout parameters
    const verticalSpacing = 120
    
    function traverse(node: OpeningNode, depth: number, angleRange: [number, number], parentX: number, parentY: number, nodeId = 'root') {
        const x = parentX
        const y = parentY
        
        nodes.push({
            ...node,
            id: nodeId,
            x, y,
            isWhite: depth % 2 !== 0 // Depth 1 = Move 1 = White
        })

        const children = Object.entries(node.children)
        if (children.length === 0) return

        const totalChildWeight = children.reduce((sum, [_, child]: [any, OpeningNode]) => sum + child.weight, 0)
        if (totalChildWeight > 0) {
            let currentAngle = angleRange[0]
            const rangeWidth = angleRange[1] - angleRange[0]

            children.forEach(([_, child]: [any, OpeningNode], i) => {
                const childWeightPct = child.weight / totalChildWeight
                const childAngleWidth = rangeWidth * childWeightPct
                const childAngle = currentAngle + childAngleWidth / 2
                
                // Calculate child position based on angle
                const childX = x + Math.cos(childAngle) * (verticalSpacing + (depth * 5))
                const childY = y - Math.sin(childAngle) * (verticalSpacing + (depth * 5))
                
                edges.push({
                    x1: x, y1: y,
                    x2: childX, y2: childY,
                    weight: child.weight,
                    d: `M ${x} ${y} Q ${x} ${childY} ${childX} ${childY}`
                })

                traverse(child, depth + 1, [currentAngle, currentAngle + childAngleWidth], childX, childY, nodeId + '-' + i)
                currentAngle += childAngleWidth
            })
        }
    }

    // Start traversal from Root
    if (libraryStore.openingTree) {
        traverse(libraryStore.openingTree, 0, [Math.PI * 0.2, Math.PI * 0.8], 0, 0)
    }
    
    return { nodes, edges }
})

const nodes = computed(() => graphData.value.nodes)
const edges = computed(() => graphData.value.edges)

function selectNode(node: GraphNode) {
    // Communication with Vault filtering would go here
    logger.info('[Constellation] Selected line:', node.san)
}

onMounted(() => {
   if (containerEl.value) {
       width.value = containerEl.value.clientWidth
       height.value = containerEl.value.clientHeight
   }
})
</script>

<style scoped>
/* (Styles omitted for brevity, keeping original styles) */
.constellation-panel {
  display: flex;
  flex-direction: column;
  height: 700px;
  background: radial-gradient(circle at center, #0d0b29 0%, #030214 100%);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  position: relative;
  overflow: hidden;
}

.constellation-header {
  position: absolute;
  top: var(--space-4);
  left: var(--space-4);
  right: var(--space-4);
  padding: var(--space-3) var(--space-5);
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
  border-radius: var(--radius-lg);
}
.constellation-header .info { max-width: 400px; }
.constellation-header h3 { margin: 0 0 4px; color: white; font-size: 1.2rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }
.constellation-header p { margin: 0; font-size: 0.85rem; line-height: 1.4; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8)); }

.header-controls { pointer-events: auto; }
.perspective-toggle { display: flex; gap: 2px; padding: 2px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3); }
.side-btn { 
  background: none; border: none; padding: 6px 14px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); cursor: pointer; border-radius: 4px; transition: all 0.2s;
}
.side-btn.active { background: var(--accent); color: white; }
.side-btn:hover:not(.active) { color: var(--text-primary); background: rgba(255,255,255,0.05); }

.constellation-legend {
  position: absolute;
  bottom: var(--space-4);
  right: var(--space-4);
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 10;
  border-radius: var(--radius-md);
}
.legend-item { display: flex; align-items: center; gap: 10px; font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.dot { width: 12px; height: 12px; border-radius: 50%; }
.dot.white { background: var(--accent-bright); box-shadow: 0 0 12px var(--accent-bright); }
.dot.black { background: #4a4a75; border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 0 6px rgba(0,0,0,0.5); }

.canvas-container {
  flex: 1;
  cursor: grab;
  position: relative;
}
.canvas-container:active { cursor: grabbing; }

.constellation-svg { display: block; }

.constellation-edge {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.5;
}

.constellation-node { cursor: pointer; }
.star {
  transition: all 0.3s ease;
  filter: drop-shadow(0 0 4px rgba(0,0,0,0.5));
}
.star-white { fill: var(--accent-bright); filter: drop-shadow(0 0 12px var(--accent)); }
.star-black { fill: #4a4a75; stroke: rgba(255,255,255,0.4); stroke-width: 1.5; filter: drop-shadow(0 0 5px rgba(255,255,255,0.1)); }

.star-glow {
  fill: var(--accent);
  opacity: 0.3;
  animation: pulse 2s infinite;
}

.star-label {
  fill: white;
  font-size: 10px;
  font-weight: 700;
  text-anchor: middle;
  pointer-events: none;
  opacity: 0.7;
}

.node-tooltip {
  position: fixed;
  padding: var(--space-3);
  pointer-events: none;
  z-index: 100;
  min-width: 150px;
}
.tooltip-title { font-weight: 800; font-size: 1.1rem; color: var(--accent-bright); margin-bottom: 4px; }
.tooltip-stat { font-size: 0.9rem; margin-bottom: 2px; }
.tooltip-hint { font-size: 0.7rem; color: var(--text-muted); font-style: italic; }

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.15); opacity: 0.5; }
  100% { transform: scale(1); opacity: 0.3; }
}

.constellation-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  z-index: 100;
}

.loader-content { text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }
.constellation-empty { font-size: 4rem; margin-bottom: var(--space-2); filter: drop-shadow(0 0 20px var(--accent)); animation: float 4s ease-in-out infinite; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }

.neon-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid transparent;
  border-top-color: var(--accent);
  border-bottom-color: var(--accent-bright);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 15px var(--accent);
}

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.fade-enter-active, .fade-slide-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
