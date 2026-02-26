import { useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import type { PersistedBoardState } from '../types'
import { STORAGE_CONSTANTS } from '../utils/constants'
import { debugLog } from '../utils/debug'
import { saveBoardSnapshot, savePersistedBoardState } from '../utils/storage'

export function useAutoSave() {
  const board = useAppStore((state) => state.board)
  const containers = useAppStore((state) => state.containers)
  const banks = useAppStore((state) => state.banks)
  const tiles = useAppStore((state) => state.tiles)
  const latestPayloadRef = useRef<PersistedBoardState | null>(null)
  const lastSnapshotAtRef = useRef(0)

  useEffect(() => {
    if (!board) {
      latestPayloadRef.current = null
      return
    }

    latestPayloadRef.current = {
      board,
      containers,
      banks,
      tiles,
    }
  }, [board, containers, banks, tiles])

  useEffect(() => {
    if (!board) {
      return
    }

    const payload: PersistedBoardState = {
      board,
      containers,
      banks,
      tiles,
    }

    const timeoutId = window.setTimeout(() => {
      savePersistedBoardState(payload)

      debugLog('auto-save/flush', {
        boardId: board.id,
        containerCount: Object.keys(containers).length,
        bankCount: Object.keys(banks).length,
        tileCount: Object.keys(tiles).length,
      })

      const now = Date.now()
      const shouldSnapshot =
        now - lastSnapshotAtRef.current >= STORAGE_CONSTANTS.SNAPSHOT_INTERVAL_MS

      if (shouldSnapshot) {
        lastSnapshotAtRef.current = now
        void saveBoardSnapshot(payload, 'autosave')
      }
    }, STORAGE_CONSTANTS.AUTO_SAVE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [board, containers, banks, tiles])

  useEffect(() => {
    const flushLifecycleSnapshot = () => {
      const payload = latestPayloadRef.current
      if (!payload) {
        return
      }

      savePersistedBoardState(payload)
      void saveBoardSnapshot(payload, 'lifecycle')

      debugLog('auto-save/lifecycle-flush', {
        boardId: payload.board.id,
        tileCount: Object.keys(payload.tiles).length,
      })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushLifecycleSnapshot()
      }
    }

    window.addEventListener('beforeunload', flushLifecycleSnapshot)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', flushLifecycleSnapshot)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}
