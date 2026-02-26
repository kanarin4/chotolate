import type { BoardMode, TileType, Language } from '../../types'
import type { NameTemplateType, NameTemplates } from '../../types'
import { t } from '../../utils/i18n'
import type { BoardSnapshotSummary } from '../../utils/storage'
import { CreateButtons } from './CreateButtons'
import { ModeToggle } from './ModeToggle'
import { SearchBar } from './SearchBar'
import { SettingsMenu } from './SettingsMenu'
import { ZoomControls } from './ZoomControls'
import styles from './Toolbar.module.css'

type ToolbarProps = {
  mode: BoardMode
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  onModeChange: (mode: BoardMode) => void
  zoom: number
  minZoom: number
  maxZoom: number
  onZoomOut: () => void
  onZoomIn: () => void
  onZoomReset: () => void
  selectedCount: number
  onClearSelection: () => void
  onExportBoard: () => void
  onImportBoard: (file: File) => Promise<void> | void
  onExportCsv: () => void
  onImportCsv: (file: File) => Promise<void> | void
  onQuickAddTile: (tileType: TileType, name: string) => boolean
  getDefaultTileName: (tileType: TileType) => string
  nameTemplates: NameTemplates
  onNameTemplateChange: (templateType: NameTemplateType, value: string) => void
  snapshots: BoardSnapshotSummary[]
  onRefreshSnapshots: () => Promise<void> | void
  onRestoreSnapshot: (snapshotId: string) => Promise<void> | void
  onCaptureSnapshot: () => Promise<void> | void
  onCreateStaff: () => void
  onCreateNewcomer: () => void
  onCreateContainer: () => void
  isStaffDrawerOpen: boolean
  onToggleStaffDrawer: () => void
  staffBankTileCount: number
  isNewcomerDrawerOpen: boolean
  onToggleNewcomerDrawer: () => void
  newcomerBankTileCount: number
  language: Language
  onLanguageChange: (language: Language) => void
}

export function Toolbar({
  mode,
  searchQuery,
  onSearchQueryChange,
  onModeChange,
  zoom,
  minZoom,
  maxZoom,
  onZoomOut,
  onZoomIn,
  onZoomReset,
  selectedCount,
  onClearSelection,
  onExportBoard,
  onImportBoard,
  onExportCsv,
  onImportCsv,
  onQuickAddTile,
  getDefaultTileName,
  nameTemplates,
  onNameTemplateChange,
  snapshots,
  onRefreshSnapshots,
  onRestoreSnapshot,
  onCaptureSnapshot,
  onCreateStaff,
  onCreateNewcomer,
  onCreateContainer,
  isStaffDrawerOpen,
  onToggleStaffDrawer,
  staffBankTileCount,
  isNewcomerDrawerOpen,
  onToggleNewcomerDrawer,
  newcomerBankTileCount,
  language,
  onLanguageChange,
}: ToolbarProps) {
  return (
    <section className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <div className={styles.brand}>
          <img src="/brand_logo.png" alt="" className={styles.logo} />
          <h1 className={styles.title}>Chotolate</h1>
        </div>
        <div className={styles.bankToggles}>
          <button
            type="button"
            className={`${styles.toolbarButton} ${isStaffDrawerOpen ? styles.toolbarButtonActive : ''}`}
            onClick={onToggleStaffDrawer}
            title={t('staff_bank', language)}
          >
            <span className={styles.buttonLabel}>{t('staff', language)}</span>
            <span className={styles.buttonBadge}>{staffBankTileCount}</span>
          </button>
          <button
            type="button"
            className={`${styles.toolbarButton} ${isNewcomerDrawerOpen ? styles.toolbarButtonActive : ''}`}
            onClick={onToggleNewcomerDrawer}
            title={t('newcomer_bank', language)}
          >
            <span className={styles.buttonLabel}>{t('newcomer', language)}</span>
            <span className={styles.buttonBadge}>{newcomerBankTileCount}</span>
          </button>
        </div>
        <SearchBar query={searchQuery} onChange={onSearchQueryChange} language={language} />
        {selectedCount > 0 ? (
          <div className={styles.selectionSummary}>
            <span className={styles.selectionCount}>
              {language === 'en' ? `Selected: ${selectedCount}` : `選択中: ${selectedCount}`}
            </span>
            <button type="button" className={styles.searchClearButton} onClick={onClearSelection}>
              {language === 'en' ? 'Clear selection' : '選択を解除'}
            </button>
          </div>
        ) : null}
      </div>

      <div className={styles.toolbarMiddle}>
        <ModeToggle mode={mode} onModeChange={onModeChange} language={language} />
      </div>

      <div className={styles.toolbarRight}>
        <ZoomControls
          zoom={zoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          onZoomOut={onZoomOut}
          onZoomIn={onZoomIn}
          onZoomReset={onZoomReset}
        />
        <SettingsMenu
          onExportBoard={onExportBoard}
          onImportBoard={onImportBoard}
          onExportCsv={onExportCsv}
          onImportCsv={onImportCsv}
          onQuickAddTile={onQuickAddTile}
          getDefaultTileName={getDefaultTileName}
          nameTemplates={nameTemplates}
          onNameTemplateChange={onNameTemplateChange}
          snapshots={snapshots}
          onRefreshSnapshots={onRefreshSnapshots}
          onRestoreSnapshot={onRestoreSnapshot}
          onCaptureSnapshot={onCaptureSnapshot}
          language={language}
          onLanguageChange={onLanguageChange}
        />
        {mode === 'setup' ? (
          <CreateButtons
            onCreateStaff={onCreateStaff}
            onCreateNewcomer={onCreateNewcomer}
            onCreateContainer={onCreateContainer}
            language={language}
          />
        ) : null}
      </div>
    </section>
  )
}
