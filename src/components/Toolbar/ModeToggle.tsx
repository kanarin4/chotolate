import type { BoardMode } from '../../types'
import styles from './Toolbar.module.css'

type ModeToggleProps = {
  mode: BoardMode
  onModeChange: (mode: BoardMode) => void
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className={styles.modeToggle}>
      <button
        type="button"
        className={`${styles.modeButton} ${mode === 'setup' ? styles.modeButtonActive : ''}`}
        onClick={() => onModeChange('setup')}
        title="Setup"
      >
        <span className={styles.buttonLabel}>Setup</span>
      </button>
      <button
        type="button"
        className={`${styles.modeButton} ${mode === 'command' ? styles.modeButtonActive : ''}`}
        onClick={() => onModeChange('command')}
        title="Command"
      >
        <span className={styles.buttonLabel}>Command</span>
      </button>
    </div>
  )
}
