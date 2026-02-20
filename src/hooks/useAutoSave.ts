import { useEffect } from 'react'
import { useAppStore } from '../store'
import { STORAGE_CONSTANTS } from '../utils/constants'
import { debugLog } from '../utils/debug'
import { savePersistedBoardState } from '../utils/storage'

export function useAutoSave() {
  const board = useAppStore((state) => state.board)
  const containers = useAppStore((state) => state.containers)
  const banks = useAppStore((state) => state.banks)
  const tiles = useAppStore((state) => state.tiles)

  useEffect(() => {
    if (!board) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      savePersistedBoardState({
        board,
        containers,
        banks,
        tiles,
      })

      debugLog('auto-save/flush', {
        boardId: board.id,
        containerCount: Object.keys(containers).length,
        bankCount: Object.keys(banks).length,
        tileCount: Object.keys(tiles).length,
      })
    }, STORAGE_CONSTANTS.AUTO_SAVE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [board, containers, banks, tiles])
}
