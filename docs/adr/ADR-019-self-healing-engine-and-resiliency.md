# ADR 019: Self-Healing Web Worker Engine Resiliency

**Status**: Accepted  
**Date**: 2026-05-22  

**Context**:  
Knightfall integrates Stockfish WASM directly in the client browser using Web Workers. However, executing unrestricted chess engine computations (such as deep searches, multi-variation lines, or infinite analysis) frequently triggered browser-level `RuntimeError: unreachable` WASM memory stack overflows. When this occurred, the chess worker crashed silently, leaving the chessboard UI locked, unresponsive to user moves, and unable to calculate evaluations.

**Decision**:  
We establish a resilient, self-healing engine lifecycle in `engineStore.ts` and `useBotEngine.ts` to manage WASM chess workers safely.

Technical Pillars of Engine Resiliency:
1. **Strict Resource Capping**: Cap Stockfish Web Worker memory configuration to `8MB` Hash size and restrict CPU allocation to `1` thread. This prevents memory leaks and ensures runtime compatibility on low-end mobile viewports.
2. **Search Depth Bounds**: Restrict maximum calculations to a depth limit of 15/16. This provides rapid tactical feedback without overloading the client CPU.
3. **Web Worker Watchdog / Reboot Sentinel**: Implement a reactive watchdog loop. If a worker fails to return evaluation telemetry within a 3-second heartbeat sentinel window, the orchestrator terminates the dead worker process, clears memory references, and initializes a fresh Stockfish worker instance.
4. **Transparent Resuscitation & Force-Save**: Active gameplay and analysis states (FEN string, PGN logs, and player clocks) must be cached in memory. Upon a self-healing worker reboot, the new worker is automatically preloaded with the current game state, ensuring zero loss of player progression.

**Technical Shifts**:  
- Refactored `engineStore.ts` to implement the watchdog reboot routine.
- Hardened anti-cheat handlers (`usePlayAntiCheat.ts`) to ignore blur/tab-switch events while the engine is in a `isRebooting` state, preventing false positives.

**Consequences**:  
- **Positive**:
  - Eliminated browser freezes and chessboard lockups during local engine calculations.
  - Seamless background crash recovery with no disruption to the player.
- **Negative**:
  - Restricting Stockfish to depth 15 limits the accuracy of complex late-endgame evaluations (deep positional planning is offloaded to WebSocket/Cloud engine routes).
