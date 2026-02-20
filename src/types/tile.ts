export const TileType = {
  STAFF: 'staff',
  NEWCOMER: 'newcomer',
} as const

export type TileType = (typeof TileType)[keyof typeof TileType]

export const FatigueState = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
} as const

export type FatigueState = (typeof FatigueState)[keyof typeof FatigueState]

export interface Tile {
  id: string
  boardId: string
  currentZoneId: string
  name: string
  tileType: TileType
  fatigueState: FatigueState
  notes: string
  orderIndex: number
  createdAt: string
  updatedAt: string
}
