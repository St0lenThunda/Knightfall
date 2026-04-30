# ADR 005: Shadow Realm Integration & Storage Hardening

## Status
Proposed (2026-04-30)

## Context
The Knightfall Intelligence Engine previously identified tactical blunders during game analysis but lacked a seamless mechanism to convert these blunders into actionable training. Additionally, the codebase suffered from "Storage Leakage," where `localStorage` was accessed directly in multiple components and stores, leading to type safety issues and fragile state persistence.

## Decision
We have implemented a unified "Shadow Realm" tactical training loop and hardened the persistence layer:

1.  **Storage Abstraction**: All legacy `localStorage.getItem/setItem` calls have been replaced by the `Storage` utility. This utility provides a centralized registry of `StorageKey` enums, ensuring type safety and preventing key collisions.
2.  **Tactical Harvesting**: The `curriculumStore` now automatically harvests blunders from the `libraryStore` synthesis results, transforming them into "Personalized Drills."
3.  **Clinic Integration**: The `DNAClinic.vue` component now prioritizes these personalized drills, surfacing them as "Urgent Prescriptions" with vibrant pulse indicators.
4.  **Analytics Layer**: Added a "Ghost Mastery" stat tracker to the `PuzzlesView` to visualize the user's success rate in conquering their own past mistakes.

## Consequences
-   **Architecture**: Unidirectional data flow from analysis -> harvest -> training is now solidified.
-   **Maintainability**: The removal of direct `localStorage` access reduces the risk of runtime errors and simplifies debugging.
-   **UX**: The "Clinic" feels more alive and reactive to the user's specific gameplay weaknesses.
-   **Performance**: Centralized storage allows for better optimization of persistence triggers (e.g., debounced writes).

## Alternatives Considered
-   **Direct Link to Analysis**: Instead of a "Shadow Realm" vault, we could have linked users back to the analysis board. However, this wouldn't provide the "gamified" training experience (hints, solution reveal, progress tracking) that the Puzzles view offers.
