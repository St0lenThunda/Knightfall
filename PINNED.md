# 📌 Pinned Context

> Last pinned: 2026-05-21 22:18
> Session: Foundational Lessons System (The Mentor's Path)

## What Was Done
- [x] **[P0] WASM Worker Resilience**: Reduced "The Celestial Event" depth to 16 and implemented a 16MB Hash limit to resolve `RuntimeError: unreachable` memory crashes.
- [x] **[P0] Self-Healing Engine**: Integrated a reboot mechanism that automatically reduces analysis depth by 2 on worker failure to prevent infinite crash loops.
- [x] **[P0] Viewport Hardening**: Adjusted ChessBoard max-height to `min(800px, 72vh)` and refined the setup overlay symmetry to eliminate UI clipping on standard viewports.
- [x] **[P1] Anti-Cheat (Warden) Tuning**: Reduced visibility violation weights from 30 to 20, allowing 5 blurs before a "Busted" state, providing a fairer dev/debug experience.
- [x] **[P1] Navigation Accessibility**: Elevated SideNav z-index to 2000 and optimized NavSection padding to ensure the toggle remains usable even behind full-page overlays.
- [x] **[P2] UX Polish**: Implemented smooth `scrollIntoView` for the board area upon game start to automatically conceal the play-header.

## What's Next
- [ ] **[P0] [Learn] Foundational Lessons**: Build the "Mentor's Path" — 10 foundation nodes (Story → Do → Confirm) for absolute beginners.
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

## 📌 Pinned Future Layers (Foundations Upgrade Path)

> These are approved future enhancements from the Brainstorm session. Do NOT build these now —
> they are post-launch upgrades to the Foundational Lessons system (Approach E: Mentor's Path).

### Layer 1: Chapter World Islands (from Approach D)
- Group the 10 foundation nodes into **3 themed islands** on the Knight's Path:
  - 🏛️ **The Ancient Realm** — `found-origins`, `found-board`
  - ⚔️ **The War College** — `found-pawns` → `found-kings` (6 piece lessons)
  - 🧠 **The Grand Library** — `found-check`, `found-principles`
- Each island has its own visual theme, background art, and color palette.
- Non-linear piece ordering within "The War College" (user chooses which piece to learn first).
- Star ratings per node (1–3 stars: finished / quiz passed / challenge aced).
- Hidden lore nodes unlocked by 3-starring all nodes in an island (e.g., "The Opera Game" for War College).
- Cross-island cinematic transitions.

### Layer 2: Living Board Arrow Overlays (from Approach C)
- Add `arrows` and `highlights` props to `ChessBoard.vue` for rendering visual overlays:
  - **Golden arrows**: Animate outward from a piece to show all its legal moves (e.g., knight's 8 L-shapes).
  - **Ghost squares**: Hovering over a piece fades in its movement range in faint gold.
  - **Spotlight effect**: Darken the entire board except the active piece and its range when introducing each piece.
  - **Side-by-side boards**: Two boards simultaneously for visual comparison (e.g., rim knight vs. center knight).
- These overlays are reusable across all lesson types, analysis view, and puzzle hints.

### Layer 3: Dojo Master AI Coach (from Approach B)
- Replace scripted Phase 1 narrative with an **AI-powered Socratic tutor** (Gemini API).
- Reactive dialogue based on what the user does on the board ("Nice try — but a pawn can't move backwards").
- Character portrait + typing animation.
- Prerequisite: Gemini coaching integration must be live first.

### Layer 4: Merge Path into Sanctum Tabs
- Merge the standalone `/path` view (visual skill tree/map) as a secondary tab inside the `/sanctum` view.
- Allow users to toggle between the structured list layout and the dark atmospheric node map, sharing the same underlying state.

## Known Issues
- Engine Instability: While depth 16 is stable, browser memory pressure may still trigger reboots.
- HMR Sync: Visibility violation scores in the Anti-Cheat may occasionally lag during HMR.

## Hot Files
- `src/stores/curriculumStore.ts` (Foundation Node Definitions)
- `src/data/foundationLessons.ts` (Lesson Content — NEW)
- `src/views/FoundationLessonView.vue` (Mentor's Path View — NEW)
- `src/views/PathView.vue` (Node Click Routing)

## Session Notes
Brainstormed 5 approaches for the Foundational Lessons system. Selected **Approach E (The Mentor's Path)** — a 3-phase lesson structure (Story → Do → Confirm) for each of the 10 foundation nodes. Future upgrade path: Layer 1 (Chapter World Islands) → Layer 2 (Arrow Overlays) → Layer 3 (AI Dojo Master). Building Approach E now.
