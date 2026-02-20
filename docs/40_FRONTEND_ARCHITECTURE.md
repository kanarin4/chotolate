# Chotolate — Frontend Architecture

## 1. Overview

Chotolate is a **single-page web application** optimized for desktop use. This document specifies the technology stack, component architecture, project structure, and technical decisions.

---

## 2. Technology Stack

### 2.1 Core Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | React 18+ | Component model, ecosystem, performance |
| **Language** | TypeScript | Type safety, IDE support, refactoring confidence |
| **Build Tool** | Vite | Fast dev server, HMR, optimized production builds |
| **Styling** | Vanilla CSS + CSS Modules | Full control, no utility class bloat, scoped styles |
| **State Management** | Zustand | Lightweight, TypeScript-native, no boilerplate |
| **Drag Library** | @dnd-kit/core | Accessible, performant, highly customizable |
| **ID Generation** | uuid (v4) | Standard UUID generation |

### 2.2 Why These Choices

**React** — The dominant component framework with the richest ecosystem for drag-and-drop, spatial layouts, and complex UI state. Chotolate's component-heavy, state-driven nature maps naturally to React's model.

**Zustand** — Chosen over Redux for its minimal boilerplate and natural TypeScript integration. Chotolate's state model is complex but not deeply nested — Zustand's flat store with slices is ideal.

**@dnd-kit** — Chosen over react-beautiful-dnd (deprecated) and react-dnd (complex API). @dnd-kit offers:
- Sensor-based drag detection (mouse, touch, keyboard)
- Custom collision detection algorithms
- Performant rendering (minimal re-renders during drag)
- Accessibility built in (keyboard drag support)
- Support for custom drag overlays

**Vite** — Fastest available dev server with instant HMR. No config needed for TypeScript + React.

**Vanilla CSS + CSS Modules** — Maximum control over layout and styling. CSS Modules provide scoped class names without runtime overhead. No dependency on utility-first frameworks.

---

## 3. Project Structure

