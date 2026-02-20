import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { TileType, type TileType as TileTypeValue } from '../../types'
import styles from './Toolbar.module.css'

type SettingsMenuProps = {
  onExportBoard: () => void
  onImportBoard: (file: File) => Promise<void> | void
  onQuickAddTile: (tileType: TileTypeValue, name: string) => boolean
}

export function SettingsMenu({
  onExportBoard,
  onImportBoard,
  onQuickAddTile,
}: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [staffNameDraft, setStaffNameDraft] = useState('')
  const [newcomerNameDraft, setNewcomerNameDraft] = useState('')
  const [staffAddedCount, setStaffAddedCount] = useState(0)
  const [newcomerAddedCount, setNewcomerAddedCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
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

  const handleQuickAddStaff = () => {
    const nextName = staffNameDraft.trim()
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
    const nextName = newcomerNameDraft.trim()
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

  return (
    <div ref={menuRef} className={styles.settingsMenuContainer}>
      <button
        type="button"
        className={styles.settingsButton}
        onClick={() => setIsOpen((open) => !open)}
      >
        Settings
      </button>

      {isOpen ? (
        <section className={styles.settingsPanel}>
          <div className={styles.settingsSection}>
            <h4 className={styles.settingsHeading}>Data</h4>
            <div className={styles.settingsActions}>
              <button type="button" className={styles.settingsActionButton} onClick={onExportBoard}>
                Export board
              </button>
              <button
                type="button"
                className={styles.settingsActionButton}
                onClick={() => fileInputRef.current?.click()}
              >
                Import board
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className={styles.hiddenFileInput}
                onChange={handleImportFileChange}
              />
            </div>
          </div>

          <div className={styles.settingsSection}>
            <h4 className={styles.settingsHeading}>Quick Add (Tab)</h4>
            <p className={styles.settingsHint}>
              Enter a name and press Tab to add repeatedly during initialization.
            </p>

            <div className={styles.quickAddRow}>
              <label className={styles.quickAddLabel}>
                <span>Staff</span>
                <input
                  type="text"
                  className={styles.quickAddInput}
                  value={staffNameDraft}
                  onChange={(event) => setStaffNameDraft(event.target.value)}
                  onKeyDown={(event) => handleQuickAddKeyDown(event, TileType.STAFF)}
                  placeholder="Staff name"
                />
              </label>
              <button
                type="button"
                className={styles.quickAddButton}
                onClick={handleQuickAddStaff}
              >
                Add
              </button>
            </div>

            <div className={styles.quickAddRow}>
              <label className={styles.quickAddLabel}>
                <span>Newcomer</span>
                <input
                  type="text"
                  className={styles.quickAddInput}
                  value={newcomerNameDraft}
                  onChange={(event) => setNewcomerNameDraft(event.target.value)}
                  onKeyDown={(event) => handleQuickAddKeyDown(event, TileType.NEWCOMER)}
                  placeholder="Newcomer name"
                />
              </label>
              <button
                type="button"
                className={styles.quickAddButton}
                onClick={handleQuickAddNewcomer}
              >
                Add
              </button>
            </div>

            <p className={styles.quickAddSummary}>
              Added this session: {staffAddedCount} staff / {newcomerAddedCount} newcomers
            </p>
          </div>
        </section>
      ) : null}
    </div>
  )
}
