# Phase 5 Tile Features

Date: 2026-02-19

## Scope
- Implement tile creation flows for Staff and Newcomers.
- Add tile info modal for editing name/notes/fatigue.
- Support tile deletion with timed undo.
- Support inline tile name editing.
- Persist board state so fatigue changes survive refresh.

## Implemented

### 1) Tile Creation Flow (T5.1, T5.2)
- `src/containers/AppShell.tsx`
  - added toolbar actions:
    - `+ Staff`
    - `+ Newcomer`
  - both open `TileInfoModal` in create mode.
- `src/components/Modal/TileInfoModal.tsx`
  - create mode supports:
    - required name
    - optional notes
    - fixed tile type
    - default fatigue (green)
- `src/store/boardSlice.ts`
  - existing `createTile` action reused for creation and bank placement.

### 2) Tile Info Modal (T5.3)
- Added modal layer:
  - `src/components/Modal/TileInfoModal.tsx`
  - `src/components/Modal/Modal.module.css`
- Edit mode supports:
  - name updates
  - notes updates
  - fatigue state selection
  - current zone display
  - created timestamp display
  - delete action entry point
- Modal state now supports both edit and create use-cases:
  - `src/types/ui.ts` (`tile_info`, `tile_create`)

### 3) Fatigue + Persistence (T5.4)
- `src/utils/storage.ts`
  - added localStorage load/save utilities for persisted board state.
- `src/store/index.ts`
  - hydrate store from persisted board state at boot.
  - save board slice changes back to localStorage on board mutations.
- `src/utils/constants.ts`
  - retained storage constants and integrated with persistence utility.

### 4) Tile Delete with Undo Window (T5.5)
- `src/containers/AppShell.tsx`
  - tile delete path now pushes undo snapshot before deletion.
  - delete confirm prompt now indicates 10-second undo window.
- `src/hooks/useUndo.ts`
  - added undo manager hook:
    - expiry pruning
    - countdown timing
    - restore dispatch
- `src/components/common/UndoSnackbar.tsx`
  - added undo snackbar UI with:
    - undo button
    - live countdown
    - dismiss action
- `src/components/common/common.module.css`
  - snackbar styling.
- `src/store/boardSlice.ts`
  - added `restoreTile` action for undo restoration.
- `src/types/ui.ts`
  - added typed `tile_delete` undo snapshot shape.

### 5) Inline Tile Name Editing (T5.6)
- `src/components/Tile/Tile.tsx`
  - double-click on tile name enters inline edit mode.
  - `Enter` commits, `Escape` cancels, `blur` commits.
  - tile drag is disabled while editing to prevent interaction conflicts.
- `src/components/Tile/Tile.module.css`
  - added inline name input styling.
- `src/components/Bank/*.tsx`, `src/components/Container/ContainerGrid.tsx`, `src/components/Container/Container.tsx`
  - threaded tile callbacks for:
    - info modal open
    - inline name commit

## Validation
- `npm run lint` passes
- `npm run build` passes
