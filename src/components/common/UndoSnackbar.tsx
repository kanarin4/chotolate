import { debugLog } from '../../utils/debug'
import type { Language } from '../../types'
import styles from './common.module.css'

type UndoSnackbarProps = {
  label: string
  remainingMs: number
  onUndo: () => void
  onDismiss: () => void
  language: Language
}

export function UndoSnackbar({ label, remainingMs, onUndo, onDismiss, language }: UndoSnackbarProps) {
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))

  const handleUndo = () => {
    debugLog('UndoSnackbar/undo-click')
    onUndo()
  }

  const handleDismiss = () => {
    debugLog('UndoSnackbar/dismiss-click')
    onDismiss()
  }

  const undoLabel = language === 'en' ? 'Undo' : '元に戻す'

  return (
    <section className={styles.undoSnackbar} role="status" aria-live="polite">
      <span>{label}</span>
      <div className={styles.undoActions}>
        <button type="button" className={styles.undoButton} onClick={handleUndo}>
          {undoLabel} ({remainingSeconds}s)
        </button>
        <button type="button" className={styles.dismissButton} onClick={handleDismiss} aria-label="Dismiss undo">
          x
        </button>
      </div>
    </section>
  )
}
