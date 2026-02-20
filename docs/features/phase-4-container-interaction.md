# Phase 4 Container Interaction

Date: 2026-02-19

## Scope
- Implement full container interaction layer:
  - container creation flow
  - free positioning
  - 8-point resize handles
  - dynamic minimum size constraints
  - auto-grow on tile add
  - container deletion flow

## Implemented

### 1) Container Creation Flow (T4.1)
- `src/containers/AppShell.tsx`
  - added `+ Container` toolbar button
  - creates container centered in current board viewport
  - opens immediate name editing state for new container

### 2) Container Positioning (T4.2)
- `src/hooks/useContainerDrag.ts`
  - pointer-based header dragging
  - updates `x/y` in store
- `src/components/Container/Container.tsx`
  - integrates drag hook on header pointer down

### 3) Resize Handles (T4.3)
- `src/components/Container/ResizeHandles.tsx`
  - 8 handle directions (`n, ne, e, se, s, sw, w, nw`)
- `src/components/Container/Container.module.css`
  - handle positioning and cursor styles

### 4) Minimum Size Constraint (T4.4)
- `src/utils/containerSizing.ts`
  - computes dynamic minimum width/height for split Staff/Newcomer sections
- `src/hooks/useContainerResize.ts`
  - clamps live resize values to computed minimum bounds

### 5) Auto-Grow on Tile Add (T4.5)
- `src/store/boardSlice.ts`
  - `moveTile` now checks target container required minimum size after move
  - expands container dimensions automatically when needed

### 6) Container Deletion (T4.6)
- `src/components/Container/ContainerHeader.tsx`
  - added delete action button in header
- `src/components/Container/Container.tsx`
  - confirmation prompt before delete
- `src/store/boardSlice.ts`
  - existing delete behavior returns staff/newcomer tiles to their default banks

## Supporting Updates
- `src/components/Container/Container.tsx`
  - absolute positioning + explicit width/height + z-index
  - name editing integration
- `src/containers/AppShell.css`
  - board toolbar + scrollable viewport + relative canvas
- `src/store/types.ts`
  - `createContainer` supports optional payload (`name`, `x`, `y`, `width`, `height`)
- `src/store/selectors.ts`
  - container min-size selector now uses `calculateContainerMinSize`

## Validation
- `npm run lint` passes
- `npm run build` passes
