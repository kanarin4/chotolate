# Chotolate — Future Expansion

## 1. Overview

This document outlines features and capabilities planned for post-MVP development. These are organized into thematic tracks, each building on the MVP foundation. Nothing in this document is required for the initial release.

---

## 2. Expansion Tracks

```
Track 1: Data & Export          → Portable data, board templates
Track 2: Collaboration          → Multi-user, real-time sync
Track 3: Enhanced Interaction   → Keyboard, accessibility, mobile
Track 4: Intelligence           → Analytics, suggestions, history
Track 5: Integration            → External systems, APIs
```

---

## 3. Track 1 — Data & Export

### 3.1 JSON Export / Import

**Priority**: High (first post-MVP feature)

- Export entire board state as a downloadable `.json` file
- Import a `.json` file to restore a board
- Enables backup, sharing between devices, and board archiving

### 3.2 Board Templates

**Priority**: High

- Save the current board's container layout (without tiles) as a reusable template
- Apply templates to new boards for recurring events
- Templates store: container names, positions, sizes
- Template library: list, preview, delete templates

### 3.3 IndexedDB Migration

**Priority**: Medium

- Migrate persistence from LocalStorage (5MB limit) to IndexedDB
- Enables larger board states and more boards per device
- Transparent migration from existing LocalStorage data

### 3.4 CSV Import for Tiles

**Priority**: Medium

- Import a list of staff/newcomer names from a CSV file
- Batch-create tiles from imported data
- Map CSV columns to tile properties (name, notes)

### 3.5 Print / PDF Export

**Priority**: Low

- Generate a snapshot of the board as a printable PDF
- Useful for physical backup or posting at event venue
- Shows container names, tile assignments, fatigue states

---

## 4. Track 2 — Collaboration

### 4.1 Real-Time Multi-User Sync

**Priority**: High

- WebSocket-based real-time sync between multiple operators
- Last-write-wins conflict resolution at the action level
- Visual indicators showing other operators' cursors
- Requires backend: Node.js + Socket.IO + PostgreSQL

**Architecture**: See `40_FRONTEND_ARCHITECTURE.md`, Section 9.

### 4.2 Viewer Role

**Priority**: Medium

- Read-only access to the board
- Viewers see the same board state as operators but cannot drag, create, or modify
- Shareable link for viewer access
- Use case: remote supervisors monitoring the board

### 4.3 Board Sharing

**Priority**: Medium

- Generate a shareable link for a specific board
- Link recipients can view (or edit, if authorized)
- Requires authentication layer (simple session-based)

### 4.4 Activity Log

**Priority**: Low

- Record all actions (who moved what, when)
- Viewable in a sidebar panel
- Useful for post-event review and accountability

---

## 5. Track 3 — Enhanced Interaction

### 5.1 Keyboard-Accessible Drag

**Priority**: High (accessibility requirement)

- Tab to focus a tile
- Enter to pick up
- Arrow keys to navigate between zones
- Enter to drop
- Escape to cancel drag

### 5.2 Touch Optimization

**Priority**: Medium

- Refined long-press drag initiation for tablets
- Haptic feedback on drag events (via Vibration API)
- Larger touch targets
- Multi-touch handling (pinch-to-zoom board)

### 5.3 Mobile Layout

**Priority**: Low

- Responsive layout for phones (< 768px)
- Banks as bottom sheets
- Containers stacked vertically
- Simplified drag interaction

### 5.4 Dark Mode

**Priority**: Medium

- System preference detection
- Manual toggle
- Full color palette adjustment for dark backgrounds
- Maintains accessibility contrast ratios

### 5.5 Tile Grouping / Tagging

**Priority**: Low

- Assign tags to tiles (e.g., "Team A", "Security", "Medical")
- Filter board view by tag
- Color-code tiles by tag
- Group by tag within containers

---

## 6. Track 4 — Intelligence

### 6.1 Assignment History

**Priority**: Medium

- Track where each tile has been assigned over time
- Timeline view per tile: "Alice was at Front Gate from 10:00–12:00, then VIP Lounge from 12:00–14:00"
- Requires timestamp tracking on MOVE_TILE actions

### 6.2 Fatigue Timer (Optional Enhancement)

**Priority**: Low

- Optional automatic fatigue progression based on time in position
- Operator enables per-container: after `N` hours, tiles auto-yellow, after `M` hours, auto-red
- Manual override always available
- **Clear opt-in** — never automatic by default (violates design philosophy)

### 6.3 Board Analytics Dashboard

**Priority**: Low

- Post-event summary:
  - Total reassignments
  - Average time per position
  - Fatigue distribution
  - Busiest containers
- Exportable as PDF report

### 6.4 Position Capacity Warnings

**Priority**: Medium

- Set a maximum tile count per container
- Visual warning when container approaches or exceeds capacity
- Does not block placement — advisory only

---

## 7. Track 5 — Integration

### 7.1 REST API

**Priority**: Low

- Expose board state via REST endpoints
- Enables external systems to read board state
- Use case: display screens, monitoring dashboards

### 7.2 Webhook Notifications

**Priority**: Low

- Fire webhooks on events (tile moved, fatigue changed, container created)
- Enables integration with Slack, Discord, or custom systems

### 7.3 Calendar Import

**Priority**: Low

- Import staff schedules from calendar (iCal/Google Calendar)
- Pre-populate tile availability metadata
- Suggest assignments based on schedule overlap

---

## 8. Expansion Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| JSON Export/Import | High | Low | **P1** |
| Board Templates | High | Medium | **P1** |
| Keyboard Drag | High | Medium | **P1** |
| IndexedDB Migration | Medium | Low | **P2** |
| Real-Time Sync | High | High | **P2** |
| Viewer Role | Medium | Medium | **P2** |
| CSV Import | Medium | Low | **P2** |
| Dark Mode | Medium | Low | **P2** |
| Position Capacity | Medium | Low | **P2** |
| Assignment History | Medium | Medium | **P3** |
| Touch Optimization | Medium | Medium | **P3** |
| Board Sharing | Medium | Medium | **P3** |
| Print/PDF Export | Low | Medium | **P3** |
| Tile Tagging | Low | Medium | **P3** |
| Activity Log | Low | Medium | **P4** |
| Analytics Dashboard | Low | High | **P4** |
| Fatigue Timer | Low | Medium | **P4** |
| REST API | Low | Medium | **P4** |
| Webhooks | Low | Medium | **P4** |
| Mobile Layout | Low | High | **P5** |
| Calendar Import | Low | High | **P5** |

---

## 9. Architectural Preparedness

The MVP architecture is designed to support these expansions without major rewrites:

| Expansion | Architectural Support |
|-----------|----------------------|
| Remote persistence | State store is storage-agnostic — swap LocalStorage for API calls |
| Real-time sync | Actions are serializable — can be sent over WebSocket |
| Multi-user | State is normalized — concurrent mutations merge cleanly |
| Templates | Container data is separate from tile data — extract container layout |
| Analytics | Action-based state updates enable event sourcing pattern |
| Keyboard drag | @dnd-kit supports keyboard sensors natively |
| Dark mode | CSS custom properties enable theme switching |
| Export/Import | BoardState is a single JSON-serializable object |

No expansion requires changes to the core data model. All expansions layer on top of the existing entity structure.
