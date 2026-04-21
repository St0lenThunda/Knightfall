# Native Desktop Bridge & DuckDB Integration

**Date**: 2026-04-20
**Status**: Completed ✅
**Branch**: `chessbase`

## Summary
Successfully transitioned Knightfall from a browser-only environment to a hybrid Desktop-Native application using **Tauri**. This allows us to bypass browser memory/file limits and leverage the **DuckDB** engine for massive-scale chess analytics locally.

## Changes
- **Backend (Rust)**:
  - Initialized `src-tauri` native wrapper.
  - Implemented `DbManager` to manage a persistent, thread-safe DuckDB connection.
  - Created `run_query`, `import_pgn`, and `list_directory` IPC commands.
- **Frontend (Vue)**:
  - Created `useDatabase.ts` composable to interface with native JSON-mapped queries.
  - Validated native execution in `App.vue` startup routine.

## Implementation Details
### High-Speed Streaming
The `import_pgn` command utilizes `BufReader` and `std::fs` to stream gigabyte-scale text files without allocating the entire contents into memory. By wrapping insertions in a SQL Transaction, we achieve near-native database write performance.

### File System Security
The `list_directory` command implements our **Path Validation** rule. By canonicalizing paths on the Rust side, we prevent the "Webview" from being used as a vector to browse outside of authorized user directories.

### Columnar-to-JSON Bridge
The `run_query` command now dynamically inspects cursor metadata to convert DuckDB's internal row format into a `serde_json` array, allowing the Vue frontend to consume analytical data as standard JavaScript objects.

### The IPC Layer
We use Tauri's `invoke` system. This acts as a high-speed "message bus" between the front-end JavaScript and the back-end Rust. This is a critical architectural shift required to compete with ChessBase, as it enables Knightfall to read terabyte-scale files without the browser hanging.



## Files
- `src-tauri/src/lib.rs` - Native entry point and command definitions.
- `src-tauri/Cargo.toml` - Rust dependency management (DuckDB).
- `src/composables/useDatabase.ts` - Frontend database wrapper.
- `src/App.vue` - Application entry point logic.

## Verification
- Successfully invoked Rust commands on startup.
- Verified DuckDB table creation and insertion via console logging.
