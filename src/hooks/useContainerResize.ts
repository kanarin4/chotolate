import type { PointerEvent as ReactPointerEvent } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import type { Container, Tile } from '../types'
import { calculateContainerMinSize } from '../utils/containerSizing'

export type ResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

type ResizeCallbacks = {
  onBringToFront?: () => void
  onResize: (next: { x: number; y: number; width: number; height: number }) => void
  zoom?: number
}

type ActiveResizeListeners = {
  onMove: (event: PointerEvent) => void
  onUp: (event: PointerEvent) => void
}

const includesNorth = (direction: ResizeDirection): boolean => direction.includes('n')
const includesSouth = (direction: ResizeDirection): boolean => direction.includes('s')
const includesEast = (direction: ResizeDirection): boolean => direction.includes('e')
const includesWest = (direction: ResizeDirection): boolean => direction.includes('w')

const removeListeners = (listeners: ActiveResizeListeners | null) => {
  if (!listeners) {
    return
  }

  window.removeEventListener('pointermove', listeners.onMove)
  window.removeEventListener('pointerup', listeners.onUp)
  window.removeEventListener('pointercancel', listeners.onUp)
}

export function useContainerResize(container: Container, tiles: Tile[], callbacks: ResizeCallbacks) {
  const activeListenersRef = useRef<ActiveResizeListeners | null>(null)

  useEffect(() => {
    return () => {
      removeListeners(activeListenersRef.current)
    }
  }, [])

  const handleResizePointerDown = useCallback(
    (direction: ResizeDirection, event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      callbacks.onBringToFront?.()

      removeListeners(activeListenersRef.current)

      const pointerId = event.pointerId
      const startPointerX = event.clientX
      const startPointerY = event.clientY
      const originX = container.x
      const originY = container.y
      const originWidth = container.width
      const originHeight = container.height
      const zoomScale =
        typeof callbacks.zoom === 'number' && callbacks.zoom > 0 ? callbacks.zoom : 1

      const onMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) {
          return
        }

        const deltaX = (moveEvent.clientX - startPointerX) / zoomScale
        const deltaY = (moveEvent.clientY - startPointerY) / zoomScale

        let nextX = originX
        let nextY = originY
        let rawWidth = originWidth
        let rawHeight = originHeight

        if (includesEast(direction)) {
          rawWidth = originWidth + deltaX
        }

        if (includesSouth(direction)) {
          rawHeight = originHeight + deltaY
        }

        if (includesWest(direction)) {
          rawWidth = originWidth - deltaX
        }

        if (includesNorth(direction)) {
          rawHeight = originHeight - deltaY
        }

        const horizontalSizing = calculateContainerMinSize(rawWidth, tiles, {
          showStaffSection: container.acceptsStaff,
          showNewcomerSection: container.acceptsNewcomers,
        })
        const clampedWidth = Math.max(rawWidth, horizontalSizing.minWidth)

        const verticalSizing = calculateContainerMinSize(clampedWidth, tiles, {
          showStaffSection: container.acceptsStaff,
          showNewcomerSection: container.acceptsNewcomers,
        })
        const clampedHeight = Math.max(rawHeight, verticalSizing.minHeight)

        if (includesWest(direction)) {
          nextX = originX + (originWidth - clampedWidth)
        }

        if (includesNorth(direction)) {
          nextY = originY + (originHeight - clampedHeight)
        }

        callbacks.onResize({
          x: Math.max(0, nextX),
          y: Math.max(0, nextY),
          width: clampedWidth,
          height: clampedHeight,
        })
      }

      const onUp = (upEvent: PointerEvent) => {
        if (upEvent.pointerId !== pointerId) {
          return
        }

        removeListeners(activeListenersRef.current)
        activeListenersRef.current = null
      }

      activeListenersRef.current = { onMove, onUp }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [
      callbacks,
      container.acceptsNewcomers,
      container.acceptsStaff,
      container.height,
      container.width,
      container.x,
      container.y,
      tiles,
    ],
  )

  return {
    handleResizePointerDown,
  }
}
