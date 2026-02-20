# Chotolate — State Management

## 1. Overview

Chotolate uses a **centralized, immutable state store** to manage all application data. The state model is the single source of truth for the board, containers, banks, tiles, and UI state. All mutations flow through defined actions, ensuring predictability and debuggability.

---

## 2. State Architecture

```
┌────────────────────────────────────────────────────┐
│                  Application State                  │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────┐  ┌──────────────┐               │
│  │  Board State  │  │   UI State   │               │
│  │  ────────────│  │  ────────────│               │
│  │  board       │  │  mode        │               │
│  │  containers  │  │  searchQuery │               │
│  │  banks       │  │  dragState   │               │
│  │  tiles       │  │  selectedId  │               │
│  └──────────────┘  │  modalState  │               │
│                    └──────────────┘               │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │              Derived State (computed)          │  │
│  │  ─────────────────────────────────────────── │  │
│  │  tilesByZone    containerMinSizes             │  │
│  │  tileCounts     searchMatches                 │  │
│  │  zoneLookup     isAnyTileDragging             │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

---

## 3. State Slices

### 3.1 Board State

Persistent data that is saved to storage.

```typescript
interface BoardState {
  board: Board;
  containers: Record<string, Container>;  // keyed by id
  banks: Record<string, Bank>;            // keyed by id
  tiles: Record<string, Tile>;            // keyed by id
}
```

**Normalization**: All entities are stored as **records keyed by ID** (normalized form), not arrays. This enables O(1) lookups and prevents duplication.

### 3.2 UI State

Ephemeral state that is **not persisted** across sessions.

```typescript
interface UIState {
  mode: "setup" | "command";
  searchQuery: string;
  dragState: DragState | null;
  selectedTileId: string | null;
  modalState: ModalState | null;
  undoStack: UndoEntry[];
}

interface DragState {
  tileId: string;
  originZoneId: string;
  currentPosition: { x: number; y: number };
  activeDropTargetId: string | null;
}

interface ModalState {
  type: "tile_info" | "container_edit" | "delete_confirm";
  entityId: string;
}

interface UndoEntry {
  type: "tile_delete" | "container_delete";
  timestamp: number;
  snapshot: any;  // Serialized entity state before deletion
}
```

---

## 4. Derived State

Computed values derived from board state. These are **memoized** and recalculated only when their dependencies change.

```typescript
// Tiles grouped by their current zone
type TilesByZone = Record<string, Tile[]>;

// Tile counts per zone
type TileCounts = Record<string, number>;

// Lookup: zoneId → zone entity (Container or Bank)
type ZoneLookup = Record<string, Container | Bank>;

// Minimum sizes for each container based on content
type ContainerMinSizes = Record<string, { minWidth: number; minHeight: number }>;

// Set of tile IDs matching the current search query
type SearchMatches = Set<string>;

// Is any tile currently being dragged?
type IsAnyTileDragging = boolean;
```

### 4.1 Memoization Strategy

| Derived Value | Dependencies | Recompute When |
|---------------|-------------|----------------|
| `tilesByZone` | `tiles` | Any tile's `currentZoneId` changes, tile added/removed |
| `tileCounts` | `tilesByZone` | `tilesByZone` changes |
| `containerMinSizes` | `tilesByZone`, layout constants | `tilesByZone` changes |
| `searchMatches` | `tiles`, `searchQuery` | Search query or tile names change |
| `isAnyTileDragging` | `dragState` | Drag starts or ends |

---

## 5. Actions

All state mutations are performed through **discrete, named actions**. Each action describes an intent, not a raw state mutation.

### 5.1 Board Actions

| Action | Payload | Effect |
|--------|---------|--------|
| `LOAD_BOARD` | `boardId: string` | Load board from storage |
| `UPDATE_BOARD_NAME` | `name: string` | Update board name |
| `SAVE_BOARD` | — | Persist current state to storage |

### 5.2 Container Actions

| Action | Payload | Effect |
|--------|---------|--------|
| `CREATE_CONTAINER` | `name: string` | Create container at viewport center |
| `UPDATE_CONTAINER` | `id, changes` | Update name, position, or size |
| `MOVE_CONTAINER` | `id, x, y` | Update container position |
| `RESIZE_CONTAINER` | `id, width, height` | Update size (with min constraint) |
| `DELETE_CONTAINER` | `id` | Remove container, return tiles to banks |
| `BRING_TO_FRONT` | `id` | Set z-index to max + 1 |

### 5.3 Tile Actions

| Action | Payload | Effect |
|--------|---------|--------|
| `CREATE_TILE` | `name, tileType, notes?` | Create tile in appropriate bank |
| `UPDATE_TILE` | `id, changes` | Update name, notes |
| `DELETE_TILE` | `id` | Remove tile from zone and store |
| `MOVE_TILE` | `id, targetZoneId` | Move tile to new zone |
| `CYCLE_FATIGUE` | `id` | Advance fatigue: green → yellow → red → green |
| `SET_FATIGUE` | `id, state` | Explicitly set fatigue state |

### 5.4 Drag Actions

| Action | Payload | Effect |
|--------|---------|--------|
| `DRAG_START` | `tileId` | Set drag state, record origin zone |
| `DRAG_MOVE` | `x, y` | Update drag position, evaluate hover target |
| `DRAG_HOVER` | `targetZoneId \| null` | Set or clear active drop target |
| `DRAG_DROP` | — | Evaluate drop, execute MOVE_TILE or return |
| `DRAG_CANCEL` | — | Return tile to origin, clear drag state |

### 5.5 UI Actions

| Action | Payload | Effect |
|--------|---------|--------|
| `SET_MODE` | `mode` | Switch setup ↔ command mode |
| `SET_SEARCH` | `query` | Update search query |
| `OPEN_MODAL` | `type, entityId` | Show modal dialog |
| `CLOSE_MODAL` | — | Dismiss modal |
| `PUSH_UNDO` | `entry` | Add undo entry to stack |
| `POP_UNDO` | — | Execute undo, remove from stack |

---

## 6. Action Flow

### 6.1 Drag-and-Drop Flow

```
User mousedown on tile
    → DRAG_START { tileId }
    → State: dragState = { tileId, originZoneId, ... }

