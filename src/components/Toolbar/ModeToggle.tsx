import type { BoardMode, Language } from '../../types'
import { t } from '../../utils/i18n'
import styles from './Toolbar.module.css'

type ModeToggleProps = {
  mode: BoardMode
  onModeChange: (mode: BoardMode) => void
  language: Language
}

export function ModeToggle({ mode, onModeChange, language }: ModeToggleProps) {
  return (
    <div className={styles.modeToggle}>
      <button
        type="button"
        className={`${styles.modeButton} ${mode === 'setup' ? styles.modeButtonActive : ''}`}
        onClick={() => onModeChange('setup')}
        title={t('setup_mode', language)}
      >
        <span className={styles.buttonLabel}>{t('setup_mode', language)}</span>
      </button>
      <button
        type="button"
        className={`${styles.modeButton} ${mode === 'command' ? styles.modeButtonActive : ''}`}
        onClick={() => onModeChange('command')}
        title={t('command_mode', language)}
      >
        <span className={styles.buttonLabel}>{t('command_mode', language)}</span>
      </button>
    </div>
  )
}
