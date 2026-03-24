import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type MutableRefObject,
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
  onBackgroundPointerDown?: () => void
  onTrackpadZoom?: (scaleFactor: number, anchor: { x: number; y: number }) => void
  children: ReactNode
}

type PanState = {
  pointerId: number
  startX: number
  startY: number
  startScrollLeft: number
  startScrollTop: number
}

type ViewportMetrics = {
  scrollLeft: number
  scrollTop: number
  clientWidth: number
  clientHeight: number
  scrollWidth: number
  scrollHeight: number
}

type BoardPositionIndicatorProps = {
  viewportRef: MutableRefObject<HTMLDivElement | null>
  contentWidth: number
  contentHeight: number
}

const LOCATOR_HIDE_DELAY_MS = 900
const WHEEL_DELTA_LINE_PX = 16

const readViewportMetrics = (viewport: HTMLDivElement): ViewportMetrics => ({
  scrollLeft: viewport.scrollLeft,
  scrollTop: viewport.scrollTop,
  clientWidth: viewport.clientWidth,
  clientHeight: viewport.clientHeight,
  scrollWidth: viewport.scrollWidth,
  scrollHeight: viewport.scrollHeight,
})

const hasScrollableOverflow = (metrics: ViewportMetrics): boolean =>
  metrics.scrollWidth > metrics.clientWidth || metrics.scrollHeight > metrics.clientHeight

const normalizeWheelDelta = (
  delta: number,
  deltaMode: number,
  viewportSize: number,
): number => {
  if (deltaMode === 1) {
    return delta * WHEEL_DELTA_LINE_PX
  }

  if (deltaMode === 2) {
    return delta * viewportSize
  }

  return delta
}

