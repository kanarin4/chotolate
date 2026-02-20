import {
  useMemo,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { FatigueState, TileType, type FatigueState as FatigueStateValue, type Tile, type TileType as TileTypeValue } from '../../types'
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
  fatigueState: FatigueStateValue
}

type TileInfoModalProps = {
  mode: TileInfoModalMode
  tile: Tile | null
  createTileType: TileTypeValue | null
  currentZoneLabel: string | null
  onClose: () => void
  onCreateTile: (payload: CreateTileInput) => void
  onSaveTile: (payload: SaveTileInput) => void
  onDeleteTile: (tileId: string) => void
}

const formatTileTypeLabel = (tileType: TileTypeValue): string =>
  tileType === TileType.STAFF ? 'Staff' : 'Newcomer'

export function TileInfoModal({
  mode,
  tile,
  createTileType,
  currentZoneLabel,
  onClose,
  onCreateTile,
  onSaveTile,
  onDeleteTile,
}: TileInfoModalProps) {
  const [name, setName] = useState(() => (mode === 'edit' && tile ? tile.name : ''))
  const [notes, setNotes] = useState(() => (mode === 'edit' && tile ? tile.notes : ''))
  const [fatigueState, setFatigueState] = useState<FatigueStateValue>(() =>
    mode === 'edit' && tile ? tile.fatigueState : FatigueState.GREEN,
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

  const title =
    mode === 'create'
      ? `Create ${formatTileTypeLabel(effectiveTileType)} Tile`
      : `Edit ${tile?.name ?? 'Tile'}`

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
      fatigueState,
    })

    onSaveTile({
      tileId: tile.id,
      name: trimmedName,
      notes,
      fatigueState,
    })
  }

  const handleDelete = () => {
    if (!tile) {
      return
    }

    debugLog('TileInfoModal/delete-click', { tileId: tile.id })
    onDeleteTile(tile.id)
  }

  return (
    <div className={styles.modalBackdrop} onPointerDown={handleBackdropPointerDown}>
      <section className={styles.modalCard} aria-modal="true" role="dialog" aria-label={title}>
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            x
          </button>
        </header>

        <form className={styles.modalBody} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Name</span>
            <input
              className={styles.input}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter a name"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Type</span>
            <span className={styles.staticValue}>{formatTileTypeLabel(effectiveTileType)}</span>
          </label>

          {mode === 'edit' ? (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Fatigue</span>
              <select
                className={styles.select}
                value={fatigueState}
                onChange={(event) => setFatigueState(event.target.value as FatigueStateValue)}
              >
                <option value={FatigueState.GREEN}>Green</option>
                <option value={FatigueState.YELLOW}>Yellow</option>
                <option value={FatigueState.RED}>Red</option>
              </select>
            </label>
          ) : (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Fatigue</span>
              <span className={styles.staticValue}>Green (default)</span>
            </label>
          )}

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Notes</span>
            <textarea
              className={styles.textarea}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes"
            />
          </label>

          {mode === 'edit' && tile ? (
            <>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Current Zone</span>
                <span className={styles.staticValue}>{currentZoneLabel ?? 'Unknown zone'}</span>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Created</span>
                <span className={styles.staticValue}>{new Date(tile.createdAt).toLocaleString()}</span>
              </label>
            </>
          ) : null}

          <footer className={styles.actions}>
            {mode === 'edit' && tile ? (
              <button type="button" className={`${styles.actionButton} ${styles.deleteButton}`} onClick={handleDelete}>
                Delete
              </button>
            ) : null}
            <button type="button" className={styles.actionButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.actionButton}>
              {mode === 'create' ? 'Create' : 'Save'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
