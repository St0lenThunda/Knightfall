## 🏁 Current Status: v0.42.2 ("Onboarding Modularization & System Hardening") — STABLE
**Date**: May 22, 2026
**Overall Health**: 🟢 Green (Stable)
**Test Coverage**: 100% Pass Rate (Unit & E2E Suites)

### 🚀 Recent Milestones
- **Onboarding Gauntlet Modularization (v0.42.2)**:
  - Decomposed the monolithic 877-line `OnboardingGauntlet.vue` component into three isolated step components under `src/components/onboarding/` (`OnboardingDeclaration.vue`, `OnboardingQuickWin.vue`, and `OnboardingDiagnostic.vue`) to satisfy the style guide's 500-line component threshold.
  - Removed syntax-invalid `v-slot` template attributes that caused production build compile failures.
- **System Optimizations & Code Safety (v0.42.2)**:
  - Fixed DNA Reveal fanfare particle rendering by binding destructured refs from `useDnaFanfare()` in `DnaRevealView.vue`.
  - Converted `multiPvs` in `engineStore.ts` to `shallowRef` to eliminate recursive observer proxy wrapping.
  - Aligned local storage with centralized logging constraints by replacing console logs with `logger` calls.
  - Pruned the obsolete `libraryFilter.worker.ts` script.
  - Resolved TypeScript type errors in `gameStore.spec.ts` unit tests.
- **Administrative Command Center & Secure Purging (v0.42.1)**:
  - Resolved directory SELECT query crash by ensuring `role` and `created_at` database columns exist.
  - Implemented secure RLS access using `SECURITY DEFINER` check helper (`public.is_admin(user_id)`) to bypass infinite recursion.
  - Created a searchable user directory and confirmation modal staged in the `mortal-curriculum` branch.
  - Created a dedicated Administration dashboard sub-routed under `/admin` containing a searchable user directory.
  - Implemented the "Rite of Oblivion" (secure user purging) via an elevated `SECURITY DEFINER` RPC to safely delete user data (matches, puzzle attempts, skill progress, and auth credentials) in a single atomic transaction.
  - Set up dual-confirmation safety lock requiring confirmation input (typing the target username) and self-lock prevention.
  - Implemented database-driven role verification checking roles directly on the database to prevent hardcoded frontend admin checks.
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
- **AdminView.vue & Admin Components**: Created a responsive glassmorphic administration cockpit (`AdminView.vue`), searchable `UserDirectory.vue`, and validation modal `PurgeConfirmationModal.vue`.
- **adminStore.ts**: Added Pinia actions to search, load, and purge users via remote database RPC.
- **main.ts / useNavigation.ts**: Configured `/admin` sub-routing, route guards verifying database roles on each transition, and dynamic Administration sidebar navigation.
- **curriculumStore.ts**: Unified all lessons and nodes under a single source of truth using `quests` and `realms`. Centralized first-time quest completion and dynamic XP awarding.
- **FoundationLessonView.vue**: Added narrator layout, quizzes, and live board verification challenges for Chapter 0. Integrated quiz scoring thresholds, failed retry/review state, and "+0 XP (Already Completed)" displays.
- **LessonView.vue**: Removed duplicate local XP awards on trial quest completions, utilizing centralized store logic.
- **useUserGamification.ts**: Removed the static `addXP(50)` reward from `markQuestComplete` to avoid double-awarding XP.
- **gameStore.ts**: Consolidated player color checking to rely strictly on `boardLogic.playerColor`.
- **puzzleApi.ts**: Added client-side localStorage caching checks for the daily puzzle payload.
- **usePuzzleLogic.ts**: Wire up automatic loader for daily puzzle on first page access.

### ⚠️ Blockers & Debt
- **Database Schema & RLS Migrations**: The database constraints and RLS policies on `user_skill_progress` must be updated on the remote Supabase console using `supabase_fix_curriculum_progress.sql` and `supabase_fix_curriculum_progress_rls.sql` so that progress insertions succeed without RLS violation warnings.

### 🎯 Next Objectives
1. Implement a pool of puzzles to pull from, dynamically adapting to player mistakes.
2. Implement **Mortal Probability** graph on Analysis Board.
3. Finalize **Courier's Dispatch** (P1 Feedback System).
