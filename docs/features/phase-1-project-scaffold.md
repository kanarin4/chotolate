# Phase 1 Project Scaffold

Date: 2026-02-19

## Scope
- Initialize Vite + React + TypeScript project.
- Add core runtime dependencies: `zustand`, `@dnd-kit/core`, `@dnd-kit/utilities`.
- Create required source folders:
  - `src/components`
  - `src/containers`
  - `src/tiles`
  - `src/banks`
  - `src/hooks`
  - `src/state`
  - `src/utils`
  - `src/types`
- Implement basic shell layout with placeholders:
  - left sidebar
  - full-screen board area
  - bottom bank

## Notes
- `DndContext` is wired at the app root for future drag/drop phases.
- Initial minimal store was later expanded in `docs/features/phase-1-foundation-phase-2-static-components.md`.
- Layout uses CSS Grid with only basic structural styling.
