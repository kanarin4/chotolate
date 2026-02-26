import { House, TileType, type Tile } from '../../types'
import styles from './Tile.module.css'

type TileDragOverlayProps = {
  tile: Tile | null
}

const LABEL_BY_HOUSE: Record<House, string> = {
  [House.RED]: 'P',
  [House.YELLOW]: 'T',
  [House.BLUE]: 'R',
  [House.GREEN]: 'B',
}

export function TileDragOverlay({ tile }: TileDragOverlayProps) {
  if (!tile) {
    return null
  }

  const supportsHouse = tile.tileType === TileType.STAFF

  return (
    <article
      className={`${styles.tile} ${tile.tileType === TileType.STAFF ? styles.staffTile : styles.newcomerTile
        } ${styles.dragOverlay}`}
    >
      {supportsHouse ? (
        <span className={`${styles.houseIndicator} ${styles[`house_${tile.house}`]}`}>
          <span className={styles.houseShape}>{LABEL_BY_HOUSE[tile.house]}</span>
        </span>
      ) : null}
      <span className={styles.tileName}>{tile.name}</span>
      <span className={styles.infoButton} aria-hidden="true">
        i
      </span>
    </article>
  )
}
