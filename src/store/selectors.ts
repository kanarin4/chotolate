import { BankType, type Bank, type Container, type Tile } from '../types'
import { calculateContainerMinSize } from '../utils/containerSizing'
import type { AppStore } from './types'

const containersCache = new WeakMap<Record<string, Container>, Container[]>()
const banksCache = new WeakMap<Record<string, Bank>, Bank[]>()
const tilesCache = new WeakMap<Record<string, Tile>, Tile[]>()
const tilesByZoneCache = new WeakMap<Record<string, Tile>, Record<string, Tile[]>>()
const tileCountsCache = new WeakMap<Record<string, Tile[]>, Record<string, number>>()
const containerMinSizesCache = new WeakMap<
  Record<string, Container>,
  WeakMap<Record<string, Tile>, Record<string, { minWidth: number; minHeight: number }>>
>()
const zoneLookupCache = new WeakMap<
  Record<string, Container>,
  WeakMap<Record<string, Bank>, Record<string, Container | Bank>>
>()
const searchMatchesCache = new WeakMap<Record<string, Tile>, Map<string, Set<string>>>()
const EMPTY_SEARCH_MATCHES = new Set<string>()

export const selectBoard = (state: AppStore) => state.board

export const selectContainersRecord = (state: AppStore) => state.containers
export const selectBanksRecord = (state: AppStore) => state.banks
export const selectTilesRecord = (state: AppStore) => state.tiles

export const selectContainers = (state: AppStore): Container[] => {
  const cached = containersCache.get(state.containers)
  if (cached) {
    return cached
  }

  const computed = Object.values(state.containers).sort((a, b) => a.zIndex - b.zIndex)
  containersCache.set(state.containers, computed)
  return computed
}

export const selectBanks = (state: AppStore): Bank[] => {
  const cached = banksCache.get(state.banks)
  if (cached) {
    return cached
  }

  const computed = Object.values(state.banks)
  banksCache.set(state.banks, computed)
  return computed
}

export const selectTiles = (state: AppStore): Tile[] => {
  const cached = tilesCache.get(state.tiles)
  if (cached) {
    return cached
  }

  const computed = Object.values(state.tiles).sort((a, b) => a.orderIndex - b.orderIndex)
  tilesCache.set(state.tiles, computed)
  return computed
}

export const selectTilesByZone = (state: AppStore): Record<string, Tile[]> => {
  const cached = tilesByZoneCache.get(state.tiles)
  if (cached) {
    return cached
  }

  const grouped: Record<string, Tile[]> = {}

  for (const tile of selectTiles(state)) {
    if (!grouped[tile.currentZoneId]) {
      grouped[tile.currentZoneId] = []
    }

    grouped[tile.currentZoneId].push(tile)
  }

  tilesByZoneCache.set(state.tiles, grouped)
  return grouped
}

export const selectTileCounts = (state: AppStore): Record<string, number> => {
  const tilesByZone = selectTilesByZone(state)
  const cached = tileCountsCache.get(tilesByZone)

  if (cached) {
    return cached
  }

  const computed = Object.fromEntries(
    Object.entries(tilesByZone).map(([zoneId, tiles]) => [zoneId, tiles.length]),
  )

  tileCountsCache.set(tilesByZone, computed)
  return computed
}

export const selectZoneLookup = (state: AppStore): Record<string, Container | Bank> => {
  const byBanksCache = zoneLookupCache.get(state.containers)
  const cached = byBanksCache?.get(state.banks)

  if (cached) {
    return cached
  }

  const computed: Record<string, Container | Bank> = {
    ...state.containers,
    ...state.banks,
  }

  const nextByBanksCache = byBanksCache ?? new WeakMap<Record<string, Bank>, Record<string, Container | Bank>>()
  nextByBanksCache.set(state.banks, computed)
  zoneLookupCache.set(state.containers, nextByBanksCache)

  return computed
}

export const selectContainerMinSizes = (
  state: AppStore,
): Record<string, { minWidth: number; minHeight: number }> => {
  const byTilesCache = containerMinSizesCache.get(state.containers)
  const cached = byTilesCache?.get(state.tiles)

  if (cached) {
    return cached
  }

  const tilesByZone = selectTilesByZone(state)

  const computed = Object.fromEntries(
    Object.values(state.containers).map((container) => {
      const sectionSizing = calculateContainerMinSize(container.width, tilesByZone[container.id] ?? [], {
        showStaffSection: container.acceptsStaff,
        showNewcomerSection: container.acceptsNewcomers,
      })

      return [container.id, { minWidth: sectionSizing.minWidth, minHeight: sectionSizing.minHeight }]
    }),
  )

  const nextByTilesCache =
    byTilesCache ??
    new WeakMap<Record<string, Tile>, Record<string, { minWidth: number; minHeight: number }>>()
  nextByTilesCache.set(state.tiles, computed)
  containerMinSizesCache.set(state.containers, nextByTilesCache)

  return computed
}

export const selectSearchMatches = (state: AppStore): Set<string> => {
  const query = state.searchQuery.trim().toLowerCase()

  if (!query) {
    return EMPTY_SEARCH_MATCHES
  }

  const queryCache = searchMatchesCache.get(state.tiles) ?? new Map<string, Set<string>>()
  const cached = queryCache.get(query)

  if (cached) {
    return cached
  }

  const matchingIds = Object.values(state.tiles)
    .filter((tile) => tile.name.toLowerCase().includes(query))
    .map((tile) => tile.id)

  const computed = new Set(matchingIds)
  queryCache.set(query, computed)
  searchMatchesCache.set(state.tiles, queryCache)

  return computed
}

export const selectIsAnyTileDragging = (state: AppStore): boolean => state.dragState !== null

export const selectBankByType = (bankType: BankType) => (state: AppStore): Bank | undefined =>
  Object.values(state.banks).find((bank) => bank.bankType === bankType)

export const selectStaffBank = selectBankByType(BankType.STAFF)
export const selectNewcomerBank = selectBankByType(BankType.NEWCOMER)
export const selectCompletedBank = selectBankByType(BankType.COMPLETED_NEWCOMER)
