# Chotolate Build Checklist

## Phase 1 — Foundation

- [x] T1.1 Project scaffold (Vite + React + TypeScript)
- [x] T1.2 Core dependencies (`zustand`, `@dnd-kit/core`, `@dnd-kit/utilities`)
- [x] T1.3 Type system (`src/types/board.ts`, `src/types/tile.ts`, `src/types/ui.ts`, `src/types/index.ts`)
- [x] T1.4 Design token system (`src/styles/reset.css`, `src/styles/variables.css`, `src/styles/global.css`)
- [x] T1.5 Zustand slices + selectors (`src/store/boardSlice.ts`, `src/store/uiSlice.ts`, `src/store/selectors.ts`, `src/store/index.ts`)
- [x] T1.6 Layout constants (`src/utils/constants.ts`)

## Phase 2 — Core Components

- [x] T2.1 Tile component (static)
- [x] T2.2 Fatigue indicator
- [x] T2.3 Grid layout engine (`src/utils/layout.ts`, `src/hooks/useContainerLayout.ts`)
- [x] T2.4 Container component (static)
- [x] T2.5 Bank components (static)
- [x] T2.6 Count badge component

## Verification

- [x] Lint passes (`npm run lint`)
- [x] Build passes (`npm run build`)

## Runtime Hotfixes

- [x] Fix React `getSnapshot` infinite-loop/maximum update-depth error in `AppShell`
- [x] Add broad debug logging for render, drag lifecycle, and store actions

## Future Tasklist

### Phase 3 — Drag System

- [x] T3.1 Finalize DnD context + sensors for production behavior
- [x] T3.2 Make tiles draggable with `useDraggable`
- [x] T3.3 Make banks/containers droppable with `useDroppable`
- [x] T3.4 Add tile drag overlay
- [x] T3.5 Implement cursor-point collision detection
- [x] T3.6 Implement drop validation + return-to-origin behavior
- [x] T3.7 Add active drop-target highlighting

### Phase 3 — Refinements

- [x] T3.5 refinement: return top-priority cursor collision target only
- [x] Remove visible Staff/Newcomer labels from tile UI
- [x] Split container body into Staff and Newcomer sections with type-based placement

### Phase 4 — Container Interaction

- [x] T4.1 Add container creation flow (`+ Container`)
- [x] T4.2 Enable container positioning (drag header)
- [x] T4.3 Add 8-point resize handles
- [x] T4.4 Enforce dynamic minimum size constraints
- [x] T4.5 Auto-grow container when tile add overflows bounds
- [x] T4.6 Add container deletion + tile recovery to banks
- [x] T4.7 Add container edit menu with section toggles (Staff/Newcomers on/off)

### Phase 5 — Tile Features

- [x] T5.1 Add staff tile creation flow
- [x] T5.2 Add newcomer tile creation flow
- [x] T5.3 Build tile info modal
- [x] T5.4 Wire fatigue toggle end-to-end with persistence
- [x] T5.5 Add tile deletion with undo window
- [x] T5.6 Add inline tile name editing

### Phase 6 — Board Features

- [x] Add board pan/scroll behavior
- [x] Add board zoom controls (zoom in/out/reset)
- [x] Add search/find highlighting flow
- [x] Build toolbar (search, mode toggle, create actions)
- [x] Add setup/command mode switching
- [x] Add auto-save persistence + load recovery

### Phase 7 — Polish

- [x] Add snap/return/highlight animations
- [x] Add container/bank count polish and empty states
- [ ] Reintroduce board mini-map overlay for navigation awareness (currently removed; optional viewport indicator)
- [x] Add responsive bank behavior for narrower screens
- [x] Handle edge cases and invalid data recovery UX
- [ ] Profile and optimize render/drag performance
