# ADR 021: IndexedDB Caching and Hybrid Paging for Scaling Large Chess Libraries

**Status**: Accepted  
**Date**: 2026-05-22  

**Context**:  
Users import large chess databases containing hundreds or thousands of PGN matches from external platforms (Lichess and Chess.com). Maintaining thousands of deeply nested chess game objects and move trees inside reactive Javascript memory (Pinia) causes massive RAM consumption, layout thrashing, and garbage collection freezes. Additionally, loading these collections from remote servers on every page load consumes substantial network bandwidth.

**Decision**:  
We establish a local client-side database caching layer and hybrid memory lifecycle to decouple UI lists from heavy memory structures.

Specifications of the Data Storage Architecture:
1. **IndexedDB Offline Layer**: Treat client-side IndexedDB (managed via `useLibraryIdb.ts`) as the primary storage and caching engine for full game bodies and PGN strings.
2. **Cursor-Based Syncing**: Synchronize cloud data from Supabase to IndexedDB using chunked cursor-based syncing. Rather than downloading entire tables, records are pulled in batches using timestamp offsets.
3. **Paging & Lazy Loading**: Pinia store state must only retain metadata for visible lists. Full game trees and move lists are queried from IndexedDB on-demand when a user selects a game for analysis.
4. **Data Integrity Scanning**: Run database integrity scripts (`useLibraryIntegrity.ts`) that periodically checksum local IndexedDB record counts and IDs against remote tables to repair missing or out-of-sync matches.

**Technical Shifts**:  
- Refactored `libraryStore.ts` to coordinate local queries with IndexedDB.
- Implemented `useLibraryIntegrity.ts` to perform data scanning and recover corrupted offline entries.
- Refined `VaultPanel.vue` lists to support infinite scrolling and page boundaries.

**Consequences**:  
- **Positive**:
  - Extremely low memory footprint; easily scales to libraries of 10,000+ matches on low-end devices.
  - Fast page rendering and list traversal; metadata is lightweight, and the UI remains highly responsive.
  - Offline compatibility; games can be loaded, filtered, and analyzed without internet connectivity.
- **Negative**:
  - Increases synchronization complexity, requiring detailed handlers for conflict resolution, offline write queuing, and schema migrations inside IndexedDB.
