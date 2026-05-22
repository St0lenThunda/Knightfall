# ADR 018: Medieval-Gothic Visual Theme and Stained Glass Aesthetic

**Status**: Accepted  
**Date**: 2026-05-22  

**Context**:  
Standard modern dark-mode chess dashboards are visually flat and fail to evoke strong emotional engagement or express a premium, high-retention character. To align with the Spectral Suite's commitment to "Rich Aesthetics" and visual excellence, Knightfall required a thematic rebranding that felt atmospheric, mysterious, and state-of-the-art.

**Decision**:  
We adopt a **Medieval-Gothic Cathedral** design system. All future interface elements must adhere to these thematic and visual guidelines.

Key Pillars of the Gothic Aesthetic:
1. **The Stained-Glass Canvas**: UI layouts utilize translucent overlay backdrops combined with rich, colorful linear gradients (deep violets, crimsons, and golds) to replicate cathedral stained glass.
2. **Gothic Radiance (CSS God Rays)**: Background canvases implement dynamic, animated linear gradients that mimic structural light rays passing through high arches, creating depth and movement.
3. **Immersive Iconography**: Standardize interface and routing navigation around medieval thematic metaphors:
   - **Scroll**: Learning Path Map (`PathView.vue`)
   - **Shield**: War Room & Achievements (`ProfileView.vue`)
   - **Crystal Ball**: Cathedral of Analysis (`AnalysisView.vue`)
   - **Forge**: Puzzle Training & Gauntlets (`PuzzlesView.vue` / `GauntletView.vue`)
   - **Skeleton Key**: Account Customization (`SettingsView.vue`)
4. **Monastic Narrative Coaching**: The AI Coach operates under a "monastic counselor" persona. Chess analytics are framed as "Positional Rites" and "Tactical Sins," offering storytelling evaluations rather than bare computer metrics.
5. **Glassmorphism Layouts**: Component boxes utilize high-blur `backdrop-filter: blur(16px)` panels, preserving background legibility while maintaining sharp text and element contrast.

**Technical Shifts**:  
- Redesigned `LandingSandbox.vue` with a Z-pattern grid overlay, animated CSS god rays, and gothic structural arches.
- Remediated styling properties across all pages to pass 100/100 Lighthouse accessibility gates (ensuring appropriate contrast between gothic background elements and foreground text).

**Consequences**:  
- **Positive**:
  - Immersive, cohesive theme that separates Knightfall from generic chess tools.
  - Highly interactive visual experience through smooth CSS transitions and lighting effects.
- **Negative**:
  - Requires careful visual testing and color-contrast calibration to avoid accessibility regressions on translucent text containers.
