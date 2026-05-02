# 📌 Pinned Context

> Last pinned: 2026-05-02 09:25
> Session: Silicon Soul - Vault Scaling + Mortal Engine (v0.35.0)

## 🔗 Links & Resources
- **Production Preview:** [Live App](https://knightfall-d16dff7vb-st0lenthundas-projects.vercel.app/)

## 🎯 The Core Product Identity
**Knightfall is a standalone chess training ecosystem focused on Momentum, Personalization, and Curiosity.**
* **Standalone First**: It provides instant value (puzzles, streaks) without requiring external accounts.
* **Imports as Enhancers**: Lichess/Chess.com sync is a "Power User" feature, not a dependency for onboarding.

## 🚀 The Onboarding "Magic Moment" Flow
Landing → Quick Win (1 Puzzle) → Live Assessment (5-7 min) → **DNA Reveal** → Personalized Plan → Delayed Signup.

- **Mortal Engine Pillar**: Introduced `useMortalLogic.ts` for archetype-driven personalities (Aggressor, Turtle, Gambler, Balanced).
- **Hybrid Vault Scaling**: Rebuilt `libraryStore.ts` and `useLibraryIdb.ts` with cursor-based paging and `IntersectionObserver` for infinite scrolling.
- **Unified Bot Registry**: All 9 silicon opponents now exhibit humanized, probabilistic blunder behaviors.
- **Architectural Mastery**: Leveraged the **Pillar Architecture** to cleanly separate persistence, orchestration, and behavioral logic.

- [ ] [P0] **Mortal UX**: Build the "Mortal Probability" graph for the analysis board to visualize human move likelihood.
- [ ] [P1] **DNA Struggle Tracking**: Implement logic to identify which Mortal archetypes (e.g., Aggressors) the user struggles against most.
- [ ] [P1] **Mortal Engine Validation**: Finalize drill validation for the training queue using the new personality layer.
- [ ] [P2] **Telemetry Expansion**: Integrate `useLibraryStats` output into the `ConstellationPanel` for opening performance visualization.
- [ ] [P2] **DNA Reveal Screen**: Finalize the "Magic Moment" animation for Archetype/Skill breakdown.
- [ ] [P3] **Delayed Signup Gate**: Implement "Save your DNA profile" logic after assessment.

## ⚠️ Known Issues
- Minor: `gameStore.ts` reports move object property errors (TS2339) in headless environments.
- Environment: CI reports non-critical Supabase client warnings due to mock credentials.

- `src/stores/libraryStore.ts` (Hybrid Paging Orchestrator)
- `src/stores/engineStore.ts` (Mortal Integration)
- `src/stores/engine/useMortalLogic.ts` (Personality Archetypes)
- `src/components/library/VaultPanel.vue` (Infinite Scroll UI)
- `src/stores/library/useLibraryIdb.ts` (Cursor-based persistence)

## 📝 Session Notes
We have successfully bridged the gap between raw intelligence gathering and a stable, modular storage architecture. The transition to the **Pillar Pattern** ensures that as we add more "Power User" features (like the Mortal Engine), we won't compromise the stability of the core onboarding experience. The sidebar is now cleaner, prioritizing the high-level "Command" and "Training" categories.
