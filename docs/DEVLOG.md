# Devlog

## 2026-02-19 — Phase 1 Scaffold
- Chose Vite React TypeScript scaffold to align with project plan.
- Added Zustand immediately to establish global state path early.
- Added dnd-kit context in root app now so later drag/drop tasks can be incremental.
- Kept UI styling minimal and focused on structural layout only.
- Preserved docs directory and added implementation tracking files required by `docs/codex.md`.

## 2026-02-19 — Foundation Completion + Static Components
- Completed remaining Phase 1 tasks before deeper drag logic to stabilize architecture boundaries (types, slices, constants, styles).
- Switched entity enums to `as const` objects because the project TypeScript config uses `erasableSyntaxOnly`, which rejects runtime enums.
- Normalized store shape (`Record<string, Entity>`) matches documentation and supports O(1) lookups for upcoming drag/drop validations.
- Seeded initial board data in store to make Phase 2 static components render immediately without temporary mock files.
- Implemented container layout as a pure utility and memoized hook to keep sizing math isolated ahead of resize/drop features.
- Wired fatigue click through store actions to satisfy manual-toggle behavior without introducing scheduling logic.

## 2026-02-19 — Runtime Loop Hotfix + Debug Instrumentation
- Root cause of `Maximum update depth exceeded` was non-stable values returned by Zustand selectors used directly in `AppShell` (`Object.values(...)/grouping` on each snapshot).
- React `useSyncExternalStore` requires cached snapshot semantics; returning fresh objects/arrays each read can trigger repeated re-subscribe/rerender loops.
- Fixed by subscribing to stable record slices (`containers`, `banks`, `tiles`) and deriving arrays/maps with `useMemo`.
- Added debug instrumentation to make runtime behavior observable:
  - DnD lifecycle (`drag-start`, `drag-move`, `drag-end`, `drag-cancel`)
  - store action dispatch logs for board and UI slices
  - store-level update summary logs (`changedKeys`, entity counts)
  - component render and tile click traces
- Added selector-level memoization caches so any future `useAppStore(selectX)` usage of derived selectors returns stable snapshots when inputs are unchanged.

## 2026-02-19 — Phase 3 Drag System
- Extracted drag behavior into `useDragAndDrop` to keep `App.tsx` declarative and isolate drag/drop business rules.
- Implemented cursor-point collision because bounding-box collision does not match operator intent for this board model.
- Implemented deterministic drop resolution:
  - valid target container/bank -> move tile
  - invalid or outside target -> return tile to default bank by tile type
- Added bank acceptance gating for visual highlighting so invalid bank targets do not appear active for the current tile type.
- Added draggable control-event guards (`pointerdown` stop propagation) on tile fatigue/info buttons to reduce accidental drag starts from control clicks.

## 2026-02-19 — Phase 3.5 + Container Type Split
- Tightened collision resolution by returning only a single highest-priority target from cursor collision results; this avoids ambiguous overlap behavior.
- Removed tile type labels to reduce per-tile visual noise while retaining type differentiation through existing border styles and container sections.
- Implemented explicit two-lane container composition (Staff lane + Newcomer lane) so all assignments inside a container are grouped by tile type.
- Drop behavior did not require store schema changes; existing `currentZoneId` move logic remains valid and UI-level split is derived from tile type on render.

## 2026-02-19 — Phase 4 Container Interaction
- Shifted board rendering from flex-wrapped containers to an explicit canvas model (scrollable viewport + absolute-positioned containers) to support free positioning and resizing semantics.
- Used pointer-driven custom hooks (`useContainerDrag`, `useContainerResize`) for container interactions to avoid coupling container drag/resize behavior to tile dnd-kit flows.
- Added explicit dynamic sizing utility (`calculateContainerMinSize`) tailored to the split container layout (Staff/Newcomers sections), rather than relying on single-grid assumptions.
- Enforced resize constraints at interaction time and applied auto-grow at state-transition time (`moveTile`) so both manual resize and drag-drop placement remain consistent.
- Reused existing `deleteContainer` state behavior (tile recovery to banks) and added UI-level confirmation in container headers.

## 2026-02-19 — Phase 4.7 Container Edit Menu + Section Toggles
- Introduced explicit container capability flags (`acceptsStaff`, `acceptsNewcomers`) so section visibility and drop eligibility use the same source of truth.
- Added an in-header edit menu with checkboxes to toggle section availability at container level.
- Enforced drop constraints at two layers:
  - interaction layer (`useDragAndDrop` target validation)
  - state mutation layer (`moveTile` container validation guard)
