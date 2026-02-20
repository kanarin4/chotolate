# Chotolate — Testing Strategy

## 1. Overview

Chotolate's testing strategy addresses the unique challenges of a spatial, drag-driven interface. Standard unit tests cover logic; custom test harnesses verify the drag system, layout engine, and container constraints.

---

## 2. Test Pyramid

```
                    ┌──────────┐
                    │  Manual  │  ← Usability sessions
                    │  Tests   │
                   ┌┴──────────┴┐
                   │   E2E      │  ← Full workflow automation
                   │   Tests    │
                  ┌┴────────────┴┐
                  │ Integration  │  ← Component + store interaction
                  │   Tests      │
                 ┌┴──────────────┴┐
                 │   Unit Tests    │  ← Pure functions, state logic
                 └────────────────┘
```

| Level | Scope | Tool | Count (est.) |
|-------|-------|------|-------------|
| Unit | Pure functions, state actions | Vitest | 80–120 |
| Integration | Component + store | Vitest + React Testing Library | 30–50 |
| E2E | Full workflow in browser | Playwright | 15–25 |
| Manual | Usability, visual, stress | Human testers | 5–10 sessions |

---

## 3. Unit Tests

### 3.1 Grid Layout Engine (`src/utils/layout.ts`)

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| Single tile in wide container | width=300, tiles=1 | 1 column, 1 row, tile at (gap, headerH+gap) |
| Row wrapping | width=300, tiles=5 | 2 columns, 3 rows |
| Exact fit (no extra space) | width=296, tiles=4 | 2 columns, 2 rows, no overflow |
| Empty container | width=240, tiles=0 | 0 columns, 0 rows, empty positions |
| One column (narrow container) | width=150, tiles=3 | 1 column, 3 rows |
| Large tile count | width=500, tiles=50 | Stable output, no crash |

### 3.2 Minimum Size Calculation

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| Empty container | tiles=0 | ABSOLUTE_MIN_WIDTH, ABSOLUTE_MIN_HEIGHT |
| One tile | tiles=1, cols=1 | tileWidth + 2*gap, headerH + tileHeight + 2*gap |
| Full row | tiles=3, cols=3 | 3*tileWidth + 4*gap, headerH + tileHeight + 2*gap |
| Multiple rows | tiles=7, cols=3 | 3*tileWidth + 4*gap, headerH + 3*tileHeight + 4*gap |

### 3.3 Collision Detection (`src/utils/collision.ts`)

| Test Case | Scenario | Expected |
|-----------|----------|----------|
| Cursor inside one container | cursor at (150, 150), container at (100,100,200,200) | Returns container |
| Cursor outside all containers | cursor at (50, 50), containers all at (200+,200+) | Returns empty |
| Cursor on container border | cursor at (100, 100), container starts at (100,100) | Returns container (inclusive) |
| Two overlapping containers | cursor in overlap area | Returns higher z-index container |
| Multiple containers, cursor in one | 5 containers, cursor in #3 | Returns only #3 |

### 3.4 State Actions

| Test Case | Action | Assertion |
|-----------|--------|-----------|
| Create tile | CREATE_TILE(staff) | Tile in store, currentZoneId = staffBankId |
| Move tile | MOVE_TILE(tileId, containerId) | tile.currentZoneId = containerId |
| Move tile back to bank | MOVE_TILE(tileId, staffBankId) | tile.currentZoneId = staffBankId |
| Cycle fatigue | CYCLE_FATIGUE(tileId) | green→yellow, yellow→red, red→green |
| Create container | CREATE_CONTAINER(name) | Container in store with default size |
| Resize container (valid) | RESIZE_CONTAINER(id, 400, 300) | Container size updated |
| Resize container (below min) | RESIZE_CONTAINER(id, 50, 50) | Clamped to min size |
| Delete container | DELETE_CONTAINER(id) | Container removed, tiles in banks |
| Delete tile | DELETE_TILE(id) | Tile removed from store |

### 3.5 Drop Validation

