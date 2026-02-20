import type {
  Collision,
  CollisionDetection,
  DroppableContainer,
} from '@dnd-kit/core'
import { debugLog } from './debug'

type DroppableData = {
  priority?: number
}

const isPointWithinRect = (
  x: number,
  y: number,
  rect: { left: number; right: number; top: number; bottom: number },
): boolean => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom

const getPriority = (container: DroppableContainer): number => {
  const data = container.data.current as DroppableData | undefined
  return data?.priority ?? 0
}

export const cursorCollision: CollisionDetection = ({
  pointerCoordinates,
  droppableContainers,
}: Parameters<CollisionDetection>[0]): Collision[] => {
  if (!pointerCoordinates) {
    return []
  }

  const collisions = droppableContainers
    .filter((container: DroppableContainer) => {
      const rect = container.rect.current
      if (!rect) {
        return false
      }

      return isPointWithinRect(pointerCoordinates.x, pointerCoordinates.y, rect)
    })
    .sort((a: DroppableContainer, b: DroppableContainer) => getPriority(b) - getPriority(a))
    .map((container: DroppableContainer) => ({
      id: container.id,
      data: {
        droppableContainer: container,
        value: getPriority(container),
      },
    }))

  if (collisions.length > 1) {
    debugLog('collision/multiple-targets', {
      pointerCoordinates,
      candidates: collisions.map((collision: Collision) => String(collision.id)),
    })
  }

  return collisions.slice(0, 1)
}
