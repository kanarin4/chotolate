import {
  PointerSensor,
  TouchSensor,
  type DropAnimation,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useCallback, useMemo, useState } from 'react'
import { useAppStore } from '../store'
import { BankType, TileType, type Bank, type Container, type Tile } from '../types'
import { debugError, debugLog } from '../utils/debug'

type ContainersRecord = Record<string, Container>
type BanksRecord = Record<string, Bank>

const SNAP_DROP_ANIMATION_MS = 200
const RETURN_DROP_ANIMATION_MS = 250
const DROP_ANIMATION_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

const isValidBankForTile = (tileType: TileType, bankType: BankType): boolean => {
  if (tileType === TileType.STAFF) {
    return bankType === BankType.STAFF
  }

  return bankType === BankType.NEWCOMER || bankType === BankType.COMPLETED_NEWCOMER
}

const isValidDropTarget = (
  tile: Tile,
  targetZoneId: string,
  containers: ContainersRecord,
  banks: BanksRecord,
): boolean => {
  const container = containers[targetZoneId]
  if (container) {
    if (tile.tileType === TileType.STAFF) {
      return container.acceptsStaff
    }

    return container.acceptsNewcomers
  }

  const bank = banks[targetZoneId]
  if (!bank) {
    return false
  }

  return isValidBankForTile(tile.tileType, bank.bankType)
}

const getDefaultBankIdByTileType = (tileType: TileType, banks: BanksRecord): string | null => {
  const targetBankType = tileType === TileType.STAFF ? BankType.STAFF : BankType.NEWCOMER

  const bank = Object.values(banks).find((candidate) => candidate.bankType === targetBankType)
  return bank?.id ?? null
}

export function useDragAndDrop() {
  const tiles = useAppStore((state) => state.tiles)
  const containers = useAppStore((state) => state.containers)
  const banks = useAppStore((state) => state.banks)
  const dragState = useAppStore((state) => state.dragState)
  const [dropAnimationDuration, setDropAnimationDuration] = useState<number>(
    SNAP_DROP_ANIMATION_MS,
  )

  const dragStart = useAppStore((state) => state.dragStart)
  const dragMove = useAppStore((state) => state.dragMove)
  const dragHover = useAppStore((state) => state.dragHover)
  const dragDrop = useAppStore((state) => state.dragDrop)
  const dragCancel = useAppStore((state) => state.dragCancel)
  const moveTile = useAppStore((state) => state.moveTile)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 8,
      },
    }),
  )

  const activeTile = useMemo(() => {
    if (!dragState) {
      return null
    }

    return tiles[dragState.tileId] ?? null
  }, [dragState, tiles])

  const dropAnimation = useMemo<DropAnimation>(
    () => ({
      duration: dropAnimationDuration,
      easing: DROP_ANIMATION_EASING,
    }),
    [dropAnimationDuration],
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const tileId = String(event.active.id)
      const tile = tiles[tileId]

      if (!tile) {
        debugError('DND/drag-start-missing-tile', { tileId })
        return
      }

      debugLog('DND/drag-start', {
        tileId,
        originZoneId: tile.currentZoneId,
        pointer: event.activatorEvent.type,
      })

      setDropAnimationDuration(SNAP_DROP_ANIMATION_MS)
      dragStart(tileId, tile.currentZoneId)
    },
    [dragStart, tiles],
  )

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      debugLog('DND/drag-move', {
        tileId: String(event.active.id),
        delta: event.delta,
      })

      dragMove({ x: event.delta.x, y: event.delta.y })
    },
    [dragMove],
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const targetZoneId = event.over ? String(event.over.id) : null
      if (dragState?.activeDropTargetId === targetZoneId) {
        return
      }

      debugLog('DND/drag-over', {
        tileId: String(event.active.id),
        targetZoneId,
      })

      dragHover(targetZoneId)
    },
    [dragHover, dragState],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const tileId = String(event.active.id)
      const tile = tiles[tileId]
      const targetZoneId = event.over ? String(event.over.id) : null

      if (!tile) {
        debugError('DND/drag-end-missing-tile', { tileId })
        dragDrop()
        dragHover(null)
        return
      }

      debugLog('DND/drag-end', {
        tileId,
        fromZoneId: tile.currentZoneId,
        targetZoneId,
      })

      const isValidDrop =
        targetZoneId !== null && isValidDropTarget(tile, targetZoneId, containers, banks)

      setDropAnimationDuration(
        isValidDrop ? SNAP_DROP_ANIMATION_MS : RETURN_DROP_ANIMATION_MS,
      )

      if (isValidDrop && targetZoneId) {
        if (targetZoneId !== tile.currentZoneId) {
          moveTile(tileId, targetZoneId)
          debugLog('DND/drop-applied', { tileId, targetZoneId })
        } else {
          debugLog('DND/drop-noop-same-zone', { tileId, targetZoneId })
        }
      } else {
        const fallbackBankId = getDefaultBankIdByTileType(tile.tileType, banks)

        if (fallbackBankId && tile.currentZoneId !== fallbackBankId) {
          moveTile(tileId, fallbackBankId)
          debugLog('DND/drop-return-to-default-bank', {
            tileId,
            fallbackBankId,
            previousZoneId: tile.currentZoneId,
          })
        } else {
          debugLog('DND/drop-no-valid-target-no-move', {
            tileId,
            fallbackBankId,
            currentZoneId: tile.currentZoneId,
          })
        }
      }

      dragDrop()
      dragHover(null)
    },
    [banks, containers, dragDrop, dragHover, moveTile, tiles],
  )

  const handleDragCancel = useCallback(() => {
    debugLog('DND/drag-cancel')
    setDropAnimationDuration(RETURN_DROP_ANIMATION_MS)
    dragCancel()
    dragHover(null)
  }, [dragCancel, dragHover])

  return {
    sensors,
    activeTile,
    dropAnimation,
    handleDragStart,
    handleDragMove,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  }
}
