import styles from './common.module.css'

type CountBadgeProps = {
  count: number
}

export function CountBadge({ count }: CountBadgeProps) {
  const tileNoun = count === 1 ? 'tile' : 'tiles'

  return (
    <span
      className={`${styles.countBadge} ${count === 0 ? styles.countBadgeEmpty : ''}`}
      aria-label={`${count} ${tileNoun}`}
      title={`${count} ${tileNoun}`}
    >
      {count}
    </span>
  )
}
