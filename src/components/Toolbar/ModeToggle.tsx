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
      >
        Setup
      </button>
      <button
        type="button"
        className={`${styles.modeButton} ${mode === 'command' ? styles.modeButtonActive : ''}`}
        onClick={() => onModeChange('command')}
      >
        Command
      </button>
    </div>
  )
}
