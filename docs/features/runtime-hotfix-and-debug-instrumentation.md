# Runtime Hotfix and Debug Instrumentation

Date: 2026-02-19

## Scope
- Fix runtime error reported in browser console:
  - `The result of getSnapshot should be cached to avoid an infinite loop`
  - `Maximum update depth exceeded`
- Add broad console debug instrumentation across app lifecycle and state updates.

## Root Cause
`AppShell` subscribed to derived Zustand selectors that created new arrays/maps each read (`selectContainers`, `selectTilesByZone`, bank lookups). Under React's external-store snapshot expectations, these non-stable selector results can trigger repeated rerendering and eventually an update-depth crash.

## Fix Implemented
- `src/containers/AppShell.tsx`
  - replaced derived selector subscriptions with stable store-slice subscriptions:
    - `containers`
    - `banks`
    - `tiles`
  - derived view data via `useMemo`:
    - sorted containers
    - grouped tiles by zone
    - banks mapped by type

## Debug Instrumentation Added
- `src/utils/debug.ts`
  - `debugLog` and `debugError` utilities (dev-mode gated)
- `src/App.tsx`
  - drag lifecycle logs and missing-tile error logs
- `src/store/boardSlice.ts`
  - logs for each board action and key validation failures
- `src/store/uiSlice.ts`
  - logs for each UI/drag action
- `src/store/index.ts`
  - global store subscription logs with changed keys and state summary
- component-level render/interaction traces:
  - `src/containers/AppShell.tsx`
  - `src/components/Container/Container.tsx`
  - `src/components/Bank/StaffBank.tsx`
  - `src/components/Bank/NewcomerBank.tsx`
  - `src/components/Bank/CompletedBank.tsx`
  - `src/components/Tile/Tile.tsx`
- selector stabilization:
  - `src/store/selectors.ts` now memoizes derived outputs to preserve snapshot stability when state references are unchanged.

## Validation
- `npm run lint` passes
- `npm run build` passes
