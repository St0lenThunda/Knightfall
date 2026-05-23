# ADR 022: Centralized Route Metadata and Archetype Realignment

**Status**: Accepted  
**Date**: 2026-05-23  

**Context**:  
1. **Dynamic Page Titles and Icons**: Page titles and navigation icons were previously hardcoded across multiple views, headers, and the sidebar configuration (`useNavigation.ts`). This caused duplication and maintenance overhead when adding, removing, or re-styling navigation elements.
2. **Archetype Mismatch**: The player DNA profile engine mapped players to dynamic status levels (such as `Storm Form`), but the glossary displayed distinct, static archetype classifications (like `The Vanguard`). This caused semantic mismatch and user confusion.
3. **Data Integrity Bloat**: The user profile overview page (`WarRoomPanel.vue`) was cluttered with database maintenance, cloud syncing, and troubleshooting tools, diverting focus from gameplay achievements and profile telemetry.

**Decision**:  
1. **Vue Router as Single Source of Truth (SSOT)**: Page title and icon definitions are consolidated inside the Vue Router configuration in `src/main.ts` under the `meta` configuration block. All page headers and sidebar item renders resolve titles/icons dynamically from the active route location.
2. **Dual-Classification System**: Establish the Battlefield & Bastion profiling model. Each dynamic status form (e.g., Storm, Rogue, Sentinel, Oracle) is linked to a permanent Core Persona (e.g., Vanguard, Ironclad, Grand Strategist) to resolve the glossary alignment.
3. **Separation of Maintenance and Integrations**:
   - Relocate bulk cloud sync tools (Refresh DNA, Sync Cloud Vault) to the **Integrations** tab in `/profile`.
   - Relocate local database integrity repair tools (Purge test data, sanitize metadata, rebuild schema, nuclear vault wipe) to a new **Maintenance** tab in global `/settings`.

**Technical Shifts**:  
1. Extended `RouteMeta` in `src/env.d.ts` to support `title` and `icon` properties.
2. Refactored `src/composables/useNavigation.ts` using `router.resolve()` to dynamically load title and icon information.
3. Implemented safe routing helpers in view headers (`routeMeta` computed property) to fall back gracefully in unit testing environments, preventing test-runner node initialization errors.
4. Extracted glossary lookup metadata inside `useArchetypeStats.ts` to implement the dynamic core persona associations.

**Consequences**:  
- **Positive**:
  - Eliminated duplicate title/icon strings across the codebase; changing a name/icon now only requires updating a single route definition.
  - Resolved profile-to-glossary semantic mismatch by unifying classification names.
  - Improved UX focus by removing data-wipe and debug/integrity controls from the main user-facing dashboard.
  - Maintained complete unit test coverage (102/102 passing) by supplying fallback routes in mocking setups.
- **Negative**:
  - Requires developers to register page metadata during new route configurations in `main.ts` rather than ad-hoc definitions.
