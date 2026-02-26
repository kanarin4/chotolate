import styles from './Toolbar.module.css'

type CreateButtonsProps = {
  onCreateStaff: () => void
  onCreateNewcomer: () => void
  onCreateContainer: () => void
}

export function CreateButtons({
  onCreateStaff,
  onCreateNewcomer,
  onCreateContainer,
}: CreateButtonsProps) {
  return (
    <div className={styles.createButtons}>
      <button type="button" className={styles.createButton} onClick={onCreateStaff} title="+ Staff">
        <span className={styles.buttonLabel}>+ Staff</span>
      </button>
      <button type="button" className={styles.createButton} onClick={onCreateNewcomer} title="+ Newcomer">
        <span className={styles.buttonLabel}>+ Newcomer</span>
      </button>
      <button type="button" className={styles.createButton} onClick={onCreateContainer} title="+ Cont">
        <span className={styles.buttonLabel}>+ Container</span>
      </button>
    </div>
  )
}
