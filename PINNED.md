# 📌 Pinned Context: v0.10.0 "The Duolingo Release"

> Last pinned: 2026-04-22T19:26:00
> Session: Deployed the Progressive Learning Architecture (Curriculum + Lessons). Shifting focus to Lichess Data Ingestion.

## What Was Done
- **Gamification Core**: Implemented Hearts (5-life system), XP rewards, and Daily Streaks in `userStore.ts`.
- **Learning Path**: Created `PathView.vue`, a vertical S-curve curriculum map with unlocked/locked states.
- **Lesson Engine**: Created `LessonView.vue`, an interactive engine that sequences 5 targeted exercises per skill node.
- **Interactive Review**: Created `ReviewView.vue` to allow users to "Fix Their Mistakes" from analyzed games.
- **Time Bonus System**: Added Lightning/Quick/Solid XP bonuses in `PuzzlesView.vue`.
- **Intelligence Layer**: Implemented SHA-256 coaching cache in `llmApi.ts` to reduce latency and costs.

## What's Next
- [ ] **Lichess Data Ingestion**: Build the pipeline to pull PGNs and move-by-move behavior (timing, pressure) from Lichess.
- [ ] **Weakness DNA Engine**: Map Lichess blunders to specific `skill_nodes` (e.g., if user misses a pin in a game, unlock the "Pins" lesson).
- [ ] **DNA Dashboard**: Build radar charts visualizing tactical vs. positional health.
- [ ] **Bite-Sized Lessons**: Populate more `skill_nodes` content (Forks, Skewers, Outposts, etc.).
- [ ] **Sensory Feedback**: Add audio cues for "Correct Move" and "Blunder".

## Known Issues
- **Terminal Environment**: Local terminal is currently using Node `v14.17.0`, causing `npm run dev` to fail (Prefix `node:` requires v16+). **Fix: Run `nvm use 24.11.0` in the user terminal.**
- **Lesson Content**: Lessons currently pull random category puzzles; need to refine `fetchPuzzleBatch` to support specific theme tags (e.g., `pin`, `fork`).

## Hot Files
- `src/stores/curriculumStore.ts`: Defines the skill tree and progress tracking.
- `src/views/LessonView.vue`: The instructional engine orchestrator.
- `src/views/PathView.vue`: The visual map of the training journey.
- `src/stores/userStore.ts`: Central hub for Hearts, XP, and Streaks.
- `src/api/puzzleApi.ts`: Needs update for theme-specific fetching.

## Session Notes
We have successfully moved from a "Static Tool" to an "Active Training Platform". The project is now architecturally ready for deep Lichess integration. Every mistake imported from Lichess can now be converted into a structured lesson node on the Path.
