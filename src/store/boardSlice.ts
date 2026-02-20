import { v4 as uuidv4 } from 'uuid'
import type { StateCreator } from 'zustand'
import {
  BankType,
  FatigueState,
  TileType,
  type Bank,
  type Board,
  type Container,
  type PersistedBoardState,
  type Tile,
} from '../types'
import { debugLog } from '../utils/debug'
import { calculateContainerMinSize } from '../utils/containerSizing'
import { LAYOUT_CONSTANTS } from '../utils/constants'
import type {
  AppStore,
  BoardSlice,
  ContainerChanges,
  CreateContainerInput,
  CreateTileInput,
  TileChanges,
} from './types'

const nowIso = (): string => new Date().toISOString()

const getMaxOrderForZone = (tiles: Record<string, Tile>, zoneId: string): number => {
  const orderIndexes = Object.values(tiles)
    .filter((tile) => tile.currentZoneId === zoneId)
    .map((tile) => tile.orderIndex)

  return orderIndexes.length ? Math.max(...orderIndexes) : -1
}

const getMaxZIndex = (containers: Record<string, Container>): number => {
  const zIndexes = Object.values(containers).map((container) => container.zIndex)
  return zIndexes.length ? Math.max(...zIndexes) : 0
}

const getBankIdByType = (banks: Record<string, Bank>, bankType: BankType): string | null => {
  const bank = Object.values(banks).find((entry) => entry.bankType === bankType)
  return bank?.id ?? null
}

const canTileEnterBank = (tileType: TileType, bankType: BankType): boolean => {
  if (tileType === TileType.STAFF) {
    return bankType === BankType.STAFF
  }

  return bankType === BankType.NEWCOMER || bankType === BankType.COMPLETED_NEWCOMER
}

const canTileEnterContainer = (tileType: TileType, container: Container): boolean => {
  if (tileType === TileType.STAFF) {
    return container.acceptsStaff
  }

  return container.acceptsNewcomers
}

const isValidZoneForTile = (
  tileType: TileType,
  targetZoneId: string,
  containers: Record<string, Container>,
  banks: Record<string, Bank>,
): boolean => {
  const targetContainer = containers[targetZoneId]
  if (targetContainer) {
    return canTileEnterContainer(tileType, targetContainer)
  }

  const targetBank = banks[targetZoneId]
  if (!targetBank) {
    return false
  }

  return canTileEnterBank(tileType, targetBank.bankType)
}

const resolveDefaultBankForTile = (
  tileType: TileType,
  banks: Record<string, Bank>,
): string | null => {
  return tileType === TileType.STAFF
    ? getBankIdByType(banks, BankType.STAFF)
    : getBankIdByType(banks, BankType.NEWCOMER)
}

