export function initAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  
  const playThud = (freq1: number, freq2: number, time1: number, time2: number) => {
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq1, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(freq2, ctx.currentTime + time1)
    
    gain.gain.setValueAtTime(1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time2)
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + time2 + 0.1)
  }

  return {
    move: () => playThud(350, 80, 0.05, 0.08),
    capture: () => playThud(500, 100, 0.08, 0.1),
    check: () => playThud(600, 200, 0.1, 0.2),
  }
}
