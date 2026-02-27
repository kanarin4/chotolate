import { v4 as uuidv4 } from 'uuid'
import {
  BankType,
  House,
  TileType,
  type Bank,
  type BoardMode,
  type Container,
  type NameTemplates,
  type PersistedBoardState,
  type Tile,
} from '../types'
import { DEFAULT_NAME_TEMPLATES, STORAGE_CONSTANTS } from './constants'
import { debugError, debugLog } from './debug'

interface PersistedBoardEnvelope extends PersistedBoardState {
  version: number
  savedAt: string
}

export interface BoardSnapshotSummary {
  id: string
  savedAt: string
  source: 'autosave' | 'manual' | 'lifecycle'
  containerCount: number
  bankCount: number
  tileCount: number
}

interface BoardSnapshotRecord {
  id: string
  savedAt: string
  savedAtMs: number
  source: 'autosave' | 'manual' | 'lifecycle'
  state: PersistedBoardState
}

const STORAGE_KEY = `${STORAGE_CONSTANTS.KEY_PREFIX}:v${STORAGE_CONSTANTS.VERSION}`
const UI_MODE_STORAGE_KEY = `${STORAGE_CONSTANTS.KEY_PREFIX}:ui:v${STORAGE_CONSTANTS.VERSION}`
const NAME_TEMPLATES_STORAGE_KEY = `${STORAGE_CONSTANTS.KEY_PREFIX}:name-templates:v${STORAGE_CONSTANTS.VERSION}`
const SNAPSHOT_STORE_INDEX = 'savedAtMs'

const canAccessLocalStorage = (): boolean => typeof window !== 'undefined' && 'localStorage' in window
const canAccessIndexedDb = (): boolean => typeof window !== 'undefined' && 'indexedDB' in window

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isNameTemplates = (value: unknown): value is NameTemplates =>
  isRecord(value) &&
  typeof value.staff === 'string' &&
  typeof value.newcomer === 'string' &&
  typeof value.container === 'string'

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

const isValidHouse = (value: string): value is Tile['house'] => {
  return (
    value === House.RED ||
    value === House.YELLOW ||
    value === House.BLUE ||
    value === House.GREEN
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

      const houseRaw = (tile.house || (tile as any).fatigueState || '').toLowerCase()
      const normalizedHouse: Tile['house'] = isValidHouse(houseRaw)
        ? houseRaw
        : House.GREEN

      return [
        id,
        {
          ...tile,
          tileType,
          house: normalizedHouse,
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

export async function saveBoardSnapshot(
  payload: PersistedBoardState,
  source: 'autosave' | 'manual' | 'lifecycle' = 'autosave',
): Promise<void> {
  if (!canAccessIndexedDb()) {
    return
  }
  const savedAt = new Date().toISOString()
  const record: BoardSnapshotRecord = {
    id: uuidv4(),
    savedAt,
    savedAtMs: Date.parse(savedAt),
    source,
    state: normalizePersistedBoardState(payload),
  }

  let db: IDBDatabase | null = null
  try {
    db = await openSnapshotsDatabase()
    const transaction = db.transaction(STORAGE_CONSTANTS.SNAPSHOT_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORAGE_CONSTANTS.SNAPSHOT_STORE_NAME)
    store.put(record)
    await waitForTransaction(transaction)

    await applySnapshotRetentionPolicy(db)

    debugLog('storage/snapshot-save-success', {
      snapshotId: record.id,
      source: record.source,
      tileCount: Object.keys(record.state.tiles).length,
    })
  } catch (error) {
    debugError('storage/snapshot-save-failed', error)
  } finally {
    db?.close()
  }
}

export async function clearAllSnapshots(): Promise<void> {
  if (!canAccessIndexedDb()) {
    return
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.deleteDatabase(STORAGE_CONSTANTS.SNAPSHOT_DB_NAME)

    request.onsuccess = () => {
      debugLog('storage/snapshot-db-deleted')
      resolve()
    }

    request.onerror = () => {
      debugLog('storage/snapshot-db-delete-failed', request.error)
      reject(request.error ?? new Error('Failed to delete snapshot database'))
    }

    request.onblocked = () => {
      debugLog('storage/snapshot-db-delete-blocked')
      // If blocked, we might want to alert the user or just resolve eventually
      // but choosing to resolve to allow the UI to continue
      resolve()
    }
  })
}

export async function listBoardSnapshots(limit = 20): Promise<BoardSnapshotSummary[]> {
  if (!canAccessIndexedDb()) {
    return []
  }
  let db: IDBDatabase | null = null
  try {
    db = await openSnapshotsDatabase()
    const allRecords = await loadAllSnapshotRecords(db)
    return allRecords
      .sort((a, b) => b.savedAtMs - a.savedAtMs)
      .slice(0, limit)
      .map(createSnapshotSummary)
  } catch (error) {
    debugError('storage/snapshot-list-failed', error)
    return []
  } finally {
    db?.close()
  }
}

export async function loadBoardSnapshot(snapshotId: string): Promise<PersistedBoardState | null> {
  if (!canAccessIndexedDb()) {
    return null
  }
  let db: IDBDatabase | null = null
  try {
    db = await openSnapshotsDatabase()
    const transaction = db.transaction(STORAGE_CONSTANTS.SNAPSHOT_STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORAGE_CONSTANTS.SNAPSHOT_STORE_NAME)
    const record = await requestToPromise<BoardSnapshotRecord | undefined>(store.get(snapshotId))
    await waitForTransaction(transaction)

    if (!record) {
      return null
    }

    return normalizePersistedBoardState(record.state)
  } catch (error) {
    debugError('storage/snapshot-load-failed', error)
    return null
  } finally {
    db?.close()
  }
}

export async function loadLatestBoardSnapshot(): Promise<PersistedBoardState | null> {
  const [latest] = await listBoardSnapshots(1)
  if (!latest) {
    return null
  }

  return loadBoardSnapshot(latest.id)
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

export function loadPersistedNameTemplates(): NameTemplates | null {
  if (!canAccessLocalStorage()) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(NAME_TEMPLATES_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)
    if (!isNameTemplates(parsed)) {
      debugLog('storage/load-name-templates-invalid-shape', {
        storageKey: NAME_TEMPLATES_STORAGE_KEY,
      })
      return null
    }

    const mergedTemplates: NameTemplates = {
      ...DEFAULT_NAME_TEMPLATES,
      ...parsed,
    }

    debugLog('storage/load-name-templates-success', {
      storageKey: NAME_TEMPLATES_STORAGE_KEY,
      templates: mergedTemplates,
    })
    return mergedTemplates
  } catch (error) {
    debugError('storage/load-name-templates-failed', error)
    return null
  }
}

export function savePersistedNameTemplates(nameTemplates: NameTemplates): void {
  if (!canAccessLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(NAME_TEMPLATES_STORAGE_KEY, JSON.stringify(nameTemplates))
    debugLog('storage/save-name-templates-success', {
      storageKey: NAME_TEMPLATES_STORAGE_KEY,
      templates: nameTemplates,
    })
  } catch (error) {
    debugError('storage/save-name-templates-failed', error)
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

const createSnapshotSummary = (record: BoardSnapshotRecord): BoardSnapshotSummary => ({
  id: record.id,
  savedAt: record.savedAt,
  source: record.source,
  containerCount: Object.keys(record.state.containers).length,
  bankCount: Object.keys(record.state.banks).length,
  tileCount: Object.keys(record.state.tiles).length,
})

const waitForTransaction = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve()
    }
    transaction.onerror = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction failed'))
    }
    transaction.onabort = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
    }
  })

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result)
    }
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB request failed'))
    }
  })

const openSnapshotsDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (!canAccessIndexedDb()) {
      reject(new Error('IndexedDB unavailable'))
      return
    }

    const request = window.indexedDB.open(
      STORAGE_CONSTANTS.SNAPSHOT_DB_NAME,
      STORAGE_CONSTANTS.SNAPSHOT_DB_VERSION,
    )

    request.onupgradeneeded = () => {
      const db = request.result
      const store = db.objectStoreNames.contains(STORAGE_CONSTANTS.SNAPSHOT_STORE_NAME)
        ? request.transaction?.objectStore(STORAGE_CONSTANTS.SNAPSHOT_STORE_NAME)
        : db.createObjectStore(STORAGE_CONSTANTS.SNAPSHOT_STORE_NAME, {
          keyPath: 'id',
        })

      if (store && !store.indexNames.contains(SNAPSHOT_STORE_INDEX)) {
        store.createIndex(SNAPSHOT_STORE_INDEX, SNAPSHOT_STORE_INDEX)
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open snapshot database'))
    }
  })

const loadAllSnapshotRecords = async (db: IDBDatabase): Promise<BoardSnapshotRecord[]> => {
  const transaction = db.transaction(STORAGE_CONSTANTS.SNAPSHOT_STORE_NAME, 'readonly')
  const store = transaction.objectStore(STORAGE_CONSTANTS.SNAPSHOT_STORE_NAME)
  const records = await requestToPromise<BoardSnapshotRecord[]>(store.getAll())
  await waitForTransaction(transaction)
  return records
}

const applySnapshotRetentionPolicy = async (db: IDBDatabase): Promise<void> => {
  const allRecords = await loadAllSnapshotRecords(db)
  const excessCount = allRecords.length - STORAGE_CONSTANTS.SNAPSHOT_HISTORY_LIMIT
  if (excessCount <= 0) {
    return
  }

  const staleRecords = [...allRecords]
    .sort((a, b) => a.savedAtMs - b.savedAtMs)
    .slice(0, excessCount)

  const transaction = db.transaction(STORAGE_CONSTANTS.SNAPSHOT_STORE_NAME, 'readwrite')
  const store = transaction.objectStore(STORAGE_CONSTANTS.SNAPSHOT_STORE_NAME)

  staleRecords.forEach((record) => {
    store.delete(record.id)
  })

  await waitForTransaction(transaction)
  debugLog('storage/snapshot-retention-pruned', {
    removedCount: staleRecords.length,
    limit: STORAGE_CONSTANTS.SNAPSHOT_HISTORY_LIMIT,
  })
}