function BoardPositionIndicator({
  viewportRef,
  contentWidth,
  contentHeight,
}: BoardPositionIndicatorProps) {
  const hideTimeoutRef = useRef<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [metrics, setMetrics] = useState<ViewportMetrics>({
    scrollLeft: 0,
    scrollTop: 0,
    clientWidth: 1,
    clientHeight: 1,
    scrollWidth: Math.max(1, contentWidth),
    scrollHeight: Math.max(1, contentHeight),
  })

  const updateMetrics = useCallback((viewport: HTMLDivElement) => {
    const nextMetrics = readViewportMetrics(viewport)

    setMetrics((previousMetrics) => {
      if (
        previousMetrics.scrollLeft === nextMetrics.scrollLeft &&
        previousMetrics.scrollTop === nextMetrics.scrollTop &&
        previousMetrics.clientWidth === nextMetrics.clientWidth &&
        previousMetrics.clientHeight === nextMetrics.clientHeight &&
        previousMetrics.scrollWidth === nextMetrics.scrollWidth &&
        previousMetrics.scrollHeight === nextMetrics.scrollHeight
      ) {
        return previousMetrics
      }

      return nextMetrics
    })

    return nextMetrics
  }, [])

  const revealTemporarily = useCallback(() => {
    setIsVisible(true)

    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current)
    }

    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false)
      hideTimeoutRef.current = null
    }, LOCATOR_HIDE_DELAY_MS)
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    const syncMetrics = () => {
      updateMetrics(viewport)
    }

    const handleScroll = () => {
      const nextMetrics = updateMetrics(viewport)

      if (hasScrollableOverflow(nextMetrics)) {
        revealTemporarily()
      }
    }

    syncMetrics()

    const resizeObserver = new ResizeObserver(() => {
      syncMetrics()
    })

    resizeObserver.observe(viewport)

    const zoomLayer = viewport.firstElementChild
    if (zoomLayer instanceof HTMLElement) {
      resizeObserver.observe(zoomLayer)
    }

    viewport.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      viewport.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [contentHeight, contentWidth, revealTemporarily, updateMetrics, viewportRef])

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  const locatorGeometry = useMemo(() => {
    const worldWidth = Math.max(metrics.scrollWidth, metrics.clientWidth, 1)
    const worldHeight = Math.max(metrics.scrollHeight, metrics.clientHeight, 1)
    const maxScrollX = Math.max(0, worldWidth - metrics.clientWidth)
    const maxScrollY = Math.max(0, worldHeight - metrics.clientHeight)

    if (maxScrollX === 0 && maxScrollY === 0) {
      return null
    }

    const maxFrameWidth = 152
    const maxFrameHeight = 108
    const aspectRatio = worldWidth / worldHeight

    let frameWidth = maxFrameWidth
    let frameHeight = frameWidth / aspectRatio

    if (frameHeight > maxFrameHeight) {
      frameHeight = maxFrameHeight
      frameWidth = frameHeight * aspectRatio
    }

    const rawViewportWidth = (metrics.clientWidth / worldWidth) * frameWidth
    const rawViewportHeight = (metrics.clientHeight / worldHeight) * frameHeight
    const viewportWidth = Math.min(frameWidth, Math.max(16, rawViewportWidth))
    const viewportHeight = Math.min(frameHeight, Math.max(16, rawViewportHeight))
    const maxViewportLeft = Math.max(0, frameWidth - viewportWidth)
    const maxViewportTop = Math.max(0, frameHeight - viewportHeight)
    const viewportLeft =
      maxScrollX === 0 ? 0 : (metrics.scrollLeft / maxScrollX) * maxViewportLeft
    const viewportTop = maxScrollY === 0 ? 0 : (metrics.scrollTop / maxScrollY) * maxViewportTop

    return {
      frameWidth,
      frameHeight,
      viewportWidth,
      viewportHeight,
      viewportLeft,
      viewportTop,
      horizontalPercent: maxScrollX === 0 ? 0 : Math.round((metrics.scrollLeft / maxScrollX) * 100),
      verticalPercent: maxScrollY === 0 ? 0 : Math.round((metrics.scrollTop / maxScrollY) * 100),
    }
  }, [metrics])

  if (!locatorGeometry) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className={`${styles.boardPositionIndicator} ${isVisible ? styles.boardPositionIndicatorVisible : ''}`}
    >
      <div className={styles.boardPositionIndicatorLabel}>Board Position</div>
      <div
        className={styles.boardPositionIndicatorFrame}
        style={{
          width: locatorGeometry.frameWidth,
          height: locatorGeometry.frameHeight,
        }}
      >
        <div
          className={styles.boardPositionIndicatorViewport}
          style={{
            width: locatorGeometry.viewportWidth,
            height: locatorGeometry.viewportHeight,
            transform: `translate(${locatorGeometry.viewportLeft}px, ${locatorGeometry.viewportTop}px)`,
          }}
        />
      </div>
      <div className={styles.boardPositionIndicatorMeta}>
        {locatorGeometry.horizontalPercent}% x · {locatorGeometry.verticalPercent}% y
      </div>
    </div>
  )
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
  {
    canvasWidth,
    canvasHeight,
    zoom,
    isEmpty,
    emptyLabel,
    onBackgroundPointerDown,
    onTrackpadZoom,
    children,
  },
  ref,
) {
  const panRef = useRef<PanState | null>(null)
  const viewportNodeRef = useRef<HTMLDivElement | null>(null)
  const gestureStartZoomRef = useRef<number | null>(null)
  const [isPanning, setIsPanning] = useState(false)

  const scaledCanvasWidth = canvasWidth * zoom
  const scaledCanvasHeight = canvasHeight * zoom

  const setViewportNode = useCallback(
    (node: HTMLDivElement | null) => {
      viewportNodeRef.current = node
      assignForwardedRef(ref, node)
    },
    [ref],
  )

  useEffect(() => {
    const viewport = viewportNodeRef.current
    if (!viewport || !onTrackpadZoom) {
      return
    }

    const getAnchorFromClientPoint = (clientX: number, clientY: number) => {
      const bounds = viewport.getBoundingClientRect()

      return {
        x: clientX - bounds.left,
        y: clientY - bounds.top,
      }
    }

    const handleWheel = (event: WheelEvent) => {
      // Trackpad pinch arrives as ctrl+wheel in Chromium-based browsers.
      if (!event.ctrlKey) {
        event.preventDefault()

        const deltaX = normalizeWheelDelta(event.deltaX, event.deltaMode, viewport.clientWidth)
        const deltaY = normalizeWheelDelta(event.deltaY, event.deltaMode, viewport.clientHeight)
        const nextScrollLeft = viewport.scrollLeft + deltaX
        const nextScrollTop = viewport.scrollTop + deltaY

        viewport.scrollLeft = Math.max(
          0,
          Math.min(nextScrollLeft, viewport.scrollWidth - viewport.clientWidth),
        )
        viewport.scrollTop = Math.max(
          0,
          Math.min(nextScrollTop, viewport.scrollHeight - viewport.clientHeight),
        )
        return
      }

      event.preventDefault()

      const anchor = getAnchorFromClientPoint(event.clientX, event.clientY)
      const scaleFactor = Math.exp(-event.deltaY * 0.0025)

      onTrackpadZoom(scaleFactor, anchor)
    }

    type GestureEventLike = Event & {
      scale: number
      clientX: number
      clientY: number
      preventDefault: () => void
    }

    const handleGestureStart = (event: Event) => {
      const gestureEvent = event as GestureEventLike

      gestureStartZoomRef.current = zoom
      gestureEvent.preventDefault()
    }

    const handleGestureChange = (event: Event) => {
      const gestureEvent = event as GestureEventLike

      gestureEvent.preventDefault()

      const anchor = getAnchorFromClientPoint(gestureEvent.clientX, gestureEvent.clientY)
      const baseZoom = gestureStartZoomRef.current ?? zoom

      if (baseZoom <= 0) {
        return
      }

      onTrackpadZoom(gestureEvent.scale, anchor)
    }

    const handleGestureEnd = () => {
      gestureStartZoomRef.current = null
    }

    viewport.addEventListener('wheel', handleWheel, { passive: false })
    viewport.addEventListener('gesturestart', handleGestureStart as EventListener)
    viewport.addEventListener('gesturechange', handleGestureChange as EventListener)
    viewport.addEventListener('gestureend', handleGestureEnd)

    return () => {
      viewport.removeEventListener('wheel', handleWheel)
      viewport.removeEventListener('gesturestart', handleGestureStart as EventListener)
      viewport.removeEventListener('gesturechange', handleGestureChange as EventListener)
      viewport.removeEventListener('gestureend', handleGestureEnd)
    }
  }, [onTrackpadZoom, zoom])

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    // Middle button for panning
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

  const handleCanvasPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return
      }

      if (event.target === event.currentTarget) {
        onBackgroundPointerDown?.()
      }
    },
    [onBackgroundPointerDown],
  )

  return (
    <div className={styles.boardRoot}>
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
            onPointerDown={handleCanvasPointerDown}
          >
            {isEmpty ? <div className={styles.boardEmpty}>{emptyLabel}</div> : null}
            {children}
          </div>
        </div>
      </div>
      <BoardPositionIndicator
        viewportRef={viewportNodeRef}
        contentWidth={scaledCanvasWidth}
        contentHeight={scaledCanvasHeight}
      />
    </div>
  )
})
