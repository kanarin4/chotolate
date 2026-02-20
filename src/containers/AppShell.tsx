import { useEffect, useMemo, useRef, useState } from 'react'
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
import { useAppStore } from '../store'
import { LAYOUT_CONSTANTS, UI_CONSTANTS } from '../utils/constants'
import {
  BankType,
  TileType,
  type Bank,
  type BoardMode,
  type Container as ContainerModel,
  type Tile,
} from '../types'
import { debugLog } from '../utils/debug'
import './AppShell.css'

const sortByZIndex = <T extends { zIndex: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.zIndex - b.zIndex)

const groupTilesByZone = (tilesRecord: Record<string, Tile>): Record<string, Tile[]> => {
  const grouped: Record<string, Tile[]> = {}

  const orderedTiles = Object.values(tilesRecord).sort((a, b) => a.orderIndex - b.orderIndex)

  for (const tile of orderedTiles) {
    if (!grouped[tile.currentZoneId]) {
      grouped[tile.currentZoneId] = []
    }

    grouped[tile.currentZoneId].push(tile)
  }

  return grouped
}

const mapBanksByType = (banksRecord: Record<string, Bank>): Partial<Record<BankType, Bank>> => {
  const mapped: Partial<Record<BankType, Bank>> = {}

  for (const bank of Object.values(banksRecord)) {
    mapped[bank.bankType] = bank
  }

  return mapped
}

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

