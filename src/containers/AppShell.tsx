import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { CompletedBank } from '../components/Bank/CompletedBank'
import { NewcomerBank } from '../components/Bank/NewcomerBank'
import { StaffBank } from '../components/Bank/StaffBank'
import { Board } from '../components/Board/Board'
import { Container } from '../components/Container/Container'
import { TileInfoModal } from '../components/Modal/TileInfoModal'
import { Toolbar } from '../components/Toolbar/Toolbar'
import { UndoSnackbar } from '../components/common/UndoSnackbar'
import { useSearch } from '../hooks/useSearch'
import { useUndo } from '../hooks/useUndo'
import { selectContainers, selectContainersWithSearchMatches, selectTilesByZone, useAppStore } from '../store'
import type { NameTemplateType } from '../types'
import {
  BankType,
  House,
  TileType,
  type Bank,
  type BoardMode,
  type Container as ContainerModel,
  type PersistedBoardState,
  type Tile,
  type TileType as TileTypeValue,
} from '../types'
import { buildCsv, parseCsv } from '../utils/csv'
import { LAYOUT_CONSTANTS, UI_CONSTANTS } from '../utils/constants'
import { debugLog } from '../utils/debug'
import { applyNameTemplate, getDefaultTemplate } from '../utils/naming'
import {
  listBoardSnapshots,
  loadBoardSnapshot,
  parseImportedBoardState,
  saveBoardSnapshot,
} from '../utils/storage'
import './AppShell.css'

const TILE_CSV_HEADERS = [
  'id',
  'name',
  'tileType',
  'currentZoneId',
  'currentZoneLabel',
  'notes',
  'house',
  'orderIndex',
] as const

const getBankLabel = (bankType: BankType): string => {
  if (bankType === BankType.STAFF) {
    return 'Staff Bank'
  }

  if (bankType === BankType.NEWCOMER) {
    return 'Newcomer Bank'
  }

  return 'Completed Bank'
}

const getZoneLabel = (
  zoneId: string,
  containersRecord: Record<string, ContainerModel>,
  banksRecord: Record<string, Bank>,
): string => {
  const container = containersRecord[zoneId]
  if (container) {
    return container.name
  }

  const bank = banksRecord[zoneId]
  if (bank) {
    return getBankLabel(bank.bankType)
  }

  return 'Unknown zone'
}

const roundZoom = (value: number): number => Math.round(value * 100) / 100

const clampZoom = (value: number): number =>
  Math.min(UI_CONSTANTS.BOARD_ZOOM_MAX, Math.max(UI_CONSTANTS.BOARD_ZOOM_MIN, value))

const containersIntersect = (a: ContainerModel, b: ContainerModel): boolean =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y

const mapBanksByType = (banksRecord: Record<string, Bank>): Partial<Record<BankType, Bank>> => {
  const mapped: Partial<Record<BankType, Bank>> = {}

  for (const bank of Object.values(banksRecord)) {
    mapped[bank.bankType] = bank
  }

  return mapped
}

const isValidHouse = (value: string): value is Tile['house'] =>
  value === House.GREEN || value === House.YELLOW || value === House.RED || value === House.BLUE

const resolveTileTypeFromCsv = (value: string): TileTypeValue | null => {
  const normalized = value.trim().toLowerCase()

  if (normalized === TileType.STAFF) {
    return TileType.STAFF
  }

  if (normalized === TileType.NEWCOMER) {
    return TileType.NEWCOMER
  }

  return null
}

const downloadFile = (filename: string, content: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()

  URL.revokeObjectURL(url)
}

