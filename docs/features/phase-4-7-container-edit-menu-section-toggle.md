# Phase 4.7 Container Edit Menu + Section Toggles

Date: 2026-02-19

## Scope
- Add container-level edit menu.
- Toggle Staff/Newcomer sections on or off per container.
- Make drop behavior respect section toggles.

## Implemented

### 1) Container Model Extension
- `src/types/board.ts`
  - `Container` now includes:
    - `acceptsStaff: boolean`
    - `acceptsNewcomers: boolean`
- defaults wired in `src/store/boardSlice.ts` for initial and created containers.

### 2) Edit Menu in Container Header
- `src/components/Container/ContainerHeader.tsx`
  - added `edit` menu button in header
  - added menu panel with checkboxes:
    - Staff section
    - Newcomers section
- `src/components/Container/Container.module.css`
  - added edit menu styles

### 3) Conditional Section Rendering
- `src/components/Container/ContainerGrid.tsx`
  - added `showStaffSection` and `showNewcomerSection` props
  - renders sections conditionally
  - shows fallback message if no sections are enabled

### 4) Toggle Behavior + Data Integrity
- `src/components/Container/Container.tsx`
  - toggles update container capability flags
  - prevents disabling both sections at once
  - when toggling off:
    - Staff off -> move all staff tiles in container to Staff Bank
    - Newcomers off -> move all newcomer tiles in container to Newcomer Bank

### 5) Drop Validation and Collision Behavior
- `src/hooks/useDragAndDrop.ts`
  - container target validity now checks section capability flags
- `src/store/boardSlice.ts`
  - `moveTile` also enforces container section capabilities
- `src/components/Container/Container.tsx`
  - container droppable is disabled when active tile type is not accepted
- `src/components/Bank/BankContainer.tsx`
  - bank droppable is disabled when current dragged type is not accepted

### 6) Min-Size Alignment
- `src/utils/containerSizing.ts`
  - sizing now accepts section visibility options
  - min height is computed from enabled sections only
- updated calls in:
  - `src/hooks/useContainerResize.ts`
  - `src/store/boardSlice.ts`
  - `src/store/selectors.ts`

## Validation
- `npm run lint` passes
- `npm run build` passes
