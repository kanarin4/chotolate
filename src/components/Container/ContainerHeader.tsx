import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { CountBadge } from '../common/CountBadge'
import styles from './Container.module.css'

type ContainerHeaderProps = {
  name: string
  count: number
  acceptsStaff: boolean
  acceptsNewcomers: boolean
  isEditingName: boolean
  onStartEditName: () => void
  onCommitEditName: (name: string) => void
  onCancelEditName: () => void
  onToggleStaffSection: (enabled: boolean) => void
  onToggleNewcomerSection: (enabled: boolean) => void
  onDeleteContainer: () => void
  onHeaderPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
}

export function ContainerHeader({
  name,
  count,
  acceptsStaff,
  acceptsNewcomers,
  isEditingName,
  onStartEditName,
  onCommitEditName,
  onCancelEditName,
  onToggleStaffSection,
  onToggleNewcomerSection,
  onDeleteContainer,
  onHeaderPointerDown,
}: ContainerHeaderProps) {
  const [draftName, setDraftName] = useState(name)
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const editMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setDraftName(name)
  }, [name])

  useEffect(() => {
    if (isEditingName) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditingName])

  useEffect(() => {
    if (!isEditMenuOpen) {
      return
    }

    const handleWindowPointerDown = (event: PointerEvent) => {
      if (!editMenuRef.current?.contains(event.target as Node)) {
        setIsEditMenuOpen(false)
      }
    }

    window.addEventListener('pointerdown', handleWindowPointerDown)

    return () => {
      window.removeEventListener('pointerdown', handleWindowPointerDown)
    }
  }, [isEditMenuOpen])

  const commit = () => {
    onCommitEditName(draftName.trim())
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      commit()
      return
    }

    if (event.key === 'Escape') {
      setDraftName(name)
      onCancelEditName()
    }
  }

  const handleDeletePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
  }

  const stopHeaderDrag = (event: ReactPointerEvent<HTMLElement>) => {
    event.stopPropagation()
  }

  return (
    <header className={styles.containerHeader} onPointerDown={onHeaderPointerDown}>
      {isEditingName ? (
        <input
          ref={inputRef}
          className={styles.containerNameInput}
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          onPointerDown={(event) => stopHeaderDrag(event)}
        />
      ) : (
        <button
          type="button"
          className={styles.containerNameButton}
          onDoubleClick={onStartEditName}
          onPointerDown={(event) => stopHeaderDrag(event)}
        >
          {name}
        </button>
      )}

      <div className={styles.containerHeaderRight}>
        <CountBadge count={count} />

        <div ref={editMenuRef} className={styles.editMenuContainer} onPointerDown={stopHeaderDrag}>
          <button
            type="button"
            className={styles.editMenuButton}
            onClick={() => setIsEditMenuOpen((open) => !open)}
            aria-label={`Edit ${name}`}
          >
            edit
          </button>

          {isEditMenuOpen ? (
            <div className={styles.editMenuPanel}>
              <label className={styles.editMenuItem}>
                <input
                  type="checkbox"
                  checked={acceptsStaff}
                  onChange={(event) => onToggleStaffSection(event.target.checked)}
                />
                <span>Staff section</span>
              </label>

              <label className={styles.editMenuItem}>
                <input
                  type="checkbox"
                  checked={acceptsNewcomers}
                  onChange={(event) => onToggleNewcomerSection(event.target.checked)}
                />
                <span>Newcomers section</span>
              </label>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className={styles.deleteContainerButton}
          onPointerDown={handleDeletePointerDown}
          onClick={onDeleteContainer}
          aria-label={`Delete container ${name}`}
        >
          x
        </button>
      </div>
    </header>
  )
}
