## 🏁 Current Status: v0.40.1 ("Chronicles & Sanctum Unification") — STABLE
**Date**: May 22, 2026
**Overall Health**: 🟢 Green (Stable)
**Test Coverage**: 100% Pass Rate (Unit Suite)

### 🚀 Recent Milestones
- **Foundational Chronicles (Chapter 0)**: Implemented 10 story-driven, interactive lessons with narrative slides, quizzes, and live board verification challenges.
- **Terminology Unification**: Refactored references across views (`PathView`, `SanctumView`, `ScholarDashboard`, `useUserGamification`) to align vocabulary under Quest, Realm, and Sanctum models, using `curriculumStore` as the single source of truth.
- **Lesson Completion & Quiz XP Fixes**:
  - Implemented a 70% passing threshold for foundational lesson quizzes. Users must score >= 70% correct to pass the quiz and mark the lesson complete.
  - Added visual Retry/Review cards on quiz failures.
  - Restricted XP gains to first-time successful completions; subsequent completions show "+0 XP (Already Completed)" in the UI and do not award double XP.
  - Created a database migration script `supabase_fix_curriculum_progress.sql` to drop the foreign key constraint `user_skill_progress_node_id_fkey`, allowing progress to sync correctly with Supabase.
- **Board Interactivity Fix**: Eliminated duplicate `playerColor` state between `gameStore` and `boardLogic`, resolving chessboard lockups on interactive challenges.
- **Lichess Daily Puzzle Cache & Automation**: Integrated client-side cached fetching of the Lichess Daily Puzzle on first load, saving attempts automatically to Supabase.

### 🛠️ Key Technical Changes
- **curriculumStore.ts**: Unified all lessons and nodes under a single source of truth using `quests` and `realms`. Centralized first-time quest completion and dynamic XP awarding.
- **FoundationLessonView.vue**: Added narrator layout, quizzes, and live board verification challenges for Chapter 0. Integrated quiz scoring thresholds, failed retry/review state, and "+0 XP (Already Completed)" displays.
- **LessonView.vue**: Removed duplicate local XP awards on trial quest completions, utilizing centralized store logic.
- **useUserGamification.ts**: Removed the static `addXP(50)` reward from `markQuestComplete` to avoid double-awarding XP.
- **gameStore.ts**: Consolidated player color checking to rely strictly on `boardLogic.playerColor`.
- **puzzleApi.ts**: Added client-side localStorage caching checks for the daily puzzle payload.
- **usePuzzleLogic.ts**: Wire up automatic loader for daily puzzle on first page access.

### ⚠️ Blockers & Debt
- **Database Foreign Key drop**: The constraint `user_skill_progress_node_id_fkey` must be dropped in the remote Supabase console using `supabase_fix_curriculum_progress.sql` so that progress insertions succeed.

### 🎯 Next Objectives
1. Implement a pool of puzzles to pull from, dynamically adapting to player mistakes.
2. Implement **Mortal Probability** graph on Analysis Board.
3. Finalize **Courier's Dispatch** (P1 Feedback System).
