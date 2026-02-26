import { t } from '../../utils/i18n'
import type { Language } from '../../types'
import styles from './Toolbar.module.css'

type SearchBarProps = {
  query: string
  onChange: (query: string) => void
  language: Language
}

export function SearchBar({ query, onChange, language }: SearchBarProps) {
  return (
    <>
      <input
        type="search"
        className={styles.searchField}
        value={query}
        placeholder={t('search_placeholder', language)}
        onChange={(event) => onChange(event.target.value)}
      />
      {query.trim() ? (
        <button
          type="button"
          className={styles.searchClearButton}
          onClick={() => onChange('')}
        >
          {language === 'en' ? 'Clear' : 'クリア'}
        </button>
      ) : null}
    </>
  )
}
