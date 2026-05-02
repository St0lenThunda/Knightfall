# 📌 Pinned Context

> Last pinned: 2026-05-02 00:15
> Session: Vault Stabilization + Navigation Declutter (v0.32.0)

## 🔗 Links & Resources
- **Production Preview:** [Live App](https://knightfall-d16dff7vb-st0lenthundas-projects.vercel.app/)

## 🎯 The Core Product Identity
**Knightfall is a standalone chess training ecosystem focused on Momentum, Personalization, and Curiosity.**
* **Standalone First**: It provides instant value (puzzles, streaks) without requiring external accounts.
* **Imports as Enhancers**: Lichess/Chess.com sync is a "Power User" feature, not a dependency for onboarding.

## 🚀 The Onboarding "Magic Moment" Flow
Landing → Quick Win (1 Puzzle) → Live Assessment (5-7 min) → **DNA Reveal** → Personalized Plan → Delayed Signup.

## 🛠️ What Was Done (v0.32.0)
- **Architectural Stabilization**: Successfully migrated `libraryStore.ts` to a **Pillar Architecture**, resolving all circular dependency and type mismatch regressions.
- **Vault Maintenance**: Implemented automated `purgeTestPollution` to scrub test-generated "ghost" records from local and cloud storage.
- **Immersive Feedback**: Synchronized administrative maintenance tasks with high-fidelity visual overlays and rhythmic animations in `WarRoomIntegrity.vue`.
- **Navigation Declutter**: Simplified the `SideNav.vue` sidebar by consolidating categories, removing italicized subtitles, and optimizing vertical spacing.
- **Warden Shield**: Finalized the `warden_report.json` bridge for automated build intelligence and health monitoring.

## ⚡ What's Next (Prioritized)
- [ ] [P0] **CI Behavioral Validation**: Resolve the remaining Playwright teardown pollution using the new `purgeTestPollution` routine.
- [ ] [P1] **Mortal Engine Validation**: Integrate Stockfish layer to filter non-winning harvested blunders.
- [ ] [P2] **Telemetry Expansion**: Integrate `useLibraryStats` output into the `ConstellationPanel` for opening performance visualization.
- [ ] [P2] **DNA Reveal Screen**: Finalize the "Magic Moment" animation for Archetype/Skill breakdown.
- [ ] [P2] **Vault Virtualization**: Implement `vue-virtual-scroller` for >10,000 game libraries.
- [ ] [P3] **Delayed Signup Gate**: Implement "Save your DNA profile" logic after assessment.

## ⚠️ Known Issues
- Minor: `gameStore.ts` reports move object property errors (TS2339) in headless environments.
- Environment: CI reports non-critical Supabase client warnings due to mock credentials.

## 🔥 Hot Files
- `src/stores/libraryStore.ts` (Orchestrator for all vault intelligence)
- `src/components/SideNav.vue` (Consolidated Navigation)
- `src/stores/library/useLibraryIdb.ts` (Local persistence layer)
- `src/components/profile/warroom/WarRoomIntegrity.vue` (Maintenance UI)

## 📝 Session Notes
We have successfully bridged the gap between raw intelligence gathering and a stable, modular storage architecture. The transition to the **Pillar Pattern** ensures that as we add more "Power User" features (like the Mortal Engine), we won't compromise the stability of the core onboarding experience. The sidebar is now cleaner, prioritizing the high-level "Command" and "Training" categories.
