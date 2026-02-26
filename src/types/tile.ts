export const TileType = {
  STAFF: 'staff',
  NEWCOMER: 'newcomer',
} as const

export type TileType = (typeof TileType)[keyof typeof TileType]

export const House = {
  RED: 'red',
  YELLOW: 'yellow',
  BLUE: 'blue',
  GREEN: 'green',
} as const

export type House = (typeof House)[keyof typeof House]

export interface Tile {
  id: string
  boardId: string
  currentZoneId: string
  name: string
  tileType: TileType
  house: House
  notes: string
  orderIndex: number
  createdAt: string
  updatedAt: string
}
