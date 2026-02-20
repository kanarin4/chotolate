import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { selectSearchMatches, useAppStore } from '../../store'
import type { Tile as TileModel } from '../../types'
import { TileType } from '../../types'
import { debugLog } from '../../utils/debug'
import { FatigueIndicator } from './FatigueIndicator'
import styles from './Tile.module.css'

type TileProps = {
  tile: TileModel
  onFatigueToggle?: (tileId: string) => void
  onInfoClick?: (tileId: string) => void
  onNameCommit?: (tileId: string, nextName: string) => void
  draggable?: boolean
}

export function Tile({
  tile,
  onFatigueToggle,
  onInfoClick,
  onNameCommit,
  draggable = true,
}: TileProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(tile.name)
  const searchQuery = useAppStore((state) => state.searchQuery)
  const searchMatches = useAppStore(selectSearchMatches)
  const isSearchActive = searchQuery.trim().length > 0
  const isSearchMatch = !isSearchActive || searchMatches.has(tile.id)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tile.id,
    disabled: !draggable || isEditingName,
    data: {
      tileId: tile.id,
      tileType: tile.tileType,
      currentZoneId: tile.currentZoneId,
    },
  })

  const dragStyle = {
    transform: !isDragging && transform ? CSS.Transform.toString(transform) : undefined,
  }

  const handleFatigueToggle = () => {
    debugLog('Tile/fatigue-toggle-click', { tileId: tile.id, currentFatigue: tile.fatigueState })
    onFatigueToggle?.(tile.id)
  }

  const handleInfoClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    debugLog('Tile/info-click', { tileId: tile.id })
    onInfoClick?.(tile.id)
  }

  const handleInfoPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
  }

  const handleStartNameEdit = (event: MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation()
    setNameDraft(tile.name)
    setIsEditingName(true)
    debugLog('Tile/name-edit-start', { tileId: tile.id })
  }

  const commitNameEdit = () => {
    const trimmedName = nameDraft.trim()
    const nextName = trimmedName || tile.name

    if (nextName !== tile.name) {
      debugLog('Tile/name-edit-commit', {
        tileId: tile.id,
        previousName: tile.name,
        nextName,
      })
      onNameCommit?.(tile.id, nextName)
    } else {
      debugLog('Tile/name-edit-no-change', { tileId: tile.id })
    }

    setIsEditingName(false)
  }

  const cancelNameEdit = () => {
    setNameDraft(tile.name)
    setIsEditingName(false)
    debugLog('Tile/name-edit-cancel', { tileId: tile.id })
  }

  const handleNameInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      commitNameEdit()
      return
    }

    if (event.key === 'Escape') {
      cancelNameEdit()
    }
  }

  const handleNameInputPointerDown = (event: PointerEvent<HTMLInputElement>) => {
    event.stopPropagation()
  }

  const dragInteractionProps = draggable && !isEditingName ? { ...attributes, ...listeners } : {}

  return (
    <article
      ref={setNodeRef}
      style={dragStyle}
      className={`${styles.tile} ${
        tile.tileType === TileType.STAFF ? styles.staffTile : styles.newcomerTile
      } ${draggable && !isEditingName ? styles.tileDraggable : ''} ${
        isDragging ? styles.tileDraggingSource : ''
      } ${isSearchActive && isSearchMatch ? styles.tileSearchMatch : ''} ${
        isSearchActive && !isSearchMatch ? styles.tileSearchDimmed : ''
      }`}
      {...dragInteractionProps}
    >
      <FatigueIndicator state={tile.fatigueState} onToggle={handleFatigueToggle} />
      {isEditingName ? (
        <input
          className={styles.tileNameInput}
          value={nameDraft}
          onChange={(event) => setNameDraft(event.target.value)}
          onBlur={commitNameEdit}
          onKeyDown={handleNameInputKeyDown}
          onPointerDown={handleNameInputPointerDown}
          autoFocus
        />
      ) : (
        <span className={styles.tileName} onDoubleClick={handleStartNameEdit}>
          {tile.name}
        </span>
      )}
      <button
        type="button"
        className={styles.infoButton}
        aria-label={`Open info for ${tile.name}`}
        onClick={handleInfoClick}
        onPointerDown={handleInfoPointerDown}
      >
        i
      </button>
    </article>
  )
}
