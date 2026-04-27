import type { OpeningNode, GraphNode, GraphEdge, ConstellationLayout } from '../stores/libraryStore'

/**
 * Calculates a visual layout for the Opening Tree (Constellation).
 * 
 * DESIGN PATTERN: Recursive Flattening
 * Instead of having the UI component traverse the tree on every render,
 * we process the tree once and return a flat list of nodes and edges
 * with pre-calculated SVG coordinates.
 * 
 * @param root - The root of the opening tree
 * @returns ConstellationLayout - The flattened layout ready for SVG rendering
 */
export function calculateConstellationLayout(root: OpeningNode | null): ConstellationLayout {
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []
    let maxWeight = 1

    if (!root) {
        return { nodes, edges, maxWeight }
    }

    // Layout configuration
    const VERTICAL_SPACING = 120
    const INITIAL_ANGLE_RANGE: [number, number] = [Math.PI * 0.2, Math.PI * 0.8]

    /**
     * Recursive helper to calculate positions and flatten the tree.
     */
    function traverse(
        node: OpeningNode, 
        depth: number, 
        angleRange: [number, number], 
        parentX: number, 
        parentY: number, 
        nodeId = 'root'
    ) {
        if (node.weight > maxWeight) maxWeight = node.weight

        const x = parentX
        const y = parentY
        
        nodes.push({
            ...node,
            id: nodeId,
            x, y,
            isWhite: depth % 2 !== 0,
            depth,
            wins: node.wins || 0,
            losses: node.losses || 0,
            draws: node.draws || 0
        })

        const children = Object.entries(node.children)
        if (children.length === 0) return

        // We sort children by weight to ensure the "main lines" are centered
        const sortedChildren = children.sort((a, b) => b[1].weight - a[1].weight)
        const totalChildWeight = sortedChildren.reduce((sum, [_, child]) => sum + child.weight, 0)
        
        if (totalChildWeight > 0) {
            let currentAngle = angleRange[0]
            const rangeWidth = angleRange[1] - angleRange[0]

            sortedChildren.forEach(([_, child], i) => {
                const childWeightPct = child.weight / totalChildWeight
                const childAngleWidth = rangeWidth * childWeightPct
                const childAngle = currentAngle + childAngleWidth / 2
                
                // Calculate child position based on radial layout
                // We add a slight depth-based expansion to prevent overlap in deep trees
                const distance = VERTICAL_SPACING + (depth * 8)
                const childX = x + Math.cos(childAngle) * distance
                const childY = y - Math.sin(childAngle) * distance
                
                edges.push({
                    id: `edge-${nodeId}-${i}`,
                    x1: x, y1: y,
                    x2: childX, y2: childY,
                    weight: child.weight,
                    // Quadratic Bezier Curve for smoother visual connections
                    d: `M ${x} ${y} Q ${x} ${childY} ${childX} ${childY}`
                })

                traverse(
                    child, 
                    depth + 1, 
                    [currentAngle, currentAngle + childAngleWidth], 
                    childX, 
                    childY, 
                    `${nodeId}-${i}`
                )
                
                currentAngle += childAngleWidth
            })
        }
    }

    // Start traversal from the root node (Move 0)
    traverse(root, 0, INITIAL_ANGLE_RANGE, 0, 0)
    
    return { nodes, edges, maxWeight }
}
