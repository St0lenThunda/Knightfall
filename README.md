# ♞ Knightfall

> A premium, full-stack chess training platform built with Vue 3, TypeScript, and Supabase.

---

## Overview

Knightfall is a modern chess web application focused on **skill development through deep analytics**. It combines an interactive chess engine, AI-powered coaching, adaptive puzzle training, and persistent player profiles into a single cohesive experience. Every session you play feeds a living Weakness DNA model that directs your training toward your actual blind spots.

---

## Features

### ♟ Play
- Play against a Stockfish-powered chess engine with configurable difficulty
- Real-time legal move highlights, drag-and-drop piece input, and promotion dialogs
- Game Over screen with result breakdown and a **Review Game** button
- Anti-cheat heuristics measuring move time variance

### 🔬 Analysis
- Full game replay with forward/backward navigation
- AI coaching panel powered by a language model — generates natural language commentary per move
- PGN import for analyzing games from external sources
- Stockfish engine integration with best-move suggestions

### ⚡ Puzzles
- Adaptive puzzle queue driven by your **Weakness DNA** category
- Multi-step tactical puzzles with automated opponent responses
- Progressive hint system: text hint → highlighted piece → directional arrow
- Mate-in-X and move-count indicators per puzzle
- Puzzle skip tracking records failed attempts to Supabase

### 👤 Profile
- User authentication via Supabase (email/password)
- Real-time profile editor for username updates
- **Weakness DNA radar chart** — 6-axis spider chart blending puzzle failure themes and game loss patterns
- Win/Loss/Draw donut chart with opening stats
- Rating history line chart
- Activity heatmap (last 12 weeks)
- Recent games list
- **Badge system** — tiered chess titles with milestone, DNA-mastery, streak, and ritual badges

### 🔔 Global Toast Notifications
- App-wide toast system replacing all browser `alert()` calls
- Four variants: `success`, `error`, `warning`, `info`
- Contextual toasts for: login/logout, puzzle results, profile saves, hint display, PGN errors

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Vue 3 (Composition API, `<script setup>`) |
| Language | TypeScript |
| State Management | Pinia |
| Routing | Vue Router 4 |
| Build Tool | Vite |
| Chess Engine | Stockfish (Web Worker via `engineStore`) |
| AI Coaching | LLM API (`llmApi.ts`) |
| Backend / Auth / DB | Supabase (PostgreSQL + Row-Level Security) |
| Styling | Vanilla CSS with custom design tokens |

---

## Architecture

```
src/
├── api/
│   ├── llmApi.ts          # AI coaching generation
│   ├── puzzleApi.ts       # Puzzle fetch & batch logic
│   └── supabaseClient.ts  # Supabase singleton
├── components/
│   ├── AuthModal.vue      # Login / Signup modal
│   ├── ChessBoard.vue     # Board renderer (highlights, arrows, SVG overlay)
│   ├── SideNav.vue        # Navigation sidebar
│   └── ToastProvider.vue  # Global toast overlay
├── stores/
│   ├── engineStore.ts     # Stockfish Web Worker bridge
│   ├── gameStore.ts       # Chess.js game state, move history, anti-cheat
│   ├── settingsStore.ts   # Sound, theme preferences
│   ├── uiStore.ts         # Global toast notification queue
│   └── userStore.ts       # Auth session, profile, puzzle attempts, badge logic
├── views/
│   ├── AnalysisView.vue   # Game analysis + AI coaching
│   ├── HomeView.vue       # Dashboard
│   ├── PlayView.vue       # Live game vs engine
│   ├── ProfileView.vue    # Player profile, charts, badges
│   └── PuzzlesView.vue    # Puzzle training
└── data/
    └── puzzles.json       # Local puzzle dataset
```

---

## Database Schema (Supabase)

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | FK → `auth.users` |
| `username` | TEXT | Editable via profile editor |
| `rating` | INTEGER | Game Elo rating |
| `puzzle_rating` | INTEGER | Separate puzzle Elo (K=32 standard formula) |
| `avatar_url` | TEXT | Optional |

