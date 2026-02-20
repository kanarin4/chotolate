import type { PointerEvent } from 'react'
import { FatigueState } from '../../types'
import styles from './Tile.module.css'

const SHAPE_BY_STATE: Record<FatigueState, string> = {
  [FatigueState.GREEN]: '●',
  [FatigueState.YELLOW]: '◆',
  [FatigueState.RED]: '■',
}

type FatigueIndicatorProps = {
  state: FatigueState
  onToggle?: () => void
}

export function FatigueIndicator({ state, onToggle }: FatigueIndicatorProps) {
  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
  }

  return (
    <button
      type="button"
      className={`${styles.fatigueIndicator} ${styles[`fatigue_${state}`]}`}
      onClick={onToggle}
      onPointerDown={handlePointerDown}
      aria-label={`Fatigue ${state}`}
    >
      <span className={styles.fatigueShape}>{SHAPE_BY_STATE[state]}</span>
    </button>
  )
}
