# 📌 Pinned Context

> Last pinned: 2026-04-30 19:38
> Session: Strategic Pivot + v0.29.4 Finalization

## 🎯 The Core Product Identity
**Knightfall is a standalone chess training ecosystem focused on Momentum, Personalization, and Curiosity.**
* **Standalone First**: It provides instant value (puzzles, streaks) without requiring external accounts.
* **Imports as Enhancers**: Lichess/Chess.com sync is a "Power User" feature, not a dependency for onboarding.

## 🚀 The Onboarding "Magic Moment" Flow
Landing → Quick Win (1 Puzzle) → Live Assessment (5-7 min) → **DNA Reveal** → Personalized Plan → Delayed Signup.

## ## What Was Done (v0.29.4)
- Resolved all TypeScript regressions in template refs and store orchestration.
- Fixed Linux case-sensitivity build blockers on Vercel (`chesscomApi.ts`).
- Promoted Shadow Realm (SRS) to a core production feature.
- Hardened storage utility and audio resilience.
- Updated README.md and Pin Workflow with priority management.

## ⚡ What's Next (Prioritized)
- [ ] [P0] Verify Green Build on Vercel for commit `797fc86`.
- [ ] [P0] Assessment Engine: Build the 5-7 minute live assessment logic (3 Tactics, 2 Calc, 1 Endgame).
- [ ] [P1] DNA Reveal Screen: Create the "Magic Moment" animation for Archetype/Skill breakdown.
- [ ] [P1] Mortal Engine Validation: Integrate Stockfish layer to filter non-winning harvested blunders.
- [ ] [P2] UI Alignment: Unify Activity Heatmap onto the main War Room dashboard (currently only in Constellation).
- [ ] [P2] UI Alignment: Integrate "Top Opening" stats into the WLD Donut chart in StatsRatio.vue.
- [ ] [P2] Vault Virtualization: Implement `vue-virtual-scroller` for >10,000 game libraries.
- [ ] [P2] Delayed Signup Gate: Implement "Save your DNA profile" logic after assessment.
- [ ] [P3] Expand Coach Prescriptions: Add positional and endgame theme recognition.

## ⚠️ Known Issues
- Minor: Async `onMounted` warnings in Vitest suite (non-blocking).

## 🔥 Hot Files
- `src/stores/curriculumStore.ts` (Assessment logic)
- `src/views/PuzzlesView.vue` (Onboarding/Tactical loop)
- `src/stores/userStore.ts` (DNA & Progression)
- `src/api/chesscomApi.ts` (API Sync)

## 📝 Session Notes
We are shifting from a **toolmaker mindset** to a **product company mindset**. The stabilization of v0.29.4 provides the technical foundation needed to build the standalone "Duolingo" onboarding flow without regressions.
