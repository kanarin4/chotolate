import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type ForwardedRef,
  type PointerEvent,
  type ReactNode,
} from 'react'
import styles from './Board.module.css'

type BoardProps = {
  canvasWidth: number
  canvasHeight: number
  zoom: number
  isEmpty: boolean
  emptyLabel: string
  children: ReactNode
}

type PanState = {
  pointerId: number
  startX: number
  startY: number
  startScrollLeft: number
  startScrollTop: number
}

const assignForwardedRef = (
  ref: ForwardedRef<HTMLDivElement>,
  node: HTMLDivElement | null,
): void => {
  if (typeof ref === 'function') {
    ref(node)
    return
  }

  if (ref) {
    ref.current = node
  }
}

export const Board = forwardRef<HTMLDivElement, BoardProps>(function Board(
  { canvasWidth, canvasHeight, zoom, isEmpty, emptyLabel, children },
  ref,
) {
  const panRef = useRef<PanState | null>(null)
  const [isPanning, setIsPanning] = useState(false)

  const scaledCanvasWidth = canvasWidth * zoom
  const scaledCanvasHeight = canvasHeight * zoom

  const setViewportNode = useCallback(
    (node: HTMLDivElement | null) => {
      assignForwardedRef(ref, node)
    },
    [ref],
  )

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 1) {
      return
    }

    const viewport = event.currentTarget

    panRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: viewport.scrollLeft,
      startScrollTop: viewport.scrollTop,
    }

    setIsPanning(true)
    viewport.setPointerCapture(event.pointerId)
    event.preventDefault()
  }, [])

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const panState = panRef.current
    if (!panState || event.pointerId !== panState.pointerId) {
      return
    }

    const viewport = event.currentTarget
    const deltaX = event.clientX - panState.startX
    const deltaY = event.clientY - panState.startY

    viewport.scrollLeft = panState.startScrollLeft - deltaX
    viewport.scrollTop = panState.startScrollTop - deltaY
    event.preventDefault()
  }, [])

  const handlePointerEnd = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const panState = panRef.current
    if (!panState || event.pointerId !== panState.pointerId) {
      return
    }

    panRef.current = null
    setIsPanning(false)

    const viewport = event.currentTarget
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId)
    }
  }, [])

  return (
    <div
      ref={setViewportNode}
      className={`${styles.boardViewport} ${isPanning ? styles.boardViewportPanning : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      <div
        className={styles.boardZoomLayer}
        style={{
          width: scaledCanvasWidth,
          height: scaledCanvasHeight,
        }}
      >
        <div
          className={styles.boardCanvas}
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `scale(${zoom})`,
          }}
        >
          {isEmpty ? <div className={styles.boardEmpty}>{emptyLabel}</div> : null}
          {children}
        </div>
      </div>
    </div>
  )
})
