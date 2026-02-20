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
      <button type="button" className={styles.createButton} onClick={onCreateStaff}>
        + Staff
      </button>
      <button type="button" className={styles.createButton} onClick={onCreateNewcomer}>
        + Newcomer
      </button>
      <button type="button" className={styles.createButton} onClick={onCreateContainer}>
        + Container
      </button>
    </div>
  )
}
