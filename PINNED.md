# 📌 Pinned Context

> Last pinned: 2026-04-21T22:48:00-04:00
> Session: DNA Lab data integrity sprint — deduplication, Chess.com integration, prescriptions engine

## What Was Done
- **Chess.com Username Centralized** — Moved from per-page input to Profile settings with localStorage persistence. DNA Lab reads from `userStore.profile.chessComUsername`
- **ECO Code Lookup** — Created `src/utils/ecoLookup.ts` with ~200 ECO→opening name mappings. Opening Lab cards now show proper names like "Sicilian: Najdorf" instead of "Live Chess"
- **Prescription Engine (DNA Lab)** — 3 dynamic prescriptions based on game analysis: color imbalance, game length patterns, opening diversity. Severity-coded (critical/warning/good/info)
- **Prescription Engine (Opening Lab)** — 3 opening-specific prescriptions: weakest opening, strongest weapon, one-trick pony detection. Displayed as "Coach's Notes" strip
- **ConfirmModal Component** — Reusable modal replacing all native `confirm()` dialogs. Used in DNA Lab for RESET ALL
- **Reset Library (Nuclear)** — Uses `indexedDB.deleteDatabase()` for guaranteed atomic wipe. Auto-recovers cloud games from Supabase and re-imports Chess.com if linked
- **Deduplication Engine** — Rewrote fingerprinting to use PGN move text (strip headers/comments/whitespace) + player names
- **DataCloneError Fix** — JSON roundtrip to strip Vue Proxy wrappers before Worker `postMessage`
- **Expanded Stats** — Added win rate, avg opponent Elo, peak rating, W/L/D record, bullet rating, preferred format, source breakdown

## What's Next
- [ ] **Verify data integrity end-to-end** — Reset, re-import, confirm game counts match reality (~7 Knightfall + ~46 Chess.com)
- [ ] **Opening Lab "Train Tactics" button** — Currently a toast placeholder. Should navigate to puzzle drills filtered by the selected opening
- [ ] **Opening Lab "Study Theory" button** — Should open an interactive chessboard to step through the opening moves
- [ ] **Badge Engine** — Infrastructure exists but needs mapping to trigger rewards from DNA Lab milestones
- [ ] **Profile Chess.com field → Supabase** — Currently localStorage only. Add `chess_com_username` column to profiles table for cross-device persistence
- [ ] **Archive View** — Ensure the Vault UI properly utilizes `libraryStore` for filtering/displaying the aggregated game vault
- [ ] **Win rate calculation accuracy** — The `libraryWinRate` and `avgOpponentElo` use `userStore.profile.username` which is the Knightfall username, but Chess.com games use the Chess.com username. Need to match against both

## Known Issues
- **Game count discrepancy** — After prune, count showed 72 (expected ~53). After navigating away and back, jumped to 153. Root cause: IDB transactions not committing before navigation. The new `deleteDatabase()` approach should fix this but hasn't been verified yet
- **`openingStats` ECO matching** — If imported PGNs don't have the `ECO` header stored in `g.eco`, they fall through to event name which may still produce junk titles
- **Chess.com username matching** — `libraryWinRate` uses Knightfall username to determine wins, but imported Chess.com games have the Chess.com username as the player name. Need dual-name matching

## Hot Files
- `src/views/DnaView.vue` — Prescriptions, stats grid, import flow, reset logic
- `src/views/OpeningLabView.vue` — Coach's Notes, repertoire cards, curated study
- `src/stores/libraryStore.ts` — Core data layer: IDB, dedup, reset, openingStats
- `src/stores/userStore.ts` — Profile with chessComUsername
- `src/utils/ecoLookup.ts` — ECO code → opening name mapping
- `src/components/ConfirmModal.vue` — Reusable confirmation modal
- `src/views/ProfileView.vue` — Chess.com username field in edit form

## Session Notes
The codebase is on the `duolingo` branch focused on retention features ("The Forge" sidebar section). The core challenge this session was data integrity — games were being double-counted because Chess.com imports and Knightfall games overlap in the same IndexedDB store. The dedup fingerprint was too weak (metadata-only) and IDB transactions were silently failing during SPA navigation. The prescriptions engine is the highest-value new feature — it turns raw game data into actionable coaching, which is the core differentiator of Knightfall.
