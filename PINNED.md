# 📌 Pinned Context: The Duolingo Paradigm Shift

> Last pinned: 2026-04-30 (Session: Strategic Pivot)
> Status: Major Architectural Inversion in Progress

## The Core Product Identity
**Knightfall is a personalized chess training platform that builds your skill daily—with optional game imports for deeper coaching.**

* **Not a utility:** It is not a PGN importer, nor a Lichess/Chess.com companion app.
* **A Standalone Ecosystem:** It provides instant value (puzzles, paths, streaks) without requiring an external account connection. External imports act as an **enhancer**, not a dependency.

## Target Funnel
Landing → Quick Win → Assessment → DNA Reveal → Daily Plan → Streak Hook

## Knightfall Standalone Onboarding Flow
*The goal is not to teach chess immediately, but to create Momentum, Personalization, Curiosity, and a Return Habit.*

1. **Screen 1: Hero Landing**
   - CTA: "Start Free Assessment" vs "I Already Have an Account"
2. **Screen 2: Quick Win (30 seconds)**
   - Solve 1 easy tactical puzzle (e.g., mate in 1) for immediate dopamine before asking for signup.
3. **Screen 3: Adaptive Skill Assessment (5–7 min)**
   - 3 Tactics, 2 Calculation lines, 1 Endgame concept, 2 Strategy choices, 1 Speed drill.
   - *Secret Sauce:* Difficulty adapts live to preserve confidence.
4. **Screen 4: DNA Reveal (Magic Moment)**
   - Full-screen animation revealing Baseline Chess DNA (Vision, Speed, Endgame, Positional, Openings) and an Archetype Title (e.g., "The Tactician").
5. **Screen 5: Personalized Plan**
   - Provide "Today's Plan" directly based on the DNA.
6. **Screen 6: Account Creation (Delayed)**
   - Only ask for signup *now* to "Save your DNA profile". Increases conversion massively.
7. **Screen 7: First Streak Hook**
   - "Day 1 Complete." Tease tomorrow's unlocks (Tactical Pulse, DNA Updates).
8. **Screen 8: Soft Import Upsell (Later)**
   - After 2 or 3 sessions, suggest connecting Lichess to enhance the coaching.

## Minimum Build Order (7 Days)
- **Day 1:** Landing + CTA
- **Day 2:** Quick puzzle starter
- **Day 3:** Assessment engine
- **Day 4:** DNA reveal screen
- **Day 5:** Plan generator
- **Day 6:** Signup gate + guest mode
- **Day 7:** Analytics + polish

## Hot Files for the Transition
- `src/views/PathView.vue`, `src/views/LessonView.vue`
- `src/stores/curriculumStore.ts`, `src/stores/coachStore.ts`
- `src/composables/useUserGamification.ts`
- `src/components/board/PuzzleIntroOverlay.vue`, `src/components/board/PuzzleSuccessOverlay.vue`
- `src/router/index.ts` (Routing inversion: PathView -> `/`)

## Session Notes
The pivot from a **toolmaker mindset** to a **product company mindset**. We are leveraging the existing rendering engine, LLM caching, and Gamification stores to deliver immediate value to new users. Imports will only be promoted *after* the user is hooked on the core progression loop.
