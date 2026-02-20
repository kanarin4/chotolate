import type { StateCreator } from 'zustand'
import { debugLog } from '../utils/debug'
import { UI_CONSTANTS } from '../utils/constants'
import type { AppStore, UISlice } from './types'

const logUIAction = (action: string, payload?: unknown): void => {
  debugLog(`store/ui/${action}`, payload)
}

export const createUISlice: StateCreator<AppStore, [], [], UISlice> = (set, get) => ({
  mode: 'setup',
  searchQuery: '',
  dragState: null,
  selectedTileId: null,
  modalState: null,
  undoStack: [],

  setMode: (mode) => {
    logUIAction('setMode', { mode })
    set({ mode })
  },

  setSearchQuery: (searchQuery) => {
    logUIAction('setSearchQuery', { searchQuery })
    set({ searchQuery })
  },

  dragStart: (tileId, originZoneId, position = { x: 0, y: 0 }) => {
    logUIAction('dragStart', { tileId, originZoneId, position })
    set({
      dragState: {
        tileId,
        originZoneId,
        currentPosition: position,
        activeDropTargetId: null,
      },
    })
  },

  dragMove: (position) => {
    logUIAction('dragMove', { position })
    set((state) => {
      if (!state.dragState) {
        return state
      }

      return {
        dragState: {
          ...state.dragState,
          currentPosition: position,
        },
      }
    })
  },

  dragHover: (targetZoneId) => {
    logUIAction('dragHover', { targetZoneId })
    set((state) => {
      if (!state.dragState) {
        return state
      }

      return {
        dragState: {
          ...state.dragState,
          activeDropTargetId: targetZoneId,
        },
      }
    })
  },

  dragDrop: () => {
    logUIAction('dragDrop')
    set({ dragState: null })
  },

  dragCancel: () => {
    logUIAction('dragCancel')
    set({ dragState: null })
  },

  setSelectedTileId: (selectedTileId) => {
    logUIAction('setSelectedTileId', { selectedTileId })
    set({ selectedTileId })
  },

  openModal: (modalState) => {
    logUIAction('openModal', modalState)
    set({ modalState })
  },

  closeModal: () => {
    logUIAction('closeModal')
    set({ modalState: null })
  },

  pushUndo: (entry) => {
    logUIAction('pushUndo', entry)
    set((state) => ({
      undoStack: [entry, ...state.undoStack].slice(0, UI_CONSTANTS.MAX_UNDO_ENTRIES),
    }))
  },

  popUndo: () => {
    logUIAction('popUndo')
    const [firstEntry] = get().undoStack

    if (!firstEntry) {
      logUIAction('popUndo/empty')
      return null
    }

    set((state) => ({
      undoStack: state.undoStack.slice(1),
    }))

    return firstEntry
  },

  clearExpiredUndo: () => {
    logUIAction('clearExpiredUndo')
    const cutoff = Date.now() - UI_CONSTANTS.UNDO_TTL_MS

    set((state) => ({
      undoStack: state.undoStack.filter((entry) => entry.timestamp >= cutoff),
    }))
  },
})
