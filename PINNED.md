# 📌 Pinned Context: v0.15.5 "Dashboard Layout V4: The Intelligence Matrix"

> Last pinned: 2026-04-23
> Session: Major overhaul of the Profile Dashboard layout to a spanning 3-column matrix.

## What Was Done
- **Layout V4 (CSS Grid Matrix)**:
  - Migrated from flex columns to a **3-column CSS Grid** supporting `span-2` and `span-3` cards.
  - **Library IQ**: Elevated to the first card position (full width), focusing on data density (Games, Openings, Opponent Elo, etc.) without win rate noise.
- **High-Density Components**:
  - **Recent Activity**: Expanded to **2 columns** for better game visibility.
  - **Performance Ratio**: Expanded to **2 columns**. Features a real-time W/L/D summary and an enhanced donut chart with a side breakdown.
  - **Performance History**: Expanded to **2 columns**. Added **X/Y axes** and a **Legend** (Rating vs. Avg Elo).
  - **Top Openings**: Increased visibility to show **top 6** repertoire anchors.
- **UI Refinements**:
  - **The Clinic**: Converted prescription links into **action buttons** for a more interactive tool-like feel.
  - **Data Integrity**: Optimized administrative actions with **bottom-right alignment**.
  - **Responsive Overrides**: Added adaptive layouts for 1400px (2-col) and 900px (1-col) screens.

## What's Next
- [ ] **Automated Testing**: Initialize **Vitest** (Unit) and **Playwright** (E2E) infrastructure.
- [ ] **Core Logic Tests**: Write test suite for `gameStore.ts` move validation.
- [ ] **Lichess Data Ingestion**: Build the pipeline to pull curated data, user PGNs and behavior metrics from Lichess.

## Known Issues
- **0% Test Coverage**: The project currently lacks automated validation.
- **Cold Start Cache**: LLM Service requires a warmed cache (Supabase) to maintain sub-10ms performance for new positions.

## Hot Files
- `src/views/ProfileView.vue`: Matrix layout and component V2 upgrades.
- `src/stores/libraryStore.ts`: Source of truth for WLD and performance stats.

## Session Notes
The Dashboard has reached its definitive structural form. The "Intelligence Matrix" layout allows for high-density telemetry (Ratio, History) to breathe, while keeping the administrative and behavioral tools logically grouped.
