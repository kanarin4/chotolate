# Chotolate — Drag and Snap System

## 1. Overview

The drag-and-snap system is the core interaction mechanism of Chotolate. Every tile placement, reassignment, and bank return is performed through this system. The behavior must be precise, responsive, and unambiguous.

---

## 2. Drag Lifecycle

### 2.1 Phases

```
IDLE → DRAG_START → DRAGGING → DROP_EVALUATE → SNAP_OR_RETURN → IDLE
```

| Phase | Trigger | Behavior |
|-------|---------|----------|
| **IDLE** | Default state | Tile is stationary in its current container or bank |
| **DRAG_START** | Pointer down + move threshold | Tile lifts from position, creates drag preview |
| **DRAGGING** | Pointer move | Tile preview follows cursor, containers evaluate hover |
| **DROP_EVALUATE** | Pointer up | System determines which container (if any) contains the cursor |
| **SNAP_OR_RETURN** | Evaluation result | Tile snaps to target container or returns to origin |
| **IDLE** | Animation complete | Tile settles into final position |

### 2.2 Drag Start Threshold

- A minimum **pointer movement of 5px** from the initial pointer-down position is required before a drag begins
- This prevents accidental drags when the operator clicks a tile for info or fatigue toggle
- Below the threshold, the interaction is treated as a click, not a drag

---

## 3. Drag Preview

### 3.1 Visual Behavior

| Property | Value |
|----------|-------|
| Opacity | 80% (semi-transparent) |
| Scale | 1.05× (slightly enlarged) |
| Shadow | Elevated drop shadow to indicate "lifted" state |
| Cursor | `grabbing` |
| Z-index | Above all containers and tiles |
| Position | Centered on cursor |

### 3.2 Origin Placeholder

When a tile is picked up, its original position shows a **ghost placeholder** (faded outline) to indicate where the tile came from. This helps the operator track the origin during the drag.

---

## 4. Container Hover Detection

### 4.1 Detection Method

During dragging, the system continuously checks which container (if any) the **cursor point** (not the tile bounds) is inside.

```
for each container in allContainers:
    if container.bounds.contains(cursor.x, cursor.y):
        set container as activeDropTarget
```

### 4.2 Priority Resolution

If containers overlap (which should be avoided by design but is technically possible), the container with the **highest z-index** (most recently interacted with) takes priority.

### 4.3 Hover Highlight

When a container becomes the active drop target:

| Visual Change | Description |
|---------------|-------------|
| Border | Thickened, accent color (e.g., blue) |
| Background | Subtle tint (e.g., light blue overlay at 10% opacity) |
| Label | Count badge updates to show "+1" preview |

Banks also highlight when they are valid drop targets.

---

## 5. Drop Evaluation

### 5.1 Membership Rule

> A tile belongs to the container whose bounds contain the **cursor point** at the moment of drop.

This is explicitly the **cursor position**, not the tile's center or bounding box. The cursor is the operator's point of intent.

### 5.2 Decision Tree

```
ON DROP:
├── Cursor inside a container?
│   ├── YES:
│   │   ├── Is the container a valid target for this tile type?
│   │   │   ├── YES → Snap tile into container
│   │   │   └── NO → Return tile to origin
│   │   └── (Staff tiles cannot enter Newcomer Bank, etc.)
│   └── NO:
│       └── Return tile to originating bank
└── (Staff → Staff Bank, Newcomer → Newcomer Bank)
```

### 5.3 Valid Drop Targets per Tile Type

| Tile Type | Valid Targets |
|-----------|---------------|
| Staff | Any position container, Staff Bank |
| Newcomer | Any position container, Newcomer Bank, Completed Newcomer Bank |

### 5.4 Invalid Drop Behavior

If a tile is dropped:
- Outside all containers → returns to originating bank
- On an invalid container (e.g., staff tile on Newcomer Bank) → returns to originating bank
- On itself (same position) → no-op, tile stays in place

---

## 6. Snap Animation

### 6.1 Snap to Container

When a tile is successfully dropped into a container:

1. The tile's drag preview disappears
2. The tile animates to its new grid position inside the container (200ms ease-out)
3. The container's internal layout recalculates
4. The container's tile count updates
5. The origin container's layout recalculates and count updates

### 6.2 Return to Origin

When a tile is returned (invalid drop or drop outside containers):

1. The tile's drag preview animates back to the ghost placeholder position (250ms ease-out)
2. The ghost placeholder fills in with the returned tile
3. No state change occurs

---

## 7. Removal from Previous Container

When a tile is dropped into a **different** container than its origin:

| Step | Description |
|------|-------------|
| 1 | Tile is removed from origin container's tile list |
| 2 | Origin container's internal layout recalculates |
| 3 | Origin container's tile count decrements |
| 4 | Tile is added to target container's tile list |
| 5 | Target container's internal layout recalculates |
| 6 | Target container's tile count increments |

This is an **atomic state transition** — the tile is never in zero or two containers simultaneously in the state model.

---

## 8. Edge Cases

### 8.1 Drag Over Multiple Containers

As the cursor moves across the board, containers highlight and un-highlight in real time. Only one container is highlighted at a time (the one under the cursor).

### 8.2 Container Resizing During Drag

If a container is resized by another mechanism during a drag (not expected in single-operator MVP but architecturally possible), the hover detection recalculates against updated bounds.

### 8.3 Rapid Sequential Drags

The system must handle the operator quickly dropping one tile and immediately picking up another. Each drag lifecycle is independent and stateless relative to previous drags.

### 8.4 Scroll During Drag

If the board canvas scrolls during a drag (e.g., auto-scroll when cursor approaches canvas edge):

- The drag preview remains anchored to the cursor
- Container hover detection accounts for scroll offset
- Drop evaluation uses **viewport-relative cursor position** translated to **canvas-relative coordinates**

### 8.5 Auto-Scroll

When dragging a tile near the edge of the board canvas:

| Edge Zone | Behavior |
|-----------|----------|
| Within 40px of canvas edge | Canvas auto-scrolls in that direction |
| Scroll speed | Proportional to distance from edge (closer = faster) |
| Maximum scroll speed | 15px per frame |

---

## 9. Performance Requirements

| Metric | Target |
|--------|--------|
| Drag start latency | < 16ms (one frame) |
| Cursor tracking latency | < 16ms (60 FPS tracking) |
| Container highlight response | < 32ms (two frames) |
| Snap animation duration | 200ms |
| Return animation duration | 250ms |
| Layout recalculation on drop | < 50ms |

---

## 10. Pointer Support

| Input | Support |
|-------|---------|
| Mouse | Primary input — full drag support |
| Touch | Supported — long press (300ms) initiates drag to avoid conflict with scroll |
| Pen / stylus | Supported — same as mouse |
| Keyboard | Future enhancement — arrow key movement |

### 10.1 Touch-Specific Behavior

- Long press (300ms hold without movement) initiates drag
- Haptic feedback on drag start (if available via Vibration API)
- Larger hit targets for touch — tile touch target extends 4px beyond visual boundary
- Touch drag cancels on multi-touch (second finger cancels drag, tile returns to origin)