```
chotolate/
├── docs/                      # Project documentation (this system)
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── main.tsx               # Application entry point
│   ├── App.tsx                # Root component, mode routing
│   ├── components/
│   │   ├── Board/
│   │   │   ├── Board.tsx          # Board canvas with pan/scroll
│   │   │   ├── Board.module.css
│   │   │   ├── BoardCanvas.tsx    # Canvas layer for containers
│   │   │   └── BoardCanvas.module.css
│   │   ├── Container/
│   │   │   ├── Container.tsx      # Position container component
│   │   │   ├── Container.module.css
│   │   │   ├── ContainerHeader.tsx
│   │   │   ├── ContainerGrid.tsx  # Internal tile grid layout
│   │   │   └── ResizeHandles.tsx  # 8-point resize controls
│   │   ├── Tile/
│   │   │   ├── Tile.tsx           # Draggable tile component
│   │   │   ├── Tile.module.css
│   │   │   ├── TileDragOverlay.tsx # Drag preview
│   │   │   ├── FatigueIndicator.tsx
│   │   │   └── TileInfoButton.tsx
│   │   ├── Bank/
│   │   │   ├── StaffBank.tsx
│   │   │   ├── NewcomerBank.tsx
│   │   │   ├── CompletedBank.tsx
│   │   │   ├── BankContainer.tsx  # Shared bank container logic
│   │   │   └── Bank.module.css
│   │   ├── Toolbar/
│   │   │   ├── Toolbar.tsx
│   │   │   ├── Toolbar.module.css
│   │   │   ├── SearchBar.tsx
│   │   │   ├── ModeToggle.tsx
│   │   │   └── CreateButtons.tsx
│   │   ├── Modal/
│   │   │   ├── TileInfoModal.tsx
│   │   │   ├── ContainerEditModal.tsx
│   │   │   ├── DeleteConfirmModal.tsx
│   │   │   └── Modal.module.css
│   │   └── common/
│   │       ├── CountBadge.tsx
│   │       ├── UndoSnackbar.tsx
│   │       └── common.module.css
│   ├── store/
│   │   ├── index.ts              # Combined store export
│   │   ├── boardSlice.ts         # Board state + actions
│   │   ├── uiSlice.ts            # UI state + actions
│   │   └── selectors.ts          # Memoized derived state
│   ├── hooks/
│   │   ├── useDragAndDrop.ts     # DnD kit integration hook
│   │   ├── useContainerResize.ts # Resize logic with constraints
│   │   ├── useAutoSave.ts        # Debounced persistence
│   │   ├── useSearch.ts          # Search highlighting logic
│   │   ├── useContainerLayout.ts # Grid layout calculation
│   │   └── useUndo.ts            # Undo stack management
│   ├── utils/
│   │   ├── layout.ts             # Grid layout algorithm
│   │   ├── collision.ts          # Spatial collision detection
│   │   ├── storage.ts            # LocalStorage operations
│   │   ├── validation.ts         # Data integrity checks
│   │   └── constants.ts          # System constants
│   ├── types/
│   │   ├── board.ts              # Board, Container, Bank types
│   │   ├── tile.ts               # Tile, TileType, FatigueState
│   │   ├── ui.ts                 # UIState, DragState, ModalState
│   │   └── index.ts              # Re-exports
│   └── styles/
│       ├── reset.css             # CSS reset / normalize
│       ├── variables.css         # CSS custom properties (design tokens)
│       └── global.css            # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 4. Component Architecture

### 4.1 Component Tree

```
App
├── Toolbar
│   ├── SearchBar
│   ├── ModeToggle
│   └── CreateButtons
├── MainLayout
│   ├── StaffBank
│   │   └── Tile[] (staff, unassigned)
│   ├── Board
│   │   └── BoardCanvas
│   │       └── Container[] (user-created)
│   │           ├── ContainerHeader
│   │           ├── ContainerGrid
│   │           │   └── Tile[] (assigned)
│   │           └── ResizeHandles
│   └── NewcomerBank
│       └── Tile[] (newcomer, unassigned)
├── CompletedBank
│   └── Tile[] (newcomer, completed)
├── TileDragOverlay (portal, rendered during drag)
├── ModalLayer (portal)
│   ├── TileInfoModal
│   ├── ContainerEditModal
│   └── DeleteConfirmModal
└── UndoSnackbar
```

### 4.2 Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| `App` | Root layout, DnD context provider, state provider |
| `Toolbar` | Controls above the board |
| `Board` | Scrollable/pannable canvas container |
| `BoardCanvas` | Positions containers in absolute layout |
| `Container` | Renders a position zone with header + grid |
| `ContainerGrid` | Lays out tiles in a wrapped grid |
| `Tile` | Draggable tile with fatigue dot and info button |
| `TileDragOverlay` | Floating preview during drag (rendered in portal) |
| `StaffBank` / `NewcomerBank` / `CompletedBank` | Fixed bank regions |
| `SearchBar` | Text input that drives search highlighting |
| `CountBadge` | Displays tile count on zones |

---

## 5. Drag-and-Drop Integration

### 5.1 @dnd-kit Setup

```
DndContext (App level)
├── Sensors: PointerSensor, TouchSensor, KeyboardSensor
├── CollisionDetection: custom (cursor-point based)
├── DragOverlay: TileDragOverlay component
├── Droppable zones: each Container + each Bank
└── Draggable items: each Tile
```

### 5.2 Custom Collision Detection

@dnd-kit's default collision detection uses bounding box intersection. Chotolate requires **cursor-point collision** (the zone under the cursor, not the tile bounds).

Custom collision strategy:

```typescript
function cursorCollision(args: CollisionDetectionArgs): Collision[] {
  const { pointerCoordinates, droppableContainers } = args;
  if (!pointerCoordinates) return [];

  return droppableContainers
    .filter(container => {
      const rect = container.rect.current;
      return (
        pointerCoordinates.x >= rect.left &&
        pointerCoordinates.x <= rect.right &&
        pointerCoordinates.y >= rect.top &&
        pointerCoordinates.y <= rect.bottom
      );
    })
    .sort((a, b) => (b.data.current?.zIndex ?? 0) - (a.data.current?.zIndex ?? 0))
    .slice(0, 1)
    .map(container => ({
      id: container.id,
      data: { droppableContainer: container },
    }));
}
```

### 5.3 Drop Validation

On drop, the system validates:

1. Is the target zone a valid destination for this tile type?
2. If invalid → tile returns to origin zone (no state change)
3. If valid → `MOVE_TILE` action dispatched

---

## 6. Spatial Collision Detection

### 6.1 Container Bounds Checking

For container resize and positioning, the system detects:

- **Edge proximity** for auto-scroll during drag
- **Container overlap** for warning indicators
- **Cursor-in-container** for drop target highlighting

### 6.2 Algorithm

```
Given containers sorted by z-index (descending):
For each container:
    If cursor point (x, y) is within container rect:
        Return container as active drop target
        Break (first match = highest z-index)
