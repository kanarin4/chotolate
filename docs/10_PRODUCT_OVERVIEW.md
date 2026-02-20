# Chotolate — Product Overview

## 1. What Is Chotolate?

Chotolate is a web-based **staff position visualization board** designed for event organizers. It functions as a **structured magnetic operations command board** where people appear as draggable tiles ("magnets") that snap into containers representing operational positions.

The system provides **real-time situational awareness** of who is placed where during an event. It is **not** a scheduling tool, a forecasting engine, or a resource optimizer. It is a visualization and rapid reassignment tool.

---

## 2. Core Problem

Event organizers managing staff and newcomers across multiple operational positions need to:

- **See at a glance** who is assigned where
- **Reassign people rapidly** when conditions change
- **Track newcomer processing** through intake stages
- **Monitor fatigue** across the team
- **Maintain spatial clarity** — no ambiguity about who is where

Existing tools (spreadsheets, whiteboards, radio communication) fail because they are either too slow to update, too fragile to maintain, or lack the spatial immediacy required during live operations.

---

## 3. Core Metaphor

Chotolate is a **magnetic command board**.

| Physical World | Chotolate |
|---------------|-----------|
| Whiteboard | The board canvas |
| Magnetic name tags | Tiles (magnets) |
| Labeled zones on the board | Containers (position snap zones) |
| Staging area for unassigned people | Banks |
| Moving a magnet to a new zone | Drag and snap |

The metaphor is intentionally simple. If you can operate a magnetic whiteboard, you can operate Chotolate.

---

## 4. Core Concepts

### 4.1 Containers (Positions)

Containers are user-created rectangular regions on the board. Each container represents an operational position (e.g., "Front Gate", "Registration Desk", "VIP Lounge").

- Created dynamically by the operator
- Freely positioned on the board canvas
- Resizable (with minimum size constraints)
- Hold multiple tiles with automatic internal layout
- Display a count of contained tiles

### 4.2 Tiles (Magnets)

Tiles represent people — either **staff** or **newcomers**. They are uniform in size and display:

- Name
- Role type (staff / newcomer)
- Fatigue color indicator (green / yellow / red)
- Info button for metadata editing
- Drag handle

### 4.3 Banks

Banks are fixed interface regions that act as holding areas:

| Bank | Purpose |
|------|---------|
| **Staff Bank** | Unassigned staff members |
| **Newcomer Bank** | Newcomers awaiting processing |
| **Completed Newcomer Bank** | Newcomers who have finished processing |

Banks behave like containers (tiles snap into them) but are fixed UI elements, not freely positioned.

### 4.4 Drag and Snap

The core interaction: pick up a tile and drop it into a container. The tile snaps into the container's internal grid layout. Dropping outside any container returns the tile to its originating bank.

---

## 5. Workflow

### Phase 1 — Setup

The operator creates the board structure:

1. **Create position containers** — Define operational positions by adding and naming containers
2. **Create staff tiles** — Add staff members with names and metadata
3. **Create newcomer tiles** — Add newcomers expected for the event

All entities are created via `+` buttons in their respective interface regions.

### Phase 2 — Command Board Operation

The operator uses the board during the live event:

1. **Drag staff tiles** into position containers to assign them
2. **Drag newcomer tiles** into position containers for processing
3. **Move tiles between containers** to reassign
4. **Move completed newcomers** to the Completed Newcomer Bank
5. **Use search** to find and highlight specific people
6. **Toggle fatigue colors** to track team energy levels
7. **Resize and reposition containers** as operational needs change

---

## 6. What Chotolate Is NOT

| Not This | Why |
|----------|-----|
| A scheduler | It shows current state, not future plans |
| A time tracker | Fatigue is manual, not timed |
| A communication tool | It visualizes placement, not messages |
| A forecasting engine | No predictive logic |
| A grid system | Containers are freely positioned, not grid-locked |
| An HR system | Minimal metadata, no payroll, no contracts |

---

## 7. Success Criteria

The system succeeds when:

- An operator can read the entire board state in **< 3 seconds**
- Reassigning a person takes **< 2 seconds** (one drag-and-drop)
- There is **zero ambiguity** about who is assigned where
- The board supports **50+ tiles** without layout degradation
- A new operator can understand the board **without training**
