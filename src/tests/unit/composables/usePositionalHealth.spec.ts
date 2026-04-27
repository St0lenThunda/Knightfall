import { describe, it, expect } from 'vitest'
import { usePositionalHealth } from '../../../composables/usePositionalHealth'
import { ref } from 'vue'

describe('usePositionalHealth Composable', () => {
  it('calculates balanced material correctly', () => {
    const fen = ref('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    const evalNum = ref(0)
    
    const { metrics } = usePositionalHealth(() => fen.value, () => evalNum.value)
    
    expect(metrics.value.material).toBeCloseTo(50, 1)
  })

  it('detects material advantage for white', () => {
    // Position where white is up a Queen
    const fen = ref('rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    const evalNum = ref(9.0)
    
    const { metrics } = usePositionalHealth(() => fen.value, () => evalNum.value)
    
    // Up a queen (+9) should be > 50%
    expect(metrics.value.material).toBeGreaterThan(50)
  })

  it('detects king safety issues in check', () => {
    const fen = ref('rnbqkbnr/pppp1ppp/8/4p2Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 0 1')
    const evalNum = ref(1.5)
    
    const { metrics } = usePositionalHealth(() => fen.value, () => evalNum.value)
    const baseSafety = metrics.value.safety
    
    // Now put black in check
    fen.value = 'rnb1kbnr/pppp1ppp/8/4p2Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 0 1' // Not a check but let's use a real check fen
    const checkFen = 'rnbqkbnr/ppppp1pp/8/5p1Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 0 1'
    fen.value = checkFen
    
    expect(metrics.value.safety).toBeLessThan(baseSafety)
  })

  it('provides correct diagnosis for balanced position', () => {
    const fen = ref('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    const evalNum = ref(0)
    
    const { diagnosis } = usePositionalHealth(() => fen.value, () => evalNum.value)
    
    expect(diagnosis.value.material).toContain('balanced')
    expect(diagnosis.value.activity).toContain('normally')
  })
})
