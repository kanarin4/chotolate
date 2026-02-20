# Phase 6 Board Features

Date: 2026-02-19

## Scope
- Add board pan/scroll behavior.
- Add search/find highlighting across tiles.
- Build toolbar with search, mode toggle, and create actions.
- Add setup/command mode switching.
- Add debounced auto-save persistence with load recovery.

## Implemented

### 1) Board Pan + Scroll
- Added dedicated board surface component:
  - `src/components/Board/Board.tsx`
  - `src/components/Board/Board.module.css`
- Existing scroll behavior remains available via viewport scrollbars.
- Added pointer-based board panning with middle mouse drag.
- Board canvas stays absolute-positioned for container placement.
- Removed board mini-map overlay from active UI per latest direction.
- Mini-map/navigation preview is now tracked as future work.

### 1.1) Board Zoom
- Added toolbar zoom controls for:
  - zoom out
  - zoom in
  - reset to 100%
- Board now renders through a scaled canvas layer while preserving viewport scroll/pan.
- Zoom transitions keep the current viewport center anchored to reduce disorientation.
- Container drag/resize pointer deltas are normalized by zoom level so movement/resizing stays accurate at all zoom levels.
- Files:
  - `src/components/Toolbar/ZoomControls.tsx`
  - `src/components/Toolbar/Toolbar.tsx`
  - `src/components/Board/Board.tsx`
  - `src/hooks/useContainerDrag.ts`
  - `src/hooks/useContainerResize.ts`
  - `src/containers/AppShell.tsx`

### 2) Search / Find Highlighting
- Added search hook:
  - `src/hooks/useSearch.ts`
- Reused existing selector:
  - `selectSearchMatches` from `src/store/selectors.ts`
- Tile rendering now reacts to search state:
  - matches are highlighted
  - non-matches are dimmed
  - files:
    - `src/components/Tile/Tile.tsx`
    - `src/components/Tile/Tile.module.css`

### 3) Toolbar Assembly
- Added toolbar component family:
  - `src/components/Toolbar/Toolbar.tsx`
  - `src/components/Toolbar/SearchBar.tsx`
  - `src/components/Toolbar/ModeToggle.tsx`
  - `src/components/Toolbar/CreateButtons.tsx`
  - `src/components/Toolbar/Toolbar.module.css`
- `AppShell` now uses the composed toolbar rather than inline buttons.

### 4) Setup / Command Mode Switching
- Mode toggle wired to Zustand `mode` state:
  - `setMode` in `src/store/uiSlice.ts`
- Toolbar create actions are only visible in setup mode.
- Mode is persisted to localStorage and restored on reload:
  - `loadPersistedMode`, `savePersistedMode` in `src/utils/storage.ts`
  - hydration/writes wired in `src/store/index.ts`

### 5) Debounced Auto-Save + Load Recovery
- Added debounced auto-save hook:
  - `src/hooks/useAutoSave.ts`
  - wired in `src/App.tsx`
- Removed immediate board write-on-every-store-update behavior.
- Kept hydration + normalization recovery path in storage load:
  - missing banks repaired
  - invalid zones remapped safely
  - file: `src/utils/storage.ts`

## Validation
- `npm run lint` passes
- `npm run build` passes
