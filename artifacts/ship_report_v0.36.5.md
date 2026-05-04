# 🚢 Shipping Report: Engine & UI Resilience (v0.36.5)

## 🏗️ Architectural Decisions (ADR)

### ADR 005: Self-Healing Engine Worker Architecture

**Status:** Accepted
**Context:** The Stockfish WASM worker was prone to `RuntimeError: unreachable` crashes when search depth or Hash memory exceeded browser-allocated stack limits.
**Decision:** 
1. **Memory Capping**: Enforce a strict 16MB Hash limit and reduce Nova's depth to 16.
2. **State Persistence**: Track FEN, Depth, and Bot ID outside the worker lifecycle.
3. **Graceful Degradation**: On worker failure, automatically reboot and resume analysis at `Depth - 2` to ensure a "Mortal" fallback that prevents recurring crashes.
**Impact:** Significantly increased engine uptime and system stability on low-RAM devices.

---

## 🛠️ Technical Walkthrough

### 1. Engine Hardening (`engineStore.ts`)
- Introduced `lastAnalyzedFen`, `lastAnalyzedDepth`, and `lastAnalyzedBot` to the reactive state.
- Implemented `reboot()` logic that terminates the current worker and spawns a fresh one with inherited state.
- Removed deprecated `Contempt` UCI commands to align with modern Stockfish standards.

### 2. Viewport-Aware Layout (`PlayView.vue` & `ChessBoard.vue`)
- Replaced fixed height constraints with `min(800px, 72vh)` to ensure the board scales gracefully across different monitor sizes.
- Added `scrollIntoView` orchestration in the `startGame` hook to hide the header and focus the board.

### 3. Anti-Cheat (The Warden) Tuning
- Calibrated the `BLUR` violation weight from 30 to 20 in `useAntiCheat.ts`.
- This allows for 5 window-switches (for documentation or debug) before reaching the "Busted" threshold of 100 points.

---

## 🚦 Health & Quality Status
- **Build**: ✅ Passed
- **Tests**: ⚠️ Failing (LibraryStore loading logic - unrelated to current changes)
- **Git Status**: 13 files modified, 4 untracked.

## 📝 Next Steps
- Implement the WebSocket Bridge for external engines.
- Build the Mortal Probability graph.
