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
      <div class="legend-title">Performance Heatmap</div>
      <div class="legend-scale">
        <div class="scale-item"><span class="swatch rose"></span> High Risk</div>
        <div class="scale-item"><span class="swatch neutral"></span> Balanced</div>
        <div class="scale-item"><span class="swatch emerald"></span> Stronghold</div>
      </div>
      <div class="legend-controls mt-2">
         <button class="btn btn-ghost btn-xs" @click="resetView">🎯 Center View</button>
      </div>
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
            :style="{ opacity: 0.05 + (edge.weight / maxWeight) * 0.4 }"
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
              :style="{ fill: getNodeColor(node) }"
            />
            <text 
              v-if="node.weight > maxWeight * 0.05 || viewBox.scale > 1.2"
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
              :style="{ fill: getNodeColor(node) }"
            />
          </g>
        </g>
      </svg>

      <!-- Advanced Tooltip -->
      <div v-if="hoverNode" class="node-tooltip glass-lg" :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }">
        <div class="tooltip-header">
          <div class="tooltip-title">{{ hoverNode.san }}</div>
          <div class="win-rate" :style="{ color: getNodeColor(hoverNode) }">
            {{ hoverNode.weight > 0 ? Math.round((hoverNode.wins / hoverNode.weight) * 100) : 0 }}% Win
          </div>
        </div>
        
        <div class="tooltip-stats mt-2">
          <div class="stat-row"><span>Frequency:</span> <strong>{{ hoverNode.weight || 0 }} games</strong></div>
          <div class="stat-row"><span>Performance:</span> <strong>{{ hoverNode.wins || 0 }}W / {{ hoverNode.draws || 0 }}D / {{ hoverNode.losses || 0 }}L</strong></div>
        </div>

        <div class="tooltip-actions mt-4">
          <button class="btn btn-primary btn-sm w-full" @click="analyzePosition(hoverNode)">
            🔬 Analyze in Lab
          </button>
          <div class="tooltip-hint mt-2">Click star to filter Vault to this line</div>
        </div>
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
import { useRouter } from 'vue-router'
import { useLibraryStore } from '../../stores/libraryStore'
import { useUiStore } from '../../stores/uiStore'

const libraryStore = useLibraryStore()
const uiStore = useUiStore()
const router = useRouter()

const containerEl = ref<HTMLElement | null>(null)
const width = ref(1000)
const height = ref(800)
const viewBox = ref({ x: 500, y: 700, scale: 1.0 })
const hoverNode = ref<any | null>(null)
const tooltipPos = ref({ x: 0, y: 0 })

// Dragging state
const isDragging = ref(false)
const lastMousePos = ref({ x: 0, y: 0 })

function resetView() {
    viewBox.value = { x: width.value / 2, y: height.value - 100, scale: 1.0 }
}

function getNodeColor(node: any) {
  const weight = node.weight || 0
  if (weight === 0) return 'var(--accent)'
  const wins = node.wins || 0
  const winRate = wins / weight
  if (winRate > 0.6) return '#10b981' // emerald
  if (winRate > 0.45) return 'var(--accent-bright)' // neutral/accent
  return '#f43f5e' // rose
}

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

// Graph Data (Consuming pre-calculated layout from store)
const nodes = computed(() => libraryStore.constellationLayout.nodes)
const edges = computed(() => libraryStore.constellationLayout.edges)
const maxWeight = computed(() => libraryStore.constellationLayout.maxWeight)

function selectNode(node: any) {
    libraryStore.searchQuery = node.san
    uiStore.addToast(`Filtering Vault for ${node.san} variations`, 'info')
    // We could switch tab here if we wanted
}

function analyzePosition(node: any) {
    // Jump to analysis lab with this FEN
    router.push({ path: '/analysis', query: { fen: node.fen }})
}

onMounted(() => {
   if (containerEl.value) {
       width.value = containerEl.value.clientWidth
       height.value = containerEl.value.clientHeight
       resetView()
   }
})
</script>

<style scoped>
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
  left: var(--space-4);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
  border-radius: var(--radius-md);
  min-width: 180px;
}
.legend-title { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); font-weight: 800; margin-bottom: 4px; }
.legend-scale { display: flex; flex-direction: column; gap: 6px; }
.scale-item { display: flex; align-items: center; gap: 10px; font-size: 0.75rem; font-weight: 600; }
.swatch { width: 10px; height: 10px; border-radius: 2px; }
.swatch.rose { background: #f43f5e; box-shadow: 0 0 8px rgba(244,63,94,0.4); }
.swatch.neutral { background: var(--accent-bright); box-shadow: 0 0 8px rgba(139,92,246,0.4); }
.swatch.emerald { background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.4); }

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

.star-glow {
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
  padding: var(--space-5);
  pointer-events: none;
  z-index: 100;
  min-width: 220px;
  box-shadow: 0 16px 32px rgba(0,0,0,0.4);
}
.tooltip-header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 8px; }
.tooltip-title { font-weight: 900; font-size: 1.2rem; color: white; }
.win-rate { font-weight: 800; font-size: 0.85rem; }
.stat-row { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px; }
.stat-row span { opacity: 0.6; }
.tooltip-hint { font-size: 0.65rem; color: var(--text-muted); font-style: italic; text-align: center; }

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
