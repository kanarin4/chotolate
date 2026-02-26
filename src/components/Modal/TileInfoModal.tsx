import {
  useMemo,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  House,
  TileType,
  type House as HouseValue,
  type Tile,
  type TileType as TileTypeValue,
  type Language,
} from '../../types'
import { t } from '../../utils/i18n'
import { debugLog } from '../../utils/debug'
import styles from './Modal.module.css'

type TileInfoModalMode = 'create' | 'edit'

type CreateTileInput = {
  name: string
  notes: string
  tileType: TileTypeValue
}

type SaveTileInput = {
  tileId: string
  name: string
  notes: string
  house: HouseValue
}

type TileInfoModalProps = {
  mode: TileInfoModalMode
  tile: Tile | null
  createTileType: TileTypeValue | null
  defaultCreateName?: string
  currentZoneLabel: string | null
  onClose: () => void
  onCreateTile: (payload: CreateTileInput) => void
  onSaveTile: (payload: SaveTileInput) => void
  onDeleteTile: (tileId: string) => void
  language: Language
}

const formatTileTypeLabel = (tileType: TileTypeValue, lang: Language): string =>
  tileType === TileType.STAFF ? t('staff', lang) : t('newcomer', lang)

export function TileInfoModal({
  mode,
  tile,
  createTileType,
  defaultCreateName = '',
  currentZoneLabel,
  onClose,
  onCreateTile,
  onSaveTile,
  onDeleteTile,
  language,
}: TileInfoModalProps) {
  const [name, setName] = useState(() =>
    mode === 'edit' && tile ? tile.name : defaultCreateName,
  )
  const [notes, setNotes] = useState(() => (mode === 'edit' && tile ? tile.notes : ''))
  const [house, setHouse] = useState<HouseValue>(() =>
    mode === 'edit' && tile ? tile.house : House.GREEN,
  )

  const effectiveTileType = useMemo(() => {
    if (mode === 'edit' && tile) {
      return tile.tileType
    }

    return createTileType
  }, [createTileType, mode, tile])

  if (!effectiveTileType) {
    return null
  }

  const houseEnabled = effectiveTileType === TileType.STAFF

  const title =
    mode === 'create'
      ? language === 'en'
        ? `Create ${formatTileTypeLabel(effectiveTileType, language)} Tile`
        : `${formatTileTypeLabel(effectiveTileType, language)}タイルの作成`
      : language === 'en'
        ? `Edit ${tile?.name ?? 'Tile'}`
        : `${tile?.name ?? 'タイル'}の編集`

  const handleBackdropPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      debugLog('TileInfoModal/close-backdrop')
      onClose()
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      debugLog('TileInfoModal/submit-empty-name', { mode })
      return
    }

    if (mode === 'create') {
      debugLog('TileInfoModal/create-submit', {
        tileType: effectiveTileType,
        name: trimmedName,
      })
      onCreateTile({
        name: trimmedName,
        notes,
        tileType: effectiveTileType,
      })
      return
    }

    if (!tile) {
      return
    }

    debugLog('TileInfoModal/save-submit', {
      tileId: tile.id,
      name: trimmedName,
      house,
    })

    onSaveTile({
      tileId: tile.id,
      name: trimmedName,
      notes,
      house: houseEnabled ? house : House.GREEN,
    })
  }

  const handleDelete = () => {
    if (!tile) {
      return
    }

    debugLog('TileInfoModal/delete-click', { tileId: tile.id })
    onDeleteTile(tile.id)
  }

  const closeLabel = language === 'en' ? 'Close modal' : '閉じる'
  const nameLabel = language === 'en' ? 'Name' : '名前'
  const typeLabel = language === 'en' ? 'Type' : 'タイプ'
  const houseLabel = language === 'en' ? 'House' : 'ハウス'
  const notesLabel = language === 'en' ? 'Notes' : 'メモ'
  const zoneLabelLabel = language === 'en' ? 'Current Zone' : '現在の場所'
  const createdLabel = language === 'en' ? 'Created' : '作成日'
  const deleteLabel = language === 'en' ? 'Delete' : '削除'
  const cancelLabel = language === 'en' ? 'Cancel' : 'キャンセル'
  const createButtonLabel = language === 'en' ? 'Create' : '作成'
  const saveButtonLabel = language === 'en' ? 'Save' : '保存'
  const enterNamePlaceholder = language === 'en' ? 'Enter a name' : '名前を入力'
  const optionalNotesPlaceholder = language === 'en' ? 'Optional notes' : 'メモ（任意）'
  const unknownZoneLabel = language === 'en' ? 'Unknown zone' : '不明な場所'

  const paprikaLabel = t('paprika', language)
  const turmericLabel = t('turmeric', language)
  const rosemaryLabel = t('rosemary', language)
  const basilLabel = t('basil', language)

  return (
    <div className={styles.modalBackdrop} onPointerDown={handleBackdropPointerDown}>
      <section className={styles.modalCard} aria-modal="true" role="dialog" aria-label={title}>
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label={closeLabel}>
            x
          </button>
        </header>

        <form className={styles.modalBody} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{nameLabel}</span>
            <input
              className={styles.input}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={enterNamePlaceholder}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>{typeLabel}</span>
            <span className={styles.staticValue}>{formatTileTypeLabel(effectiveTileType, language)}</span>
          </label>

          {houseEnabled ? (
            mode === 'edit' ? (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>{houseLabel}</span>
                <select
                  className={styles.select}
                  value={house}
                  onChange={(event) => setHouse(event.target.value as HouseValue)}
                >
                  <option value={House.RED}>{paprikaLabel}</option>
                  <option value={House.YELLOW}>{turmericLabel}</option>
                  <option value={House.BLUE}>{rosemaryLabel}</option>
                  <option value={House.GREEN}>{basilLabel}</option>
                </select>
              </label>
            ) : (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>{houseLabel}</span>
                <span className={styles.staticValue}>{basilLabel} (default)</span>
              </label>
            )
          ) : null}

          <label className={styles.field}>
            <span className={styles.fieldLabel}>{notesLabel}</span>
            <textarea
              className={styles.textarea}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={optionalNotesPlaceholder}
            />
          </label>

          {mode === 'edit' && tile ? (
            <>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>{zoneLabelLabel}</span>
                <span className={styles.staticValue}>{currentZoneLabel ?? unknownZoneLabel}</span>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>{createdLabel}</span>
                <span className={styles.staticValue}>{new Date(tile.createdAt).toLocaleString()}</span>
              </label>
            </>
          ) : null}

          <footer className={styles.actions}>
            {mode === 'edit' && tile ? (
              <button type="button" className={`${styles.actionButton} ${styles.deleteButton}`} onClick={handleDelete}>
                {deleteLabel}
              </button>
            ) : null}
            <button type="button" className={styles.actionButton} onClick={onClose}>
              {cancelLabel}
            </button>
            <button type="submit" className={styles.actionButton}>
              {mode === 'create' ? createButtonLabel : saveButtonLabel}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
