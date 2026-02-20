import { LAYOUT_CONSTANTS } from './constants'

type LayoutConstants = typeof LAYOUT_CONSTANTS

export interface ContainerLayoutResult {
  columns: number
  rows: number
  minWidth: number
  minHeight: number
  tilePositions: Array<{ left: number; top: number }>
}

export function calculateContainerLayout(
  containerWidth: number,
  tileCount: number,
  constants: LayoutConstants = LAYOUT_CONSTANTS,
): ContainerLayoutResult {
  const availableWidth = Math.max(containerWidth - constants.GRID_GAP * 2, 0)
  const columns = Math.max(
    1,
    Math.floor((availableWidth + constants.GRID_GAP) / (constants.TILE_WIDTH + constants.GRID_GAP)),
  )

  const rows = Math.max(1, Math.ceil(tileCount / columns))

  const minWidth = Math.max(
    constants.CONTAINER_MIN_WIDTH,
    columns * constants.TILE_WIDTH + (columns + 1) * constants.GRID_GAP,
  )

  const minHeight = Math.max(
    constants.CONTAINER_MIN_HEIGHT,
    rows * constants.TILE_HEIGHT +
      (rows + 1) * constants.GRID_GAP +
      constants.CONTAINER_HEADER_HEIGHT,
  )

  const tilePositions = Array.from({ length: tileCount }, (_value, index) => {
    const columnIndex = index % columns
    const rowIndex = Math.floor(index / columns)

    return {
      left: constants.GRID_GAP + columnIndex * (constants.TILE_WIDTH + constants.GRID_GAP),
      top: constants.GRID_GAP + rowIndex * (constants.TILE_HEIGHT + constants.GRID_GAP),
    }
  })

  return {
    columns,
    rows,
    minWidth,
    minHeight,
    tilePositions,
  }
}
