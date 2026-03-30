import { useState, useEffect, useRef } from 'react'

export default function SearchBar({
  onSearch,
  loading = false,
  initialValue = '',
  language = 'English',
}) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef(null)

  // Sync initialValue when it changes 
  useEffect(() => {
    if (initialValue) {
      setValue(initialValue)
      inputRef.current?.focus()
    }
  }, [initialValue])

  const placeholder =
    language === 'French'
      ? 'Posez une question sur les archives...'
      : 'Ask a question about the archive...'

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || loading) return
    onSearch(trimmed)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 w-full max-w-3xl mx-auto"
      role="search"
    >
      <div className="relative flex-1">
        {/* Search icon */}
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </span>

        <input
          ref={inputRef}
          type="text"
          className="search-input pl-11 pr-4"
          placeholder={placeholder}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          autoFocus
          aria-label="Search question"
        />

        {/* Clear button */}
        {value && !loading && (
          <button
            type="button"
            onClick={() => { setValue(''); inputRef.current?.focus() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400
                       hover:text-slate-600 transition-colors"
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <button
        type="submit"
        className="search-btn"
        disabled={loading || !value.trim()}
        aria-label="Submit search"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            <span>Searching</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.2"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span>{language === 'French' ? 'Rechercher' : 'Search'}</span>
          </>
        )}
      </button>
    </form>
  )
}
