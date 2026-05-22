# Foundational Lessons, Terminology Unification, and Lesson Completion Fixes

**Date**: 2026-05-22  
**Status**: Completed ✅  

## Summary
We implemented a narrative-first foundational learning curriculum, unified gamified nomenclature under a single source of truth (`curriculumStore.ts`), resolved a critical chessboard lockup issue on interactive challenges, and enabled automatic fetching and caching of Lichess Daily Puzzles.

Additionally, we resolved the database synchronizing bug and added strict completion/XP rules:
1. Implemented a 70% passing threshold for foundational lesson quizzes. Users must score >= 70% correct to pass the quiz and mark the lesson complete.
2. Added visual Retry/Review cards on quiz failures, allowing users to re-take the quiz or review the slides.
3. Restricted XP gains to first-time successful completions; subsequent completions show "+0 XP (Already Completed)" in the UI and do not award double XP.
4. Created a database migration script `supabase_fix_curriculum_progress.sql` to drop the foreign key constraint `user_skill_progress_node_id_fkey`, allowing progress to sync correctly with Supabase.
5. Added unit tests covering quest completion, XP rules, and duplicate check logic.

---

## Key Changes

### 1. Foundational Chronicles (Chapter 0: The Grand Game Begins)
- Created [foundationLessons.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/data/foundationLessons.ts) detailing 10 modules (Chronicles) with story slides, quizzes, and live board verification challenges.
- Implemented [FoundationLessonView.vue](file:///Users/thunda/Desktop/Development/Knightfall/src/views/FoundationLessonView.vue) to coordinate the presentation of narrative pages, slide progressions, board state loads, interactive board challenge checks, and multiple-choice quizzes.
- **Passing Threshold & Failure States**: Added a >=70% score requirement to pass quizzes. If failed, it enters a `failed` phase rendering retry and slide review buttons.
- **Repeat Progression Guards**: Caches the completion status on mount to dynamically show `+0 XP (Already Completed)` instead of the standard quest reward.

### 2. Centralized XP & Progression Sync
- **useUserGamification.ts**: Removed the static `addXP(50)` reward inside `markQuestComplete` to avoid double-awarding XP.
- **curriculumStore.ts**: Modified `completeQuest` to guard against duplicate completions, insert progress to Supabase, sync with the local gamification engine, and dynamically award the quest-specific `xp_reward` (plus toast alerts) only on first success.
- **LessonView.vue**: Removed duplicate local XP awards on trial quest completions, utilizing the centralized store logic.

### 3. Terminology Unification (Quest / Sanctum Paradigm)
- Replaced mixed terms with unified domain models:
  - `Academy` / `Sanctum` ➔ **Sanctum**
  - `Subject` / `Chapter` ➔ **Realm**
  - `Lesson` / `Node` ➔ **Quest**
  - `lessonType: 'foundation'` ➔ `questType: 'chronicle'` (narrative slider lessons)
  - `lessonType: 'drill'` ➔ `questType: 'trial'` (puzzle drills)
- Unified the state management under `curriculumStore.ts`, routing endpoints (e.g. `/sanctum` replaces `/academy` with redirect preservation), and visual elements like `ScholarDashboard.vue` and `PathView.vue`.

### 4. Drift-Free Chessboard Interactivity
- Resolved a chess board lockup bug in `LessonView.vue`.
- **Root Cause**: `gameStore.ts` and `boardLogic.playerColor` had duplicated, drifting player color states. When checking for the player's turn, the engine evaluated the outdated private state instead of the active board logic, locking down moves.
- **Solution**: Removed duplicate state. Made `boardLogic.playerColor` the Single Source of Truth (SSOT) inside `gameStore.ts`.

### 5. Lichess Daily Puzzle Cache & Auto-Load
- Implemented `fetchLichessDaily()` helper in `puzzleApi.ts` that checks local storage caching against the current calendar day string before querying Lichess.
- Updated `usePuzzleLogic.ts` to check if a user has already attempted today's puzzle. If not, auto-loads the Daily Puzzle on first load of the puzzle view, saving results directly to Supabase (`puzzle_attempts` table).

### 6. Database Migration & Schema Unlocking
- Created [supabase_fix_curriculum_progress.sql](file:///Users/thunda/Desktop/Development/Knightfall/supabase_fix_curriculum_progress.sql) to drop the constraint referencing `skill_nodes` (which is empty in production), allowing users to successfully insert and persist quest/lesson completions.

---

## File Registry

- [foundationLessons.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/data/foundationLessons.ts) — Foundational lesson definitions.
- [FoundationLessonView.vue](file:///Users/thunda/Desktop/Development/Knightfall/src/views/FoundationLessonView.vue) — Narrator slide player, quiz, and board verification view.
- [curriculumStore.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/stores/curriculumStore.ts) — Central state store for realms, quests, and completion progress.
- [curriculumStore.spec.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/tests/unit/stores/curriculumStore.spec.ts) — Unit tests covering quest completion, first-time XP awards, and duplicate completion guards.
- [puzzleApi.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/api/puzzleApi.ts) — Client-side caching wrapper for Lichess Daily Puzzle API calls.
- [usePuzzleLogic.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/composables/usePuzzleLogic.ts) — Auto-fetch controller mapping puzzle states and persistence.
- [gameStore.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/stores/gameStore.ts) — Chessboard state consolidator ensuring SSOT for player color.
- [supabase_fix_curriculum_progress.sql](file:///Users/thunda/Desktop/Development/Knightfall/supabase_fix_curriculum_progress.sql) — SQL migration dropping the foreign key constraint on the `user_skill_progress` table.
- [warden-shield.yml](file:///Users/thunda/Desktop/Development/Knightfall/.github/workflows/warden-shield.yml) — GitHub Actions CI pipeline tracking gates for `mortal-curriculum`.
- [auth.spec.ts](file:///Users/thunda/Desktop/Development/Knightfall/tests/e2e/auth.spec.ts) — E2E test suite updated to Sanctum paths.

---

### Additional Infrastructure & Branch Changes
- **Branch Renaming**: Renamed local/remote branch to `mortal-curriculum`.
- **CI Trigger Hardening**: Updated `.github/workflows/warden-shield.yml` to target the `mortal-curriculum` branch for push and pull request hooks.
- **E2E Test Unification**: Refactored `tests/e2e/auth.spec.ts` to expect the unified `"Sanctum"` navigation labels and `/sanctum` routes.

---

## Verification

- **TypeScript compilation**: Verified using `npx tsc --noEmit` and `vue-tsc -b` during production builds.
- **Unit tests**: Verified via `npx vitest run`. All 90 tests pass successfully.
- **E2E validation**: Verified via `npx playwright test`. All 43 test suites and scenarios pass successfully under Chromium and WebKit.
