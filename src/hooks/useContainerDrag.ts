import type { PointerEvent as ReactPointerEvent } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import type { Container } from '../types'

type DragCallbacks = {
  onBringToFront?: () => void
  onMove: (x: number, y: number) => void
  zoom?: number
}

type ActiveDragListeners = {
  onMove: (event: PointerEvent) => void
  onUp: (event: PointerEvent) => void
}

const removeListeners = (listeners: ActiveDragListeners | null) => {
  if (!listeners) {
    return
  }

  window.removeEventListener('pointermove', listeners.onMove)
  window.removeEventListener('pointerup', listeners.onUp)
  window.removeEventListener('pointercancel', listeners.onUp)
}

export function useContainerDrag(container: Container, callbacks: DragCallbacks) {
  const activeListenersRef = useRef<ActiveDragListeners | null>(null)

  useEffect(() => {
    return () => {
      removeListeners(activeListenersRef.current)
    }
  }, [])

  const handleDragPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
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
      const zoomScale =
        typeof callbacks.zoom === 'number' && callbacks.zoom > 0 ? callbacks.zoom : 1

      const onMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) {
          return
        }

        const deltaX = (moveEvent.clientX - startPointerX) / zoomScale
        const deltaY = (moveEvent.clientY - startPointerY) / zoomScale

        callbacks.onMove(Math.max(0, originX + deltaX), Math.max(0, originY + deltaY))
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
    [callbacks, container.x, container.y],
  )

  return {
    handleDragPointerDown,
  }
}
