# Tauri & DuckDB Architecture Pivot

**Date**: 2026-04-20
**Status**: Completed ✅
**Branch**: `chessbase`

## Summary
Officially documented the pivot from a web-based, cloud-dependent architecture towards a localized, Desktop-Native "ChessBase Killer" app via Tauri and DuckDB.

## Changes
- Updated the future roadmap and tech stack architecture docs in `README.md` to reflect the intent to migrate from Vite/Web to Tauri.
- Formally integrated **DuckDB** as the planned database solution for massive, columnar statistical analysis of chess games locally.
- Injected new **DRY** (Don't Repeat Yourself) principle directives into the global `.agent/rules/code-style-guide.md` file.

## Implementation Details
The decision to utilize DuckDB fundamentally alters the data access paths. Since DuckDB excels at aggregate queries (OLAP) rather than single-point lookups (OLTP), future queries surrounding KnightFall's *Weakness DNA*, *Opening Statistics*, and *Win/Loss Visualizations* will be architected to leverage DuckDB's columnar scanning rather than manual array iterations in TypeScript.

The decision to move to Tauri bypasses the severe performance constraints of browser `IndexedDB` storage, allowing Knightfall to ingest multi-gigabyte PGNs effortlessly.

## Files
- `README.md` - Updated Tech Stack and Roadmap.
- `.agent/rules/code-style-guide.md` - Added DRY rule.

## Verification
- Reviewed documentation structurally against the `@[/documentation]` workflow protocol.
