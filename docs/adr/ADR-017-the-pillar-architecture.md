# ADR 017: The Pillar Architecture for State Decomposition

**Status**: Accepted  
**Date**: 2026-05-22  

**Context**:  
As Knightfall added offline game storage, real-time database synchronization, game analytics, and interactive sidebars, the central global Pinia stores (particularly `libraryStore.ts`) expanded to over 1,000 lines. This monolithic structure created tight logical coupling, made unit testing difficult, and introduced circular dependency loops that repeatedly broke Vite's Hot Module Replacement (HMR) during local development.

**Decision**:  
We establish the **Pillar Architecture** pattern to decompose monolithic state managers and view controllers into specialized, decoupled sub-composables (Pillars) organized under modular folders (e.g., `src/stores/library/`, `src/composables/analysis/`).

Rules of the Pillar Architecture:
1. **Orchestrator Stores**: The main Pinia store (e.g., `libraryStore.ts`) acts as the top-level orchestrator. It manages central reactive states and coordinates the lifecycle initialization of sub-modules.
2. **Pillar Composables**: Sub-domains (such as local storage persistence, synchronization, filtration, and statistical summaries) are delegated to focused, stateless or stateful sub-composables (e.g., `useLibraryIdb.ts`, `useLibrarySync.ts`, `useLibraryFilter.ts`, `useLibraryStats.ts`).
3. **Unidirectional Dependency Tree**: Leaf stores and sub-composables must never import the parent orchestrator store. If shared data is required, it must be passed as arguments during initialization or extracted into a shared lower-level "Atom Store."

**Technical Shifts**:  
1. Monolithic files were split into granular components:
   - `libraryStore.ts` delegates to `useLibraryIdb.ts` (IndexedDB interface), `useLibrarySync.ts` (Supabase synchronization), `useLibraryFilter.ts` (list sorting/filtering), and `useLibraryStats.ts` (chess metric calculations).
   - `ProfileView.vue` split into `ProfileDnaTab.vue`, `ProfileConstellationTab.vue`, and `ProfileIntegrationsTab.vue` components.
2. Inter-store communication is maintained via explicit dependency injection patterns during composable setup.

**Consequences**:  
- **Positive**:
  - Eliminated Vite HMR circular dependency errors.
  - Decreased file sizes (average under 250 lines), complying with the 500-line threshold design rule.
  - Highly testable architecture; enables mocking database sync or index lookups independently in Vitest suites without loading the whole store context.
- **Negative**:
  - Requires developers to manage explicit parameter passing or shared state references between sub-composables.
