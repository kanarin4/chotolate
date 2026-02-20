import type { BoardMode, TileType } from '../../types'
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
  onExportBoard: () => void
  onImportBoard: (file: File) => Promise<void> | void
  onQuickAddTile: (tileType: TileType, name: string) => boolean
  onCreateStaff: () => void
  onCreateNewcomer: () => void
  onCreateContainer: () => void
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
  onExportBoard,
  onImportBoard,
  onQuickAddTile,
  onCreateStaff,
  onCreateNewcomer,
  onCreateContainer,
}: ToolbarProps) {
  return (
    <section className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <SearchBar query={searchQuery} onChange={onSearchQueryChange} />
      </div>

      <div className={styles.toolbarMiddle}>
        <ModeToggle mode={mode} onModeChange={onModeChange} />
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
          onQuickAddTile={onQuickAddTile}
        />
        {mode === 'setup' ? (
          <CreateButtons
            onCreateStaff={onCreateStaff}
            onCreateNewcomer={onCreateNewcomer}
            onCreateContainer={onCreateContainer}
          />
        ) : null}
      </div>
    </section>
  )
}
