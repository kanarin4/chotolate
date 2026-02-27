import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { t } from '../../utils/i18n'
import type { Language } from '../../types'
import type { BoardSnapshotSummary } from '../../utils/storage'
import {
  TileType,
  type NameTemplates,
  type NameTemplateType,
  type TileType as TileTypeValue,
} from '../../types'
import styles from './Toolbar.module.css'

type SettingsMenuProps = {
  onExportBoard: () => void
  onImportBoard: (file: File) => Promise<void> | void
  onExportCsv: () => void
  onImportCsv: (file: File) => Promise<void> | void
  onQuickAddTile: (tileType: TileTypeValue, name: string) => boolean
  getDefaultTileName: (tileType: TileTypeValue) => string
  nameTemplates: NameTemplates
  onNameTemplateChange: (templateType: NameTemplateType, value: string) => void
  snapshots: BoardSnapshotSummary[]
  onRefreshSnapshots: () => Promise<void> | void
  onRestoreSnapshot: (snapshotId: string) => Promise<void> | void
  onCaptureSnapshot: () => Promise<void> | void
  onClearSnapshots: () => Promise<void> | void
  language: Language
  onLanguageChange: (language: Language) => void
}

export function SettingsMenu({
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
  onClearSnapshots,
  language,
  onLanguageChange,
}: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [staffNameDraft, setStaffNameDraft] = useState('')
  const [newcomerNameDraft, setNewcomerNameDraft] = useState('')
  const [staffAddedCount, setStaffAddedCount] = useState(0)
  const [newcomerAddedCount, setNewcomerAddedCount] = useState(0)
  const [isRefreshingSnapshots, setIsRefreshingSnapshots] = useState(false)
  const [isCapturingSnapshot, setIsCapturingSnapshot] = useState(false)
  const [isClearingSnapshots, setIsClearingSnapshots] = useState(false)
  const [restoringSnapshotId, setRestoringSnapshotId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const csvFileInputRef = useRef<HTMLInputElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleWindowPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    window.addEventListener('pointerdown', handleWindowPointerDown)

    return () => {
      window.removeEventListener('pointerdown', handleWindowPointerDown)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    void onRefreshSnapshots()
  }, [isOpen, onRefreshSnapshots])

  const handleQuickAddStaff = () => {
    const nextName = (staffNameDraft.trim() || getDefaultTileName(TileType.STAFF)).trim()
    if (!nextName) {
      return
    }

    if (!onQuickAddTile(TileType.STAFF, nextName)) {
      return
    }

    setStaffNameDraft('')
    setStaffAddedCount((count) => count + 1)
  }

  const handleQuickAddNewcomer = () => {
    const nextName = (newcomerNameDraft.trim() || getDefaultTileName(TileType.NEWCOMER)).trim()
    if (!nextName) {
      return
    }

    if (!onQuickAddTile(TileType.NEWCOMER, nextName)) {
      return
    }

    setNewcomerNameDraft('')
    setNewcomerAddedCount((count) => count + 1)
  }

  const handleQuickAddKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    tileType: TileTypeValue,
  ) => {
    if (event.key !== 'Tab' && event.key !== 'Enter') {
      return
    }

    event.preventDefault()

    if (tileType === TileType.STAFF) {
      handleQuickAddStaff()
      return
    }

    handleQuickAddNewcomer()
  }

  const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    Promise.resolve(onImportBoard(file)).finally(() => {
      event.target.value = ''
    })
  }

  const handleImportCsvFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    Promise.resolve(onImportCsv(file)).finally(() => {
      event.target.value = ''
    })
  }

  const handleNameTemplateChange = (templateType: NameTemplateType, value: string) => {
    onNameTemplateChange(templateType, value)
  }

  const handleCaptureSnapshot = () => {
    setIsCapturingSnapshot(true)
    Promise.resolve(onCaptureSnapshot()).finally(() => {
      setIsCapturingSnapshot(false)
    })
  }

  const handleRestoreSnapshot = (snapshotId: string) => {
    setRestoringSnapshotId(snapshotId)
    Promise.resolve(onRestoreSnapshot(snapshotId)).finally(() => {
      setRestoringSnapshotId((currentId) => (currentId === snapshotId ? null : currentId))
    })
  }

  const handleClearSnapshots = () => {
    const confirmed = window.confirm(t('clear_history_confirm', language))
    if (!confirmed) {
      return
    }

    setIsClearingSnapshots(true)
    Promise.resolve(onClearSnapshots()).finally(() => {
      setIsClearingSnapshots(false)
      void onRefreshSnapshots()
    })
  }

  return (
    <div ref={menuRef} className={styles.settingsMenuContainer}>
      <button
        type="button"
        className={styles.settingsButton}
        onClick={() => setIsOpen((open) => !open)}
      >
        {t('settings', language)}
      </button>

      {isOpen ? (
        <section className={styles.settingsPanel}>
          <div className={styles.settingsSection}>
            <h4 className={styles.settingsHeading}>{t('language', language)}</h4>
            <div className={styles.languageToggle}>
              <button
                type="button"
                className={`${styles.languageButton} ${language === 'en' ? styles.languageButtonActive : ''}`}
                onClick={() => onLanguageChange('en')}
              >
                {t('en', language)}
              </button>
              <button
                type="button"
                className={`${styles.languageButton} ${language === 'jp' ? styles.languageButtonActive : ''}`}
                onClick={() => onLanguageChange('jp')}
              >
                {t('jp', language)}
              </button>
            </div>
          </div>

          <div className={styles.settingsSection}>
            <h4 className={styles.settingsHeading}>{t('data', language) || 'Data'}</h4>
            <div className={styles.settingsActions}>
              <button type="button" className={styles.settingsActionButton} onClick={onExportBoard}>
                {t('export_board', language)}
              </button>
              <button
                type="button"
                className={styles.settingsActionButton}
                onClick={() => fileInputRef.current?.click()}
              >
                {t('import_board', language)}
              </button>
              <button type="button" className={styles.settingsActionButton} onClick={onExportCsv}>
                {t('export_csv', language)}
              </button>
              <button
                type="button"
                className={styles.settingsActionButton}
                onClick={() => csvFileInputRef.current?.click()}
              >
                {t('import_csv', language)}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className={styles.hiddenFileInput}
                onChange={handleImportFileChange}
              />
              <input
                ref={csvFileInputRef}
                type="file"
                accept="text/csv,.csv"
                className={styles.hiddenFileInput}
                onChange={handleImportCsvFileChange}
              />
            </div>
          </div>

          <div className={styles.settingsSection}>
            <h4 className={styles.settingsHeading}>{t('default_names', language)}</h4>
            <div className={styles.templateGrid}>
              <label className={styles.quickAddLabel}>
                <span>{t('staff_template', language)}</span>
                <input
                  type="text"
                  className={styles.quickAddInput}
                  value={nameTemplates.staff}
                  onChange={(event) => handleNameTemplateChange('staff', event.target.value)}
                  placeholder="Staff {n}"
                />
              </label>
              <label className={styles.quickAddLabel}>
                <span>{t('newcomer_template', language)}</span>
                <input
                  type="text"
                  className={styles.quickAddInput}
                  value={nameTemplates.newcomer}
                  onChange={(event) => handleNameTemplateChange('newcomer', event.target.value)}
                  placeholder="Newcomer {n}"
                />
              </label>
              <label className={styles.quickAddLabel}>
                <span>{t('container_template', language)}</span>
                <input
                  type="text"
                  className={styles.quickAddInput}
                  value={nameTemplates.container}
                  onChange={(event) => handleNameTemplateChange('container', event.target.value)}
                  placeholder="Position {n}"
                />
              </label>
            </div>
          </div>

          <div className={styles.settingsSection}>
            <h4 className={styles.settingsHeading}>{t('quick_add', language)}</h4>
            <p className={styles.settingsHint}>
              {language === 'en'
                ? 'Enter a name and press Tab to add repeatedly. Empty name uses current defaults.'
                : '名前を入力してTabを押すと連続で追加できます。空欄の場合は現在のデフォルト名が使用されます。'}
            </p>

            <div className={styles.quickAddRow}>
              <label className={styles.quickAddLabel}>
                <span>{t('staff', language)}</span>
                <input
                  type="text"
                  className={styles.quickAddInput}
                  value={staffNameDraft}
                  onChange={(event) => setStaffNameDraft(event.target.value)}
                  onKeyDown={(event) => handleQuickAddKeyDown(event, TileType.STAFF)}
                  placeholder={getDefaultTileName(TileType.STAFF)}
                />
              </label>
              <button
                type="button"
                className={styles.quickAddButton}
                onClick={handleQuickAddStaff}
              >
                {t('add', language)}
              </button>
            </div>

            <div className={styles.quickAddRow}>
              <label className={styles.quickAddLabel}>
                <span>{t('newcomer', language)}</span>
                <input
                  type="text"
                  className={styles.quickAddInput}
                  value={newcomerNameDraft}
                  onChange={(event) => setNewcomerNameDraft(event.target.value)}
                  onKeyDown={(event) => handleQuickAddKeyDown(event, TileType.NEWCOMER)}
                  placeholder={getDefaultTileName(TileType.NEWCOMER)}
                />
              </label>
              <button
                type="button"
                className={styles.quickAddButton}
                onClick={handleQuickAddNewcomer}
              >
                {t('add', language)}
              </button>
            </div>

            <p className={styles.quickAddSummary}>
              {t('added_this_session', language)}: {staffAddedCount} {t('staff', language)} / {newcomerAddedCount} {t('newcomer', language)}
            </p>
          </div>

          <div className={styles.settingsSection}>
            <div className={styles.snapshotHeader}>
              <h4 className={styles.settingsHeading}>{t('snapshots', language)}</h4>
              <div className={styles.settingsActions}>
                <button
                  type="button"
                  className={styles.settingsActionButton}
                  onClick={handleCaptureSnapshot}
                  disabled={isCapturingSnapshot}
                >
                  {isCapturingSnapshot ? t('saving', language) : t('save_now', language)}
                </button>
                <button
                  type="button"
                  className={styles.settingsActionButton}
                  onClick={() => {
                    setIsRefreshingSnapshots(true)
                    Promise.resolve(onRefreshSnapshots()).finally(() => {
                      setIsRefreshingSnapshots(false)
                    })
                  }}
                  disabled={isRefreshingSnapshots}
                >
                  {isRefreshingSnapshots ? t('refreshing', language) : t('refresh', language)}
                </button>
                <button
                  type="button"
                  className={`${styles.settingsActionButton} ${styles.dangerButton}`}
                  onClick={handleClearSnapshots}
                  disabled={isClearingSnapshots || snapshots.length === 0}
                >
                  {isClearingSnapshots ? t('refreshing', language) : t('clear_history', language)}
                </button>
              </div>
            </div>

            {snapshots.length === 0 ? (
              <p className={styles.settingsHint}>{t('no_snapshots', language)}</p>
            ) : (
              <ul className={styles.snapshotList}>
                {snapshots.map((snapshot) => (
                  <li key={snapshot.id} className={styles.snapshotItem}>
                    <div className={styles.snapshotMeta}>
                      <span>{new Date(snapshot.savedAt).toLocaleString()}</span>
                      <span className={styles.snapshotType}>{snapshot.source}</span>
                      <span>
                        {snapshot.tileCount} {t('newcomer', language)} / {snapshot.containerCount} {t('container', language)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.settingsActionButton}
                      onClick={() => handleRestoreSnapshot(snapshot.id)}
                      disabled={restoringSnapshotId === snapshot.id}
                    >
                      {restoringSnapshotId === snapshot.id ? t('restoring', language) : t('restore', language)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}
