# ADR 015: The Duolingo Paradigm Shift

**Status**: Accepted  
**Date**: 2026-04-30  
**Context**:  
Historically, Knightfall operated as a PGN importer and analysis tool, creating high friction for new users who did not immediately have games to import from Lichess or Chess.com. The product was essentially a "toolmaker" utility rather than a habit-forming platform. To improve retention, market size, and user progression, the architecture must transition to a standalone "Skill Progression Platform" (similar to Duolingo).

**Decision**:  
We will restructure Knightfall into a self-contained ecosystem that provides immediate value through a local "Onboarding Gauntlet" (a 7-minute skill assessment) that calculates a Baseline Chess DNA. External imports (Lichess/Chess.com) will be demoted from a primary dependency to an optional "enhancer" hidden behind later progression stages.

**Technical Shifts**:
1. **Routing Inversion**: `PathView` replaces the dashboard/vault as the default landing route (`/`).
2. **Onboarding Funnel**: The application will intercept new, unauthenticated users with an immediate 5-10 puzzle sequence (`OnboardingGauntlet.vue`) to build momentum.
3. **DNA Decoupling**: Stats and "DNA" previously calculated purely from imported PGN arrays will now be seeded manually by the assessment and stored as a distinct entity in Supabase.

**Consequences**:  
- **Positive**: Massive reduction in onboarding friction; better retention mechanics; unlocks a standalone product tier.
- **Negative**: Requires decoupling the existing `libraryStore` from the UI components that currently rely entirely on it for rendering content.