export function AppShell() {
  const board = useAppStore((state) => state.board)
  const containersRecord = useAppStore((state) => state.containers)
  const banksRecord = useAppStore((state) => state.banks)
  const tilesRecord = useAppStore((state) => state.tiles)
  const dragState = useAppStore((state) => state.dragState)
  const modalState = useAppStore((state) => state.modalState)
  const mode = useAppStore((state) => state.mode)
  const nameTemplates = useAppStore((state) => state.nameTemplates)
  const selectedTileIds = useAppStore((state) => state.selectedTileIds)
  const language = useAppStore((state) => state.language)

  const createContainer = useAppStore((state) => state.createContainer)
  const updateContainer = useAppStore((state) => state.updateContainer)
  const bringToFront = useAppStore((state) => state.bringToFront)
  const createTile = useAppStore((state) => state.createTile)
  const updateTile = useAppStore((state) => state.updateTile)
  const deleteTile = useAppStore((state) => state.deleteTile)
  const cycleHouse = useAppStore((state) => state.cycleHouse)
  const setHouse = useAppStore((state) => state.setHouse)
  const loadBoard = useAppStore((state) => state.loadBoard)
  const saveBoard = useAppStore((state) => state.saveBoard)
  const pushUndo = useAppStore((state) => state.pushUndo)
  const openModal = useAppStore((state) => state.openModal)
  const closeModal = useAppStore((state) => state.closeModal)
  const setSelectedTileId = useAppStore((state) => state.setSelectedTileId)
  const selectTile = useAppStore((state) => state.selectTile)
  const clearTileSelection = useAppStore((state) => state.clearTileSelection)
  const setMode = useAppStore((state) => state.setMode)
  const setNameTemplate = useAppStore((state) => state.setNameTemplate)
  const setLanguage = useAppStore((state) => state.setLanguage)
  const clearSnapshots = useAppStore((state) => state.clearSnapshots)

  const containers = useAppStore(selectContainers)
  const tilesByZone = useAppStore(selectTilesByZone)
  const containersWithSearchMatches = useAppStore(selectContainersWithSearchMatches)

  const { searchQuery, setSearchQuery, searchMatches, isSearchActive } = useSearch()
  const { activeUndo, remainingMs, handleUndo, dismissActiveUndo } = useUndo()

  const boardViewportRef = useRef<HTMLDivElement | null>(null)
  const previousZoomRef = useRef<number>(UI_CONSTANTS.BOARD_ZOOM_DEFAULT)
  const pendingZoomAnchorRef = useRef<{ x: number; y: number } | null>(null)
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null)
  const [boardZoom, setBoardZoom] = useState<number>(() => {
    // Mobile-aware default zoom
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 0.55 // More zoomed out for mobile
    }
    return UI_CONSTANTS.BOARD_ZOOM_DEFAULT
  })
  const [isStaffDrawerOpen, setIsStaffDrawerOpen] = useState(false)
  const [isNewcomerDrawerOpen, setIsNewcomerDrawerOpen] = useState(false)
  const [snapshots, setSnapshots] = useState<Awaited<ReturnType<typeof listBoardSnapshots>>>([])
  const [createModalDefaultName, setCreateModalDefaultName] = useState('')

  const selectedTileIdSet = useMemo(() => new Set(selectedTileIds), [selectedTileIds])

  const banksByType = useMemo(() => mapBanksByType(banksRecord), [banksRecord])
  const staffBank = banksByType[BankType.STAFF]
  const newcomerBank = banksByType[BankType.NEWCOMER]
  const completedBank = banksByType[BankType.COMPLETED_NEWCOMER]

  const activeTileType = dragState ? tilesRecord[dragState.tileId]?.tileType ?? null : null
  const staffBankTileCount = staffBank ? (tilesByZone[staffBank.id] ?? []).length : 0
  const newcomerBankTileCount = newcomerBank ? (tilesByZone[newcomerBank.id] ?? []).length : 0
  const completedBankTileCount = completedBank ? (tilesByZone[completedBank.id] ?? []).length : 0

  const staffTileCount = useMemo(
    () => Object.values(tilesRecord).filter((tile) => tile.tileType === TileType.STAFF).length,
    [tilesRecord],
  )
  const newcomerTileCount = useMemo(
    () => Object.values(tilesRecord).filter((tile) => tile.tileType === TileType.NEWCOMER).length,
    [tilesRecord],
  )

  const getDefaultTileName = useCallback(
    (tileType: TileTypeValue): string => {
      const templateType = tileType === TileType.STAFF ? 'staff' : 'newcomer'
      const nextNumber =
        tileType === TileType.STAFF ? staffTileCount + 1 : newcomerTileCount + 1
      const template =
        tileType === TileType.STAFF ? nameTemplates.staff : nameTemplates.newcomer

      return applyNameTemplate(template, nextNumber, getDefaultTemplate(templateType))
    },
    [nameTemplates.newcomer, nameTemplates.staff, newcomerTileCount, staffTileCount],
  )

  const defaultContainerName = useMemo(
    () =>
      applyNameTemplate(
        nameTemplates.container,
        containers.length + 1,
        getDefaultTemplate('container'),
      ),
    [containers.length, nameTemplates.container],
  )

  const boardCanvasSize = useMemo(() => {
    const farthestRight = containers.reduce(
      (maxRight, container) => Math.max(maxRight, container.x + container.width),
      0,
    )
    const farthestBottom = containers.reduce(
      (maxBottom, container) => Math.max(maxBottom, container.y + container.height),
      0,
    )

    return {
      width: Math.max(1800, farthestRight + 360),
      height: Math.max(1200, farthestBottom + 320),
    }
  }, [containers])

  const overlappingContainerIds = useMemo(() => {
    const overlappingIds = new Set<string>()

    for (let index = 0; index < containers.length; index += 1) {
      for (let nextIndex = index + 1; nextIndex < containers.length; nextIndex += 1) {
        const currentContainer = containers[index]
        const nextContainer = containers[nextIndex]

        if (containersIntersect(currentContainer, nextContainer)) {
          overlappingIds.add(currentContainer.id)
          overlappingIds.add(nextContainer.id)
        }
      }
    }

    return overlappingIds
  }, [containers])

  const clampBoardViewportToContent = useCallback(() => {
    const viewport = boardViewportRef.current
    if (!viewport) {
      return
    }

    const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth)
    const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight)

    if (viewport.scrollLeft > maxScrollLeft) {
      viewport.scrollLeft = maxScrollLeft
    } else if (viewport.scrollLeft < 0) {
      viewport.scrollLeft = 0
    }

    if (viewport.scrollTop > maxScrollTop) {
      viewport.scrollTop = maxScrollTop
    } else if (viewport.scrollTop < 0) {
      viewport.scrollTop = 0
    }
  }, [])

  const infoTile = modalState?.type === 'tile_info' ? tilesRecord[modalState.entityId] ?? null : null
  const createTileType = modalState?.type === 'tile_create' ? modalState.tileType : null
  const tileModalMode = modalState?.type === 'tile_create' ? 'create' : 'edit'

  const currentZoneLabel = useMemo(() => {
    if (!infoTile) {
      return null
    }

    return getZoneLabel(infoTile.currentZoneId, containersRecord, banksRecord)
  }, [banksRecord, containersRecord, infoTile])

  const refreshSnapshots = useCallback(async () => {
    const nextSnapshots = await listBoardSnapshots(12)
    setSnapshots(nextSnapshots)
  }, [])

  useEffect(() => {
    let isCancelled = false

    void listBoardSnapshots(12).then((nextSnapshots) => {
      if (!isCancelled) {
        setSnapshots(nextSnapshots)
      }
    })

    return () => {
      isCancelled = true
    }
  }, [])

  useLayoutEffect(() => {
    const viewport = boardViewportRef.current
    const previousZoom = previousZoomRef.current
    const pendingZoomAnchor = pendingZoomAnchorRef.current

    if (!viewport || previousZoom === boardZoom) {
      previousZoomRef.current = boardZoom
      pendingZoomAnchorRef.current = null
      return
    }

    // Preserve the gesture focus point while zooming inside the board viewport.
    if (pendingZoomAnchor) {
      const anchorWorldX = (viewport.scrollLeft + pendingZoomAnchor.x) / previousZoom
      const anchorWorldY = (viewport.scrollTop + pendingZoomAnchor.y) / previousZoom

      viewport.scrollLeft = Math.max(0, anchorWorldX * boardZoom - pendingZoomAnchor.x)
      viewport.scrollTop = Math.max(0, anchorWorldY * boardZoom - pendingZoomAnchor.y)
    } else {
      const centerWorldX = (viewport.scrollLeft + viewport.clientWidth / 2) / previousZoom
      const centerWorldY = (viewport.scrollTop + viewport.clientHeight / 2) / previousZoom

      viewport.scrollLeft = Math.max(0, centerWorldX * boardZoom - viewport.clientWidth / 2)
      viewport.scrollTop = Math.max(0, centerWorldY * boardZoom - viewport.clientHeight / 2)
    }

    previousZoomRef.current = boardZoom
    pendingZoomAnchorRef.current = null
  }, [boardZoom])

  useLayoutEffect(() => {
    clampBoardViewportToContent()
  }, [boardCanvasSize.height, boardCanvasSize.width, boardZoom, clampBoardViewportToContent])

  useEffect(() => {
    const handleResize = () => {
      clampBoardViewportToContent()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [clampBoardViewportToContent])

  useEffect(() => {
    debugLog('AppShell/render', {
      mode,
      boardZoom,
      searchQuery,
      searchMatchCount: searchMatches.size,
      selectedTileCount: selectedTileIds.length,
      containers: containers.length,
      overlappingContainers: overlappingContainerIds.size,
      banks: Object.keys(banksRecord).length,
      tiles: Object.keys(tilesRecord).length,
      staffBankTiles: staffBankTileCount,
      newcomerBankTiles: newcomerBankTileCount,
      completedBankTiles: completedBankTileCount,
      activeTileType,
      activeDropTargetId: dragState?.activeDropTargetId ?? null,
      editingContainerId,
      editingContainerExists: editingContainerId ? Boolean(containersRecord[editingContainerId]) : false,
      isStaffDrawerOpen,
      isNewcomerDrawerOpen,
      modalType: modalState?.type ?? null,
      hasUndoEntry: Boolean(activeUndo),
      snapshotCount: snapshots.length,
    })
  }, [
    activeTileType,
    activeUndo,
    banksRecord,
    boardZoom,
    completedBankTileCount,
    containers,
    containersRecord,
    dragState,
    editingContainerId,
    isNewcomerDrawerOpen,
    isStaffDrawerOpen,
    modalState,
    mode,
    newcomerBankTileCount,
    overlappingContainerIds,
    searchMatches,
    searchQuery,
    selectedTileIds.length,
    snapshots.length,
    staffBankTileCount,
    tilesRecord,
  ])

  useEffect(() => {
    if (!isStaffDrawerOpen && !isNewcomerDrawerOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsStaffDrawerOpen(false)
        setIsNewcomerDrawerOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isNewcomerDrawerOpen, isStaffDrawerOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearTileSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [clearTileSelection])

  const handleNameTemplateChange = useCallback(
    (templateType: NameTemplateType, value: string) => {
      setNameTemplate(templateType, value)
    },
    [setNameTemplate],
  )

  const handleCreateContainer = useCallback(() => {
    const width = LAYOUT_CONSTANTS.CONTAINER_DEFAULT_WIDTH
    const height = LAYOUT_CONSTANTS.CONTAINER_DEFAULT_HEIGHT

    const viewport = boardViewportRef.current
    const centeredX = viewport
      ? viewport.scrollLeft / boardZoom + viewport.clientWidth / (2 * boardZoom) - width / 2
      : 120
    const centeredY = viewport
      ? viewport.scrollTop / boardZoom + viewport.clientHeight / (2 * boardZoom) - height / 2
      : 120

    const id = createContainer({
      name: defaultContainerName,
      x: Math.max(0, centeredX),
      y: Math.max(0, centeredY),
      width,
      height,
    })

    bringToFront(id)
    setEditingContainerId(id)

    debugLog('AppShell/create-container', {
      id,
      name: defaultContainerName,
      x: centeredX,
      y: centeredY,
      width,
      height,
      zoom: boardZoom,
    })
  }, [boardZoom, bringToFront, createContainer, defaultContainerName])

  const handleModeChange = useCallback(
    (nextMode: BoardMode) => {
      setMode(nextMode)
    },
    [setMode],
  )

  const handleExportBoard = useCallback(() => {
    const snapshot = saveBoard()
    if (!snapshot) {
      window.alert('Unable to export board right now.')
      return
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    downloadFile(
      `chotolate-board-${stamp}.json`,
      JSON.stringify(snapshot, null, 2),
      'application/json',
    )

    debugLog('AppShell/export-board', {
      boardId: snapshot.board.id,
      containerCount: Object.keys(snapshot.containers).length,
      bankCount: Object.keys(snapshot.banks).length,
      tileCount: Object.keys(snapshot.tiles).length,
    })
  }, [saveBoard])

  const handleImportBoard = useCallback(
    async (file: File) => {
      try {
        const raw = await file.text()
        const parsed: unknown = JSON.parse(raw)
        const importedBoard = parseImportedBoardState(parsed)

        if (!importedBoard) {
          window.alert('Invalid board file. Please import a valid Chotolate board JSON.')
          return
        }

        const confirmed = window.confirm(
          `Import "${importedBoard.board.name}" and replace the current board state?`,
        )
        if (!confirmed) {
          return
        }

        loadBoard(importedBoard)
        await saveBoardSnapshot(importedBoard, 'manual')
        await refreshSnapshots()

        debugLog('AppShell/import-board', {
          boardId: importedBoard.board.id,
          containerCount: Object.keys(importedBoard.containers).length,
          bankCount: Object.keys(importedBoard.banks).length,
          tileCount: Object.keys(importedBoard.tiles).length,
        })
      } catch (error) {
        debugLog('AppShell/import-board-failed', {
          message: error instanceof Error ? error.message : String(error),
        })
        window.alert('Import failed. Please verify the JSON file and try again.')
      }
    },
    [loadBoard, refreshSnapshots],
  )

  const handleExportCsv = useCallback(() => {
    const rows = Object.values(tilesRecord)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((tile) => ({
        id: tile.id,
        name: tile.name,
        tileType: tile.tileType,
        currentZoneId: tile.currentZoneId,
        currentZoneLabel: getZoneLabel(tile.currentZoneId, containersRecord, banksRecord),
        notes: tile.notes,
        house: tile.house,
        orderIndex: String(tile.orderIndex),
      }))

    const csv = buildCsv([...TILE_CSV_HEADERS], rows)
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    downloadFile(`chotolate-tiles-${stamp}.csv`, csv, 'text/csv;charset=utf-8')

    debugLog('AppShell/export-csv', {
      rowCount: rows.length,
    })
  }, [banksRecord, containersRecord, tilesRecord])

  const handleImportCsv = useCallback(
    async (file: File) => {
      if (!board || !staffBank || !newcomerBank) {
        window.alert('Board is not ready for CSV import.')
        return
      }

      try {
        const raw = await file.text()
        const parsed = parseCsv(raw)

        if (parsed.headers.length === 0) {
          window.alert('CSV appears to be empty.')
          return
        }

        const requiredHeaders = ['name', 'tileType']
        const missingHeaders = requiredHeaders.filter((header) => !parsed.headers.includes(header))

        if (missingHeaders.length > 0) {
          window.alert(`CSV is missing required headers: ${missingHeaders.join(', ')}`)
          return
        }

        const bankLabelById = Object.fromEntries(
          Object.values(banksRecord).map((bank) => [bank.id, getBankLabel(bank.bankType)]),
        )
        const zoneIdByLabel = new Map<string, string>()

        Object.values(containersRecord).forEach((container) => {
          zoneIdByLabel.set(container.name.trim().toLowerCase(), container.id)
        })
        Object.entries(bankLabelById).forEach(([zoneId, label]) => {
          zoneIdByLabel.set(label.trim().toLowerCase(), zoneId)
        })

        const zoneOrder = new Map<string, number>()
        const nextTiles: Record<string, Tile> = {}
        const errors: string[] = []
        const timestamp = new Date().toISOString()

        parsed.rows.forEach((row, rowIndex) => {
          const lineNumber = rowIndex + 2
          const name = (row.name ?? '').trim()
          const parsedTileType = resolveTileTypeFromCsv(row.tileType ?? '')

          if (!name) {
            errors.push(`Line ${lineNumber}: missing name`)
            return
          }

          if (!parsedTileType) {
            errors.push(`Line ${lineNumber}: invalid tileType "${row.tileType ?? ''}"`)
            return
          }

          const zoneIdFromCsv = (row.currentZoneId ?? '').trim()
          const zoneLabelFromCsv = (row.currentZoneLabel ?? '').trim().toLowerCase()

          let resolvedZoneId = zoneIdFromCsv

          if (!resolvedZoneId && zoneLabelFromCsv) {
            resolvedZoneId = zoneIdByLabel.get(zoneLabelFromCsv) ?? ''
          }

          if (!resolvedZoneId || (!containersRecord[resolvedZoneId] && !banksRecord[resolvedZoneId])) {
            resolvedZoneId = parsedTileType === TileType.STAFF ? staffBank.id : newcomerBank.id
          }

          const targetBank = banksRecord[resolvedZoneId]
          const targetContainer = containersRecord[resolvedZoneId]

          if (targetBank) {
            const isInvalidBankForType =
              (parsedTileType === TileType.STAFF && targetBank.bankType !== BankType.STAFF) ||
              (parsedTileType === TileType.NEWCOMER &&
                targetBank.bankType !== BankType.NEWCOMER &&
                targetBank.bankType !== BankType.COMPLETED_NEWCOMER)

            if (isInvalidBankForType) {
              resolvedZoneId = parsedTileType === TileType.STAFF ? staffBank.id : newcomerBank.id
            }
          }

          if (targetContainer) {
            const isInvalidContainerForType =
              (parsedTileType === TileType.STAFF && !targetContainer.acceptsStaff) ||
              (parsedTileType === TileType.NEWCOMER && !targetContainer.acceptsNewcomers)

            if (isInvalidContainerForType) {
              resolvedZoneId = parsedTileType === TileType.STAFF ? staffBank.id : newcomerBank.id
            }
          }

          const houseRaw = (row.house ?? '').toLowerCase()
          const normalizedHouse: Tile['house'] = isValidHouse(houseRaw)
            ? houseRaw
            : House.GREEN

          const nextOrder = zoneOrder.get(resolvedZoneId) ?? 0
          zoneOrder.set(resolvedZoneId, nextOrder + 1)

          const requestedId = (row.id ?? '').trim()
          const tileId = requestedId && !nextTiles[requestedId] ? requestedId : uuidv4()

          nextTiles[tileId] = {
            id: tileId,
            boardId: board.id,
            currentZoneId: resolvedZoneId,
            name,
            tileType: parsedTileType,
            house: parsedTileType === TileType.NEWCOMER ? House.GREEN : normalizedHouse,
            notes: row.notes ?? '',
            orderIndex: nextOrder,
            createdAt: timestamp,
            updatedAt: timestamp,
          }
        })

        if (Object.keys(nextTiles).length === 0) {
          window.alert(
            `CSV import did not produce valid tiles.${errors.length > 0 ? `\n\n${errors.slice(0, 8).join('\n')}` : ''}`,
          )
          return
        }

        const errorMessage =
          errors.length > 0
            ? `\n\n${errors.length} row(s) were skipped:\n${errors.slice(0, 8).join('\n')}`
            : ''

        const confirmed = window.confirm(
          `Replace existing tiles with ${Object.keys(nextTiles).length} imported tile(s)?${errorMessage}`,
        )
        if (!confirmed) {
          return
        }

        const nextState: PersistedBoardState = {
          board: {
            ...board,
            updatedAt: timestamp,
          },
          containers: containersRecord,
          banks: banksRecord,
          tiles: nextTiles,
        }

        loadBoard(nextState)
        await saveBoardSnapshot(nextState, 'manual')
        await refreshSnapshots()

        debugLog('AppShell/import-csv-success', {
          importedTiles: Object.keys(nextTiles).length,
          skippedRows: errors.length,
        })
      } catch (error) {
        debugLog('AppShell/import-csv-failed', {
          message: error instanceof Error ? error.message : String(error),
        })
        window.alert('CSV import failed. Please verify the file and try again.')
      }
    },
    [
      banksRecord,
      board,
      containersRecord,
      loadBoard,
      newcomerBank,
      refreshSnapshots,
      staffBank,
    ],
  )

  const handleQuickAddTile = useCallback(
    (tileType: TileTypeValue, name: string): boolean => {
      const trimmedName = name.trim()
      if (!trimmedName) {
        return false
      }

      const id = createTile({
        name: trimmedName,
        notes: '',
        tileType,
      })

      const isSuccess = Boolean(id)

      debugLog('AppShell/quick-add-tile', {
        tileType,
        name: trimmedName,
        createdTileId: id,
        success: isSuccess,
      })

      return isSuccess
    },
    [createTile],
  )

  const handleCaptureSnapshot = useCallback(async () => {
    const snapshot = saveBoard()
    if (!snapshot) {
      window.alert('Unable to save snapshot right now.')
      return
    }

    await saveBoardSnapshot(snapshot, 'manual')
    await refreshSnapshots()

    debugLog('AppShell/capture-snapshot', {
      boardId: snapshot.board.id,
      tileCount: Object.keys(snapshot.tiles).length,
    })
  }, [refreshSnapshots, saveBoard])

  const handleRestoreSnapshot = useCallback(
    async (snapshotId: string) => {
      const snapshot = await loadBoardSnapshot(snapshotId)
      if (!snapshot) {
        window.alert('Snapshot could not be loaded.')
        return
      }

      const snapshotSummary = snapshots.find((entry) => entry.id === snapshotId)
      const snapshotLabel = snapshotSummary
        ? new Date(snapshotSummary.savedAt).toLocaleString()
        : 'the selected time'

      const confirmed = window.confirm(
        `Restore snapshot from ${snapshotLabel} and replace current board state?`,
      )
      if (!confirmed) {
        return
      }

      loadBoard(snapshot)
      await refreshSnapshots()

      debugLog('AppShell/restore-snapshot', {
        snapshotId,
        tileCount: Object.keys(snapshot.tiles).length,
      })
    },
    [loadBoard, refreshSnapshots, snapshots],
  )

  const updateBoardZoom = useCallback(
    (nextZoom: number, anchor?: { x: number; y: number }) => {
      const clampedZoom = clampZoom(roundZoom(nextZoom))

      pendingZoomAnchorRef.current = anchor ?? null

      setBoardZoom((previousZoom) => {
        if (previousZoom === clampedZoom) {
          pendingZoomAnchorRef.current = null
          return previousZoom
        }

        return clampedZoom
      })

      debugLog('AppShell/update-board-zoom', {
        previousZoom: previousZoomRef.current,
        nextZoom: clampedZoom,
        anchor,
      })
    },
    [],
  )

  const scaleBoardZoom = useCallback(
    (scaleFactor: number, anchor?: { x: number; y: number }) => {
      pendingZoomAnchorRef.current = anchor ?? null

      setBoardZoom((previousZoom) => {
        const nextZoom = clampZoom(roundZoom(previousZoom * scaleFactor))

        if (previousZoom === nextZoom) {
          pendingZoomAnchorRef.current = null
          return previousZoom
        }

        debugLog('AppShell/scale-board-zoom', {
          previousZoom,
          nextZoom,
          scaleFactor,
          anchor,
        })

        return nextZoom
      })
    },
    [],
  )

  const handleZoomIn = useCallback(() => {
    updateBoardZoom(boardZoom + UI_CONSTANTS.BOARD_ZOOM_STEP)
  }, [boardZoom, updateBoardZoom])

  const handleZoomOut = useCallback(() => {
    updateBoardZoom(boardZoom - UI_CONSTANTS.BOARD_ZOOM_STEP)
  }, [boardZoom, updateBoardZoom])

  const handleZoomReset = useCallback(() => {
    updateBoardZoom(UI_CONSTANTS.BOARD_ZOOM_DEFAULT)
  }, [updateBoardZoom])

  const handleTrackpadZoom = useCallback(
    (scaleFactor: number, anchor: { x: number; y: number }) => {
      scaleBoardZoom(scaleFactor, anchor)
    },
    [scaleBoardZoom],
  )

  const handleToggleStaffDrawer = useCallback(() => {
    setIsNewcomerDrawerOpen(false)
    setIsStaffDrawerOpen((isOpen) => !isOpen)
  }, [])

  const handleToggleNewcomerDrawer = useCallback(() => {
    setIsStaffDrawerOpen(false)
    setIsNewcomerDrawerOpen((isOpen) => !isOpen)
  }, [])

  const handleCloseDrawers = useCallback(() => {
    setIsStaffDrawerOpen(false)
    setIsNewcomerDrawerOpen(false)
  }, [])

  const handleOpenCreateTileModal = useCallback(
    (tileType: TileTypeValue) => {
      const defaultName = getDefaultTileName(tileType)

      debugLog('AppShell/open-create-tile-modal', { tileType, defaultName })
      clearTileSelection()
      setCreateModalDefaultName(defaultName)
      openModal({
        type: 'tile_create',
        tileType,
      })
    },
    [clearTileSelection, getDefaultTileName, openModal],
  )

  useEffect(() => {
    const isTextInputTarget = (target: EventTarget | null): target is HTMLElement => {
      if (!(target instanceof HTMLElement)) {
        return false
      }
      const tag = target.tagName
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target.isContentEditable
      )
    }

    const handleHotkeys = (event: KeyboardEvent) => {
      if (event.isComposing) {
        return
      }

      if (event.altKey || event.metaKey || event.ctrlKey) {
        return
      }

      if (isTextInputTarget(event.target)) {
        return
      }

      if (modalState) {
        return
      }

      const key = event.key.toLowerCase()
      if (key === 's') {
        event.preventDefault()
        handleOpenCreateTileModal(TileType.STAFF)
      } else if (key === 'n') {
        event.preventDefault()
        handleOpenCreateTileModal(TileType.NEWCOMER)
      } else if (key === 'c') {
        event.preventDefault()
        handleCreateContainer()
      }
    }

    window.addEventListener('keydown', handleHotkeys)
    return () => {
      window.removeEventListener('keydown', handleHotkeys)
    }
  }, [handleCreateContainer, handleOpenCreateTileModal, modalState])

  const handleOpenTileInfo = useCallback(
    (tileId: string) => {
      debugLog('AppShell/open-tile-info', { tileId })
      setSelectedTileId(tileId)
      openModal({
        type: 'tile_info',
        entityId: tileId,
      })
    },
    [openModal, setSelectedTileId],
  )

  const handleCloseTileModal = useCallback(() => {
    debugLog('AppShell/close-tile-modal')
    closeModal()
    clearTileSelection()
  }, [clearTileSelection, closeModal])

  const handleCreateTile = useCallback(
    (payload: {
      name: string
      notes: string
      tileType: TileTypeValue
      house: Tile['house']
    }) => {
      const id = createTile(payload)

      debugLog('AppShell/create-tile', {
        createdTileId: id,
        tileType: payload.tileType,
        name: payload.name,
        house: payload.house,
      })

      closeModal()
      clearTileSelection()
    },
    [clearTileSelection, closeModal, createTile],
  )

  const handleSaveTile = useCallback(
    (payload: {
      tileId: string
      name: string
      notes: string
      house: Tile['house']
    }) => {
      updateTile(payload.tileId, {
        name: payload.name,
        notes: payload.notes,
        house: payload.house,
      })

      const editingTile = tilesRecord[payload.tileId]
      if (editingTile?.tileType === TileType.STAFF) {
        setHouse(payload.tileId, payload.house)
      }

      debugLog('AppShell/save-tile', payload)

      closeModal()
      clearTileSelection()
    },
    [clearTileSelection, closeModal, setHouse, tilesRecord, updateTile],
  )

  const handleDeleteTile = useCallback(
    (tileId: string) => {
      const tile = tilesRecord[tileId]
      if (!tile) {
        return
      }

      const confirmed = window.confirm(`Delete ${tile.name}? You can undo for 10 seconds.`)
      if (!confirmed) {
        return
      }

      pushUndo({
        type: 'tile_delete',
        timestamp: Date.now(),
        snapshot: {
          tile,
        },
      })

      deleteTile(tileId)
      closeModal()
      clearTileSelection()

      debugLog('AppShell/delete-tile', {
        tileId,
        tileName: tile.name,
        undoWindowMs: 10_000,
      })
    },
    [clearTileSelection, closeModal, deleteTile, pushUndo, tilesRecord],
  )

  const handleTileNameCommit = useCallback(
    (tileId: string, nextName: string) => {
      updateTile(tileId, { name: nextName })
      debugLog('AppShell/inline-tile-name-commit', { tileId, nextName })
    },
    [updateTile],
  )

  const handleStartEditName = useCallback((containerId: string) => {
    setEditingContainerId(containerId)
  }, [])

  const handleCommitEditName = useCallback(
    (containerId: string, nextName: string) => {
      updateContainer(containerId, { name: nextName || 'New Position' })
      setEditingContainerId((currentId) => (currentId === containerId ? null : currentId))
    },
    [updateContainer],
  )

  const handleCancelEditName = useCallback(() => {
    setEditingContainerId(null)
  }, [])

  const handleTileSelect = useCallback(
    (tileId: string, additive: boolean) => {
      selectTile(tileId, additive)
    },
    [selectTile],
  )

  const handleBoardBackgroundPointerDown = useCallback(() => {
    clearTileSelection()
  }, [clearTileSelection])

  if (!staffBank || !newcomerBank || !completedBank) {
    debugLog('AppShell/missing-required-banks', {
      hasStaffBank: Boolean(staffBank),
      hasNewcomerBank: Boolean(newcomerBank),
      hasCompletedBank: Boolean(completedBank),
    })
    return (
      <div className="app-shell app-shell-error">
        <div className="app-error-card">
          <h2>Board data needs recovery</h2>
          <p>Required bank zones are missing. Reload to rehydrate repaired board state.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload board
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {isStaffDrawerOpen || isNewcomerDrawerOpen ? (
        <button
          type="button"
          className="drawer-backdrop"
          aria-label="Close bank drawers"
          onClick={handleCloseDrawers}
        />
      ) : null}

      <div className="main-layout">
        <aside className={`left-sidebar ${isStaffDrawerOpen ? 'drawer-open' : ''}`}>
          <StaffBank
            zoneId={staffBank.id}
            tiles={tilesByZone[staffBank.id] ?? []}
            activeTileType={activeTileType}
            selectedTileIds={selectedTileIdSet}
            searchMatches={searchMatches}
            isSearchActive={isSearchActive}
            onHouseToggle={cycleHouse}
            onTileInfoClick={handleOpenTileInfo}
            onTileNameCommit={handleTileNameCommit}
            onTileSelect={handleTileSelect}
            onClose={handleCloseDrawers}
            language={language}
          />
        </aside>

        <main className="board-area">
          <Toolbar
            mode={mode}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onModeChange={handleModeChange}
            zoom={boardZoom}
            minZoom={UI_CONSTANTS.BOARD_ZOOM_MIN}
            maxZoom={UI_CONSTANTS.BOARD_ZOOM_MAX}
            onZoomOut={handleZoomOut}
            onZoomIn={handleZoomIn}
            onZoomReset={handleZoomReset}
            selectedCount={selectedTileIds.length}
            onClearSelection={clearTileSelection}
            onExportBoard={handleExportBoard}
            onImportBoard={handleImportBoard}
            onExportCsv={handleExportCsv}
            onImportCsv={handleImportCsv}
            onQuickAddTile={handleQuickAddTile}
            getDefaultTileName={getDefaultTileName}
            nameTemplates={nameTemplates}
            onNameTemplateChange={handleNameTemplateChange}
            snapshots={snapshots}
            onRefreshSnapshots={refreshSnapshots}
            onRestoreSnapshot={handleRestoreSnapshot}
            onCaptureSnapshot={handleCaptureSnapshot}
            onClearSnapshots={clearSnapshots}
            onCreateStaff={() => handleOpenCreateTileModal(TileType.STAFF)}
            onCreateNewcomer={() => handleOpenCreateTileModal(TileType.NEWCOMER)}
            onCreateContainer={handleCreateContainer}
            isStaffDrawerOpen={isStaffDrawerOpen}
            onToggleStaffDrawer={handleToggleStaffDrawer}
            staffBankTileCount={staffBankTileCount}
            isNewcomerDrawerOpen={isNewcomerDrawerOpen}
            onToggleNewcomerDrawer={handleToggleNewcomerDrawer}
            newcomerBankTileCount={newcomerBankTileCount}
            language={language}
            onLanguageChange={setLanguage}
          />

          <Board
            ref={boardViewportRef}
            canvasWidth={boardCanvasSize.width}
            canvasHeight={boardCanvasSize.height}
            zoom={boardZoom}
            isEmpty={containers.length === 0}
            emptyLabel={language === 'en' ? 'No containers yet' : 'コンテナがまだありません'}
            onBackgroundPointerDown={handleBoardBackgroundPointerDown}
            onTrackpadZoom={handleTrackpadZoom}
          >
            {containers.map((container) => (
              <Container
                key={container.id}
                container={container}
                tiles={tilesByZone[container.id] ?? []}
                zoom={boardZoom}
                isOverlapping={overlappingContainerIds.has(container.id)}
                hasSearchMatch={containersWithSearchMatches.has(container.id)}
                isSearchActive={isSearchActive}
                selectedTileIds={selectedTileIdSet}
                searchMatches={searchMatches}
                activeTileType={activeTileType}
                isEditingName={editingContainerId === container.id}
                onStartEditName={handleStartEditName}
                onCommitEditName={handleCommitEditName}
                onCancelEditName={handleCancelEditName}
                onHouseToggle={cycleHouse}
                onTileInfoClick={handleOpenTileInfo}
                onTileNameCommit={handleTileNameCommit}
                onTileSelect={handleTileSelect}
              />
            ))}
          </Board>
        </main>

        <aside className={`right-sidebar ${isNewcomerDrawerOpen ? 'drawer-open' : ''}`}>
          <NewcomerBank
            zoneId={newcomerBank.id}
            tiles={tilesByZone[newcomerBank.id] ?? []}
            activeTileType={activeTileType}
            selectedTileIds={selectedTileIdSet}
            searchMatches={searchMatches}
            isSearchActive={isSearchActive}
            onHouseToggle={cycleHouse}
            onTileInfoClick={handleOpenTileInfo}
            onTileNameCommit={handleTileNameCommit}
            onTileSelect={handleTileSelect}
            onClose={handleCloseDrawers}
            language={language}
          />
        </aside>
      </div>

      <footer className="bottom-bank">
        <CompletedBank
          zoneId={completedBank.id}
          tiles={tilesByZone[completedBank.id] ?? []}
          activeTileType={activeTileType}
          selectedTileIds={selectedTileIdSet}
          searchMatches={searchMatches}
          isSearchActive={isSearchActive}
          onHouseToggle={cycleHouse}
          onTileInfoClick={handleOpenTileInfo}
          onTileNameCommit={handleTileNameCommit}
          onTileSelect={handleTileSelect}
          onClose={handleCloseDrawers}
          language={language}
        />
      </footer>

      {modalState?.type === 'tile_create' || modalState?.type === 'tile_info' ? (
        <TileInfoModal
          key={
            modalState.type === 'tile_info'
              ? `info-${modalState.entityId}`
              : `create-${modalState.tileType}-${createModalDefaultName}`
          }
          mode={tileModalMode}
          tile={infoTile}
          createTileType={createTileType}
          defaultCreateName={createModalDefaultName}
          currentZoneLabel={currentZoneLabel}
          onClose={handleCloseTileModal}
          onCreateTile={handleCreateTile}
          onSaveTile={handleSaveTile}
          onDeleteTile={handleDeleteTile}
          language={language}
        />
      ) : null}

      {activeUndo && remainingMs > 0 ? (
        <UndoSnackbar
          label={
            activeUndo.type === 'tile_delete'
              ? language === 'en'
                ? 'Tile deleted'
                : 'タイルを削除しました'
              : language === 'en'
                ? 'Deleted'
                : '削除しました'
          }
          remainingMs={remainingMs}
          onUndo={() => {
            handleUndo()
          }}
          onDismiss={dismissActiveUndo}
          language={language}
        />
      ) : null}
    </div>
  )
}
