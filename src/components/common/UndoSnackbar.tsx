import { debugLog } from '../../utils/debug'
import styles from './common.module.css'

type UndoSnackbarProps = {
  label: string
  remainingMs: number
  onUndo: () => void
  onDismiss: () => void
}

export function UndoSnackbar({ label, remainingMs, onUndo, onDismiss }: UndoSnackbarProps) {
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))

  const handleUndo = () => {
    debugLog('UndoSnackbar/undo-click')
    onUndo()
  }

  const handleDismiss = () => {
    debugLog('UndoSnackbar/dismiss-click')
    onDismiss()
  }

  return (
    <section className={styles.undoSnackbar} role="status" aria-live="polite">
      <span>{label}</span>
      <div className={styles.undoActions}>
        <button type="button" className={styles.undoButton} onClick={handleUndo}>
          Undo ({remainingSeconds}s)
        </button>
        <button type="button" className={styles.dismissButton} onClick={handleDismiss} aria-label="Dismiss undo">
          x
        </button>
      </div>
    </section>
  )
}
