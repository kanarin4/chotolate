import { TileType, type Tile } from '../../types'
import styles from './Tile.module.css'

type TileDragOverlayProps = {
  tile: Tile | null
}

const SHAPE_BY_FATIGUE = {
  green: '●',
  yellow: '◆',
  red: '■',
} as const

export function TileDragOverlay({ tile }: TileDragOverlayProps) {
  if (!tile) {
    return null
  }

  return (
    <article
      className={`${styles.tile} ${
        tile.tileType === TileType.STAFF ? styles.staffTile : styles.newcomerTile
      } ${styles.dragOverlay}`}
    >
      <span className={`${styles.fatigueIndicator} ${styles[`fatigue_${tile.fatigueState}`]}`}>
        <span className={styles.fatigueShape}>{SHAPE_BY_FATIGUE[tile.fatigueState]}</span>
      </span>
      <span className={styles.tileName}>{tile.name}</span>
      <span className={styles.infoButton} aria-hidden="true">
        i
      </span>
    </article>
  )
}