| Test Case | Tile Type | Target | Expected |
|-----------|-----------|--------|----------|
| Staff → Container | staff | container | Valid |
| Staff → Staff Bank | staff | staffBank | Valid |
| Staff → Newcomer Bank | staff | newcomerBank | Invalid |
| Staff → Completed Bank | staff | completedBank | Invalid |
| Newcomer → Container | newcomer | container | Valid |
| Newcomer → Newcomer Bank | newcomer | newcomerBank | Valid |
| Newcomer → Completed Bank | newcomer | completedBank | Valid |
| Newcomer → Staff Bank | newcomer | staffBank | Invalid |

### 3.6 Data Validation (`src/utils/validation.ts`)

| Test Case | Scenario | Expected |
|-----------|----------|----------|
| Valid data | Well-formed BoardState | Passes validation |
| Orphaned tile | tile.currentZoneId points to deleted zone | Tile reassigned to bank |
| Missing bank | Only 2 banks instead of 3 | Missing bank recreated |
| Duplicate IDs | Two tiles with same ID | Second tile re-ID'd |
| Empty board | No containers, no tiles | Valid (empty is OK) |
| Corrupt JSON | Malformed JSON string | Error caught, clean state initialized |

---

## 4. Integration Tests

### 4.1 Tile Component + Store

| Test Case | Scenario | Assertion |
|-----------|----------|-----------|
| Render tile from store | Store has tile data | Component renders name and fatigue |
| Click fatigue | Click fatigue dot | Store updates, re-render shows new color |
| Open info modal | Click ℹ button | Modal opens with tile data |
| Edit name in modal | Change name, save | Store updates, tile re-renders with new name |

### 4.2 Container Component + Store

| Test Case | Scenario | Assertion |
|-----------|----------|-----------|
| Render tiles in grid | Container has 5 tiles | 5 tiles rendered in grid layout |
| Add tile | Drop tile into container | Grid recalculates, count increments |
| Remove tile | Drag tile out | Grid recalculates, count decrements |
| Resize | Drag handle | Grid recalculates with new width |

### 4.3 Bank Component + Store

| Test Case | Scenario | Assertion |
|-----------|----------|-----------|
| Staff Bank shows only staff | Store has mixed tiles | Only staff tiles visible |
| Newcomer Bank shows only newcomers | Store has mixed tiles | Only newcomer tiles visible |
| Completed Bank shows completed newcomers | Tile moved to completedBankId | Tile visible in Completed Bank |

### 4.4 Search + Tile Highlighting

| Test Case | Scenario | Assertion |
|-----------|----------|-----------|
| Search matches | Query "John" | Tiles with "John" in name have match class |
| Search no match | Query "zzzzz" | All tiles have no-match class |
| Clear search | Clear input | All tiles have default class |
| Partial match | Query "Jo" | "John", "Joseph" match; "Alice" doesn't |

---

## 5. End-to-End Tests (Playwright)

### 5.1 Drag Accuracy Tests

| Test | Steps | Validation |
|------|-------|------------|
| **Basic drag** | Drag staff tile from bank → container | Tile appears in container, removed from bank |
| **Cross-container drag** | Drag tile from container A → container B | Tile in B, removed from A |
| **Invalid drop (type)** | Drag staff tile → Newcomer Bank | Tile returns to Staff Bank |
| **Drop outside** | Drag tile → empty board area | Tile returns to origin |
| **Rapid sequential drags** | Drag 5 tiles quickly one after another | All tiles land correctly |
| **Drag during search** | Search active, drag matching tile | Tile moves correctly, search state maintained |

### 5.2 Container Detection Tests

| Test | Steps | Validation |
|------|-------|------------|
| **Highlight on hover** | Drag tile, hover over container | Container border highlights |
| **Highlight changes** | Drag across two containers | Only current container highlights |
| **No highlight on open board** | Drag over empty area | No container highlighted |
| **Highlight clears on drop** | Drop tile | Highlight removed |

### 5.3 Resize Constraint Tests

| Test | Steps | Validation |
|------|-------|------------|
| **Resize larger** | Drag handle to enlarge | Container grows, grid recalculates |
| **Resize to minimum** | Drag handle to shrink past min | Resize stops at minimum |
| **Resize after adding tile** | Add tile, try shrink | New minimum enforced |
| **Resize after removing tile** | Remove tile, shrink | Container can now shrink further |

### 5.4 Layout Stability Tests

