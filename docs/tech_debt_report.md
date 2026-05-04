# Knightfall Technical Debt Report — Hardening Phase

## 🚨 Critical Monoliths (God Components)
*Target: Files > 500 lines per Architectural Rule.*

| File | Lines (Original) | Lines (Current) | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `ChessBoard.vue` | 525 | 400 | ✅ Resolved | Debug logic extracted, modern CSS applied. |
| `usePuzzleLogic.ts` | 396 | 335 | ✅ Resolved | Heuristics and XP math extracted. |
| `TelemetryModal.vue` | 637 | 190 | ✅ Resolved | Decomposed into 5 specialized sub-components. |
| `SideNav.vue` | 566 | 236 | ✅ Resolved | Logic moved to composable, UI split into sub-components. |
| `libraryStore.ts` | 559 | 378 | ✅ Resolved | Maintenance and integrity logic moved to `useLibraryIntegrity`. |
| `HomeView.vue` | 535 | 29 | ✅ Resolved | Decomposed and optimized via `defineAsyncComponent`. |
| `AdminHud.vue` | 528 | 225 | ✅ Resolved | Decomposed into `HudMetrics.vue` and `HudActions.vue`. |

## 🛠️ Extracted Utilities (The Modular Layer)
*Logic moved out of components to increase reusability and testability.*

1. **`src/utils/debugUtils.ts`**: Forensic "Black Box" snapshots.
2. **`src/utils/tacticalHeuristics.ts`**: Coaching rationales, XP math, and time bonuses.
3. **`src/utils/telemetryUtils.ts`**: Shared metadata and formatting for system metrics.
4. **`src/composables/useNavigation.ts`**: Centralized route matching and nav section logic.
5. **`src/stores/library/useLibraryIntegrity.ts`**: Data hygiene, sanitization, and repair logic.

## 📈 Hardening Roadmap
1. **End-to-End Type Safety**: Audit all remaining `any` types in `libraryStore`.
