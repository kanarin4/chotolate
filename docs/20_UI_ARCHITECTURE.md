# Chotolate — UI Architecture

## 1. Overview

The Chotolate UI is a single-page application composed of two primary modes and a persistent toolbar. The board surface is the central interaction area, surrounded by fixed bank regions and tooling.

---

## 2. Application Modes

### 2.1 Setup Mode

Used before the event to create the board structure.

| Element | Action |
|---------|--------|
| Container creation panel | Add new position containers |
| Staff creation panel | Add staff tiles |
| Newcomer creation panel | Add newcomer tiles |
| Container naming / editing | Name and configure positions |

### 2.2 Command Board Mode

Used during the event for live operations.

| Element | Action |
|---------|--------|
| Board canvas | Drag, drop, rearrange |
| Banks | Hold unassigned tiles |
| Search bar | Find and highlight tiles |
| Tile info modals | Edit metadata |
| Fatigue toggles | Cycle tile colors |

Both modes share the same underlying data and canvas. The distinction is primarily a UI affordance to guide the operator's workflow.

---

## 3. Spatial Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ TOOLBAR — Search Bar │ Mode Toggle │ Create Buttons │ Actions      │
├───────────────┬─────────────────────────────────────┬───────────────┤
│               │                                     │               │
│  STAFF BANK   │        BOARD CANVAS                 │ NEWCOMER BANK │
│               │                                     │               │
│  ┌─────────┐  │   ┌───────────────┐ ┌──────────┐   │  ┌─────────┐  │
│  │ tile    │  │   │  Container A  │ │Container │   │  │ tile    │  │
│  │ tile    │  │   │  ┌────┐┌────┐ │ │   B      │   │  │ tile    │  │
│  │ tile    │  │   │  │tile││tile│ │ │ ┌────┐   │   │  │ tile    │  │
│  │         │  │   │  └────┘└────┘ │ │ │tile│   │   │  │         │  │
│  │         │  │   │  ┌────┐       │ │ └────┘   │   │  │         │  │
│  │         │  │   │  │tile│       │ │          │   │  │         │  │
│  │         │  │   │  └────┘       │ └──────────┘   │  │         │  │
│  │         │  │   │               │                 │  │         │  │
│  │         │  │   └───────────────┘                 │  │         │  │
│  │         │  │                                     │  │         │  │
│  └─────────┘  │              ┌──────────────┐       │  └─────────┘  │
│               │              │ Container C  │       │               │
│               │              │ ┌────┐┌────┐ │       │               │
│               │              │ │tile││tile│ │       │               │
│               │              │ └────┘└────┘ │       │               │
│               │              └──────────────┘       │               │
│               │                                     │               │
├───────────────┴─────────────────────────────────────┴───────────────┤
│                     COMPLETED NEWCOMER BANK                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                                │
│  │tile│ │tile│ │tile│ │tile│ │tile│                                │
│  └────┘ └────┘ └────┘ └────┘ └────┘                                │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.1 Region Descriptions

| Region | Position | Behavior |
|--------|----------|----------|
| **Toolbar** | Top, full width | Fixed. Contains search, mode toggle, create buttons. |
| **Staff Bank** | Left sidebar | Fixed, scrollable. Holds unassigned staff tiles. |
| **Board Canvas** | Center | Scrollable and pannable. Holds position containers. |
| **Newcomer Bank** | Right sidebar | Fixed, scrollable. Holds unassigned newcomer tiles. |
| **Completed Newcomer Bank** | Bottom, full width | Fixed, horizontally scrollable. Holds finished newcomers. |

---

## 4. Toolbar

### 4.1 Elements

| Element | Function |
|---------|----------|
| **Search Input** | Text field — filters and highlights matching tiles |
| **Mode Toggle** | Switch between Setup and Command Board modes |
| **+ Staff** | Create a new staff tile |
| **+ Newcomer** | Create a new newcomer tile |
| **+ Container** | Create a new position container |

### 4.2 Search Behavior

- As the operator types, tiles with matching names gain a **highlight border** (e.g., pulsing glow or bright outline)
- Non-matching tiles are **dimmed** but remain interactive
- Clearing the search input restores all tiles to default state
- Search is **case-insensitive** and matches **partial names**

---

## 5. Container Creation UX

### 5.1 Flow

