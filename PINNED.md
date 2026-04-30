# 📌 Pinned Context: v0.29.2 "The Platinum Standard: Intelligence & Accessibility"

> Last pinned: 2026-04-29 (Session: Coaching Popup Finalization)
> Status: Stable / Production-Ready (Audit Verified)

## What Was Done
- **v0.29.2 Release**: Finalized the coaching popup architecture and global accessibility hardening.
- **Interactive Coaching Intelligence**:
  - Migrated from legacy banners to a user-triggered **Oracle's Insight** modal in `AnalysisView.vue`.
  - Implemented deterministic evaluation logic in `TaggingService` (no more pseudo-random tags).
  - Added tactical pulse animations to move quality badges to hint at interactivity.
- **Automated QA & SEO (100/100)**:
  - Hardened the codebase via **Lighthouse Audits** using MCP.
  - Achieved a perfect **100 SEO score** by creating a valid `robots.txt` and optimizing meta tags.
  - Improved **Accessibility to 94** by fixing color contrast for `--text-muted` and correcting heading hierarchies.
- **MCP Infrastructure Hardening**:
  - Reconfigured the global `mcp_config.json` to use **Node v24.15.0**.
  - Restored mandatory `$typeName` property for the Cascade plugin system.

## What's Next
- [ ] **100% Coverage Initiative**: Expand unit tests to `libraryStore.ts` and its sub-composables (`useLibraryFilter`, `useLibrarySync`).
- [ ] **Component Testing**: Write interaction tests for the new `OracleInsightModal` and `BadgeLayer` triggers.
- [ ] **Elo-Weighted Intelligence**: Adapt coaching thresholds and explanation complexity based on the user's calculated rating (pinned in `PINNED.md` backlog).

## 📥 Backlog (Low Priority)
- [ ] **Mobile Optimization**: Run Lighthouse mobile audits and address performance/UI scaling issues.

## Known Issues
- **Uncovered Sub-Composables**: The deep logic in `useLibrarySync` still lacks comprehensive unit tests.
- **Worker Mocking**: Vitest tests still require manual Web Worker mocks for Stockfish interactions.

## Hot Files
- `src/views/AnalysisView.vue`: Orchestrator for the new coaching popup and navigation synchronization.
- `src/services/taggingService.ts`: The deterministic engine for move quality classification.
- `src/style.css`: The source of truth for the hardened Knightfall design tokens.
- `src/components/board/BadgeLayer.vue`: Handles the tactical pulse and interactive cues.

## Session Notes
The Knightfall development environment is now a **Hardened Command Center**. With the MCP-driven audit pipeline active, every new feature can be verified for production-readiness in real-time. The core intelligence engine is stable and deterministic.
