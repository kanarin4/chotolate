import { create } from 'zustand'
import { createBoardSlice } from './boardSlice'
import { createUISlice } from './uiSlice'
import type { AppStore } from './types'
import { debugLog } from '../utils/debug'
import { loadPersistedBoardState, loadPersistedMode, savePersistedMode } from '../utils/storage'

const hydratedBoardState = loadPersistedBoardState()
const hydratedMode = loadPersistedMode()

export const useAppStore = create<AppStore>()((...args) => ({
  ...createBoardSlice(...args),
  ...createUISlice(...args),
  ...(hydratedMode
    ? {
        mode: hydratedMode,
      }
    : {}),
  ...(hydratedBoardState
    ? {
        board: hydratedBoardState.board,
        containers: hydratedBoardState.containers,
        banks: hydratedBoardState.banks,
        tiles: hydratedBoardState.tiles,
      }
    : {}),
}))

if (hydratedBoardState) {
  debugLog('store/hydrated-board', {
    boardId: hydratedBoardState.board.id,
    containerCount: Object.keys(hydratedBoardState.containers).length,
    bankCount: Object.keys(hydratedBoardState.banks).length,
    tileCount: Object.keys(hydratedBoardState.tiles).length,
  })
}

useAppStore.subscribe((nextState, prevState) => {
  if (nextState.mode !== prevState.mode) {
    savePersistedMode(nextState.mode)
  }

  if (!import.meta.env.DEV) {
    return
  }

  const changedKeys = (Object.keys(nextState) as Array<keyof AppStore>).filter(
    (key) => nextState[key] !== prevState[key],
  )

  debugLog('store/update', {
    changedKeys,
    containerCount: Object.keys(nextState.containers).length,
    bankCount: Object.keys(nextState.banks).length,
    tileCount: Object.keys(nextState.tiles).length,
    hasDragState: Boolean(nextState.dragState),
    selectedTileId: nextState.selectedTileId,
    mode: nextState.mode,
  })
})

export * from './types'
export * from './selectors'