1. Operator clicks **+ Container** in the toolbar
2. A new default-sized container appears on the board canvas
3. The container opens in **edit mode** with the name field focused
4. Operator types the position name and presses Enter or clicks away to confirm
5. Container can then be repositioned by dragging its header bar
6. Container can be resized by dragging its edges or corners

### 5.2 Visual States

| State | Visual |
|-------|--------|
| Default | Neutral border, name label, tile count badge |
| Hovered (no drag) | Subtle border highlight |
| Drag target (tile hovering) | Strong highlight border, background color shift |
| Edit mode | Name field visible, controls exposed |
| Empty | Container displays "No assignments" label |

---

## 6. Container Resize UX

- **Resize handles** on edges and corners (8-point resize)
- **Minimum size** enforced: container cannot shrink below the space needed to display all contained tiles in the internal grid layout
- Resize is **constrained live** — the handle stops at the minimum boundary
- When resized larger, the internal tile layout recalculates to fill available space
- When tiles are added or removed, the minimum size constraint updates

---

## 7. Tile Visual Encoding

### 7.1 Tile Anatomy

```
┌──────────────────────────┐
│ ● [Fatigue]  [Name]  ℹ  │
│   drag handle area       │
└──────────────────────────┘
```

| Element | Description |
|---------|-------------|
| **Fatigue Dot** | Colored circle: 🟢 green, 🟡 yellow, 🔴 red |
| **Name** | Primary text label |
| **Info Button** | Opens metadata editing modal |
| **Drag Handle** | The entire tile body is the drag handle |

### 7.2 Tile Types — Visual Differentiation

| Type | Visual Distinction |
|------|-------------------|
| Staff | Solid border, role label "Staff" |
| Newcomer | Dashed border, role label "Newcomer" |

### 7.3 Tile Size

All tiles have a **fixed, consistent size** across the entire board. This ensures:

- Predictable internal container layouts
- Uniform visual density
- Reliable drag-and-drop sizing

---

## 8. Bank Placement and Behavior

### 8.1 Layout Rules

| Bank | Position | Scroll | Direction |
|------|----------|--------|-----------|
| Staff Bank | Left sidebar | Vertical | Tiles stack top-to-bottom |
| Newcomer Bank | Right sidebar | Vertical | Tiles stack top-to-bottom |
| Completed Newcomer Bank | Bottom bar | Horizontal | Tiles flow left-to-right |

### 8.2 Bank Behavior

- Banks behave as **snap containers** — tiles dropped into them snap into layout
- Banks are **fixed regions** — they cannot be moved or resized by the operator
- Banks display a **tile count** badge
- Banks accept only tiles of their matching type (staff or newcomer)
- Completed Newcomer Bank accepts **only newcomer tiles** (semantic distinction from the Newcomer Bank)

---

## 9. Overflow Prevention

| Scenario | Behavior |
|----------|----------|
| Too many tiles in a container | Internal grid wraps rows; container enforces minimum height |
| Container resize too small | Resize clamped at minimum bounding size |
| Too many tiles in bank | Bank scrolls vertically (sidebar) or horizontally (bottom bar) |
| Board canvas full of containers | Canvas scrolls / pans in both directions |
| Tiles overlap | **Not possible** — grid layout guarantees non-overlapping placement |

---

## 10. Responsiveness

### 10.1 Target Environments

| Environment | Support |
|-------------|---------|
| Desktop (1280px+) | Primary target — full layout |
| Tablet landscape (1024px) | Supported — banks may collapse to side drawers |
| Tablet portrait (768px) | Supported with reduced bank visibility |
| Mobile (<768px) | **Not supported in MVP** — board requires spatial layout |

### 10.2 Responsive Adaptations

- Banks collapse into **slide-out drawers** on narrow viewports
- Toolbar stacks vertically on narrow viewports
- Board canvas remains freely scrollable at all sizes
- Tile size remains fixed — does not scale with viewport

---

## 11. Accessibility Considerations

| Feature | Implementation |
|---------|---------------|
| Keyboard drag-and-drop | Arrow keys to move, Enter to drop (future) |
| Screen reader labels | Containers and tiles have ARIA labels |
| Color-blind fatigue indicators | Fatigue dot uses color + icon shape (circle/triangle/square) |
| Focus management | Tab order: toolbar → banks → board containers |
| High contrast mode | Respect OS high-contrast preference |
