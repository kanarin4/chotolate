import { TileType, type Tile as TileModel } from '../../types'
import { useContainerLayout } from '../../hooks/useContainerLayout'
import { Tile } from '../Tile/Tile'
import styles from './Container.module.css'

type ContainerGridProps = {
  containerWidth: number
  tiles: TileModel[]
  showStaffSection: boolean
  showNewcomerSection: boolean
  onFatigueToggle?: (tileId: string) => void
  onInfoClick?: (tileId: string) => void
  onTileNameCommit?: (tileId: string, nextName: string) => void
}

function TileSection({
  title,
  tiles,
  containerWidth,
  emptyLabel,
  onFatigueToggle,
  onInfoClick,
  onTileNameCommit,
}: {
  title: string
  tiles: TileModel[]
  containerWidth: number
  emptyLabel: string
  onFatigueToggle?: (tileId: string) => void
  onInfoClick?: (tileId: string) => void
  onTileNameCommit?: (tileId: string, nextName: string) => void
}) {
  const layout = useContainerLayout(containerWidth, tiles.length)

  return (
    <section className={styles.tileSection}>
      <header className={styles.sectionLabel}>{title}</header>

      {tiles.length === 0 ? (
        <div className={styles.sectionEmptyState}>{emptyLabel}</div>
      ) : (
        <div
          className={styles.containerGrid}
          style={{
            gridTemplateColumns: `repeat(${layout.columns}, var(--tile-width))`,
          }}
        >
          {tiles.map((tile) => (
            <Tile
              key={tile.id}
              tile={tile}
              onFatigueToggle={onFatigueToggle}
              onInfoClick={onInfoClick}
              onNameCommit={onTileNameCommit}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export function ContainerGrid({
  containerWidth,
  tiles,
  showStaffSection,
  showNewcomerSection,
  onFatigueToggle,
  onInfoClick,
  onTileNameCommit,
}: ContainerGridProps) {
  const staffTiles = tiles.filter((tile) => tile.tileType === TileType.STAFF)
  const newcomerTiles = tiles.filter((tile) => tile.tileType === TileType.NEWCOMER)

  if (!showStaffSection && !showNewcomerSection) {
    return <div className={styles.sectionEmptyState}>No active sections enabled</div>
  }

  return (
    <div className={styles.containerSections}>
      {showStaffSection ? (
        <TileSection
          title="Staff"
          tiles={staffTiles}
          containerWidth={containerWidth}
          emptyLabel="No staff assigned. Drop staff tiles here."
          onFatigueToggle={onFatigueToggle}
          onInfoClick={onInfoClick}
          onTileNameCommit={onTileNameCommit}
        />
      ) : null}

      {showNewcomerSection ? (
        <TileSection
          title="Newcomers"
          tiles={newcomerTiles}
          containerWidth={containerWidth}
          emptyLabel="No newcomers assigned. Drop newcomer tiles here."
          onFatigueToggle={onFatigueToggle}
          onInfoClick={onInfoClick}
          onTileNameCommit={onTileNameCommit}
        />
      ) : null}
    </div>
  )
}
