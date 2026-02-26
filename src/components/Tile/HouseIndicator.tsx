import type { PointerEvent } from 'react'
import { House } from '../../types'
import styles from './Tile.module.css'

const LABEL_BY_HOUSE: Record<House, string> = {
    [House.RED]: 'P',
    [House.YELLOW]: 'T',
    [House.BLUE]: 'R',
    [House.GREEN]: 'B',
}

type HouseIndicatorProps = {
    house: House
    onToggle?: () => void
}

export function HouseIndicator({ house, onToggle }: HouseIndicatorProps) {
    const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
        event.stopPropagation()
    }

    return (
        <button
            type="button"
            className={`${styles.houseIndicator} ${styles[`house_${house}`]}`}
            onClick={onToggle}
            onPointerDown={handlePointerDown}
            aria-label={`House ${house}`}
        >
            <span className={styles.houseShape}>{LABEL_BY_HOUSE[house]}</span>
        </button>
    )
}
