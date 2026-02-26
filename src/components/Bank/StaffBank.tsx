import { t } from '../../utils/i18n'
import { TileType, type Tile as TileModel, type TileType as TileTypeValue, type Language } from '../../types'
import { debugLog } from '../../utils/debug'
import { Tile } from '../Tile/Tile'
import { BankContainer } from './BankContainer'
import styles from './Bank.module.css'

type StaffBankProps = {
  zoneId: string
  tiles: TileModel[]
  activeTileType: TileTypeValue | null
  selectedTileIds: Set<string>
  searchMatches: Set<string>
  isSearchActive: boolean
  onFatigueToggle?: (tileId: string) => void
  onTileInfoClick?: (tileId: string) => void
  onTileNameCommit?: (tileId: string, nextName: string) => void
  onTileSelect?: (tileId: string, additive: boolean) => void
  onClose?: () => void
  language: Language
}

export function StaffBank({
  zoneId,
  tiles,
  activeTileType,
  selectedTileIds,
  searchMatches,
  isSearchActive,
  onFatigueToggle,
  onTileInfoClick,
  onTileNameCommit,
  onTileSelect,
  onClose,
  language,
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
      title={t('staff_bank', language)}
      count={tiles.length}
      orientation="vertical"
      canAcceptDrop={canAcceptDrop}
      onClose={onClose}
    >
      {tiles.length === 0 ? (
        <div className={styles.emptyBank}>
          {language === 'en' ? 'No staff tiles yet. Drop staff here.' : 'スタッフがまだいません。ここにスタッフを移動してください。'}
        </div>
      ) : (
        tiles.map((tile) => (
          <Tile
            key={tile.id}
            tile={tile}
            isSelected={selectedTileIds.has(tile.id)}
            isSearchActive={isSearchActive}
            isSearchMatch={searchMatches.has(tile.id)}
            onFatigueToggle={onFatigueToggle}
            onInfoClick={onTileInfoClick}
            onNameCommit={onTileNameCommit}
            onSelect={onTileSelect}
          />
        ))
      )}
    </BankContainer>
  )
}
