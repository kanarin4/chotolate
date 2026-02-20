# Phase 3 Drag System

Date: 2026-02-19

## Scope
- Implement full Phase 3 drag foundation:
  - DnD context wiring
  - draggable tiles
  - droppable zones
  - drag overlay
  - custom collision detection
  - drop validation and fallback behavior
  - drop-target highlighting

## Implemented

### 1) DnD Context + Sensors
- `src/App.tsx`
  - wired `DndContext` to `useDragAndDrop`
  - configured pointer and touch sensors
  - added custom `collisionDetection={cursorCollision}`
  - mounted `DragOverlay` with `TileDragOverlay`

### 2) Draggable Tiles
- `src/components/Tile/Tile.tsx`
  - integrated `useDraggable`
  - tile carries drag data (`tileId`, `tileType`, `currentZoneId`)
  - added drag source visual state class
- `src/components/Tile/Tile.module.css`
  - added draggable and dragging-source styles

### 3) Droppable Zones
- `src/components/Container/Container.tsx`
  - integrated `useDroppable` for each container
  - passes priority based on container z-index
- `src/components/Bank/BankContainer.tsx`
  - integrated `useDroppable` for bank zones
  - supports `canAcceptDrop` gating

### 4) Drag Overlay
- `src/components/Tile/TileDragOverlay.tsx`
  - renders active tile preview during drag
- `src/components/Tile/Tile.module.css`
  - added overlay style (`opacity`, `scale`, `shadow`)

### 5) Cursor Collision
- `src/utils/collision.ts`
  - pointer-in-rect collision using cursor coordinates
  - prioritizes collisions via droppable `priority`

### 6) Drop Handling + Validation
- `src/hooks/useDragAndDrop.ts`
  - validates target by tile type and zone type
  - valid container/bank target -> `moveTile`
  - invalid/outside target -> return to default bank (`staff` -> Staff Bank, `newcomer` -> Newcomer Bank)
  - updates drag hover state during `onDragOver`

### 7) Drop-Target Highlighting
- `src/components/Container/Container.module.css`
  - added highlighted drop-target visual state
- `src/components/Bank/Bank.module.css`
  - added bank drop-target visual state
- bank highlights only when current dragged tile type is accepted

## Validation
- `npm run lint` passes
- `npm run build` passes