export function AppShell() {
  const containersRecord = useAppStore((state) => state.containers)
  const banksRecord = useAppStore((state) => state.banks)
  const tilesRecord = useAppStore((state) => state.tiles)
  const dragState = useAppStore((state) => state.dragState)
  const modalState = useAppStore((state) => state.modalState)
  const mode = useAppStore((state) => state.mode)

  const createContainer = useAppStore((state) => state.createContainer)
  const updateContainer = useAppStore((state) => state.updateContainer)
  const bringToFront = useAppStore((state) => state.bringToFront)
  const createTile = useAppStore((state) => state.createTile)
  const updateTile = useAppStore((state) => state.updateTile)
  const deleteTile = useAppStore((state) => state.deleteTile)
  const cycleFatigue = useAppStore((state) => state.cycleFatigue)
  const setFatigue = useAppStore((state) => state.setFatigue)
  const pushUndo = useAppStore((state) => state.pushUndo)
  const openModal = useAppStore((state) => state.openModal)
  const closeModal = useAppStore((state) => state.closeModal)
  const setSelectedTileId = useAppStore((state) => state.setSelectedTileId)
  const setMode = useAppStore((state) => state.setMode)

  const { searchQuery, setSearchQuery } = useSearch()
  const { activeUndo, remainingMs, handleUndo, dismissActiveUndo } = useUndo()

  const boardViewportRef = useRef<HTMLDivElement | null>(null)
  const previousZoomRef = useRef<number>(UI_CONSTANTS.BOARD_ZOOM_DEFAULT)
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null)
  const [boardZoom, setBoardZoom] = useState<number>(UI_CONSTANTS.BOARD_ZOOM_DEFAULT)
  const [isStaffDrawerOpen, setIsStaffDrawerOpen] = useState(false)
  const [isNewcomerDrawerOpen, setIsNewcomerDrawerOpen] = useState(false)

  const containers = useMemo(
    () => sortByZIndex(Object.values(containersRecord)),
    [containersRecord],
  )

  const tilesByZone = useMemo(() => groupTilesByZone(tilesRecord), [tilesRecord])

  const banksByType = useMemo(() => mapBanksByType(banksRecord), [banksRecord])
  const staffBank = banksByType[BankType.STAFF]
  const newcomerBank = banksByType[BankType.NEWCOMER]
  const completedBank = banksByType[BankType.COMPLETED_NEWCOMER]
  const activeTileType = dragState ? tilesRecord[dragState.tileId]?.tileType ?? null : null
  const staffBankTileCount = staffBank ? (tilesByZone[staffBank.id] ?? []).length : 0
  const newcomerBankTileCount = newcomerBank ? (tilesByZone[newcomerBank.id] ?? []).length : 0
  const completedBankTileCount = completedBank ? (tilesByZone[completedBank.id] ?? []).length : 0

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

  const infoTile = modalState?.type === 'tile_info' ? tilesRecord[modalState.entityId] ?? null : null
  const createTileType = modalState?.type === 'tile_create' ? modalState.tileType : null

  const tileModalMode = modalState?.type === 'tile_create' ? 'create' : 'edit'

  const currentZoneLabel = useMemo(() => {
    if (!infoTile) {
      return null
    }

    return getZoneLabel(infoTile.currentZoneId, containersRecord, banksRecord)
  }, [banksRecord, containersRecord, infoTile])

  useEffect(() => {
    const viewport = boardViewportRef.current
    const previousZoom = previousZoomRef.current

    if (!viewport || previousZoom === boardZoom) {
      previousZoomRef.current = boardZoom
      return
    }

    const centerWorldX = (viewport.scrollLeft + viewport.clientWidth / 2) / previousZoom
    const centerWorldY = (viewport.scrollTop + viewport.clientHeight / 2) / previousZoom

    viewport.scrollLeft = Math.max(0, centerWorldX * boardZoom - viewport.clientWidth / 2)
    viewport.scrollTop = Math.max(0, centerWorldY * boardZoom - viewport.clientHeight / 2)

    previousZoomRef.current = boardZoom
  }, [boardZoom])

  useEffect(() => {
    debugLog('AppShell/render', {
      mode,
      boardZoom,
      searchQuery,
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
    })
  }, [
    activeTileType,
    activeUndo,
    banksRecord,
    completedBank,
    containersRecord,
    containers.length,
    dragState,
    editingContainerId,
    modalState,
    mode,
    boardZoom,
    completedBankTileCount,
    isNewcomerDrawerOpen,
    isStaffDrawerOpen,
    newcomerBank,
    newcomerBankTileCount,
    overlappingContainerIds,
    searchQuery,
    staffBank,
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

  const handleCreateContainer = () => {
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
      name: 'New Position',
      x: Math.max(0, centeredX),
      y: Math.max(0, centeredY),
      width,
      height,
    })

    bringToFront(id)
    setEditingContainerId(id)

    debugLog('AppShell/create-container', {
      id,
      x: centeredX,
      y: centeredY,
      width,
      height,
      zoom: boardZoom,
    })
  }

  const handleModeChange = (nextMode: BoardMode) => {
    setMode(nextMode)
  }

  const handleZoomIn = () => {
    setBoardZoom((previous) =>
      clampZoom(roundZoom(previous + UI_CONSTANTS.BOARD_ZOOM_STEP)),
    )
  }

  const handleZoomOut = () => {
    setBoardZoom((previous) =>
      clampZoom(roundZoom(previous - UI_CONSTANTS.BOARD_ZOOM_STEP)),
    )
  }

  const handleZoomReset = () => {
    setBoardZoom(UI_CONSTANTS.BOARD_ZOOM_DEFAULT)
  }

  const handleToggleStaffDrawer = () => {
    setIsNewcomerDrawerOpen(false)
    setIsStaffDrawerOpen((isOpen) => !isOpen)
  }

  const handleToggleNewcomerDrawer = () => {
    setIsStaffDrawerOpen(false)
    setIsNewcomerDrawerOpen((isOpen) => !isOpen)
  }

  const handleCloseDrawers = () => {
    setIsStaffDrawerOpen(false)
    setIsNewcomerDrawerOpen(false)
  }

  const handleOpenCreateTileModal = (tileType: typeof TileType.STAFF | typeof TileType.NEWCOMER) => {
    debugLog('AppShell/open-create-tile-modal', { tileType })
    setSelectedTileId(null)
    openModal({
      type: 'tile_create',
      tileType,
    })
  }

  const handleOpenTileInfo = (tileId: string) => {
    debugLog('AppShell/open-tile-info', { tileId })
    setSelectedTileId(tileId)
    openModal({
      type: 'tile_info',
      entityId: tileId,
    })
  }

  const handleCloseTileModal = () => {
    debugLog('AppShell/close-tile-modal')
    closeModal()
    setSelectedTileId(null)
  }

  const handleCreateTile = (payload: {
    name: string
    notes: string
    tileType: typeof TileType.STAFF | typeof TileType.NEWCOMER
  }) => {
    const id = createTile(payload)

    debugLog('AppShell/create-tile', {
      createdTileId: id,
      tileType: payload.tileType,
      name: payload.name,
    })

    closeModal()
  }

  const handleSaveTile = (payload: {
    tileId: string
    name: string
    notes: string
    fatigueState: Tile['fatigueState']
  }) => {
    updateTile(payload.tileId, {
      name: payload.name,
      notes: payload.notes,
    })
    setFatigue(payload.tileId, payload.fatigueState)

    debugLog('AppShell/save-tile', payload)

    closeModal()
    setSelectedTileId(null)
  }

  const handleDeleteTile = (tileId: string) => {
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
    setSelectedTileId(null)

    debugLog('AppShell/delete-tile', {
      tileId,
      tileName: tile.name,
      undoWindowMs: 10_000,
    })
  }

  const handleTileNameCommit = (tileId: string, nextName: string) => {
    updateTile(tileId, { name: nextName })
    debugLog('AppShell/inline-tile-name-commit', { tileId, nextName })
  }

  const handleStartEditName = (containerId: string) => {
    setEditingContainerId(containerId)
  }

  const handleCommitEditName = (containerId: string, nextName: string) => {
    updateContainer(containerId, { name: nextName || 'New Position' })
    setEditingContainerId((currentId) => (currentId === containerId ? null : currentId))
  }

  const handleCancelEditName = () => {
    setEditingContainerId(null)
  }

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
            onFatigueToggle={cycleFatigue}
            onTileInfoClick={handleOpenTileInfo}
            onTileNameCommit={handleTileNameCommit}
          />
        </aside>

        <main className="board-area">
          <div className="mobile-bank-controls">
            <button
              type="button"
              className={`mobile-bank-button ${isStaffDrawerOpen ? 'mobile-bank-button-active' : ''}`}
              onClick={handleToggleStaffDrawer}
            >
              Staff ({staffBankTileCount})
            </button>
            <button
              type="button"
              className={`mobile-bank-button ${isNewcomerDrawerOpen ? 'mobile-bank-button-active' : ''}`}
              onClick={handleToggleNewcomerDrawer}
            >
              Newcomers ({newcomerBankTileCount})
            </button>
          </div>

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
            onCreateStaff={() => handleOpenCreateTileModal(TileType.STAFF)}
            onCreateNewcomer={() => handleOpenCreateTileModal(TileType.NEWCOMER)}
            onCreateContainer={handleCreateContainer}
          />

          <Board
            ref={boardViewportRef}
            canvasWidth={boardCanvasSize.width}
            canvasHeight={boardCanvasSize.height}
            zoom={boardZoom}
            isEmpty={containers.length === 0}
            emptyLabel="No containers yet"
          >
            {containers.map((container) => (
              <Container
                key={container.id}
                container={container}
                tiles={tilesByZone[container.id] ?? []}
                zoom={boardZoom}
                isOverlapping={overlappingContainerIds.has(container.id)}
                activeTileType={activeTileType}
                isEditingName={editingContainerId === container.id}
                onStartEditName={handleStartEditName}
                onCommitEditName={handleCommitEditName}
                onCancelEditName={handleCancelEditName}
                onFatigueToggle={cycleFatigue}
                onTileInfoClick={handleOpenTileInfo}
                onTileNameCommit={handleTileNameCommit}
              />
            ))}
          </Board>
        </main>

        <aside className={`right-sidebar ${isNewcomerDrawerOpen ? 'drawer-open' : ''}`}>
          <NewcomerBank
            zoneId={newcomerBank.id}
            tiles={tilesByZone[newcomerBank.id] ?? []}
            activeTileType={activeTileType}
            onFatigueToggle={cycleFatigue}
            onTileInfoClick={handleOpenTileInfo}
            onTileNameCommit={handleTileNameCommit}
          />
        </aside>
      </div>

      <footer className="bottom-bank">
        <CompletedBank
          zoneId={completedBank.id}
          tiles={tilesByZone[completedBank.id] ?? []}
          activeTileType={activeTileType}
          onFatigueToggle={cycleFatigue}
          onTileInfoClick={handleOpenTileInfo}
          onTileNameCommit={handleTileNameCommit}
        />
      </footer>

      {modalState?.type === 'tile_create' || modalState?.type === 'tile_info' ? (
        <TileInfoModal
          key={modalState.type === 'tile_info' ? `info-${modalState.entityId}` : `create-${modalState.tileType}`}
          mode={tileModalMode}
          tile={infoTile}
          createTileType={createTileType}
          currentZoneLabel={currentZoneLabel}
          onClose={handleCloseTileModal}
          onCreateTile={handleCreateTile}
          onSaveTile={handleSaveTile}
          onDeleteTile={handleDeleteTile}
        />
      ) : null}

      {activeUndo && remainingMs > 0 ? (
        <UndoSnackbar
          label={activeUndo.type === 'tile_delete' ? 'Tile deleted' : 'Deleted'}
          remainingMs={remainingMs}
          onUndo={() => {
            handleUndo()
          }}
          onDismiss={dismissActiveUndo}
        />
      ) : null}
    </div>
  )
}
