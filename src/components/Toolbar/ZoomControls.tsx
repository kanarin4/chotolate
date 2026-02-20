import { UI_CONSTANTS } from '../../utils/constants'
import styles from './Toolbar.module.css'

type ZoomControlsProps = {
  zoom: number
  minZoom: number
  maxZoom: number
  onZoomOut: () => void
  onZoomIn: () => void
  onZoomReset: () => void
}

export function ZoomControls({
  zoom,
  minZoom,
  maxZoom,
  onZoomOut,
  onZoomIn,
  onZoomReset,
}: ZoomControlsProps) {
  const zoomPercent = `${Math.round(zoom * 100) + UI_CONSTANTS.BOARD_ZOOM_LABEL_OFFSET}%`
  const isAtMin = zoom <= minZoom
  const isAtMax = zoom >= maxZoom

  return (
    <div className={styles.zoomControls}>
      <button
        type="button"
        className={styles.zoomButton}
        onClick={onZoomOut}
        disabled={isAtMin}
        aria-label="Zoom out"
      >
        -
      </button>

      <button
        type="button"
        className={styles.zoomValueButton}
        onClick={onZoomReset}
        aria-label="Reset zoom to default"
        title="Reset zoom"
      >
        {zoomPercent}
      </button>

      <button
        type="button"
        className={styles.zoomButton}
        onClick={onZoomIn}
        disabled={isAtMax}
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  )
}
