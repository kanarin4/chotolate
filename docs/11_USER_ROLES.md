# Chotolate — User Roles

## 1. Overview

Chotolate is designed for a single primary user type: the **Operator**. The MVP does not include multi-user collaboration or role-based access control. Future expansions may introduce viewer roles and multi-operator sync.

---

## 2. Operator Role

### 2.1 Definition

The Operator is the person actively managing the command board during an event. This is typically the event organizer, operations lead, or designated staff coordinator.

### 2.2 Capabilities

| Capability | Description |
|-----------|-------------|
| **Create Containers** | Define new operational positions on the board |
| **Edit Containers** | Rename, resize, reposition, and delete containers |
| **Create Tiles** | Add staff members and newcomers |
| **Edit Tiles** | Update name, metadata, and fatigue state |
| **Delete Tiles** | Remove staff or newcomers from the board |
| **Drag and Drop** | Move tiles between containers and banks |
| **Search** | Find and highlight tiles by name |
| **Toggle Fatigue** | Manually cycle fatigue color on any tile |
| **Manage Banks** | View and manage staff bank, newcomer bank, and completed newcomer bank |

### 2.3 Operator Assumptions

- The operator has **full control** over the board
- The operator is the **sole source of truth** for placement decisions
- No automated reassignment occurs — all moves are manual
- The operator is expected to have **context about the event** (knowing who people are, what positions mean)

---

## 3. Non-User Entities

### 3.1 Staff (Tile Entity)

Staff members are **represented on the board** but do not interact with the system. They exist as tiles that the operator places.

| Attribute | Description |
|-----------|-------------|
| Name | Display name on tile |
| Role | Always "staff" |
| Fatigue State | green / yellow / red (set by operator) |
| Metadata | Freeform notes editable via info modal |
| Location | Current container or Staff Bank |

### 3.2 Newcomers (Tile Entity)

Newcomers follow a processing lifecycle but do not interact with the system directly.

| Attribute | Description |
|-----------|-------------|
| Name | Display name on tile |
| Role | Always "newcomer" |
| Fatigue State | green / yellow / red (set by operator) |
| Metadata | Freeform notes editable via info modal |
| Location | Newcomer Bank → Container → Completed Newcomer Bank |

### 3.3 Newcomer Lifecycle

```
┌──────────────┐      ┌───────────────────┐      ┌────────────────────────┐
│ Newcomer Bank │ ──→  │ Position Container │ ──→  │ Completed Newcomer Bank│
│ (awaiting)    │      │ (being processed)  │      │ (finished)             │
└──────────────┘      └───────────────────┘      └────────────────────────┘
```

The operator manually moves newcomer tiles through this lifecycle by dragging.

---

## 4. Future Roles (Post-MVP)

| Role | Description | Phase |
|------|-------------|-------|
| **Viewer** | Read-only access to the board state | Future |
| **Multi-Operator** | Multiple operators editing the same board concurrently | Future |
| **Admin** | Manages operator accounts and board templates | Future |

These roles are documented for architectural awareness but are **out of scope** for the MVP.

---

## 5. Access Model (MVP)

The MVP operates as a **single-user, local-first application**:

- No authentication required
- No user accounts
- One operator per board instance
- Data persisted in browser storage
- No sharing or collaboration in MVP

This simplifies the initial build while preserving the option to layer authentication and multi-user sync in future phases.
