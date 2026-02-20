# Chotolate — Milestones

## 1. Overview

Development is structured into 4 milestones. Each milestone produces a **demonstrable, testable increment** of the application. Milestones build on each other — no milestone can begin until its predecessor is complete.

---

## 2. Milestone Summary

| Milestone | Name | Deliverable | Phases | Estimated Effort |
|-----------|------|-------------|--------|-----------------|
| M1 | **Static Board** | Rendered board with tiles, containers, banks (no interaction) | P1 + P2 | 2–3 days |
| M2 | **Interactive Board** | Full drag-and-drop, container creation/resize, tile CRUD | P3 + P4 + P5 | 4–6 days |
| M3 | **Complete MVP** | Search, persistence, mode toggle, polish | P6 + P7 | 2–3 days |
| M4 | **Hardened Release** | Performance verified, edge cases handled, stress tested | Testing | 2–3 days |

**Total estimated effort**: 10–15 days

---

## 3. Milestone 1 — Static Board

### 3.1 Goal

Render the complete board layout with all visual components. No interactivity except visual verification.

### 3.2 Deliverables

| Item | Description |
|------|-------------|
| Project scaffold | Vite + React + TypeScript running |
| Type system | All entity types and enums defined |
| Design tokens | CSS variables for colors, spacing, typography |
| State store | Zustand store with test data |
| Tile component | Renders name, fatigue dot, type indicator |
| Container component | Renders header, grid of tiles |
| Bank components | Staff Bank, Newcomer Bank, Completed Bank |
| Board layout | Three-column layout matching spec |

### 3.3 Acceptance Criteria

- [ ] Dev server running with full board layout visible
- [ ] Mock data displays 3 containers with 2–5 tiles each
- [ ] All three banks visible with mock tiles
- [ ] Toolbar rendered with placeholder buttons
- [ ] Tiles display name, fatigue color, and type border correctly
- [ ] Container grid layout wraps tiles correctly
- [ ] No visual regressions on Chrome, Firefox, Safari

### 3.4 Demo

Open the application → see a fully rendered board with containers, tiles, and banks. Everything is static — clicking and dragging does nothing.

---

## 4. Milestone 2 — Interactive Board

### 4.1 Goal

All core interactions are functional: drag-and-drop, container management, tile CRUD.

### 4.2 Deliverables

| Item | Description |
|------|-------------|
| Drag system | @dnd-kit with custom collision detection |
| Tile drag | Tiles draggable between containers and banks |
| Drop validation | Staff/newcomer type constraints enforced |
| Drag overlay | Semi-transparent drag preview |
| Container hover | Active drop target highlighting |
| Container creation | + button → new container flow |
| Container positioning | Header drag to reposition |
| Container resizing | 8-point resize with min constraints |
| Container deletion | With tile recovery to banks |
| Tile creation | + Staff / + Newcomer flows |
| Tile info modal | Name, notes, fatigue editing |
| Fatigue toggle | Click-to-cycle on tile surface |
| Tile deletion | With undo snackbar |

### 4.3 Acceptance Criteria

- [ ] Drag a staff tile from Staff Bank to a container → tile snaps in
- [ ] Drag a staff tile between containers → tile moves correctly
- [ ] Drag a staff tile outside all containers → returns to Staff Bank
- [ ] Drag a newcomer to Completed Bank → tile moves correctly
- [ ] Drop a staff tile on Newcomer Bank → tile returns to Staff Bank
- [ ] Create a new container → appears at viewport center with name input
- [ ] Resize a container → grid layout recalculates, min size enforced
- [ ] Delete a container → tiles return to their respective banks
- [ ] Create staff tile → appears in Staff Bank
- [ ] Edit tile via info modal → changes reflected on tile
- [ ] Toggle fatigue → color cycles correctly
- [ ] Delete tile → snackbar with undo appears

### 4.4 Demo

Open the application → create containers → create tiles → drag tiles between containers and banks → resize containers → edit tile metadata → toggle fatigue colors.

---

## 5. Milestone 3 — Complete MVP

### 5.1 Goal

All MVP features implemented. The application is usable for a real event.

### 5.2 Deliverables

| Item | Description |
|------|-------------|
| Board canvas | Pan and scroll for large boards |
| Search | Find-and-highlight matching tiles |
| Toolbar | Fully assembled with all controls |
| Mode toggle | Setup ↔ Command mode |
| Auto-save | Debounced persistence to LocalStorage |
| Data validation | Integrity check and repair on load |
| Animations | Snap, return, and highlight animations |
| Count badges | Tile counts on all zones |
| Auto-scroll | Canvas scrolls during edge-drag |
| Container warnings | Overlap visual indicator |

### 5.3 Acceptance Criteria

- [ ] Search for a name → matching tiles glow, non-matches dim
- [ ] Close browser → reopen → board state fully restored
- [ ] Pan the board canvas in all directions smoothly
- [ ] Setup mode shows creation tools; Command mode hides them
- [ ] Snap animation plays when tile drops into container
- [ ] Count badges on containers and banks update correctly
- [ ] Dragging near canvas edge triggers auto-scroll
- [ ] Overlapping containers show warning indicator
- [ ] Data corruption recovery handles orphaned tiles

### 5.4 Demo

Full end-to-end workflow: set up board in Setup mode → switch to Command mode → assign staff to positions → search for a person → toggle fatigue → close and reopen → state persists.

---

## 6. Milestone 4 — Hardened Release

### 6.1 Goal

The application is stress-tested, edge cases handled, and ready for real-world use.

### 6.2 Deliverables

| Item | Description |
|------|-------------|
| Drag accuracy tests | All drag scenarios verified |
| Container detection tests | Collision detection correct |
| Resize constraint tests | Min size enforcement validated |
| Layout stability tests | Grid remains correct at scale |
| Stress tests | 200 tiles, 50 containers |
| Usability testing | Walkthrough with test users |
| Performance profiling | 60 FPS confirmed at scale |
| Cross-browser testing | Chrome, Firefox, Safari |
| Bug fixes | All issues from testing resolved |

### 6.3 Acceptance Criteria

- [ ] All automated tests pass
- [ ] 200 tiles on board with 60 FPS drag maintained
- [ ] No layout glitches after 50 rapid drag-and-drops
- [ ] Board readable in < 3 seconds with 100+ tiles
- [ ] Undo works correctly for tile and container deletion
- [ ] Touch drag works on tablet devices
- [ ] No data corruption after 100 save/load cycles
- [ ] Test user completes full workflow without guidance

### 6.4 Demo

Live stress test: create 50 containers, add 200 tiles, perform rapid reassignments while search is active and fatigue colors are toggled. Board remains responsive and readable.

---

## 7. Post-MVP Milestones (Planned)

| Milestone | Name | Scope |
|-----------|------|-------|
| M5 | **Export / Import** | JSON export/import of board state |
| M6 | **Board Templates** | Save and load board configurations |
| M7 | **Multi-User** | WebSocket real-time sync |
| M8 | **Mobile Support** | Responsive layout for phones |
| M9 | **Keyboard Navigation** | Full keyboard-accessible drag |

These are documented for planning awareness but are **out of scope** for the MVP delivery.
