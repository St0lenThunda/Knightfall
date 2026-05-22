# ðŸ“Œ Pinned Context

> Last pinned: 2026-05-22 15:34
> Session: System Analysis & Suggestions (v0.42.1)

## What Was Done
- [x] **[P0] Administrative Command Center (v0.42.1)**: Built a secure, role-verified administration view with user search and dual-confirmation purging RPC ("Rite of Oblivion").
- [x] **[P0] Foundational Lessons (Chapter 0)**: Implemented 10 story-driven, interactive lessons with narrative slides, quizzes, and live board verification challenges.
- [x] **[P0] Lesson Completion & Quiz XP Fixes**: Implemented 70% passing threshold for quizzes, disabled duplicate XP on repeat runs, and solved the progress synchronization foreign key issue.
- [x] **[P0] [Bug] DnaReveal Fanfare Fix (v0.42.2)**: Resolved the template ref binding bug in [DnaRevealView.vue](file:///Users/thunda/Desktop/Development/Knightfall/src/views/DnaRevealView.vue) to restore the rank-up particle fanfare.
- [x] **[P0] [Engine] Stockfish MultiPV Reactivity (v0.42.2)**: Converted `multiPvs` in [engineStore.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/stores/engineStore.ts) to `shallowRef` to prevent CPU-heavy recursive observer wrapping.
- [x] **[P1] Board Interactivity Fix**: Eliminated duplicate `playerColor` state between `gameStore` and `boardLogic` to resolve chessboard lockups.
- [x] **[P1] Lichess Daily Puzzle Cache**: Integrated local cache check to skip daily puzzle network fetches and save attempts automatically to Supabase.
- [x] **[P1] [Logging] Storage Guidelines Compliance (v0.42.2)**: Replaced raw `console.error` calls with `logger.error` in [storage.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/utils/storage.ts).
- [x] **[P1] System Audit & Analysis**: Completed a full system-wide audit of performance, maintainability, quality, and security, creating [analysis_results.md](file:///Users/thunda/.gemini/antigravity/brain/a0caaaaa-2f8c-4709-8b0d-c41f1e9d8853/analysis_results.md).
- [x] **[P2] [Performance] Web Worker Cleanup (v0.42.2)**: Deleted the obsolete Web Worker file [libraryFilter.worker.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/workers/libraryFilter.worker.ts).
- [x] **[P1] [Maintainability] Decompose OnboardingGauntlet (v0.42.2)**: Refactor [OnboardingGauntlet.vue](file:///Users/thunda/Desktop/Development/Knightfall/src/views/OnboardingGauntlet.vue) to split landing, Scholar's Mate, and diagnostic assessment steps into isolated components, resolving type errors and syntax warnings.

## What's Next
- [ ] **[P0] [Engine] Stockfish Inactivity Auto-Throttling**: Auto-stop Stockfish worker calculations after 3 minutes of user inactivity or hidden tab state to save battery and reduce CPU load.
- [ ] **[P1] [Maintainability] Decompose GameDetailsModal**: Refactor [GameDetailsModal.vue](file:///Users/thunda/Desktop/Development/Knightfall/src/components/library/GameDetailsModal.vue) (796 lines) by moving tab layouts into sub-components.
- [ ] **[P1] [Maintainability] Decompose FoundationLessonView**: Refactor [FoundationLessonView.vue](file:///Users/thunda/Desktop/Development/Knightfall/src/views/FoundationLessonView.vue) (665 lines) by separating quiz and slide review overlays.
- [ ] **[P1] [Maintainability] Backdrop CSS Consolidation**: Consolidate copy-pasted backdrop overlay styles into a global CSS class in [style.css](file:///Users/thunda/Desktop/Development/Knightfall/src/style.css).
- [ ] **[P2] [Security] RLS Policy Integration Testing**: Write an automated test suite to assert that cross-user progress records in `user_skill_progress` are rejected by Supabase RLS.
- [ ] **[P2] [Maintainability] Store TypeScript Strictness**: Eliminate `any` types for store parameters and composable variables.

## ðŸ“Œ Pinned Future Layers (Foundations Upgrade Path)

> These are approved future enhancements from the Brainstorm session. Do NOT build these now â€”
> they are post-launch upgrades to the Foundational Lessons system (Approach E: Mentor's Path).

### Layer 1: Chapter World Islands (from Approach D)
- Group the 10 foundation nodes into **3 themed islands** on the Knight's Path:
  - ðŸ�›ï¸� **The Ancient Realm** â€” `found-origins`, `found-board`
  - âš”ï¸� **The War College** â€” `found-pawns` â†’ `found-kings` (6 piece lessons)
  - ðŸ§  **The Grand Library** â€” `found-check`, `found-principles`
- Each island has its own visual theme, background art, and color palette.
- Non-linear piece ordering within "The War College" (user chooses which piece to learn first).
- Star ratings per node (1â€“3 stars: finished / quiz passed / challenge aced).
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
- Reactive dialogue based on what the user does on the board ("Nice try â€” but a pawn can't move backwards").
- Character portrait + typing animation.
- Prerequisite: Gemini coaching integration must be live first.

### Layer 4: Merge Path into Sanctum Tabs
- Merge the standalone `/path` view (visual skill tree/map) as a secondary tab inside the `/sanctum` view.
- Allow users to toggle between the structured list layout and the dark atmospheric node map, sharing the same underlying state.

## Known Issues
- Engine Instability: While depth 16 is stable, browser memory pressure may still trigger reboots.
- HMR Sync: Visibility violation scores in the Anti-Cheat may occasionally lag during HMR.

## Hot Files
- `src/views/OnboardingGauntlet.vue` (Onboarding steps to decompose)
- `src/components/library/GameDetailsModal.vue` (Modal tabs to decompose)
- `src/views/DnaRevealView.vue` & `src/composables/useDnaFanfare.ts` (Elo fanfare particle bug)
- `src/stores/engineStore.ts` (Stockfish MultiPV optimization)
- `src/utils/storage.ts` (Logging compliance)

## Session Notes
Completed the foundational lessons path, quiz XP validation, and administrative purging RPC. Conducted a system-wide audit and found a visual bug in `DnaRevealView` where Elo reveal particles never spawn due to unbound template refs, as well as dead code in `libraryFilter.worker.ts` and reactivity overhead in the Stockfish MultiPV stream. Pinned these findings as next-up objectives.’ Layer 3 (AI Dojo Master). Building Approach E now.
