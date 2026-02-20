import { useDroppable } from '@dnd-kit/core'
import { useCallback } from 'react'
import { useContainerDrag } from '../../hooks/useContainerDrag'
import { useContainerResize } from '../../hooks/useContainerResize'
import { useAppStore } from '../../store'
import {
  BankType,
  TileType,
  type Container as ContainerModel,
  type Tile as TileModel,
  type TileType as TileTypeValue,
} from '../../types'
import { debugLog } from '../../utils/debug'
import { ContainerGrid } from './ContainerGrid'
import { ContainerHeader } from './ContainerHeader'
import { ResizeHandles } from './ResizeHandles'
import styles from './Container.module.css'

type ContainerProps = {
  container: ContainerModel
  tiles: TileModel[]
  zoom: number
  isOverlapping: boolean
  activeTileType: TileTypeValue | null
  isEditingName: boolean
  onStartEditName: (containerId: string) => void
  onCommitEditName: (containerId: string, name: string) => void
  onCancelEditName: () => void
  onFatigueToggle?: (tileId: string) => void
  onTileInfoClick?: (tileId: string) => void
  onTileNameCommit?: (tileId: string, nextName: string) => void
}

export function Container({
  container,
  tiles,
  zoom,
  isOverlapping,
  activeTileType,
  isEditingName,
  onStartEditName,
  onCommitEditName,
  onCancelEditName,
  onFatigueToggle,
  onTileInfoClick,
  onTileNameCommit,
}: ContainerProps) {
  const updateContainer = useAppStore((state) => state.updateContainer)
  const bringToFront = useAppStore((state) => state.bringToFront)
  const deleteContainer = useAppStore((state) => state.deleteContainer)
  const moveTile = useAppStore((state) => state.moveTile)
  const banks = useAppStore((state) => state.banks)

  const canAcceptDrop =
    activeTileType === null ||
    (activeTileType === TileType.STAFF ? container.acceptsStaff : container.acceptsNewcomers)

  const { isOver, setNodeRef } = useDroppable({
    id: container.id,
    disabled: !canAcceptDrop,
    data: {
      zoneType: 'container',
      zoneId: container.id,
      priority: container.zIndex + 100,
    },
  })

  const staffCount = tiles.filter((tile) => tile.tileType === TileType.STAFF).length
  const newcomerCount = tiles.length - staffCount

  const handleMove = useCallback(
    (x: number, y: number) => {
      updateContainer(container.id, { x, y })
    },
    [container.id, updateContainer],
  )

  const handleResize = useCallback(
    (next: { x: number; y: number; width: number; height: number }) => {
      updateContainer(container.id, next)
    },
    [container.id, updateContainer],
  )

  const { handleDragPointerDown } = useContainerDrag(container, {
    zoom,
    onBringToFront: () => bringToFront(container.id),
    onMove: handleMove,
  })

  const { handleResizePointerDown } = useContainerResize(container, tiles, {
    zoom,
    onBringToFront: () => bringToFront(container.id),
    onResize: handleResize,
  })

  const handleDeleteContainer = () => {
    const confirmed = window.confirm(
      `Delete ${container.name}? Assigned tiles will return to their banks.`,
    )

    if (!confirmed) {
      return
    }

    deleteContainer(container.id)
  }

  const staffBankId =
    Object.values(banks).find((bank) => bank.bankType === BankType.STAFF)?.id ?? null
  const newcomerBankId =
    Object.values(banks).find((bank) => bank.bankType === BankType.NEWCOMER)?.id ?? null

  const handleToggleStaffSection = (enabled: boolean) => {
    if (!enabled && !container.acceptsNewcomers) {
      window.alert('At least one section must remain enabled.')
      return
    }

    updateContainer(container.id, { acceptsStaff: enabled })

    if (!enabled && staffBankId) {
      tiles
        .filter((tile) => tile.tileType === TileType.STAFF)
        .forEach((tile) => moveTile(tile.id, staffBankId))
    }
  }

  const handleToggleNewcomerSection = (enabled: boolean) => {
    if (!enabled && !container.acceptsStaff) {
      window.alert('At least one section must remain enabled.')
      return
    }

    updateContainer(container.id, { acceptsNewcomers: enabled })

    if (!enabled && newcomerBankId) {
      tiles
        .filter((tile) => tile.tileType === TileType.NEWCOMER)
        .forEach((tile) => moveTile(tile.id, newcomerBankId))
    }
  }

  debugLog('Container/render', {
    containerId: container.id,
    name: container.name,
    x: container.x,
    y: container.y,
    width: container.width,
    height: container.height,
    tileCount: tiles.length,
    staffCount,
    newcomerCount,
    acceptsStaff: container.acceptsStaff,
    acceptsNewcomers: container.acceptsNewcomers,
    zoom,
    isOverlapping,
    activeTileType,
    isDropTarget: isOver && canAcceptDrop,
  })

  return (
    <section
      ref={setNodeRef}
      className={`${styles.container} ${isOverlapping ? styles.containerOverlapWarning : ''} ${
        isOver && canAcceptDrop ? styles.containerDropTarget : ''
      }`}
      style={{
        left: container.x,
        top: container.y,
        width: container.width,
        height: container.height,
        zIndex: container.zIndex,
      }}
    >
      <ContainerHeader
        name={container.name}
        count={tiles.length}
        acceptsStaff={container.acceptsStaff}
        acceptsNewcomers={container.acceptsNewcomers}
        isEditingName={isEditingName}
        onStartEditName={() => onStartEditName(container.id)}
        onCommitEditName={(name) => onCommitEditName(container.id, name)}
        onCancelEditName={onCancelEditName}
        onToggleStaffSection={handleToggleStaffSection}
        onToggleNewcomerSection={handleToggleNewcomerSection}
        onDeleteContainer={handleDeleteContainer}
        onHeaderPointerDown={handleDragPointerDown}
      />

      <ContainerGrid
        containerWidth={container.width}
        tiles={tiles}
        showStaffSection={container.acceptsStaff}
        showNewcomerSection={container.acceptsNewcomers}
        onFatigueToggle={onFatigueToggle}
        onInfoClick={onTileInfoClick}
        onTileNameCommit={onTileNameCommit}
      />

      <ResizeHandles onResizePointerDown={handleResizePointerDown} />
    </section>
  )
}
