# ADR 016: Foundational Lessons, Terminology Unification, and Lesson Completion Mechanics

**Status**: Accepted  
**Date**: 2026-05-22  

**Context**:  
As Knightfall transitions into a gamified, skill-progression platform (the "Mortal Curriculum paradigm shift"), we introduced structured foundational chess tracks (learning lessons) and interactive slideshows. However, the codebase had accumulated fragmented terminology ("Academy" vs. "Sanctum", "Subject" vs. "Realm", "Lesson" vs. "Quest", "Node" vs. "Quest"), creating developer confusion and inconsistent UI state tracking. 

Furthermore, users completing the foundational lesson "The Origin of Chess" (`found-origins`) did not have their completion recorded in the Sanctum or Path. We discovered that a database foreign key constraint (`user_skill_progress_node_id_fkey`) forced progress records to reference valid IDs in `skill_nodes`, which is empty because lesson definitions reside strictly on the frontend. Additionally, lessons had no passing criteria (quizzes were always passed), and users could repeat lessons to gather infinite XP due to duplicative and uncapped XP award logic.

To provide a high-retention onboarding path, we also wanted to automatically fetch and display the Lichess Daily Puzzle. However, direct client-side fetching without caching risks hitting Lichess rate limits and causing unnecessary network traffic.

**Decision**:  
1. **Terminology Unification**: Define a clean, single-source-of-truth vocabulary for learning tracks:
   - The primary learning view/route is `/sanctum` (handled by `SanctumView.vue`).
   - Learning tracks/chapters are unified into **Realms** (handled by `curriculumStore.ts`).
   - Individual learning steps are unified into **Quests** (e.g. `Quest` interface), categorized into:
     - **Chronicle**: Interactive story-driven slide/quiz/challenge lessons.
     - **Trial**: Chess puzzle/tactics drills.
2. **Foundational Lessons System**: Build an interactive narrator system (`FoundationLessonView.vue`) that processes a set of story slides, quizzes, and live board verification challenges.
3. **Quiz Passing Rules & Retries**:
   - Establish a 70% passing threshold for foundational lesson quizzes. Users must answer >= 70% correct to pass the quiz and mark the lesson complete.
   - If a user fails to reach the 70% threshold, place the lesson into a `failed` phase, prompting them to retry the quiz or review the slides.
4. **Single Source of Truth (SSOT) XP Awards**:
   - Centralize all quest completion and XP awards within `curriculumStore.ts`'s `completeQuest` action.
   - Guard against duplicate completions: if a quest is already completed, exit early and do not award XP or write to the database.
   - Remove hardcoded and duplicative `addXP` calls in `useUserGamification.ts` and individual lesson views (`LessonView.vue`, `FoundationLessonView.vue`).
5. **Database Constraint Resolution**: Create a migration `supabase_fix_curriculum_progress.sql` to drop the constraint `user_skill_progress_node_id_fkey`. Since quests are managed in code as the Single Source of Truth, dropping this constraint allows storing completion progress without duplicating the quests schema inside a SQL table.
6. **Lichess Daily Puzzle Integration & Caching**: 
   - Fetch the daily puzzle from `https://lichess.org/api/puzzle/daily`.
   - Store the fetched puzzle and fetch date in `localStorage` under `LICHESS_DAILY_PUZZLE` and `LICHESS_DAILY_FETCH_DATE`.
   - On first load of the `/puzzles` page, check if the user has already attempted today's puzzle. If not, auto-load today's Lichess Daily Puzzle from cache (or API if uncached).
   - Solved/failed attempts are submitted directly to Supabase (`puzzle_attempts` database table).
7. **Single Source of Truth (SSOT) Chessboard Control**: Remove drifting duplicated state variables (such as `playerColor`) between components and `gameStore.ts`. Keep `boardLogic.playerColor` as the sole source of truth to resolve chessboard lockups.

**Technical Shifts**:  
1. All modules (`PathView.vue`, `ScholarDashboard.vue`, `useUserGamification.ts`) refer to the unified `quests` and `realms` models in `curriculumStore.ts`.
2. Created `fetchLichessDaily()` helper in `puzzleApi.ts` with local storage lookup and chess move legal verification.
3. Hooked first-load logic into `usePuzzleLogic.ts` to coordinate auto-fetching and database attempts recording.
4. Added TypeScript/Vitest test suites to check `completeQuest` edge cases, first-time XP awards, and repeat completion blocks.

**Consequences**:  
- **Positive**:
  - Consistent developer nomenclature and a single file for content definitions (`curriculumStore.ts`).
  - Bulletproof chessboard interaction logic in lesson views.
  - Strict gamification mechanics: XP is only earned once, and passing quizzes is required to unlock subsequent content.
  - Simplified database configuration allowing rapid progression updates without schema synchronizations.
  - Reduced network load and Lichess API dependency through client caching.
- **Negative**:
  - Requires manual execution of the database schema change (dropping the constraint) in production/staging consoles.
  - Broad modifications across multiple files (`PathView.vue`, `SanctumView.vue`, `ScholarDashboard.vue`, etc.) to align naming conventions.