const createInitialBoardState = (): Pick<BoardSlice, 'board' | 'containers' | 'banks' | 'tiles'> => {
  const timestamp = nowIso()
  const boardId = uuidv4()

  const staffBankId = uuidv4()
  const newcomerBankId = uuidv4()
  const completedBankId = uuidv4()

  const firstContainerId = uuidv4()

  const board: Board = {
    id: boardId,
    name: 'Chotolate Board',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const banks: Record<string, Bank> = {
    [staffBankId]: { id: staffBankId, boardId, bankType: BankType.STAFF },
    [newcomerBankId]: { id: newcomerBankId, boardId, bankType: BankType.NEWCOMER },
    [completedBankId]: { id: completedBankId, boardId, bankType: BankType.COMPLETED_NEWCOMER },
  }

  const containers: Record<string, Container> = {
    [firstContainerId]: {
      id: firstContainerId,
      boardId,
      name: 'Front Gate',
      acceptsStaff: true,
      acceptsNewcomers: true,
      x: 80,
      y: 64,
      width: 520,
      height: 260,
      zIndex: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  }

  const staffContainerTileId = uuidv4()
  const staffBankTileId = uuidv4()
  const newcomerBankTileId = uuidv4()
  const completedTileId = uuidv4()

  const tiles: Record<string, Tile> = {
    [staffContainerTileId]: {
      id: staffContainerTileId,
      boardId,
      currentZoneId: firstContainerId,
      name: 'Aki',
      tileType: TileType.STAFF,
      fatigueState: FatigueState.GREEN,
      notes: '',
      orderIndex: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    [staffBankTileId]: {
      id: staffBankTileId,
      boardId,
      currentZoneId: staffBankId,
      name: 'Mina',
      tileType: TileType.STAFF,
      fatigueState: FatigueState.YELLOW,
      notes: '',
      orderIndex: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    [newcomerBankTileId]: {
      id: newcomerBankTileId,
      boardId,
      currentZoneId: newcomerBankId,
      name: 'Kai',
      tileType: TileType.NEWCOMER,
      fatigueState: FatigueState.GREEN,
      notes: '',
      orderIndex: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    [completedTileId]: {
      id: completedTileId,
      boardId,
      currentZoneId: completedBankId,
      name: 'Rin',
      tileType: TileType.NEWCOMER,
      fatigueState: FatigueState.RED,
      notes: '',
      orderIndex: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  }

  return {
    board,
    containers,
    banks,
    tiles,
  }
}

const initialState = createInitialBoardState()

const logBoardAction = (action: string, payload?: unknown): void => {
  debugLog(`store/board/${action}`, payload)
}

export const createBoardSlice: StateCreator<AppStore, [], [], BoardSlice> = (set, get) => ({
  board: initialState.board,
  containers: initialState.containers,
  banks: initialState.banks,
  tiles: initialState.tiles,

  loadBoard: (payload: PersistedBoardState) => {
    logBoardAction('loadBoard', {
      boardId: payload.board.id,
      containerCount: Object.keys(payload.containers).length,
      bankCount: Object.keys(payload.banks).length,
      tileCount: Object.keys(payload.tiles).length,
    })

    set({
      board: payload.board,
      containers: payload.containers,
      banks: payload.banks,
      tiles: payload.tiles,
    })
  },

  updateBoardName: (name: string) => {
    logBoardAction('updateBoardName', { name })

    set((state) => {
      if (!state.board) {
        return state
      }

      return {
        board: {
          ...state.board,
          name,
          updatedAt: nowIso(),
        },
      }
    })
  },

  saveBoard: (): PersistedBoardState | null => {
    logBoardAction('saveBoard')

    const { board, containers, banks, tiles } = get()

    if (!board) {
      logBoardAction('saveBoard/failed-missing-board')
      return null
    }

    return { board, containers, banks, tiles }
  },

  createContainer: (payload?: CreateContainerInput): string => {
    const id = uuidv4()
    const timestamp = nowIso()
    const name = payload?.name?.trim() ? payload.name : 'New Position'
    const width = payload?.width ?? LAYOUT_CONSTANTS.CONTAINER_DEFAULT_WIDTH
    const height = payload?.height ?? LAYOUT_CONSTANTS.CONTAINER_DEFAULT_HEIGHT
    const x = payload?.x ?? 120
    const y = payload?.y ?? 120

    logBoardAction('createContainer', { id, name, x, y, width, height })

    set((state) => ({
      containers: {
        ...state.containers,
        [id]: {
          id,
          boardId: state.board?.id ?? '',
          name,
          acceptsStaff: true,
          acceptsNewcomers: true,
          x,
          y,
          width,
          height,
          zIndex: getMaxZIndex(state.containers) + 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
    }))

    return id
  },

  updateContainer: (id: string, changes: ContainerChanges) => {
    logBoardAction('updateContainer', { id, changes })

    set((state) => {
      const current = state.containers[id]
      if (!current) {
        return state
      }

      return {
        containers: {
          ...state.containers,
          [id]: {
            ...current,
            ...changes,
            updatedAt: nowIso(),
          },
        },
      }
    })
  },

  moveContainer: (id: string, x: number, y: number) => {
    logBoardAction('moveContainer', { id, x, y })

    set((state) => {
      const current = state.containers[id]
      if (!current) {
        return state
      }

      return {
        containers: {
          ...state.containers,
          [id]: {
            ...current,
            x,
            y,
            updatedAt: nowIso(),
          },
        },
      }
    })
  },

  resizeContainer: (id: string, width: number, height: number) => {
    logBoardAction('resizeContainer', { id, width, height })

    set((state) => {
      const current = state.containers[id]
      if (!current) {
        return state
      }

      return {
        containers: {
          ...state.containers,
          [id]: {
            ...current,
            width: Math.max(width, LAYOUT_CONSTANTS.CONTAINER_MIN_WIDTH),
            height: Math.max(height, LAYOUT_CONSTANTS.CONTAINER_MIN_HEIGHT),
            updatedAt: nowIso(),
          },
        },
      }
    })
  },

  deleteContainer: (id: string) => {
    logBoardAction('deleteContainer', { id })

    set((state) => {
      if (!state.containers[id]) {
        return state
      }

      const timestamp = nowIso()
      const nextContainers = { ...state.containers }
      delete nextContainers[id]

      const staffBankId = getBankIdByType(state.banks, BankType.STAFF)
      const newcomerBankId = getBankIdByType(state.banks, BankType.NEWCOMER)

      const nextTiles: Record<string, Tile> = { ...state.tiles }
      let staffOrder = staffBankId ? getMaxOrderForZone(nextTiles, staffBankId) : -1
      let newcomerOrder = newcomerBankId ? getMaxOrderForZone(nextTiles, newcomerBankId) : -1

      Object.values(nextTiles).forEach((tile) => {
        if (tile.currentZoneId !== id) {
          return
        }

        if (tile.tileType === TileType.STAFF && staffBankId) {
          staffOrder += 1
          nextTiles[tile.id] = {
            ...tile,
            currentZoneId: staffBankId,
            orderIndex: staffOrder,
            updatedAt: timestamp,
          }
          return
        }

        if (tile.tileType === TileType.NEWCOMER && newcomerBankId) {
          newcomerOrder += 1
          nextTiles[tile.id] = {
            ...tile,
            currentZoneId: newcomerBankId,
            orderIndex: newcomerOrder,
            updatedAt: timestamp,
          }
        }
      })

      return {
        containers: nextContainers,
        tiles: nextTiles,
      }
    })
  },

  bringToFront: (id: string) => {
    logBoardAction('bringToFront', { id })

    set((state) => {
      const current = state.containers[id]
      if (!current) {
        return state
      }

      return {
        containers: {
          ...state.containers,
          [id]: {
            ...current,
            zIndex: getMaxZIndex(state.containers) + 1,
            updatedAt: nowIso(),
          },
        },
      }
    })
  },

  createTile: (payload: CreateTileInput): string | null => {
    logBoardAction('createTile', payload)

    const { board, banks, tiles } = get()
    if (!board) {
      logBoardAction('createTile/failed-missing-board')
      return null
    }

    const targetZoneId =
      payload.tileType === TileType.STAFF
        ? getBankIdByType(banks, BankType.STAFF)
        : getBankIdByType(banks, BankType.NEWCOMER)

    if (!targetZoneId) {
      logBoardAction('createTile/failed-missing-target-zone', { tileType: payload.tileType })
      return null
    }

    const id = uuidv4()
    const timestamp = nowIso()

    const tile: Tile = {
      id,
      boardId: board.id,
      currentZoneId: targetZoneId,
      name: payload.name,
      tileType: payload.tileType,
      fatigueState: FatigueState.GREEN,
      notes: payload.notes ?? '',
      orderIndex: getMaxOrderForZone(tiles, targetZoneId) + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    set((state) => ({
      tiles: {
        ...state.tiles,
        [id]: tile,
      },
    }))

    return id
  },

  restoreTile: (tileSnapshot: Tile) => {
    logBoardAction('restoreTile', {
      id: tileSnapshot.id,
      tileType: tileSnapshot.tileType,
      currentZoneId: tileSnapshot.currentZoneId,
    })

    set((state) => {
      const zoneIsValid = isValidZoneForTile(
        tileSnapshot.tileType,
        tileSnapshot.currentZoneId,
        state.containers,
        state.banks,
      )
      const fallbackZoneId = resolveDefaultBankForTile(tileSnapshot.tileType, state.banks)
      const targetZoneId = zoneIsValid ? tileSnapshot.currentZoneId : fallbackZoneId

      if (!targetZoneId) {
        logBoardAction('restoreTile/failed-missing-target-zone', {
          tileId: tileSnapshot.id,
          tileType: tileSnapshot.tileType,
        })
        return state
      }

      return {
        tiles: {
          ...state.tiles,
          [tileSnapshot.id]: {
            ...tileSnapshot,
            currentZoneId: targetZoneId,
            orderIndex: getMaxOrderForZone(state.tiles, targetZoneId) + 1,
            updatedAt: nowIso(),
          },
        },
      }
    })
  },

  updateTile: (id: string, changes: TileChanges) => {
    logBoardAction('updateTile', { id, changes })

    set((state) => {
      const current = state.tiles[id]
      if (!current) {
        return state
      }

      return {
        tiles: {
          ...state.tiles,
          [id]: {
            ...current,
            ...changes,
            updatedAt: nowIso(),
          },
        },
      }
    })
  },

  deleteTile: (id: string) => {
    logBoardAction('deleteTile', { id })

    set((state) => {
      if (!state.tiles[id]) {
        return state
      }

      const nextTiles = { ...state.tiles }
      delete nextTiles[id]

      return {
        tiles: nextTiles,
      }
    })
  },

  moveTile: (id: string, targetZoneId: string) => {
    logBoardAction('moveTile', { id, targetZoneId })

    set((state) => {
      const tile = state.tiles[id]
      if (!tile) {
        return state
      }

      const targetContainer = state.containers[targetZoneId]
      const targetBank = state.banks[targetZoneId]

      if (!targetContainer && !targetBank) {
        logBoardAction('moveTile/invalid-target-zone', { id, targetZoneId })
        return state
      }

      if (targetBank && !canTileEnterBank(tile.tileType, targetBank.bankType)) {
        logBoardAction('moveTile/invalid-bank-for-type', {
          id,
          targetZoneId,
          tileType: tile.tileType,
          bankType: targetBank.bankType,
        })
        return state
      }

      if (
        targetContainer &&
        ((tile.tileType === TileType.STAFF && !targetContainer.acceptsStaff) ||
          (tile.tileType === TileType.NEWCOMER && !targetContainer.acceptsNewcomers))
      ) {
        logBoardAction('moveTile/invalid-container-section-for-type', {
          id,
          targetZoneId,
          tileType: tile.tileType,
          acceptsStaff: targetContainer.acceptsStaff,
          acceptsNewcomers: targetContainer.acceptsNewcomers,
        })
        return state
      }

      const timestamp = nowIso()

      const nextTiles: Record<string, Tile> = {
        ...state.tiles,
        [id]: {
          ...tile,
          currentZoneId: targetZoneId,
          orderIndex: getMaxOrderForZone(state.tiles, targetZoneId) + 1,
          updatedAt: timestamp,
        },
      }

      if (!targetContainer) {
        return {
          tiles: nextTiles,
        }
      }

      const targetContainerTiles = Object.values(nextTiles).filter(
        (candidateTile) => candidateTile.currentZoneId === targetZoneId,
      )
      const targetMinSize = calculateContainerMinSize(targetContainer.width, targetContainerTiles, {
        showStaffSection: targetContainer.acceptsStaff,
        showNewcomerSection: targetContainer.acceptsNewcomers,
      })
      const grownWidth = Math.max(targetContainer.width, targetMinSize.minWidth)
      const grownHeight = Math.max(targetContainer.height, targetMinSize.minHeight)

      if (grownWidth === targetContainer.width && grownHeight === targetContainer.height) {
        return {
          tiles: nextTiles,
        }
      }

      return {
        tiles: nextTiles,
        containers: {
          ...state.containers,
          [targetContainer.id]: {
            ...targetContainer,
            width: grownWidth,
            height: grownHeight,
            updatedAt: timestamp,
          },
        },
      }
    })
  },

  cycleFatigue: (id: string) => {
    logBoardAction('cycleFatigue', { id })

    set((state) => {
      const tile = state.tiles[id]
      if (!tile) {
        return state
      }

      const nextFatigue =
        tile.fatigueState === FatigueState.GREEN
          ? FatigueState.YELLOW
          : tile.fatigueState === FatigueState.YELLOW
            ? FatigueState.RED
            : FatigueState.GREEN

      return {
        tiles: {
          ...state.tiles,
          [id]: {
            ...tile,
            fatigueState: nextFatigue,
            updatedAt: nowIso(),
          },
        },
      }
    })
  },

  setFatigue: (id: string, fatigueState: FatigueState) => {
    logBoardAction('setFatigue', { id, fatigueState })

    set((state) => {
      const tile = state.tiles[id]
      if (!tile) {
        return state
      }

      return {
        tiles: {
          ...state.tiles,
          [id]: {
            ...tile,
            fatigueState,
            updatedAt: nowIso(),
          },
        },
      }
    })
  },
})
