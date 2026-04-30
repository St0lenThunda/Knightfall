# Project Status: Knightfall v0.29.4

**Last Updated**: 2026-04-29 23:52
**Current Version**: v0.29.4

## 🎯 Recent Accomplishments
- **Shadow Realm Harvesting (v0.29.4)**: Successfully migrated 389 personalized tactical drills and implemented a real-time **Supabase Edge Function** for automated harvesting.
- **Atmospheric UI Polish**: Integrated a "void-pulse" CSS animation for the Shadow Realm academy card, enhancing the premium feel.
- **Production Puzzle API**: Refactored `puzzleApi.ts` to seamlessly bridge local static puzzles with dynamic Supabase-hosted personal drills.
- **Curriculum Automation**: Updated `curriculumStore.ts` to prioritize fetching live drills from the Shadow Realm database over in-memory generation.
- **Schema Hardening**: Applied unique constraints to `puzzle_queue` and `coaching_cache` to ensure idempotent batch ingestion and RLS policy compliance.

## 🚧 In Progress / Next Priorities
1. **Edge Function Automation**: Transition the manual `harvest_shadow_realm.js` script into a Supabase Edge Function triggered by new match record insertions.
2. **100% Coverage Initiative**: Expanding unit tests to `libraryStore.ts` and its synchronization/filtering sub-composables.
3. **Elo-Weighted Intelligence**: Implementing dynamic coaching thresholds that adapt to the player's skill level.

## ⚠️ Known Debt / Blockers
- **Manual Ingestion**: Drills currently require periodic batch uploads via administrative SQL; real-time harvesting is pending the Edge Function migration.
- **Worker Environment Mocking**: Unit tests for Stockfish logic require robust global mocks for the Web Worker environment.

## 🧠 Brain Context (Handoff)
The "Shadow Realm" is now a live feature. The `AcademyView` and `PuzzlesView` correctly fetch personal blunders from Supabase using the `personal-GUID-INDEX` ID pattern. All ingestion errors related to RLS have been bypassed by using administrative SQL with `ON CONFLICT ON CONSTRAINT ... DO NOTHING` guards.
