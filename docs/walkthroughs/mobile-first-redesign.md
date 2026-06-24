# Mobile-First Redesign & UX Polish

**Date**: 2026-06-24
**Status**: Completed ✅

## Summary
Make all core Knightfall screens fully responsive and usable on mobile viewports (iPhone SE, Galaxy S25, iPhone 15 Pro Max) to support standalone beta testing. Consolidated the sidebar navigation into a dynamic bottom tab bar and wrapped details panels in a draggable bottom sheet.

## Changes
- **Viewport Constraints**: Added `viewport-fit=cover`, `user-scalable=no`, and standalone web-app capabilities to `index.html`.
- **Dynamic Bottom Tab Navigation**: Replaced the sidebar with a mobile bottom tab bar that dynamically adapts based on the user's authentication state.
- **Draggable Bottom Sheet**: Created a snapping `BottomSheet.vue` component with three snap points (peek, half-expanded, full-expanded).
- **Play & Analysis Optimizations**: Refactored the move history, clock controls, and evaluation bars into the bottom sheet layout.
- **Compact Setup Workflow**: Redesigned the adversary selection and parameter settings modal steps to fit without requiring scrolling.
- **Swipeable Scholar Cards**: Integrated a vertical scroll-snapped tarot-themed carousel for profile statistics (Sigil, Combat Log, and Reliquary).
- **HUD Overlays**: Added floating board indicators for hearts, streaks, and hints on the puzzles screen.

## Implementation Details
- Prevented flexbox page-stretching by applying `max-width: 100vw; overflow-x: hidden;` constraints to the main layout.
- Exposed the Pinia store to `window.store` in development/testing mode to simplify UI audits.
- Shifted the diagnostics HUD trigger on mobile to clear the bottom nav bar.

## Files
- `index.html` - Viewport and PWA adjustments
- `src/App.vue` - Dynamic bottom tab bar integration
- `src/components/common/BottomSheet.vue` - Draggable snap drawer
- `src/components/play/NewGameModal.vue` - New game layout compaction
- `src/components/play/setup/OpponentStep.vue` - Side-by-side bot card on mobile
- `src/components/play/setup/ParameterStep.vue` - Compact parameter picker on mobile
- `src/components/profile/MobileProfileCarousel.vue` - Swipeable tarot carousel
- `src/views/ProfileView.vue` - Carousel page placement
- `src/views/PuzzlesView.vue` - Mobile stats strip and layout scaling
- `src/style.css` - Layout overrides and horizontal containment

## Verification
- Verified all 119 unit tests passing.
- Verified visual alignments on Chrome Device Emulation.