User moves mouse
    → DRAG_MOVE { x, y }
    → State: dragState.currentPosition updates
    → Derived: evaluate which zone the cursor is over
    → DRAG_HOVER { targetZoneId } (if changed)
    → State: dragState.activeDropTargetId updates

User mouseup
    → DRAG_DROP
    → Evaluate:
        ├── activeDropTargetId exists AND valid for tile type?
        │   → MOVE_TILE { tileId, targetZoneId: activeDropTargetId }
        │   → State: tile.currentZoneId updates
        │   → Derived: tilesByZone, tileCounts, containerMinSizes recompute
        └── No valid target?
            → State: tile remains in originZoneId (no-op)
    → Clear dragState
    → SAVE_BOARD (debounced)
```

### 6.2 Tile Creation Flow

```
User clicks [+ Staff]
    → OPEN_MODAL { type: "tile_create", entityType: "staff" }
    → User fills form, clicks Save
    → CREATE_TILE { name, tileType: "staff", notes }
    → State: new Tile added to tiles, currentZoneId = staffBankId
    → Derived: tilesByZone, tileCounts update
    → CLOSE_MODAL
    → SAVE_BOARD (debounced)
```

---

## 7. Persistence Sync

### 7.1 Auto-Save

State is auto-saved to LocalStorage after any mutation, with **500ms debounce**:

```
Mutation occurs → start 500ms timer
    → If another mutation occurs before timer → reset timer
    → Timer expires → serialize BoardState → write to LocalStorage
```

### 7.2 Save Format

```json
{
  "version": 1,
  "savedAt": "2026-02-19T19:00:00Z",
  "board": { ... },
  "containers": { "uuid1": { ... }, "uuid2": { ... } },
  "banks": { "uuid3": { ... }, "uuid4": { ... }, "uuid5": { ... } },
  "tiles": { "uuid6": { ... }, "uuid7": { ... } }
}
```

### 7.3 Load and Recovery

On startup:

1. Read from LocalStorage
2. Parse JSON
3. Validate schema version
4. Validate referential integrity
5. Repair any issues (orphaned tiles → bank)
6. Hydrate state store

---

## 8. Performance Considerations

### 8.1 Normalized State

All entities are stored in **normalized records** (keyed by ID), avoiding:
- Nested data updates
- Array scanning for lookups
- Duplication

### 8.2 Memoized Selectors

Derived state is computed via **memoized selectors** that only recalculate when input data changes. During drag (60 FPS updates), only `dragState` changes — `tilesByZone` does not recompute until the actual drop.

### 8.3 Batched Updates

During drag, UI updates (tile position, container highlight) are handled via **requestAnimationFrame** to avoid layout thrashing. State updates for cursor position are batched.

### 8.4 Undo Stack Limits

The undo stack is limited to **20 entries** and entries older than **60 seconds** are automatically pruned.
