# ADR 006: Interactive Coaching Popup Architecture

## Status
Proposed (Shipping)

## Context
The previous "Level 1" coaching implementation used an automatic banner (`mistake-tag-banner`) that appeared at the top of the sidebar whenever a mistake was detected. While functional, this approach had several drawbacks:
1. **Visual Intrusion**: The banner pushed content down and added significant visual noise during rapid navigation.
2. **Contextual Disconnect**: There was no direct link between the indicator on the board/header and the explanation in the sidebar.
3. **Immersive Aesthetic**: Banners felt like "notifications" rather than integrated parts of the Oracle's analytical review.

## Decision
Transition the coaching feedback loop from a "Push" model (Banners) to a "Pull" model (User-Triggered Popups).
1. **Centralized Event Pipeline**: `CoachPanel` now emits the `update:tag` event instead of rendering it locally.
2. **Multi-Trigger Entry Points**: Both the `EvaluationHeader` badges and the `BadgeLayer` (on-board indicators) are now interactive click targets that emit a `badge-click` signal.
3. **Orchestrated Display**: `AnalysisView` catches these signals and manages the lifecycle of a high-fidelity glassmorphism modal to display the insights.

## Rationale
This shift aligns with the "Knightfall Premium UX" rule. It prioritizes a clean workspace for the user while making deep tactical insights easily accessible via the very icons that represent the move quality. It also allows for more detailed explanations and "Best Move" suggestions to be displayed in a focused modal without fighting for sidebar space.

## Alternatives Considered
- **Tooltips**: Rejected because tactical explanations often require markdown rendering and significant space (especially for future LLM responses).
- **Sticky Sidebar Widget**: Rejected as it would still occupy permanent real estate even for perfect games.

## Consequences
- **Positive**: cleaner UI, better focus during analysis, more immersive "Oracle" interaction.
- **Negative**: Requires one extra click to see the explanation (mitigated by the high-visibility badge design).
- **Neutral**: State management for the popup now resides in the view layer (`AnalysisView`).