### `matches`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | |
| `white_id` | UUID | FK → `profiles` |
| `black_id` | UUID | FK → `profiles` |
| `result` | TEXT | `1-0`, `0-1`, `1/2-1/2` |
| `pgn` | TEXT | Full game record |

### `puzzle_attempts`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | |
| `user_id` | UUID | FK → `auth.users` |
| `puzzle_id` | TEXT | |
| `solved` | BOOLEAN | |
| `attempts` | INTEGER | Number of wrong guesses + 1 |
| `time_taken_seconds` | INTEGER | Wall clock from load to solve/skip |
| `hints_used` | INTEGER | Level 1 and/or level 2 hint presses |
| `themes` | TEXT[] | Copied from puzzle metadata |

---

## Badge System

Knightfall uses a **four-pillar badge system**:

### 🏅 Pillar 1 — Milestone Badges
Unlocked by crossing numeric thresholds:
- 🎯 First Win, 🏁 10 / 50 / 100 Games Played
- 🧩 10 / 100 Puzzles Solved
- 📈 Rating milestones: 1200 / 1400 / 1600 / 1800 / 2000

### 🧬 Pillar 2 — DNA Mastery Badges
Unlocked by measurable skill improvement in your tracked weakness:
- 🧬 **Endgame Surgeon** — 80%+ endgame puzzle solve rate (min 20 attempts)
- ⚡ **Speed Tactician** — Average puzzle solve time under 15s over 10 puzzles
- 🔬 **Blind Spot Conquered** — Weakness category solve rate improved by 30%+ over time

### 🔥 Pillar 3 — Streak & Ritual Badges
Unlocked by consistent behavioral patterns:
- 🔥 **Iron Will** — 7-day puzzle streak without skipping
- 🌙 **Midnight Tactician** — 10 puzzles solved after midnight
- 📅 **Monday Warrior** — Won a game every Monday for 4 consecutive weeks
- 🌅 **Dawn Patrol** — Played 5 games before 8am

### 👑 Pillar 4 — Tiered Chess Titles (Prestige Rank)
A progressive rank ladder replacing the static "PRO" badge:

| Title | Symbol | Requirement |
|-------|--------|-------------|
| Pawn | ♟ | Default on signup |
| Knight | ♞ | 10 games + 1200 puzzle rating |
| Bishop | ♝ | 25 games + 1300 puzzle rating + 1 mastery badge |
| Rook | ♜ | 50 games + 1400 rating + 3 mastery badges |
| Queen | ♛ | 100 games + 1500 rating + 5 mastery badges |
| King | ♚ | 200 games + 1700 rating + 8 mastery badges |
| Grandmaster | ✦ | 500 games + 2000 rating + all streak badges |

---

## Future Roadmap

- [ ] **Real-time Multiplayer** — Supabase Realtime Channels for live matchmaking and game streaming
- [ ] **Narrative Event Badges** *(Concept 5)* — Story-driven badges awarded for specific in-game moments:
  - 📖 *"The Comeback"* — Won after being down a queen's worth of material
  - 🗡️ *"Opening Theory Broke"* — Won with no recognized opening for 10+ moves
  - 🏆 *"Perfect Run"* — 5 consecutive puzzles: no hints, no mistakes, first attempt
  - Requires PGN analysis via Supabase Edge Functions and material-tracking middleware
- [ ] **The "Duolingo for Chess" SRS Engine** — A hyper-personalized Spaced Repetition puzzle system:
  - 🔍 *Phase 1: Blunder Harvester* — Async background worker parsing `libraryStore` for massive eval swings to extract custom blunder FENs.
  - 🧠 *Phase 2: SRS Algorithm* — Utilizing SM-2 forgetting curves to serve dynamically generated puzzles based strictly on a user's historical mistakes.
  - 🎯 *Phase 3: Daily Drill UI* — A gamified "training loop" dashboard featuring progression streaks, XP bars, and instantaneous tactical pulse feedback.
- [ ] **Opening Explorer** — Interactive tree of user's most-played openings with ECO codes
- [ ] **Anti-Cheat Edge Functions** — Migrate client-side heuristics to server-side Supabase Edge Functions
- [ ] **Mobile PWA** — Progressive Web App manifest + offline puzzle mode

---

## Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Environment Variables
Create `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
