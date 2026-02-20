import type {
  Bank,
  Board,
  BoardMode,
  DragPosition,
  DragState,
  FatigueState,
  ModalState,
  PersistedBoardState,
  Tile,
  TileType,
  UndoEntry,
  Container,
} from '../types'

export type ContainerChanges = Partial<
  Pick<
    Container,
    'name' | 'acceptsStaff' | 'acceptsNewcomers' | 'x' | 'y' | 'width' | 'height' | 'zIndex'
  >
>

export type TileChanges = Partial<Pick<Tile, 'name' | 'notes' | 'orderIndex' | 'currentZoneId'>>

export interface CreateTileInput {
  name: string
  tileType: TileType
  notes?: string
}

export interface CreateContainerInput {
  name?: string
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface BoardSlice {
  board: Board | null
  containers: Record<string, Container>
  banks: Record<string, Bank>
  tiles: Record<string, Tile>

  loadBoard: (payload: PersistedBoardState) => void
  updateBoardName: (name: string) => void
  saveBoard: () => PersistedBoardState | null

  createContainer: (payload?: CreateContainerInput) => string
  updateContainer: (id: string, changes: ContainerChanges) => void
  moveContainer: (id: string, x: number, y: number) => void
  resizeContainer: (id: string, width: number, height: number) => void
  deleteContainer: (id: string) => void
  bringToFront: (id: string) => void

  createTile: (payload: CreateTileInput) => string | null
  restoreTile: (tile: Tile) => void
  updateTile: (id: string, changes: TileChanges) => void
  deleteTile: (id: string) => void
  moveTile: (id: string, targetZoneId: string) => void
  cycleFatigue: (id: string) => void
  setFatigue: (id: string, fatigueState: FatigueState) => void
}

export interface UISlice {
  mode: BoardMode
  searchQuery: string
  dragState: DragState | null
  selectedTileId: string | null
  modalState: ModalState | null
  undoStack: UndoEntry[]

  setMode: (mode: BoardMode) => void
  setSearchQuery: (searchQuery: string) => void

  dragStart: (tileId: string, originZoneId: string, position?: DragPosition) => void
  dragMove: (position: DragPosition) => void
  dragHover: (targetZoneId: string | null) => void
  dragDrop: () => void
  dragCancel: () => void

  setSelectedTileId: (tileId: string | null) => void
  openModal: (modalState: ModalState) => void
  closeModal: () => void

  pushUndo: (entry: UndoEntry) => void
  popUndo: () => UndoEntry | null
  clearExpiredUndo: () => void
}

export type AppStore = BoardSlice & UISlice
