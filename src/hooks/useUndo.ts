import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../store'
import { UI_CONSTANTS } from '../utils/constants'
import { debugLog } from '../utils/debug'

export function useUndo() {
  const undoStack = useAppStore((state) => state.undoStack)
  const popUndo = useAppStore((state) => state.popUndo)
  const clearExpiredUndo = useAppStore((state) => state.clearExpiredUndo)
  const restoreTile = useAppStore((state) => state.restoreTile)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    clearExpiredUndo()

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now())
      clearExpiredUndo()
    }, 250)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [clearExpiredUndo])

  const activeUndo = undoStack[0] ?? null

  const remainingMs = useMemo(() => {
    if (!activeUndo) {
      return 0
    }

    return Math.max(0, activeUndo.timestamp + UI_CONSTANTS.UNDO_TTL_MS - nowMs)
  }, [activeUndo, nowMs])

  const handleUndo = useCallback(() => {
    const entry = popUndo()
    if (!entry) {
      debugLog('undo/no-entry-to-restore')
      return false
    }

    if (entry.type === 'tile_delete') {
      restoreTile(entry.snapshot.tile)
      debugLog('undo/restore-tile', {
        tileId: entry.snapshot.tile.id,
      })
      return true
    }

    debugLog('undo/unsupported-entry-type', { type: entry.type })
    return false
  }, [popUndo, restoreTile])

  const dismissActiveUndo = useCallback(() => {
    const discarded = popUndo()
    debugLog('undo/dismiss', {
      discardedType: discarded?.type ?? null,
    })
  }, [popUndo])

  return {
    activeUndo,
    remainingMs,
    handleUndo,
    dismissActiveUndo,
  }
}
