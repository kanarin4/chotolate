import { t } from '../../utils/i18n'
import { TileType, type Tile as TileModel, type TileType as TileTypeValue, type Language } from '../../types'
import { debugLog } from '../../utils/debug'
import { Tile } from '../Tile/Tile'
import { BankContainer } from './BankContainer'
import styles from './Bank.module.css'

type CompletedBankProps = {
  zoneId: string
  tiles: TileModel[]
  activeTileType: TileTypeValue | null
  selectedTileIds: Set<string>
  searchMatches: Set<string>
  isSearchActive: boolean
  onHouseToggle?: (tileId: string) => void
  onTileInfoClick?: (tileId: string) => void
  onTileNameCommit?: (tileId: string, nextName: string) => void
  onTileSelect?: (tileId: string, additive: boolean) => void
  onClose?: () => void
  language: Language
}

export function CompletedBank({
  zoneId,
  tiles,
  activeTileType,
  selectedTileIds,
  searchMatches,
  isSearchActive,
  onHouseToggle,
  onTileInfoClick,
  onTileNameCommit,
  onTileSelect,
  onClose,
  language,
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
      title={t('completed_bank', language)}
      count={tiles.length}
      orientation="horizontal"
      canAcceptDrop={canAcceptDrop}
      onClose={onClose}
    >
      {tiles.length === 0 ? (
        <div className={styles.emptyBank}>
          {language === 'en' ? 'No completed newcomers yet.' : '完了した新入寮生はまだいません。'}
        </div>
      ) : (
        tiles.map((tile) => (
          <Tile
            key={tile.id}
            tile={tile}
            isSelected={selectedTileIds.has(tile.id)}
            isSearchActive={isSearchActive}
            isSearchMatch={searchMatches.has(tile.id)}
            onHouseToggle={onHouseToggle}
            onInfoClick={onTileInfoClick}
            onNameCommit={onTileNameCommit}
            onSelect={onTileSelect}
          />
        ))
      )}
    </BankContainer>
  )
}
