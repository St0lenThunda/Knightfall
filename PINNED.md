# 📌 Pinned Context

> Last pinned: 2026-04-22T00:08:00
> Session: Centralized the "Brain" (Archetype Engine) and synchronized all analytical views with real-data signals.

## What Was Done
- **Centralized Brain**: Unified playstyle archetype and prescription logic into `coachStore`.
- **Real-Data Dashboard**: Synchronized Dashboard, DNA Lab, and Profile metrics (Win Rate, Avg Elo, Performance Rating) via `libraryStore`.
- **Cloud Persistence**: Integrated Supabase sync for archetype caching and player profile persistence.
- **Visual Analytics**: Hooked up real radar charts, activity heatmaps, and rating history progression.
- **Library Integrity**: Implemented `gameFingerprint` deduplication and resolved circular store dependencies.
- **Stability**: Fixed all reported TypeErrors and warnings; bumped to `v0.8.0`.

## What's Next
- [ ] **Badge Integration**: Link the `badgeEngine` to the live `archetypeReport` for milestone rewards.
- [ ] **Opening Lab Expansion**: Use the new `archetypeReport` to recommend specific repertoires based on playstyle.
- [ ] **Mobile Layout Audit**: Ensure high-density stat cards on the Dashboard wrap correctly on small viewports.
- [ ] **Environment Fix**: Update the local development environment to Node 18+ to resolve `npm build` issues.

## Known Issues
- **Build Mismatch**: Local production build (`npm run build`) fails on Node v14.17.0; requires Node 18+ for modern Vite/Vue-TSC features.

## Hot Files
- `src/stores/coachStore.ts`: Primary intelligence engine and archetype report.
- `src/stores/libraryStore.ts`: Central data repository for all game-history metrics.
- `src/views/HomeView.vue`: Dashboard logic and weakness signal display.
- `src/views/DnaView.vue`: Radar chart and archetype narrative center.

## Session Notes
The application is now 100% data-driven. The "simulated" era of Knightfall is over. Every metric shown in the Intelligent Control Center is a real reflection of the user's library and performance.
