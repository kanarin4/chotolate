# Chotolate — Task Breakdown

## 1. Overview

All tasks are **executable units of work**. Each task has a clear input, output, and acceptance criteria. Tasks are ordered by dependency — a task can only start when its prerequisites are complete.

---

## 2. Phase 1 — Foundation

### T1.1 — Project Scaffold

- **Action**: Initialize Vite + React + TypeScript project
- **Command**: `npx -y create-vite@latest ./ --template react-ts`
- **Output**: Running dev server with default React page
- **Acceptance**: `npm run dev` serves page at localhost

### T1.2 — Install Core Dependencies

- **Action**: Install runtime and dev dependencies
- **Packages**: `zustand`, `@dnd-kit/core`, `@dnd-kit/utilities`, `uuid`
- **Dev Packages**: `@types/uuid`
- **Output**: All packages installed, no version conflicts

### T1.3 — Define Type System

- **Action**: Create TypeScript interfaces and enums
- **Files**: `src/types/board.ts`, `src/types/tile.ts`, `src/types/ui.ts`, `src/types/index.ts`
- **Output**: All entity types, enums, and derived types defined
- **Acceptance**: Types compile with no errors

### T1.4 — Design Token System

- **Action**: Create CSS custom properties for colors, spacing, sizes, typography
- **Files**: `src/styles/reset.css`, `src/styles/variables.css`, `src/styles/global.css`
- **Output**: Complete design token layer
- **Acceptance**: Variables importable in any CSS module

### T1.5 — State Store Setup

- **Action**: Create Zustand store with board and UI slices
- **Files**: `src/store/boardSlice.ts`, `src/store/uiSlice.ts`, `src/store/selectors.ts`, `src/store/index.ts`
- **Output**: Store with initial state, all CRUD actions, memoized selectors
- **Acceptance**: Actions callable in isolation, state updates correctly
- **Depends on**: T1.3

### T1.6 — Layout Constants

- **Action**: Define system constants (tile size, gap, min container size, etc.)
- **File**: `src/utils/constants.ts`
- **Output**: Exported constants used by layout and components
- **Acceptance**: Constants referenced by type system and layout engine

---

## 3. Phase 2 — Core Components

### T2.1 — Tile Component (Static)

- **Action**: Build the Tile component with name, fatigue dot, type indicator, info button
- **Files**: `src/components/Tile/Tile.tsx`, `src/components/Tile/Tile.module.css`
- **Output**: Rendered tile with all visual elements, no drag
- **Acceptance**: Tile renders with mock data, visual matches spec
- **Depends on**: T1.3, T1.4

### T2.2 — Fatigue Indicator Component

- **Action**: Build the clickable fatigue color dot with accessibility shapes
- **File**: `src/components/Tile/FatigueIndicator.tsx`
- **Output**: Colored dot that cycles on click (green → yellow → red → green)
- **Acceptance**: Click cycles state, color and shape match spec
- **Depends on**: T1.5

### T2.3 — Grid Layout Engine

- **Action**: Implement the pure function that calculates tile positions inside a container
- **Files**: `src/utils/layout.ts`, `src/hooks/useContainerLayout.ts`
- **Output**: Function takes (containerWidth, tileCount, constants) → grid positions
- **Acceptance**: Unit tests pass for various input combinations
- **Depends on**: T1.6

### T2.4 — Container Component (Static)

- **Action**: Build the Container component with header, grid, resize outline
- **Files**: `src/components/Container/Container.tsx`, `src/components/Container/Container.module.css`, `src/components/Container/ContainerHeader.tsx`, `src/components/Container/ContainerGrid.tsx`
- **Output**: Rendered container with mock tiles in grid layout
- **Acceptance**: Container renders with correct internal layout
- **Depends on**: T2.1, T2.3

### T2.5 — Bank Components (Static)

- **Action**: Build StaffBank, NewcomerBank, CompletedBank with shared BankContainer
- **Files**: `src/components/Bank/StaffBank.tsx`, `src/components/Bank/NewcomerBank.tsx`, `src/components/Bank/CompletedBank.tsx`, `src/components/Bank/BankContainer.tsx`, `src/components/Bank/Bank.module.css`
- **Output**: Rendered banks with mock tiles, correct scroll behavior
- **Acceptance**: Banks display tiles with scroll, count badge visible
- **Depends on**: T2.1

### T2.6 — Count Badge Component

- **Action**: Build count badge for containers and banks
- **File**: `src/components/common/CountBadge.tsx`
- **Output**: Pill-shaped badge showing number
- **Acceptance**: Badge renders with correct count

---

## 4. Phase 3 — Drag System

### T3.1 — DnD Context Setup

- **Action**: Integrate @dnd-kit DndContext at App level with sensors
- **File**: `src/App.tsx` modification
- **Output**: DnD system initialized with pointer and touch sensors
- **Acceptance**: No errors, sensors active
- **Depends on**: T1.2

