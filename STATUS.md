# Project Status: Knightfall v0.27.0

**Last Updated**: 2026-04-27 15:45
**Current Version**: v0.27.0

## 🎯 Recent Accomplishments
- **Full Build Recovery**: Resolved all 34 TypeScript errors causing build failures. Stabilized environment on Node v24.15.0.
- **Unit Test Suite Stabilization**: Achieved 100% passing rate (43/43 tests) across 7 files by fixing mocks, property mismatches, and test orchestration.
- **Store Hardening**: Refactored `userStore.ts` and `gameStore.ts` to support the new modular architecture (Lesson drills, clock management, semantic aliases).
- **Casing Resolution**: Fixed a critical macOS/Linux casing conflict by renaming `chessComApi.ts` to `chesscomApi.ts`.
- **E2E Isolation**: Configured Vitest to exclude Playwright E2E tests, ensuring the CI/CD pipeline correctly identifies unit vs. integration failures.

## 🚧 In Progress / Next Priorities
1. **Modularize 'WarRoomPanel.vue'**: Break into specialized sub-components (Donut, Chart, Stats) following the Anti-God Component rule.
2. **Implement 'useRatingSystem.ts'**: Offload Glicko/Elo logic from the growing `userStore`.
3. **Audit 'sharp' Dependency**: Verify if it's still needed for client-side processing or should be moved/removed.

## ⚠️ Known Debt / Blockers
- **E2E Test Execution**: Playwright tests are currently excluded from the Vitest runner but need a dedicated CI step for execution.
- **Heart System Persistence**: Hearts are currently in-memory/store-based; need full Supabase integration for persistent "Lives" across sessions.

## 🧠 Brain Context (Handoff)
The codebase is now 100% build-stable. The `userStore` has been updated with snake_case property names (`chesscom_handle`) to match the Supabase schema, so any new views should avoid camelCase for these fields. The `gameStore` now handles its own `drillIndex` for Lessons, removing the need for local index tracking in `LessonView.vue`.
