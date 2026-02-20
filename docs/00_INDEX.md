# Chotolate — Documentation Index

> **Chotolate** — Staff Position Visualization Board
> A structured magnetic operations command board for event organizers.

---

## Document Map

| #  | File | Description |
|----|------|-------------|
| 00 | [00_INDEX.md](./00_INDEX.md) | This file — master index |
| 10 | [10_PRODUCT_OVERVIEW.md](./10_PRODUCT_OVERVIEW.md) | Product vision, purpose, and core concepts |
| 11 | [11_USER_ROLES.md](./11_USER_ROLES.md) | Operator roles and permission model |
| 20 | [20_UI_ARCHITECTURE.md](./20_UI_ARCHITECTURE.md) | Board layout, visual regions, and interaction surfaces |
| 21 | [21_DRAG_AND_SNAP_SYSTEM.md](./21_DRAG_AND_SNAP_SYSTEM.md) | Drag, collision, and snap mechanics |
| 22 | [22_ZONE_MODEL.md](./22_ZONE_MODEL.md) | Container/position zone creation, resize, and layout |
| 23 | [23_STAFF_STATE_MODEL.md](./23_STAFF_STATE_MODEL.md) | Tile states, fatigue, and metadata |
| 30 | [30_DATA_MODEL.md](./30_DATA_MODEL.md) | Entity schemas and relationships |
| 31 | [31_STATE_MANAGEMENT.md](./31_STATE_MANAGEMENT.md) | Client-side state architecture |
| 40 | [40_FRONTEND_ARCHITECTURE.md](./40_FRONTEND_ARCHITECTURE.md) | Framework, component tree, and technical stack |
| 50 | [50_IMPLEMENTATION_PLAN.md](./50_IMPLEMENTATION_PLAN.md) | MVP definition, build order, and dependency graph |
| 51 | [51_TASK_BREAKDOWN.md](./51_TASK_BREAKDOWN.md) | Granular, executable task list |
| 52 | [52_MILESTONES.md](./52_MILESTONES.md) | Development phases and delivery checkpoints |
| 60 | [60_TESTING_STRATEGY.md](./60_TESTING_STRATEGY.md) | Test plan across drag, layout, stress, and usability |
| 70 | [70_FUTURE_EXPANSION.md](./70_FUTURE_EXPANSION.md) | Post-MVP roadmap and extensibility |

### Progress Tracking

| File | Description |
|------|-------------|
| [checklist.md](./checklist.md) | Current implementation checklist by phase/task |
| [CHANGELOG.md](./CHANGELOG.md) | Chronological record of completed implementation changes |
| [DEVLOG.md](./DEVLOG.md) | Engineering rationale and implementation notes |
| [features/](./features/) | Per-feature implementation summaries |

---

## Reading Order

```
Product Understanding
  10_PRODUCT_OVERVIEW → 11_USER_ROLES

UI & Interaction Model
  20_UI_ARCHITECTURE → 21_DRAG_AND_SNAP_SYSTEM → 22_ZONE_MODEL → 23_STAFF_STATE_MODEL

Data & State
  30_DATA_MODEL → 31_STATE_MANAGEMENT

Technical Implementation
  40_FRONTEND_ARCHITECTURE → 50_IMPLEMENTATION_PLAN → 51_TASK_BREAKDOWN → 52_MILESTONES

Quality & Future
  60_TESTING_STRATEGY → 70_FUTURE_EXPANSION
```

---

## Design Philosophy

| Principle | Meaning |
|-----------|---------|
| **Clarity > Aesthetics** | Every element serves operational awareness |
| **Spatial Meaning** | Position on the board conveys assignment |
| **No Ambiguity** | No overlapping tiles, no hidden assignments |
| **3-Second Rule** | Board state must be readable in under 3 seconds |
| **Manual Control** | The operator owns every placement decision |