### T3.2 — Make Tiles Draggable

- **Action**: Wrap Tile with @dnd-kit `useDraggable`
- **File**: `src/components/Tile/Tile.tsx` modification
- **Output**: Tiles initiate drag on pointer down
- **Acceptance**: Drag preview appears on mousedown+move
- **Depends on**: T3.1, T2.1

### T3.3 — Make Zones Droppable

- **Action**: Wrap Container and Bank components with @dnd-kit `useDroppable`
- **Files**: Modify Container.tsx, BankContainer.tsx
- **Output**: Zones register as drop targets
- **Acceptance**: DnD system recognizes drop zones
- **Depends on**: T3.1, T2.4, T2.5

### T3.4 — Drag Overlay

- **Action**: Build TileDragOverlay that follows cursor during drag
- **File**: `src/components/Tile/TileDragOverlay.tsx`
- **Output**: Semi-transparent tile follows cursor, original shows ghost
- **Acceptance**: Preview visually matches spec (80% opacity, 1.05× scale, shadow)
- **Depends on**: T3.2

### T3.5 — Custom Collision Detection

- **Action**: Implement cursor-point collision strategy
- **File**: `src/utils/collision.ts`
- **Output**: Custom collision function for @dnd-kit
- **Acceptance**: Collision correctly identifies zone under cursor point
- **Depends on**: T3.3

### T3.6 — Drop Handling with Validation

- **Action**: Implement onDragEnd handler — validate target, move tile, or return
- **File**: `src/hooks/useDragAndDrop.ts`
- **Output**: Tiles snap into valid zones, return to origin on invalid drop
- **Acceptance**: Staff can't drop in Newcomer Bank, newcomers can reach Completed Bank
- **Depends on**: T3.5, T1.5

### T3.7 — Container Hover Highlighting

- **Action**: Highlight the active drop target during drag
- **Files**: Container.tsx modification, Container.module.css
- **Output**: Container border/background changes when cursor enters bounds during drag
- **Acceptance**: One container highlighted at a time, clears on cursor exit
- **Depends on**: T3.5

---

## 5. Phase 4 — Container Interaction

### T4.1 — Container Creation Flow

- **Action**: Implement + Container button → new container at viewport center → name edit
- **Files**: Toolbar `CreateButtons.tsx`, store actions
- **Output**: Clicking + creates a container, name field focuses for input
- **Acceptance**: Container appears, is named, enters idle state
- **Depends on**: T2.4, T1.5

### T4.2 — Container Positioning

- **Action**: Make container headers draggable for repositioning
- **Files**: ContainerHeader.tsx modification
- **Output**: Dragging header moves entire container on canvas
- **Acceptance**: Container follows cursor, position persists in state
- **Depends on**: T4.1

### T4.3 — Resize Handles

- **Action**: Build 8-point resize handles component
- **File**: `src/components/Container/ResizeHandles.tsx`
- **Output**: Handles appear on hover, dragging resizes container
- **Acceptance**: All 8 directions work, cursor changes to appropriate resize cursor
- **Depends on**: T4.1

### T4.4 — Minimum Size Constraint

- **Action**: Implement resize constraint based on tile count
- **File**: `src/hooks/useContainerResize.ts`
- **Output**: Container cannot shrink below minimum for current tiles
- **Acceptance**: Resize handle stops at minimum, visual feedback on constraint
- **Depends on**: T4.3, T2.3

### T4.5 — Auto-Grow on Tile Add

- **Action**: Container expands when a new tile exceeds current bounds
- **File**: Store action modification
- **Output**: Dropping tile auto-grows container height if needed
- **Acceptance**: No tile clipping after drop
- **Depends on**: T4.4, T3.6

### T4.6 — Container Deletion

- **Action**: Delete container via context menu → confirm → return tiles to banks
- **Files**: Container modification, DeleteConfirmModal.tsx
- **Output**: Container removed, tiles distributed to appropriate banks
- **Acceptance**: No orphaned tiles after deletion
- **Depends on**: T4.1, T1.5

---

## 6. Phase 5 — Tile Features

### T5.1 — Tile Creation Flow (Staff)

- **Action**: + Staff button → form → create tile in Staff Bank
- **Files**: CreateButtons.tsx, TileInfoModal.tsx (creation mode)
- **Output**: Staff tile appears in Staff Bank with name
- **Acceptance**: Tile created with correct type, default fatigue
- **Depends on**: T2.1, T2.5, T1.5

### T5.2 — Tile Creation Flow (Newcomer)

- **Action**: + Newcomer button → form → create tile in Newcomer Bank
- **Output**: Newcomer tile appears in Newcomer Bank with name
- **Acceptance**: Tile created with correct type, dashed border
- **Depends on**: T5.1

### T5.3 — Tile Info Modal

