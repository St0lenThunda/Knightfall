# Foundational Lessons, Terminology Unification, and Lichess Daily Caching

**Date**: 2026-05-22  
**Status**: Completed ✅  

## Summary
We implemented a narrative-first foundational learning curriculum, unified gamified nomenclature under a single source of truth (`curriculumStore.ts`), resolved a critical chessboard lockup issue on interactive challenges, and enabled automatic fetching and caching of Lichess Daily Puzzles.

---

## Key Changes

### 1. Foundational Chronicles (Chapter 0: The Grand Game Begins)
- Created [foundationLessons.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/data/foundationLessons.ts) detailing 10 modules (Chronicles) with story slides, quizzes, and live board verification challenges.
- Implemented [FoundationLessonView.vue](file:///Users/thunda/Desktop/Development/Knightfall/src/views/FoundationLessonView.vue) to coordinate the presentation of narrative pages, slide progressions, board state loads, interactive board challenge checks, and multiple-choice quizzes.

### 2. Terminology Unification (Quest / Sanctum Paradigm)
- Replaced mixed terms with unified domain models:
  - `Academy` / `Sanctum` ➔ **Sanctum**
  - `Subject` / `Chapter` ➔ **Realm**
  - `Lesson` / `Node` ➔ **Quest**
  - `lessonType: 'foundation'` ➔ `questType: 'chronicle'` (narrative slider lessons)
  - `lessonType: 'drill'` ➔ `questType: 'trial'` (puzzle drills)
- Unified the state management under `curriculumStore.ts`, routing endpoints (e.g. `/sanctum` replaces `/academy` with redirect preservation), and visual elements like `ScholarDashboard.vue` and `PathView.vue`.

### 3. Drift-Free Chessboard Interactivity
- Resolved a chess board lockup bug in `LessonView.vue`.
- **Root Cause**: `gameStore.ts` and `boardLogic.playerColor` had duplicated, drifting player color states. When checking for the player's turn, the engine evaluated the outdated private state instead of the active board logic, locking down moves.
- **Solution**: Removed duplicate state. Made `boardLogic.playerColor` the Single Source of Truth (SSOT) inside `gameStore.ts`.

### 4. Lichess Daily Puzzle Cache & Auto-Load
- Implemented `fetchLichessDaily()` helper in `puzzleApi.ts` that checks local storage caching against the current calendar day string before querying Lichess.
- Updated `usePuzzleLogic.ts` to check if a user has already attempted today's puzzle. If not, auto-loads the Daily Puzzle on first load of the puzzle view, saving results directly to Supabase (`puzzle_attempts` table).

---

## File Registry

- [foundationLessons.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/data/foundationLessons.ts) — Foundational lesson definitions.
- [FoundationLessonView.vue](file:///Users/thunda/Desktop/Development/Knightfall/src/views/FoundationLessonView.vue) — Narrator slide player, quiz, and board verification view.
- [curriculumStore.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/stores/curriculumStore.ts) — Central state store for realms, quests, and completion progress.
- [puzzleApi.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/api/puzzleApi.ts) — Client-side caching wrapper for Lichess Daily Puzzle API calls.
- [usePuzzleLogic.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/composables/usePuzzleLogic.ts) — Auto-fetch controller mapping puzzle states and persistence.
- [gameStore.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/stores/gameStore.ts) — Chessboard state consolidator ensuring SSOT for player color.

---

- **Branch Renaming**: Renamed local/remote branch to `mortal-curriculum`.
- **CI Trigger Hardening**: Updated `.github/workflows/warden-shield.yml` to target the `mortal-curriculum` branch for push and pull request hooks.
- **E2E Test Unification**: Refactored `tests/e2e/auth.spec.ts` to expect the unified `"Sanctum"` navigation labels and `/sanctum` routes.

---

## Verification

- **TypeScript compilation**: Verified using `vue-tsc -b` during production builds.
- **Unit tests**: Verified via `npx vitest run`. All 88 tests pass successfully, including newly added cache validation suites.
- **E2E validation**: Verified via `npx playwright test`. All 43 test suites and scenarios pass successfully under Chromium and WebKit.
