# 📌 Pinned Context

> Last pinned: 2026-05-23
> Session: Store TypeScript Strictness (v0.44.0)

## What Was Done (v0.44.0)
- [ ] **[P2] [Maintainability] Store TypeScript Strictness**: Eliminate `any` types for store parameters and composable variables.

## What's Next
- [ ] **[P2] [Security] RLS Policy Integration Testing**: Write an automated test suite to assert that cross-user progress records in `user_skill_progress` are rejected by Supabase RLS.

## 📜 Historical Archive
- [x] **[v0.43.0] Stockfish Inactivity Auto-Throttling (P0)**, **Decomposed FoundationLessonView (P1)**, **Backdrop CSS Consolidation (P1)**, and **Decomposed GameDetailsModal (P1)**.

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
- `src/stores/` (Store typescript strictness cleanup)
- `tests/` or `supabase/` (RLS Policy Integration Testing)

## Session Notes
Completed v0.43.0 refactoring & maintainability release: implemented Stockfish worker auto-throttling on inactivity/tab hiding with auto-resumption; refactored FoundationLessonView to delegate logic to useFoundationLesson composable; consolidated modal-overlay styles; patched useNavigation syntax error. Initiated v0.44.0 work targeting Store TypeScript strictness.
