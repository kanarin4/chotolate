import { TileType, type Tile as TileModel, type TileType as TileTypeValue } from '../../types'
import { debugLog } from '../../utils/debug'
import { Tile } from '../Tile/Tile'
import { BankContainer } from './BankContainer'
import styles from './Bank.module.css'

type NewcomerBankProps = {
  zoneId: string
  tiles: TileModel[]
  activeTileType: TileTypeValue | null
  onFatigueToggle?: (tileId: string) => void
  onTileInfoClick?: (tileId: string) => void
  onTileNameCommit?: (tileId: string, nextName: string) => void
}

export function NewcomerBank({
  zoneId,
  tiles,
  activeTileType,
  onFatigueToggle,
  onTileInfoClick,
  onTileNameCommit,
}: NewcomerBankProps) {
  const canAcceptDrop = activeTileType === null || activeTileType === TileType.NEWCOMER

  debugLog('Bank/render', {
    bank: 'newcomer',
    tileCount: tiles.length,
    zoneId,
    canAcceptDrop,
  })

  return (
    <BankContainer
      zoneId={zoneId}
      title="Newcomer Bank"
      count={tiles.length}
      orientation="vertical"
      canAcceptDrop={canAcceptDrop}
    >
      {tiles.length === 0 ? (
        <div className={styles.emptyBank}>No newcomer tiles yet. Drop newcomers here.</div>
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
