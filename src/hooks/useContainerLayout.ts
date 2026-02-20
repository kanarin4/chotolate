import { useMemo } from 'react'
import { calculateContainerLayout } from '../utils/layout'

export function useContainerLayout(containerWidth: number, tileCount: number) {
  return useMemo(
    () => calculateContainerLayout(containerWidth, tileCount),
    [containerWidth, tileCount],
  )
}
