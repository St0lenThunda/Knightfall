# ADR 016: Foundational Lessons, Terminology Unification, and Lichess Daily Caching

**Status**: Accepted  
**Date**: 2026-05-22  

**Context**:  
As Knightfall transitions into a gamified, skill-progression platform (the "Duolingo paradigm shift"), we introduced structured foundational chess tracks (learning lessons) and interactive slideshows. However, the codebase had accumulated fragmented terminology ("Academy" vs. "Sanctum", "Subject" vs. "Realm", "Lesson" vs. "Quest", "Node" vs. "Quest"), creating developer confusion and inconsistent UI state tracking. 

Furthermore, to provide a high-retention onboarding path, we wanted to automatically fetch and display the Lichess Daily Puzzle. However, direct client-side fetching without caching risks hitting Lichess rate limits and causing unnecessary network traffic.

**Decision**:  
1. **Terminology Unification**: Define a clean, single-source-of-truth vocabulary for learning tracks:
   - The primary learning view/route is `/sanctum` (handled by `SanctumView.vue`).
   - Learning tracks/chapters are unified into **Realms** (handled by `curriculumStore.ts`).
   - Individual learning steps are unified into **Quests** (e.g. `Quest` interface), categorized into:
     - **Chronicle**: Interactive story-driven slide/quiz/challenge lessons.
     - **Trial**: Chess puzzle/tactics drills.
2. **Foundational Lessons System**: Build an interactive narrator system (`FoundationLessonView.vue`) that processes a set of story slides, quizzes, and live board verification challenges.
3. **Lichess Daily Puzzle Integration & Caching**: 
   - Fetch the daily puzzle from `https://lichess.org/api/puzzle/daily`.
   - Store the fetched puzzle and fetch date in `localStorage` under `LICHESS_DAILY_PUZZLE` and `LICHESS_DAILY_FETCH_DATE`.
   - On first load of the `/puzzles` page, check if the user has already attempted today's puzzle. If not, auto-load today's Lichess Daily Puzzle from cache (or API if uncached).
   - Solved/failed attempts are submitted directly to Supabase (`puzzle_attempts` database table).
4. **Single Source of Truth (SSOT) Chessboard Control**: Remove drifting duplicated state variables (such as `playerColor`) between components and `gameStore.ts`. Keep `boardLogic.playerColor` as the sole source of truth to resolve chessboard lockups.

**Technical Shifts**:  
1. All modules (`PathView.vue`, `ScholarDashboard.vue`, `useUserGamification.ts`) refer to the unified `quests` and `realms` models in `curriculumStore.ts`.
2. Created `fetchLichessDaily()` helper in `puzzleApi.ts` with local storage lookup and chess move legal verification.
3. Hooked first-load logic into `usePuzzleLogic.ts` to coordinate auto-fetching and database attempts recording.

**Consequences**:  
- **Positive**:
  - Consistent developer nomenclature and a single file for content definitions (`curriculumStore.ts`).
  - Bulletproof chessboard interaction logic in lesson views.
  - Reduced network load and Lichess API dependency through client caching.
- **Negative**:
  - Required broad modifications across multiple files (`PathView.vue`, `SanctumView.vue`, `ScholarDashboard.vue`, etc.) to align naming conventions.
