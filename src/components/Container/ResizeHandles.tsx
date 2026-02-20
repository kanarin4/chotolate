import type { PointerEvent as ReactPointerEvent } from 'react'
import type { ResizeDirection } from '../../hooks/useContainerResize'
import styles from './Container.module.css'

type ResizeHandlesProps = {
  onResizePointerDown: (direction: ResizeDirection, event: ReactPointerEvent<HTMLButtonElement>) => void
}

const DIRECTIONS: ResizeDirection[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']

export function ResizeHandles({ onResizePointerDown }: ResizeHandlesProps) {
  return (
    <div className={styles.resizeHandles}>
      {DIRECTIONS.map((direction) => (
        <button
          key={direction}
          type="button"
          className={`${styles.resizeHandle} ${styles[`resize_${direction}`]}`}
          onPointerDown={(event) => onResizePointerDown(direction, event)}
          aria-label={`Resize ${direction}`}
        />
      ))}
    </div>
  )
}
