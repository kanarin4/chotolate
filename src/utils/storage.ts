import { v4 as uuidv4 } from 'uuid'
import {
  BankType,
  FatigueState,
  TileType,
  type Bank,
  type BoardMode,
  type Container,
  type PersistedBoardState,
  type Tile,
} from '../types'
import { STORAGE_CONSTANTS } from './constants'
import { debugError, debugLog } from './debug'

interface PersistedBoardEnvelope extends PersistedBoardState {
  version: number
  savedAt: string
}

const STORAGE_KEY = `${STORAGE_CONSTANTS.KEY_PREFIX}:v${STORAGE_CONSTANTS.VERSION}`
const UI_MODE_STORAGE_KEY = `${STORAGE_CONSTANTS.KEY_PREFIX}:ui:v${STORAGE_CONSTANTS.VERSION}`

const canAccessLocalStorage = (): boolean => typeof window !== 'undefined' && 'localStorage' in window

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isPersistedBoardState = (value: unknown): value is PersistedBoardState => {
  if (!isRecord(value)) {
    return false
  }

  const board = value.board
  return (
    isRecord(board) &&
    typeof board.id === 'string' &&
    isRecord(value.containers) &&
    isRecord(value.banks) &&
    isRecord(value.tiles)
  )
}

const isPersistedBoardEnvelope = (value: unknown): value is PersistedBoardEnvelope => {
  return (
    isRecord(value) &&
    value.version === STORAGE_CONSTANTS.VERSION &&
    typeof value.savedAt === 'string' &&
    isPersistedBoardState(value)
  )
}

const getBankIdByType = (banks: Record<string, Bank>, bankType: BankType): string | null => {
  const matching = Object.values(banks).find((bank) => bank.bankType === bankType)
  return matching?.id ?? null
}

const isFatigueState = (value: string): value is Tile['fatigueState'] => {
  return (
    value === FatigueState.GREEN ||
    value === FatigueState.YELLOW ||
    value === FatigueState.RED
  )
}

const canTileEnterBank = (tileType: Tile['tileType'], bankType: BankType): boolean => {
  if (tileType === TileType.STAFF) {
    return bankType === BankType.STAFF
  }

  return bankType === BankType.NEWCOMER || bankType === BankType.COMPLETED_NEWCOMER
}

const canTileEnterContainer = (tileType: Tile['tileType'], container: Container): boolean => {
  if (tileType === TileType.STAFF) {
    return container.acceptsStaff
  }

  return container.acceptsNewcomers
}

const normalizePersistedBoardState = (
  state: PersistedBoardState,
): PersistedBoardState => {
  const boardId = state.board.id

  const banks: Record<string, Bank> = { ...state.banks }
  const ensureBank = (bankType: BankType): string => {
    const existingId = getBankIdByType(banks, bankType)
    if (existingId) {
      return existingId
    }

    const newId = uuidv4()
    banks[newId] = {
      id: newId,
      boardId,
      bankType,
    }
    debugLog('storage/repair-added-bank', {
      bankType,
      bankId: newId,
    })
    return newId
  }

  const staffBankId = ensureBank(BankType.STAFF)
  const newcomerBankId = ensureBank(BankType.NEWCOMER)
  ensureBank(BankType.COMPLETED_NEWCOMER)

  const containers: Record<string, Container> = Object.fromEntries(
    Object.entries(state.containers).map(([id, container]) => [
      id,
      {
        ...container,
        acceptsStaff: container.acceptsStaff ?? true,
        acceptsNewcomers: container.acceptsNewcomers ?? true,
      },
    ]),
  )

  const resolveDefaultBankId = (tileType: Tile['tileType']): string =>
    tileType === TileType.STAFF ? staffBankId : newcomerBankId

  const tiles: Record<string, Tile> = Object.fromEntries(
    Object.entries(state.tiles).map(([id, tile]) => {
      const tileType = tile.tileType === TileType.STAFF ? TileType.STAFF : TileType.NEWCOMER
      let currentZoneId = tile.currentZoneId

      const targetBank = banks[currentZoneId]
      const targetContainer = containers[currentZoneId]
      const fallbackZoneId = resolveDefaultBankId(tileType)

      if (!targetBank && !targetContainer) {
        currentZoneId = fallbackZoneId
      } else if (targetBank && !canTileEnterBank(tileType, targetBank.bankType)) {
        currentZoneId = fallbackZoneId
      } else if (targetContainer && !canTileEnterContainer(tileType, targetContainer)) {
        currentZoneId = fallbackZoneId
      }

      const fatigueState = isFatigueState(tile.fatigueState)
        ? tile.fatigueState
        : FatigueState.GREEN
      const normalizedFatigueState =
        tileType === TileType.NEWCOMER ? FatigueState.GREEN : fatigueState

      return [
        id,
        {
          ...tile,
          tileType,
          fatigueState: normalizedFatigueState,
          notes: tile.notes ?? '',
          currentZoneId,
        },
      ]
    }),
  )

  return {
    board: state.board,
    containers,
    banks,
    tiles,
  }
}

export function parseImportedBoardState(value: unknown): PersistedBoardState | null {
  if (isPersistedBoardState(value)) {
    return normalizePersistedBoardState(value)
  }

  if (isPersistedBoardEnvelope(value)) {
    return normalizePersistedBoardState({
      board: value.board,
      containers: value.containers,
      banks: value.banks,
      tiles: value.tiles,
    })
  }

  return null
}

export function loadPersistedBoardState(): PersistedBoardState | null {
  if (!canAccessLocalStorage()) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)

    const normalized = parseImportedBoardState(parsed)
    if (normalized) {
      debugLog('storage/load-success', {
        storageKey: STORAGE_KEY,
        version: isPersistedBoardEnvelope(parsed) ? parsed.version : 'legacy',
        savedAt: isPersistedBoardEnvelope(parsed) ? parsed.savedAt : undefined,
      })
      return normalized
    }

    debugLog('storage/load-invalid-shape', {
      storageKey: STORAGE_KEY,
    })
    return null
  } catch (error) {
    debugError('storage/load-failed', error)
    return null
  }
}

export function savePersistedBoardState(payload: PersistedBoardState): void {
  if (!canAccessLocalStorage()) {
    return
  }

  const envelope: PersistedBoardEnvelope = {
    version: STORAGE_CONSTANTS.VERSION,
    savedAt: new Date().toISOString(),
    ...payload,
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
    debugLog('storage/save-success', {
      storageKey: STORAGE_KEY,
      boardId: payload.board.id,
      tileCount: Object.keys(payload.tiles).length,
    })
  } catch (error) {
    debugError('storage/save-failed', error)
  }
}

const isBoardMode = (value: unknown): value is BoardMode =>
  value === 'setup' || value === 'command'

export function loadPersistedMode(): BoardMode | null {
  if (!canAccessLocalStorage()) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(UI_MODE_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)
    if (!isBoardMode(parsed)) {
      debugLog('storage/load-mode-invalid-shape', {
        storageKey: UI_MODE_STORAGE_KEY,
      })
      return null
    }

    debugLog('storage/load-mode-success', {
      storageKey: UI_MODE_STORAGE_KEY,
      mode: parsed,
    })
    return parsed
  } catch (error) {
    debugError('storage/load-mode-failed', error)
    return null
  }
}

export function savePersistedMode(mode: BoardMode): void {
  if (!canAccessLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(UI_MODE_STORAGE_KEY, JSON.stringify(mode))
    debugLog('storage/save-mode-success', {
      storageKey: UI_MODE_STORAGE_KEY,
      mode,
    })
  } catch (error) {
    debugError('storage/save-mode-failed', error)
  }
}
