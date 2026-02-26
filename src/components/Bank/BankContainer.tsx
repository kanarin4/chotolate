import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import { CountBadge } from '../common/CountBadge'
import styles from './Bank.module.css'

type BankContainerProps = {
  zoneId: string
  title: string
  count: number
  orientation: 'vertical' | 'horizontal'
  canAcceptDrop?: boolean
  priority?: number
  onClose?: () => void
  children: ReactNode
}

export function BankContainer({
  zoneId,
  title,
  count,
  orientation,
  canAcceptDrop = true,
  priority = 1,
  onClose,
  children,
}: BankContainerProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: zoneId,
    disabled: !canAcceptDrop,
    data: {
      zoneType: 'bank',
      zoneId,
      priority,
    },
  })

  const isActiveDropTarget = isOver && canAcceptDrop

  return (
    <section
      ref={setNodeRef}
      className={`${styles.bankContainer} ${isActiveDropTarget ? styles.bankDropTarget : ''}`}
    >
      <header className={styles.bankHeader}>
        <div className={styles.bankHeaderLeft}>
          {onClose && (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          )}
          <span>{title}</span>
        </div>
        <CountBadge count={count} />
      </header>
      <div
        className={
          orientation === 'horizontal' ? styles.bankBodyHorizontal : styles.bankBodyVertical
        }
      >
        {children}
      </div>
    </section>
  )
}
