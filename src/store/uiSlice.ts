import type { StateCreator } from 'zustand'
import { debugLog } from '../utils/debug'
import { DEFAULT_NAME_TEMPLATES } from '../utils/constants'
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
  selectedTileIds: [],
  nameTemplates: {
    ...DEFAULT_NAME_TEMPLATES,
  },
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
    set({
      selectedTileId,
      selectedTileIds: selectedTileId ? [selectedTileId] : [],
    })
  },

  selectTile: (tileId, additive) => {
    logUIAction('selectTile', { tileId, additive })
    set((state) => {
      if (!additive) {
        return {
          selectedTileId: tileId,
          selectedTileIds: [tileId],
        }
      }

      const alreadySelected = state.selectedTileIds.includes(tileId)
      const nextSelectedTileIds = alreadySelected
        ? state.selectedTileIds.filter((id) => id !== tileId)
        : [...state.selectedTileIds, tileId]

      return {
        selectedTileId: nextSelectedTileIds[nextSelectedTileIds.length - 1] ?? null,
        selectedTileIds: nextSelectedTileIds,
      }
    })
  },

  clearTileSelection: () => {
    logUIAction('clearTileSelection')
    set({
      selectedTileId: null,
      selectedTileIds: [],
    })
  },

  removeTileFromSelection: (tileId) => {
    logUIAction('removeTileFromSelection', { tileId })
    set((state) => {
      if (!state.selectedTileIds.includes(tileId)) {
        return state
      }

      const nextSelectedTileIds = state.selectedTileIds.filter((selectedId) => selectedId !== tileId)
      return {
        selectedTileId: nextSelectedTileIds[nextSelectedTileIds.length - 1] ?? null,
        selectedTileIds: nextSelectedTileIds,
      }
    })
  },

  setNameTemplate: (templateType, value) => {
    logUIAction('setNameTemplate', { templateType, value })
    set((state) => ({
      nameTemplates: {
        ...state.nameTemplates,
        [templateType]: value,
      },
    }))
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