```

This runs on every `pointermove` event during drag, debounced to 16ms (one frame).

---

## 7. Container Layout Algorithm

### 7.1 Grid Calculation

```typescript
function calculateLayout(
  containerWidth: number,
  tileCount: number,
  constants: LayoutConstants
): GridLayout {
  const contentWidth = containerWidth - 2 * constants.GRID_GAP;
  const columns = Math.max(1,
    Math.floor((contentWidth + constants.GRID_GAP) /
    (constants.TILE_WIDTH + constants.GRID_GAP))
  );
  const rows = Math.ceil(tileCount / columns);

  return {
    columns,
    rows,
    positions: Array.from({ length: tileCount }, (_, i) => ({
      col: i % columns,
      row: Math.floor(i / columns),
      x: constants.GRID_GAP + (i % columns) * (constants.TILE_WIDTH + constants.GRID_GAP),
      y: constants.CONTAINER_HEADER_HEIGHT + constants.GRID_GAP +
         Math.floor(i / columns) * (constants.TILE_HEIGHT + constants.GRID_GAP),
    })),
  };
}
```

### 7.2 Minimum Size Calculation

```typescript
function calculateMinSize(
  tileCount: number,
  columns: number,
  constants: LayoutConstants
): { minWidth: number; minHeight: number } {
  const rows = Math.ceil(tileCount / Math.max(1, columns));

  return {
    minWidth: Math.max(
      constants.CONTAINER_MIN_WIDTH,
      columns * constants.TILE_WIDTH + (columns + 1) * constants.GRID_GAP
    ),
    minHeight: Math.max(
      constants.CONTAINER_MIN_HEIGHT,
      constants.CONTAINER_HEADER_HEIGHT +
      rows * constants.TILE_HEIGHT + (rows + 1) * constants.GRID_GAP
    ),
  };
}
```

---

## 8. Performance Strategy

### 8.1 Rendering Optimization

| Technique | Application |
|-----------|------------|
| **React.memo** | All Tile and Container components |
| **useMemo** | Grid layout calculations |
| **Virtual scrolling** | Banks with 50+ tiles (future) |
| **requestAnimationFrame** | Drag position updates |
| **CSS transforms** | Tile drag movement (GPU-accelerated) |
| **Portal rendering** | Drag overlay rendered outside component tree |

### 8.2 State Update Optimization

| Scenario | Strategy |
|----------|----------|
| Drag movement (60 FPS) | Update only `dragState.currentPosition`, no tile re-renders |
| Hover detection | Debounced to 16ms, only update on zone change |
| Tile drop | Single batch update: move tile + recalculate layouts |
| Search typing | Debounced to 150ms |

### 8.3 Scalability Targets

| Metric | Target | Method |
|--------|--------|--------|
| 50 containers | < 16ms render | Memoization |
| 200 tiles | < 16ms render | Normalized state + memo |
| 60 FPS drag | Consistent | RAF + CSS transforms |
| Board load | < 200ms | LocalStorage JSON parse |

---

## 9. Optional Real-Time Sync (Future)

### 9.1 Architecture

```
Client A ←→ WebSocket ←→ Server ←→ WebSocket ←→ Client B
                           ↕
                        Database
```

### 9.2 Sync Protocol

When implemented:

- All actions are serialized and sent to the server
- Server applies actions to authoritative state
- Server broadcasts actions to all connected clients
- Clients apply remote actions to local state
- Conflict resolution: **last-write-wins** at the action level

### 9.3 Technologies (Planned)

| Layer | Technology |
|-------|-----------|
| Server | Node.js + Express |
| WebSocket | Socket.IO |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Session-based (simple) |

This is **post-MVP** and documented for architectural awareness only.
