import { useMemo } from 'react'
import { selectSearchMatches, useAppStore } from '../store'

export function useSearch() {
  const searchQuery = useAppStore((state) => state.searchQuery)
  const setSearchQuery = useAppStore((state) => state.setSearchQuery)
  const searchMatches = useAppStore(selectSearchMatches)

  const trimmedQuery = searchQuery.trim()

  const isSearchActive = useMemo(() => trimmedQuery.length > 0, [trimmedQuery])

  return {
    searchQuery,
    setSearchQuery,
    searchMatches,
    isSearchActive,
  }
}
