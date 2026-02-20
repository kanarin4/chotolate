import { TileType, type Tile } from '../types'
import { LAYOUT_CONSTANTS } from './constants'

const SECTION_HEADER_HEIGHT = 24
const SECTION_BORDER_AND_PADDING = 18
const CONTAINER_SECTIONS_VERTICAL_PADDING = 16
const SECTION_GAP = LAYOUT_CONSTANTS.GRID_GAP
const CONTAINER_HORIZONTAL_BUFFER = 32

const getColumnsForWidth = (containerWidth: number): number => {
  const availableWidth = Math.max(containerWidth - CONTAINER_HORIZONTAL_BUFFER, 0)

  return Math.max(
    1,
    Math.floor((availableWidth + LAYOUT_CONSTANTS.GRID_GAP) / (LAYOUT_CONSTANTS.TILE_WIDTH + LAYOUT_CONSTANTS.GRID_GAP)),
  )
}

const getRows = (tileCount: number, columns: number): number => {
  if (tileCount <= 0) {
    return 1
  }

  return Math.ceil(tileCount / columns)
}

const getSectionHeight = (rows: number): number =>
  SECTION_HEADER_HEIGHT +
  SECTION_BORDER_AND_PADDING +
  rows * LAYOUT_CONSTANTS.TILE_HEIGHT +
  Math.max(rows - 1, 0) * LAYOUT_CONSTANTS.GRID_GAP

export interface ContainerMinSize {
  minWidth: number
  minHeight: number
  columns: number
  staffRows: number | null
  newcomerRows: number | null
}

export interface SectionVisibilityOptions {
  showStaffSection?: boolean
  showNewcomerSection?: boolean
}

export function calculateContainerMinSize(
  containerWidth: number,
  tiles: Tile[],
  options: SectionVisibilityOptions = {},
): ContainerMinSize {
  const showStaffSection = options.showStaffSection ?? true
  const showNewcomerSection = options.showNewcomerSection ?? true

  const columns = getColumnsForWidth(containerWidth)

  const staffCount = tiles.filter((tile) => tile.tileType === TileType.STAFF).length
  const newcomerCount = tiles.filter((tile) => tile.tileType === TileType.NEWCOMER).length

  const staffRows = showStaffSection ? getRows(staffCount, columns) : null
  const newcomerRows = showNewcomerSection ? getRows(newcomerCount, columns) : null

  const minWidth = Math.max(
    LAYOUT_CONSTANTS.CONTAINER_MIN_WIDTH,
    LAYOUT_CONSTANTS.TILE_WIDTH + CONTAINER_HORIZONTAL_BUFFER,
  )

  const activeSectionHeights = [staffRows, newcomerRows]
    .filter((rows): rows is number => typeof rows === 'number')
    .map((rows) => getSectionHeight(rows))
  const activeSectionCount = activeSectionHeights.length

  const sectionsHeight =
    activeSectionHeights.reduce((totalHeight, sectionHeight) => totalHeight + sectionHeight, 0) +
    CONTAINER_SECTIONS_VERTICAL_PADDING +
    Math.max(activeSectionCount - 1, 0) * SECTION_GAP

  const minHeight = Math.max(
    LAYOUT_CONSTANTS.CONTAINER_MIN_HEIGHT,
    LAYOUT_CONSTANTS.CONTAINER_HEADER_HEIGHT + sectionsHeight,
  )

  return {
    minWidth,
    minHeight,
    columns,
    staffRows,
    newcomerRows,
  }
}
