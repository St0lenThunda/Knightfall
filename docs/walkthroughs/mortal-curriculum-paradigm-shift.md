# Technical Walkthrough: The Mortal Curriculum Paradigm Shift

## The Objective
Knightfall is moving from a utility "PGN analyzer" to a standalone "Chess Skill Progression Platform". The core goal is to provide immediate, gamified value to new users without requiring them to import games from external platforms. 

## The Implementation

### 1. The Onboarding Gauntlet (`OnboardingGauntlet.vue`)
This is the new entry point for unauthenticated users. 
- **The Flow**: Users will be presented with a highly polished 7-minute skill assessment comprising 5 tactical puzzles, 3 positional choices, 2 endgame tests, and a speed challenge.
- **The Engineering**: This will utilize the existing `ChessBoard` component, the `PieceLayer` interactions, and the `TaggingService` for evaluation. The puzzles will be hardcoded in a new `assessmentData.ts` file.

### 2. Baseline DNA Generation
- **The Shift**: Currently, `useLibraryStats` calculates DNA by looping over imported games.
- **The Execution**: We will introduce a new store, `useDnaStore.ts`. When the user finishes the gauntlet, it will calculate a synthetic baseline DNA based on their performance (e.g., Tactical Vision: 70%, Endgame: 45%). This state will be saved to Supabase upon account creation.

### 3. Routing Inversion (`src/router/index.ts`)
- The default `/` route will no longer point to the `Vault` or `Dashboard`.
- **New Flow**: 
  - If no DNA exists -> `/assessment`
  - If DNA exists -> `/path` (`PathView.vue`)
- The Lichess and Chess.com imports will be moved under a `/war-room` or `/pro-tools` route, specifically marketed as an "enhancer" for advanced users.

### 4. Delayed Authentication
- Users will not be asked to sign up until they reach **Screen 6** of the funnel, right after their DNA and Archetype are revealed. 
- This will hook into the existing Supabase Auth UI, but the copy will change to: *"Save your DNA profile."*

## The Next Step
The immediate next step is to build **Screen 1 (Hero Landing) and Screen 2 (Quick Win Puzzle)** to establish the top of the funnel.
