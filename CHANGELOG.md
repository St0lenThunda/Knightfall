# Changelog

All notable changes to the Knightfall project will be documented in this file.

## [v0.45.0] - 2026-05-24

### Added
*   **Move Trail Canvas Particle Engine**: Implemented an overlay coordinate-synchronized `<MoveTrailCanvas>` supporting six premium effects: Chrono Echoes (`chrono`), Blazing Flame (`fire`), Frozen Crystal (`ice`), Cyber-Neon (`cyber`), Autumn Leaves (`leaves`), and Lightning Arc (`lightning`).
*   **Aesthetic Customizer Modal**: Built a compact visual board/piece customizer featuring theme-tied trail effects, piece contrast outline toggles, a position reset button, and zero-scroll option carousels.
*   **Curriculum Completion Celebration**: Added `SanctumFanfareOverlay` to celebrate standard curriculum completion (updated to 70 quests and 5,000 XP) with rank progression milestones and high-fidelity fanfare.

### Changed
*   **Theme-to-Trail Automatic Mapping**: Taught the game board and customizer preview to automatically resolve and bind trail effects to selected piece and board themes, eliminating mix-and-match selection clutter.
*   **Dependency Pruning**: Uninstalled the dead npm package `"stockfish"` from `package.json` to prevent bundle bloat, as the application evaluates moves directly using a static worker file.

### Fixed
*   **Chess.com Daily Puzzle Parsing**: Fixed solution move coordinate mapping in `usePuzzleLogic` to properly parse PGN histories and populate solvable puzzle actions.
*   **TypeScript Type Verification**: Narrowed settings prop definitions and resolved type incompatibilities in `lastMove` properties to achieve error-free Vue compilation.

## [v0.44.1] - 2026-05-24

### Fixed
*   **Personal Puzzle Parsing**: Patched personal puzzle ID parsing in `fetchPersonalPuzzleById` to reliably extract the source game ID and move index from custom non-UUID string formats (such as local SHA/fingerprint hashes), resolving a major bug where personal mistake drills failed to load in the Siege Trials view.

## [v0.44.0] - 2026-05-23

### Changed
*   **Store TypeScript Strictness**: Enforced strict typing across all store composables and orchestrators under `src/stores/`. Replaced implicit and explicit `any` types with interfaces for game telemetry, move evaluations, database rows, opening stats, and curriculum quests.

## [v0.43.0] - 2026-05-23

### Added
*   **Stockfish Inactivity Auto-Throttling (P0)**: Auto-stops Stockfish worker calculations after 3 minutes of user inactivity or hidden tab state to save CPU and battery. Calculation is resumed seamlessly when user presence or tab visibility is restored. Added unit testing suite in [engineStore.spec.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/tests/unit/stores/engineStore.spec.ts).

### Changed
*   **Decomposed FoundationLessonView (P1)**: Extracted all slide navigation, challenge validation, and quiz handling logic from [FoundationLessonView.vue](file:///Users/thunda/Desktop/Development/Knightfall/src/views/FoundationLessonView.vue) into the reusable [useFoundationLesson.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/composables/useFoundationLesson.ts) composable, reducing view line counts from 564 to 200.
*   **Backdrop & Modal CSS Consolidation (P1)**: Consolidated copy-pasted modal-overlay styling rules into the central [style.css](file:///Users/thunda/Desktop/Development/Knightfall/src/style.css) file (with webkit-backdrop-filter support) and stripped local styling from individual modal views.
*   **Decomposed GameDetailsModal (P1)**: Refactored [GameDetailsModal.vue](file:///Users/thunda/Desktop/Development/Knightfall/src/components/library/GameDetailsModal.vue) by moving tab layouts into dedicated sub-components.

### Fixed
*   **useNavigation Syntax Bug**: Patched double trailing bracket parsing syntax errors inside [useNavigation.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/composables/useNavigation.ts).

---

## [v0.42.2] - 2026-05-22

### Changed
*   **Stockfish MultiPV Reactivity**: Converted `multiPvs` in [engineStore.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/stores/engineStore.ts) to `shallowRef` to prevent CPU-heavy recursive observer wrapping.
*   **Decompose OnboardingGauntlet**: Refactored [OnboardingGauntlet.vue](file:///Users/thunda/Desktop/Development/Knightfall/src/views/OnboardingGauntlet.vue) to isolate onboarding steps.
*   **Web Worker Cleanup**: Removed the obsolete Web Worker file [libraryFilter.worker.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/workers/libraryFilter.worker.ts).

### Fixed
*   **DnaReveal Fanfare**: Resolved a template ref binding bug in [DnaRevealView.vue](file:///Users/thunda/Desktop/Development/Knightfall/src/views/DnaRevealView.vue) to restore the rank-up particle fanfare.
*   **Storage Guidelines Compliance**: Replaced raw `console.error` calls with `logger.error` in [storage.ts](file:///Users/thunda/Desktop/Development/Knightfall/src/utils/storage.ts).

---

## [v0.42.1] - 2026-05-21

### Added
*   **Administrative Command Center**: Built a secure, role-verified administration view with user search and dual-confirmation purging RPC ("Rite of Oblivion").
*   **Foundational Lessons (Chapter 0)**: Implemented 10 story-driven, interactive lessons with narrative slides, quizzes, and live board verification challenges.

### Fixed
*   **Lesson Completion & Quiz XP**: Implemented 70% passing threshold for quizzes, disabled duplicate XP on repeat runs, and solved progress synchronization foreign key issues.
