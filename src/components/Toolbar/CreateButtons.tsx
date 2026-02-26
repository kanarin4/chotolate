import { t } from '../../utils/i18n'
import type { Language } from '../../types'
import styles from './Toolbar.module.css'

type CreateButtonsProps = {
  onCreateStaff: () => void
  onCreateNewcomer: () => void
  onCreateContainer: () => void
  language: Language
}

export function CreateButtons({
  onCreateStaff,
  onCreateNewcomer,
  onCreateContainer,
  language,
}: CreateButtonsProps) {
  return (
    <div className={styles.createButtons}>
      <button type="button" className={styles.createButton} onClick={onCreateStaff} title={`+ ${t('staff', language)}`}>
        <span className={styles.buttonLabel}>+ {t('staff', language)}</span>
      </button>
      <button type="button" className={styles.createButton} onClick={onCreateNewcomer} title={`+ ${t('newcomer', language)}`}>
        <span className={styles.buttonLabel}>+ {t('newcomer', language)}</span>
      </button>
      <button type="button" className={styles.createButton} onClick={onCreateContainer} title={`+ ${t('container', language)}`}>
        <span className={styles.buttonLabel}>+ {t('container', language)}</span>
      </button>
    </div>
  )
}