- Disabled droppable registration for zones that cannot accept the active dragged tile type to improve collision outcomes in overlap scenarios.
- Implemented section-off cleanup by moving existing in-container tiles of that type back to default banks, preventing hidden/unreachable assignments.
- Updated minimum sizing utility to compute bounds from only enabled sections, keeping resize constraints aligned with visible container structure.

## 2026-02-19 — Phase 5 Tile Features
- Consolidated tile create and tile edit into a single modal component with two explicit modes (`tile_create`, `tile_info`) to minimize duplicated form logic.
- Chose store-level board hydration/save in `src/store/index.ts` to make fatigue and tile metadata persistence immediate without introducing broader auto-save orchestration yet.
- Added `restoreTile` action to keep undo restore behavior explicit and validated at state layer (including fallback zone handling when original zone becomes invalid).
- Implemented undo as a hook (`useUndo`) plus presentation component (`UndoSnackbar`) so expiration logic stays centralized and reusable.
- Inline tile renaming intentionally disables drag during edit mode to avoid pointer/drag conflicts inside tight tile controls.

## 2026-02-19 — Hydration Repair Hotfix
- Addressed a persisted-state edge case where required banks (notably Newcomer Bank) could be missing from hydrated data.
- Added storage normalization during load to auto-repair required banks and backfill compatibility defaults (container section flags, tile notes/fatigue safety).
- Added zone-validation remapping so tiles targeting invalid/missing zones are moved to their type-appropriate default bank during hydration.

## 2026-02-19 — Layout Width Readjustment
- Resolved horizontal overflow where the board center column could force the full grid wider than viewport due min-content sizing behavior.
- Updated grid template to `var(--sidebar-width) minmax(0, 1fr) var(--sidebar-width)` and applied `min-width: 0` to center panes so board overflow is contained within the board viewport scroll area.

## 2026-02-19 — Phase 6 Board Features
- Extracted top controls into dedicated toolbar components to reduce `AppShell` coupling and make mode/search interactions explicit.
- Added search behavior by reusing store selector-based match computation and applying tile-level visual states (highlight vs dim), avoiding additional filtering state.
- Added a dedicated board viewport component and introduced middle-mouse drag panning while preserving native scrollbars for precise navigation.
- Split persistence responsibilities:
  - board entity persistence moved to debounced `useAutoSave`
  - lightweight mode preference persisted independently in storage
- Kept hydration normalization path as recovery layer for invalid/missing persisted board data.
- Added a non-interactive mini-map overlay to reduce spatial disorientation on large canvases; it renders scaled container footprints and an always-live viewport box driven by board scroll/viewport measurements.
- Updated mini-map world-bounds math to derive from content bounds + live viewport bounds (with padding) instead of fixed full-canvas extents, so viewport placement stays intuitive when operators drift into empty board regions.
- Removed the viewport rectangle overlay from minimap after UX feedback; kept the map as a stable footprint preview and moved viewport-box behavior into future-task queue until interaction/mapping semantics are finalized.
- Removed the board map/minimap overlay from active board UI and deferred map-based navigation back to future work.
- Added explicit board zoom controls (`-`, `+`, `100% reset`) in the toolbar for macro/micro board navigation.
- Implemented zoom as a scaled board-canvas layer with viewport-center anchoring during zoom transitions to prevent abrupt navigation jumps.
- Normalized container drag/resize pointer deltas by zoom factor so position and size updates remain accurate at non-100% zoom.

## 2026-02-20 — Phase 7 Polish Batch 1
- Implemented explicit drop animation timing in dnd-kit drag overlay to match polish targets: `200ms` for valid snap/drop and `250ms` for invalid return/cancel.
- Added animated visual pulse for active drop targets (banks and containers) to improve drag affordance feedback while cursor hovers valid zones.
- Added overlap detection at board-shell level (AABB intersection) and surfaced amber warning treatment on overlapping containers.
- Improved empty-state guidance and count-badge clarity (including zero-state styling and accessible count labels) so banks/sections communicate actionability more clearly.
- Implemented responsive side-bank drawers for `<1024px` with mobile toggles, backdrop close, and `Escape` key dismissal while preserving desktop 3-column layout.
- Replaced blank render path for missing required banks with explicit recovery UI and reload affordance to prevent silent failure UX.
