# Chotolate — Staff State Model

## 1. Overview

Every person on the Chotolate board is represented as a **tile**. This document defines the states, properties, transitions, and metadata model for all tiles (staff and newcomers).

---

## 2. Tile Entity Model

### 2.1 Core Properties

| Property | Type | Required | Mutable | Description |
|----------|------|----------|---------|-------------|
| `id` | UUID | Yes | No | Unique identifier |
| `name` | String | Yes | Yes | Display name |
| `type` | Enum | Yes | No | `"staff"` or `"newcomer"` |
| `fatigueState` | Enum | Yes | Yes | `"green"`, `"yellow"`, or `"red"` |
| `notes` | String | No | Yes | Freeform metadata (editable via info modal) |
| `currentZoneId` | UUID | Yes | Yes | ID of the container or bank the tile belongs to |
| `createdAt` | Timestamp | Yes | No | Creation time |
| `updatedAt` | Timestamp | Yes | Yes | Last modification time |

### 2.2 Derived Properties

| Property | Derivation |
|----------|------------|
| `isAssigned` | `currentZoneId` is a Container Zone (not a Bank) |
| `isInBank` | `currentZoneId` is a Bank Zone |
| `zoneType` | Resolved from `currentZoneId` → zone type lookup |

---

## 3. Tile Types

### 3.1 Staff Tile

Represents an event staff member.

| Attribute | Value |
|-----------|-------|
| `type` | `"staff"` |
| Visual border | Solid |
| Role label | "Staff" |
| Origin bank | Staff Bank |
| Valid zones | Staff Bank, any Position Container |
| Invalid zones | Newcomer Bank, Completed Newcomer Bank |

### 3.2 Newcomer Tile

Represents a newcomer being processed during the event.

| Attribute | Value |
|-----------|-------|
| `type` | `"newcomer"` |
| Visual border | Dashed |
| Role label | "Newcomer" |
| Origin bank | Newcomer Bank |
| Valid zones | Newcomer Bank, any Position Container, Completed Newcomer Bank |
| Invalid zones | Staff Bank |

---

## 4. Fatigue State

### 4.1 Model

Fatigue is a **manual, operator-controlled** state. There is no automatic timing, no countdown, and no algorithm. The operator assesses fatigue and sets the color manually.

### 4.2 States

| State | Color | Meaning | Visual |
|-------|-------|---------|--------|
| `"green"` | 🟢 Green | Normal / fresh | Green dot indicator |
| `"yellow"` | 🟡 Yellow | Moderate fatigue | Yellow dot indicator |
| `"red"` | 🔴 Red | High fatigue / needs relief | Red dot indicator |

### 4.3 Default State

All tiles are created with `fatigueState = "green"`.

### 4.4 Toggle Behavior

The operator cycles the fatigue state by clicking the fatigue indicator dot on the tile:

```
green → yellow → red → green → ...
```

This is a **single-click cycle**. No multi-step selection UI. Each click advances the state by one step.

### 4.5 Accessibility

For colorblind operators, fatigue indicators include a **shape variant**:

| State | Color | Shape |
|-------|-------|-------|
| Green | 🟢 | Circle ● |
| Yellow | 🟡 | Diamond ◆ |
| Red | 🔴 | Square ■ |

The shape is displayed inside or alongside the color dot.

---

## 5. Tile Lifecycle

### 5.1 Staff Lifecycle

```
Created → Staff Bank → (drag to container) → Assigned → (drag to other container) → Reassigned
                  ↑                                              │
                  └──────────── (drag back to bank) ─────────────┘
```

Staff tiles have no terminal state. They cycle between the bank and containers indefinitely.

### 5.2 Newcomer Lifecycle

```
Created → Newcomer Bank → (drag to container) → Processing
                                                     │
                                                     ├── (drag to another container) → Reassigned
                                                     │
                                                     └── (drag to completed bank) → Completed
                                                                                       │
                                                                                       └── (drag back to container) → Reprocessing
```

Newcomer tiles can also return from Completed to Newcomer Bank or to a container.

### 5.3 Lifecycle State Summary

| Tile Type | State | Zone Location |
|-----------|-------|---------------|
| Staff | Unassigned | Staff Bank |
| Staff | Assigned | Position Container |
| Newcomer | Awaiting | Newcomer Bank |
| Newcomer | Processing | Position Container |
| Newcomer | Completed | Completed Newcomer Bank |

---

## 6. Tile Creation

### 6.1 Staff Tile Creation

1. Operator clicks **+ Staff** button
2. A creation form appears (inline or modal):
   - Name (required, text input)
   - Notes (optional, textarea)
3. On submit:
   - Tile is created with `type = "staff"`, `fatigueState = "green"`
   - Tile is placed in the **Staff Bank**

### 6.2 Newcomer Tile Creation

1. Operator clicks **+ Newcomer** button
2. A creation form appears (inline or modal):
   - Name (required, text input)
   - Notes (optional, textarea)
3. On submit:
   - Tile is created with `type = "newcomer"`, `fatigueState = "green"`
   - Tile is placed in the **Newcomer Bank**

### 6.3 Batch Creation (Future Enhancement)

Support for pasting a list of names to create multiple tiles at once. Not in MVP.

---

## 7. Tile Editing

### 7.1 Info Modal

Clicking the **ℹ** button on a tile opens an info modal:

| Field | Behavior |
|-------|----------|
| Name | Editable text input |
| Type | Display only (cannot change staff ↔ newcomer) |
| Fatigue | Three-state radio (green / yellow / red) |
| Notes | Editable textarea |
| Current Zone | Display (name of current container or bank) |
| Created | Display (timestamp) |
| Save | Saves changes and closes modal |
| Delete | Deletes the tile (with confirmation) |

### 7.2 Inline Editing

The tile name can also be edited inline by **double-clicking** the name label on the tile. This opens a text input inline. Pressing Enter or clicking away saves the change.

---

## 8. Tile Deletion

### 8.1 Flow

1. Operator opens info modal → clicks **Delete**
2. Confirmation: _"Delete [Name]? This cannot be undone."_
3. On confirm:
   - Tile is removed from its current zone
   - Zone layout recalculates
   - Tile is permanently deleted

### 8.2 Undo

Tile deletion is **undoable** within 10 seconds (snackbar with undo button).

---

## 9. Tile Visual States

| State | Visual Treatment |
|-------|-----------------|
| **Idle** | Default appearance — name, fatigue dot, role indicator |
| **Hovered** | Subtle elevation shadow, cursor changes to `grab` |
| **Dragging** | 80% opacity, 1.05× scale, elevated shadow, cursor `grabbing` |
| **Search Match** | Glowing border (accent color pulse animation) |
| **Search Non-Match** | Dimmed (50% opacity) |
| **Ghost Placeholder** | Faded outline at original position during drag |

---

## 10. Search Interaction

When the operator types in the search bar:

1. The search query is matched against all tile `name` properties
2. Match is **case-insensitive** and **partial** (substring match)
3. Matching tiles receive the **Search Match** visual state
4. Non-matching tiles receive the **Search Non-Match** visual state
5. Clearing the search restores all tiles to their default visual state

Search does **not** filter tiles — all tiles remain visible but with differentiated visual treatment.
