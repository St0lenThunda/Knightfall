# Constellation Performance Optimization & Filter Linking

**Date**: 2026-04-19 (Completed 2026-04-20)
**Status**: Completed ✅

## Summary
The "Constellation" feature (mapping of opening branches) was previously a background process that triggered automatically on search/filter changes. For large collections (7,500+ games), this caused significant UI lag and wasted CPU cycles. This update moves the logic to an on-demand, asynchronous, and filter-aware architecture.

## Changes
- **Asynchronous Chunking**: Tree building now processes 100 games at a time and yields to the main thread to prevent UI lockups.
- **Manual Trigger**: Constellation mapping is now "Offline" by default and requires a manual "Analyze Collection" action.
- **Filter Fingerprinting**: The map is now linked to active Vault filters. If filters change, the map is marked as "Stale" and the user is prompted to "Re-map Results".
- **Logic Extraction**: Moved heavy PGN parsing and trie construction logic out of the store and into a dedicated utility.

## Implementation Details
- **Utility Abstraction**: Created `src/utils/constellationUtils.ts` containing the `buildOpeningTree` function.
- **Fingerprinting**: Used a hash of `searchQuery`, `filterResult`, and `selectedTag` to detect when the current visualization no longer reflects the filtered data.
- **Background Suspension**: Logic is explicitly suspended while the **Analysis Lab** is active to maximize resources for the Stockfish engine.

## Files
- `src/utils/constellationUtils.ts` - Core trie construction logic.
- `src/stores/libraryStore.ts` - State management for stale detection and tree storage.
- `src/components/library/ConstellationPanel.vue` - Updated UI for manual triggers and progress reporting.
- `src/views/LibraryView.vue` - Cleaned up automatic tab-change triggers.

## Verification
- Verified mapping performance on collections > 5,000 games.
- Confirmed that UI remains responsive (animated spinners don't stutter) during mapping.
- Confirmed "Map Out of Date" overlay appears correctly when changing search terms.
