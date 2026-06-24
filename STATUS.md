## 🏁 Current Status: v0.46.0 ("Mobile-First Redesign & UX Polish") — STABLE
**Date**: June 24, 2026
**Overall Health**: 🟢 Green (Stable)
**Test Coverage**: 100% Pass Rate (119/119 Unit & E2E Suites)

### 🚀 Recent Milestones
*   **Mobile-First Redesign & UX Polish (v0.46.0)**:
    *   Designed responsive bottom navigation tab bar that adaptively shows destinations (Home, Play, Puzzles, Sanctum, Profile, Settings) and authentication actions (Log In/Log Out) based on the player's credentials.
    *   Built `BottomSheet.vue` — a reusable, touch-draggable bottom drawer with 3 snap points (peek, half-expanded, fully-expanded) utilizing glassmorphism styling.
    *   Replaced desktop grid panels with the bottom drawer in `PlayView` and `AnalysisView` to house move history, coach evaluations, and controls.
    *   Restructured `PuzzlesView` with a compact top stats strip, scrollable category pills, and floating gothic HUD indicators (Hearts, Streak, Hints) layered on the board.
    *   Implemented `MobileProfileCarousel.vue` with swipeable tarot card viewports (Sigil, Combat Log, and Reliquary).
    *   Cleaned up mobile touch interactions (tap-to-move, gesture scrolls, touch targets) and resolved a flexbox page-stretching bug in `.main-content`.
    *   **Adversary Selection Drawer & Renamings**: Added a toggleable details drawer (Intel Drawer) in the bot selection carousel (`OpponentStep.vue`) containing the bot's backstory and attributes. Renamed the "DEPTH" label to "FORESIGHT" and "plies" to "moves" for player clarity. Stacked layout vertically on mobile to prevent overflow, replaced absolute tooltips with responsive inline help text descriptions arranged in a vertical stack (Title -> Value -> Progressbar -> Explanation) underneath the bars to prevent overflow and clipping, added visual progress indicators including a bi-directional progress bar for Contempt (ranging from -100 to 100), and made the drawer expanded/collapsed state persistent across adversary selections (until collapsed by the player). Added associated unit tests to verify the interactive drawer states.

### 🛠️ Key Technical Changes
*   **MoveTrailCanvas.vue / ChessBoard.vue**: Connected particle emitting, curve interpolation, and coordinate syncing logic.
*   **BoardCustomizerModal.vue**: Managed preview customizations, position resets, and layout styling compaction.
*   **package.json**: Removed `stockfish` from dependency registry; executed `npm install` to update lockfile.
*   **SanctumFanfareOverlay.vue / SanctumView.vue**: Set up completion detection and replay systems.
*   **usePuzzleLogic.ts**: Correctly parse Chess.com PGN headers to populate solutions.

### ⚠️ Blockers & Debt
*   **Component Size Debt**:
    *   `BoardCustomizerModal.vue` is 948 lines long (exceeds the 500-line style guide limit).
    *   `MoveTrailCanvas.vue` is 706 lines long (exceeds the 500-line style guide limit).
    *   Both are safe/functional but should be decoupled in future refactoring cycles.

### 🎯 Next Objectives
1. Extract carousel and physics elements from `BoardCustomizerModal.vue` and `MoveTrailCanvas.vue` into reusable components/composables.
2. Incrementally replace `: any` occurrences in LLM services, game views, and curator models.
