import type { Tile, TileType } from './tile'

export type BoardMode = 'setup' | 'command'

export interface DragPosition {
  x: number
  y: number
}

export interface DragState {
  tileId: string
  originZoneId: string
  currentPosition: DragPosition
  activeDropTargetId: string | null
}

export type ModalState =
  | {
      type: 'tile_info'
      entityId: string
    }
  | {
      type: 'tile_create'
      tileType: TileType
    }
  | {
      type: 'container_edit'
      entityId: string
    }
  | {
      type: 'delete_confirm'
      entityId: string
    }

export type ModalType = ModalState['type']

export interface TileDeleteUndoEntry {
  type: 'tile_delete'
  timestamp: number
  snapshot: {
    tile: Tile
  }
}

export interface ContainerDeleteUndoEntry {
  type: 'container_delete'
  timestamp: number
  snapshot: unknown
}

export type UndoEntry = TileDeleteUndoEntry | ContainerDeleteUndoEntry
export type UndoType = UndoEntry['type']
