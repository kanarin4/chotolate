import { TileType, type Tile as TileModel, type TileType as TileTypeValue } from '../../types'
import { debugLog } from '../../utils/debug'
import { Tile } from '../Tile/Tile'
import { BankContainer } from './BankContainer'
import styles from './Bank.module.css'

type StaffBankProps = {
  zoneId: string
  tiles: TileModel[]
  activeTileType: TileTypeValue | null
  onFatigueToggle?: (tileId: string) => void
  onTileInfoClick?: (tileId: string) => void
  onTileNameCommit?: (tileId: string, nextName: string) => void
}

export function StaffBank({
  zoneId,
  tiles,
  activeTileType,
  onFatigueToggle,
  onTileInfoClick,
  onTileNameCommit,
}: StaffBankProps) {
  const canAcceptDrop = activeTileType === null || activeTileType === TileType.STAFF

  debugLog('Bank/render', {
    bank: 'staff',
    tileCount: tiles.length,
    zoneId,
    canAcceptDrop,
  })

  return (
    <BankContainer
      zoneId={zoneId}
      title="Staff Bank"
      count={tiles.length}
      orientation="vertical"
      canAcceptDrop={canAcceptDrop}
    >
      {tiles.length === 0 ? (
        <div className={styles.emptyBank}>No staff tiles yet. Drop staff here.</div>
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