- **Action**: Build info modal with name, notes, fatigue, delete
- **Files**: `src/components/Modal/TileInfoModal.tsx`, `src/components/Modal/Modal.module.css`
- **Output**: Modal opens on ℹ click, edits save to state
- **Acceptance**: All fields editable, save persists changes
- **Depends on**: T2.1, T1.5

### T5.4 — Fatigue Toggle Integration

- **Action**: Wire fatigue click to cycle state in store
- **Output**: Clicking fatigue dot on tile cycles green → yellow → red
- **Acceptance**: Color changes immediately, persists across refresh
- **Depends on**: T2.2, T1.5

### T5.5 — Tile Deletion with Undo

- **Action**: Delete from info modal → snackbar with undo (10 seconds)
- **Files**: TileInfoModal modification, UndoSnackbar.tsx, `src/hooks/useUndo.ts`
- **Output**: Tile removed, snackbar offers undo
- **Acceptance**: Undo restores tile to original zone within time window
- **Depends on**: T5.3

### T5.6 — Tile Inline Name Editing

- **Action**: Double-click tile name → inline text input → save on Enter/blur
- **File**: Tile.tsx modification
- **Output**: Name editable inline on the tile surface
- **Acceptance**: Name updates in state, UI reflects change
- **Depends on**: T2.1, T1.5

---

## 7. Phase 6 — Board Features

### T6.1 — Board Canvas Pan and Scroll

- **Action**: Build scrollable/pannable board canvas
- **Files**: `src/components/Board/Board.tsx`, `src/components/Board/Board.module.css`
- **Output**: Canvas scrolls in both directions, containers positioned absolutely
- **Acceptance**: Large boards with many containers navigable
- **Depends on**: T2.4

### T6.2 — Search Highlighting

- **Action**: Search bar input → highlight matching tiles, dim others
- **Files**: `src/components/Toolbar/SearchBar.tsx`, `src/hooks/useSearch.ts`
- **Output**: Matching tiles glow, non-matches dim
- **Acceptance**: Partial, case-insensitive match works across all zones
- **Depends on**: T2.1, T1.5

### T6.3 — Toolbar Assembly

- **Action**: Assemble toolbar with search, mode toggle, create buttons
- **Files**: `src/components/Toolbar/Toolbar.tsx`, `src/components/Toolbar/Toolbar.module.css`
- **Output**: Complete toolbar matching layout spec
- **Acceptance**: All toolbar elements functional
- **Depends on**: T6.2, T5.1, T4.1

### T6.4 — Mode Toggle

- **Action**: Build setup ↔ command mode switch
- **File**: `src/components/Toolbar/ModeToggle.tsx`
- **Output**: Toggle switches mode, adjusts UI affordances
- **Acceptance**: Mode state persists, creation tools visible only in setup
- **Depends on**: T1.5

### T6.5 — Auto-Save Persistence

- **Action**: Debounced auto-save to LocalStorage after every mutation
- **File**: `src/hooks/useAutoSave.ts`, `src/utils/storage.ts`
- **Output**: Board state survives page refresh
- **Acceptance**: Modify board → refresh page → state restored
- **Depends on**: T1.5

### T6.6 — Data Validation on Load

- **Action**: Validate and repair loaded data (orphan recovery, integrity checks)
- **File**: `src/utils/validation.ts`
- **Output**: Invalid data automatically repaired on load
- **Acceptance**: Corrupted test data recovers without crash
- **Depends on**: T6.5

---

## 8. Phase 7 — Polish

### T7.1 — Snap Animation

- **Action**: Smooth 200ms ease-out animation when tile snaps into grid position
- **Output**: Tiles animate to position instead of teleporting
- **Acceptance**: Animation feels natural, no jank

### T7.2 — Return Animation

- **Action**: Smooth 250ms animation when tile returns to origin on invalid drop
- **Output**: Tile smoothly returns to origin position
- **Acceptance**: Animation feels natural, origin ghost fills in

### T7.3 — Container Overlap Warning

- **Action**: Amber border on overlapping containers
- **Output**: Containers visually warn when overlapping
- **Acceptance**: Warning appears/disappears as containers move

### T7.4 — Auto-Scroll During Drag

- **Action**: Canvas scrolls when tile dragged near edges
- **Output**: Board scrolls proportionally when drag approaches canvas edge
- **Acceptance**: Smooth scroll, tile stays with cursor

### T7.5 — Performance Optimization

- **Action**: Profile with 200 tiles, optimize render path
- **Output**: 60 FPS drag maintained with 200 tiles
- **Acceptance**: No frame drops during drag at target tile count

### T7.6 — Responsive Bank Collapsing

- **Action**: Banks collapse to drawers on viewports < 1024px
- **Output**: Side banks become slide-out drawers on narrow screens
- **Acceptance**: Banks accessible and functional in collapsed mode
