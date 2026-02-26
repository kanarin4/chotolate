import { t } from '../../utils/i18n'
import { TileType, type Tile as TileModel, type TileType as TileTypeValue, type Language } from '../../types'
import { debugLog } from '../../utils/debug'
import { Tile } from '../Tile/Tile'
import { BankContainer } from './BankContainer'
import styles from './Bank.module.css'

type NewcomerBankProps = {
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

export function NewcomerBank({
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
      title={t('newcomer_bank', language)}
      count={tiles.length}
      orientation="vertical"
      canAcceptDrop={canAcceptDrop}
      onClose={onClose}
    >
      {tiles.length === 0 ? (
        <div className={styles.emptyBank}>
          {language === 'en' ? 'No newcomer tiles yet. Drop newcomers here.' : '新入寮生がまだいません。ここに新入寮生を移動してください。'}
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
