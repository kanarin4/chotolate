import type { Tile } from './tile'

export const BankType = {
  STAFF: 'staff',
  NEWCOMER: 'newcomer',
  COMPLETED_NEWCOMER: 'completed_newcomer',
} as const

export type BankType = (typeof BankType)[keyof typeof BankType]

export interface Board {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Container {
  id: string
  boardId: string
  name: string
  acceptsStaff: boolean
  acceptsNewcomers: boolean
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  createdAt: string
  updatedAt: string
}

export interface Bank {
  id: string
  boardId: string
  bankType: BankType
}

export type Zone = Container | Bank

export type ContainerRecord = Record<string, Container>
export type BankRecord = Record<string, Bank>
export type TileRecord = Record<string, Tile>

export interface PersistedBoardState {
  board: Board
  containers: ContainerRecord
  banks: BankRecord
  tiles: TileRecord
}
