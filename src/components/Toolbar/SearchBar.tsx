import styles from './Toolbar.module.css'

type SearchBarProps = {
  query: string
  onChange: (query: string) => void
}

export function SearchBar({ query, onChange }: SearchBarProps) {
  return (
    <>
      <input
        type="search"
        className={styles.searchField}
        value={query}
        placeholder="Search tiles"
        onChange={(event) => onChange(event.target.value)}
      />
      {query.trim() ? (
        <button
          type="button"
          className={styles.searchClearButton}
          onClick={() => onChange('')}
        >
          Clear
        </button>
      ) : null}
    </>
  )
}
