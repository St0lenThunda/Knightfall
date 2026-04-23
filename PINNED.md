# 📌 Pinned Context: v0.11.0 "Ghostly Knight & Smart Coach"

> Last pinned: 2026-04-23
> Session: Finalized "Ghostly Knight" visual identity and implemented a 3-tier cost-optimized AI coaching service.

## What Was Done
- **Ghostly Aesthetic**: Rebuilt `PathView.vue` with a 2D Noir theme using high-res B&W imagery and high-contrast Gold/Glass UI elements.
- **Fix Your Mistakes**: Repaired the `ReviewView.vue` core. User moves are now validated against **Stockfish 16.1** best moves in real-time.
- **LlmService**: Implemented a tiered coaching dispatcher (Deterministic → Cache → LLM) to minimize API costs and latency.
- **Gamification Core**: Hearts (5-life system), XP rewards, and Daily Streaks are fully functional in `userStore.ts`.
- **Learning Path**: 20-node S-curve curriculum map with dynamic unlocked/locked states.
- **Asset Pipeline**: Migrated high-res backgrounds to `public/assets/` to satisfy Vite security policies.

## What's Next
- [ ] **Automated Testing**: Initialize **Vitest** (Unit) and **Playwright** (E2E) infrastructure.
- [ ] **Core Logic Tests**: Write test suite for `gameStore.ts` move validation.
- [ ] **Engine Contention**: Optimize worker usage to prevent locking when multiple views (Lab + Review) analyze simultaneously.
- [ ] **Lichess Data Ingestion**: Build the pipeline to pull user PGNs and behavior metrics from Lichess.
- [ ] **Weakness DNA Engine**: Map Lichess blunders to specific `skill_nodes` for personalized curriculum unlocking.
- [ ] **Lesson Content**: Populate curriculum nodes with real PGN data and AI-generated micro-lessons.

## Known Issues
- **0% Test Coverage**: The project currently lacks automated validation.
- **Cold Start Cache**: LLM Service requires a warmed cache (Supabase) to maintain sub-10ms performance for new positions.
- **Terminal Environment**: Local terminal requires `nvm use 24.11.0` for full Node 24 compatibility.

## Hot Files
- `src/services/llmService.ts`: Tiered coaching logic and prompt templates.
- `src/views/ReviewView.vue`: Interactive mistake-fixing engine.
- `src/views/PathView.vue`: Ghostly Knight map and progress UI.
- `src/stores/gameStore.ts`: Core chess state and move history.
- `src/stores/curriculumStore.ts`: Defines the skill tree and progress.

## Session Notes
We have moved from a "Static Tool" to a "Smarter Coaching Platform". The architecture is now economically sustainable due to the global explanation cache. The next major hurdle is **Infrastructure Reliability** (Testing) before we scale the Lichess ingestion.
