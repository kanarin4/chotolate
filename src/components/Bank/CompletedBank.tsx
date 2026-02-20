import { TileType, type Tile as TileModel, type TileType as TileTypeValue } from '../../types'
import { debugLog } from '../../utils/debug'
import { Tile } from '../Tile/Tile'
import { BankContainer } from './BankContainer'
import styles from './Bank.module.css'

type CompletedBankProps = {
  zoneId: string
  tiles: TileModel[]
  activeTileType: TileTypeValue | null
  onFatigueToggle?: (tileId: string) => void
  onTileInfoClick?: (tileId: string) => void
  onTileNameCommit?: (tileId: string, nextName: string) => void
}

export function CompletedBank({
  zoneId,
  tiles,
  activeTileType,
  onFatigueToggle,
  onTileInfoClick,
  onTileNameCommit,
}: CompletedBankProps) {
  const canAcceptDrop = activeTileType === null || activeTileType === TileType.NEWCOMER

  debugLog('Bank/render', {
    bank: 'completed_newcomer',
    tileCount: tiles.length,
    zoneId,
    canAcceptDrop,
  })

  return (
    <BankContainer
      zoneId={zoneId}
      title="Completed"
      count={tiles.length}
      orientation="horizontal"
      canAcceptDrop={canAcceptDrop}
    >
      {tiles.length === 0 ? (
        <div className={styles.emptyBank}>No completed newcomers yet.</div>
      ) : (
        tiles.map((tile) => (
          <Tile
            key={tile.id}
            tile={tile}
            onFatigueToggle={onFatigueToggle}
            onInfoClick={onTileInfoClick}
            onNameCommit={onTileNameCommit}
          />
        ))
      )}
    </BankContainer>
  )
}