| Test | Steps | Validation |
|------|-------|------------|
| **Grid wrapping after resize** | Shrink container | Tiles wrap to more rows |
| **Grid expanding after resize** | Enlarge container | Tiles unwrap to fewer rows |
| **Layout after 20 drops** | Drop 20 tiles sequentially | Grid consistent, no overlapping |
| **Layout after rapid resize** | Resize 10 times quickly | Grid always correct after settle |

### 5.5 Persistence Tests

| Test | Steps | Validation |
|------|-------|------------|
| **Save on change** | Modify board, wait 600ms | LocalStorage updated |
| **Restore on load** | Save state, reload page | State matches pre-reload |
| **Undo after delete** | Delete tile, click undo | Tile restored to original zone |
| **Corrupt data recovery** | Inject malformed localStorage, reload | App loads with repaired state |

---

## 6. High-Volume Stress Tests

### 6.1 Test Configurations

| Configuration | Containers | Tiles | Purpose |
|---------------|-----------|-------|---------|
| **Standard** | 10 | 50 | Normal usage |
| **Heavy** | 25 | 100 | Large event |
| **Maximum** | 50 | 200 | Stress limit |
| **Extreme** | 100 | 500 | Breaking point discovery |

### 6.2 Stress Test Metrics

| Metric | Target (Standard) | Target (Maximum) |
|--------|-------------------|-------------------|
| Initial render time | < 100ms | < 500ms |
| Drag start latency | < 16ms | < 32ms |
| Drag FPS | 60 | 30 (minimum) |
| Drop + layout recalc | < 50ms | < 200ms |
| Search highlight | < 100ms | < 300ms |
| Memory usage | < 50MB | < 200MB |

### 6.3 Stress Test Procedure

1. Programmatically create `N` containers at random positions
2. Programmatically create `M` tiles (half staff, half newcomer)
3. Programmatically assign tiles to random containers
4. Drag one tile from container A to container B
5. Measure: drag start latency, frame rate during drag, drop latency
6. Search for a name shared by 10% of tiles
7. Measure: highlight application time
8. Resize a container with 20 tiles
9. Measure: layout recalculation time

---

## 7. Usability Testing

### 7.1 Test Protocol

| Step | Task | Observation |
|------|------|-------------|
| 1 | "You're managing an event with 30 staff across 8 positions. Set up the board." | Can operator create containers and tiles without instruction? |
| 2 | "Assign Alice to the Front Gate." | Can operator find Alice and drag her to the correct container? |
| 3 | "Move Bob from Registration to VIP Lounge." | Can operator reassign between containers fluidly? |
| 4 | "Bob has been working for 6 hours. Mark him as fatigued." | Does operator discover the fatigue toggle? |
| 5 | "Find all people named 'Sarah'." | Does operator use search? Is the highlight obvious? |
| 6 | "The VIP Lounge is no longer needed. Remove it." | Can operator delete a container and understand where tiles go? |
| 7 | "Close your browser and reopen the app." | Is the operator confident their data persists? |

### 7.2 Metrics

| Metric | Target |
|--------|--------|
| Task completion rate | 100% for all 7 tasks |
| Time per task | < 30 seconds average |
| Error rate | < 1 error per session |
| Board readability | Operator can state who is where in < 5 seconds |
| Training required | Zero — all tasks completed without instruction |

### 7.3 Test Participants

| Group | Count | Description |
|-------|-------|-------------|
| Event organizers | 3 | Target users with real operational experience |
| Non-technical users | 2 | Validate zero-training requirement |
| Power users | 2 | Test edge cases and stress behavior |

---

## 8. Cross-Browser Testing

| Browser | Version | Priority |
|---------|---------|----------|
| Chrome | Latest 2 versions | P0 |
| Firefox | Latest 2 versions | P0 |
| Safari | Latest 2 versions | P0 |
| Edge | Latest | P1 |
| Chrome (Android tablet) | Latest | P1 |
| Safari (iPad) | Latest | P1 |

### 8.1 Cross-Browser Checklist

- [ ] Drag-and-drop works with mouse
- [ ] Drag-and-drop works with touch (tablet)
- [ ] CSS renders correctly (no layout breaks)
- [ ] Animations play smoothly
- [ ] LocalStorage persistence works
- [ ] Scrolling behavior consistent
- [ ] Resize handles responsive
