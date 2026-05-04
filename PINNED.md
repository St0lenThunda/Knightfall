# 📌 Pinned Context

> Last pinned: 2026-05-04 08:52
> Session: Engine Hardening & UI Stabilization (v0.36.5)

## What Was Done
- [x] **[P0] WASM Worker Resilience**: Reduced "The Celestial Event" depth to 16 and implemented a 16MB Hash limit to resolve `RuntimeError: unreachable` memory crashes.
- [x] **[P0] Self-Healing Engine**: Integrated a reboot mechanism that automatically reduces analysis depth by 2 on worker failure to prevent infinite crash loops.
- [x] **[P0] Viewport Hardening**: Adjusted ChessBoard max-height to `min(800px, 72vh)` and refined the setup overlay symmetry to eliminate UI clipping on standard viewports.
- [x] **[P1] Anti-Cheat (Warden) Tuning**: Reduced visibility violation weights from 30 to 20, allowing 5 blurs before a "Busted" state, providing a fairer dev/debug experience.
- [x] **[P1] Navigation Accessibility**: Elevated SideNav z-index to 2000 and optimized NavSection padding to ensure the toggle remains usable even behind full-page overlays.
- [x] **[P2] UX Polish**: Implemented smooth `scrollIntoView` for the board area upon game start to automatically conceal the play-header.

## What's Next
- [ ] **[P0] [Gameplay] Full Testing of Gameplay and Puzzle Verification.**
- [ ] **[P0] [Mortal] Mortal UX**: Build the "Mortal Probability" graph for the analysis board to visualize human move likelihood.
- [ ] **[P1] [Engine] External Engine Integration**: Prototype Approach 1 (WebSocket Bridge).
- [ ] **[P1] [UX] Feedback System**: Implement a thematic "Courier's Dispatch" or "Scribe's Ledger" for bug reports and suggestions.
- [ ] **[P1] [Mortal] Mortal Engine Validation**: Finalize drill validation for the training queue using the new personality layer.
- [ ] **[P1] [DNA] Struggle Tracking**: Implement logic to identify which Mortal archetypes the user struggles against most.
- [ ] **[P2] [Telemetry] Expansion**: Integrate `useLibraryStats` output into the `ConstellationPanel`.
- [ ] **[P2] [UX] DNA Reveal Screen**: Finalize the "Magic Moment" animation for Archetype/Skill breakdown.
- [ ] **[P2] [Engine] Latency Meter**: Add engine telemetry HUD for external integrations.
- [ ] **[P3] [Engine] Multi-Threaded WASM**: Investigate `SharedArrayBuffer` support.
- [ ] **[P3] [UX] Delayed Signup Gate**: Implement "Save your DNA profile" logic.

## Known Issues
- Engine Instability: While depth 16 is stable, browser memory pressure may still trigger reboots.
- HMR Sync: Visibility violation scores in the Anti-Cheat may occasionally lag during HMR.

## Hot Files
- `src/stores/engineStore.ts` (Resiliency Logic)
- `src/stores/game/useBotEngine.ts` (Bot Profiles)
- `src/views/PlayView.vue` (Layout & Scroll Logic)
- `src/composables/useAntiCheat.ts` (Detection Weights)

## Session Notes
Engine is moving from "fragile" to "resilient" with new memory caps and self-healing loops. UI is now viewport-aware and balanced. Next phase focuses on external engine bridges and the Mortal personality UX.
