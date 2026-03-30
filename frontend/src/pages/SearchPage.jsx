import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Layout/Navbar'
import SearchBar from '../components/Search/SearchBar'
import AnswerPanel from '../components/Search/AnswerPanel'
import SourceCard from '../components/Search/SourceCard'
import { useSearch } from '../hooks/useSearch'


export default function SearchPage({ language, onLanguageChange }) {
  const [searchParams] = useSearchParams()
  const prefill = searchParams.get('q') || ''

  const { answer, sources, status, error, search } = useSearch()

  const isLoading = status === 'retrieving' || status === 'generating'

  // Auto-run query if navigated from graph node click
  useEffect(() => {
    if (prefill) {
      search(prefill, language)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill])

  function handleSearch(question) {
    search(question, language)
  }

  const sourcesHeading =
    language === 'French' ? 'Artefacts récupérés' : 'Retrieved Artifacts'

  const emptyMessage =
    language === 'French'
      ? 'Aucune source trouvée pour cette question.'
      : 'No sources found for this question.'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>
      {/* Navbar */}
      <Navbar language={language} onLanguageChange={onLanguageChange} />

      {/* Main content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pb-16">
        {/* Search bar */}
        <div className="pt-6 pb-2">
          <SearchBar
            onSearch={handleSearch}
            loading={isLoading}
            initialValue={prefill}
            language={language}
          />
        </div>

        {/* Answer panel */}
        <AnswerPanel
          answer={answer}
          sources={sources}
          status={status}
          error={error}
          language={language}
        />

        {/* Source cards grid */}
        {status === 'done' && (
          <div className="mt-10">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              {sourcesHeading}
              <span className="ml-2 font-normal text-slate-400">
                ({sources.length})
              </span>
            </h2>

            {sources.length === 0 ? (
              <p className="text-sm text-slate-400">{emptyMessage}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sources.map(src => (
                  <SourceCard
                    key={src.id}
                    source={src}
                    language={language}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Skeleton grid while loading */}
        {isLoading && (
          <div className="mt-10">
            <div className="skeleton h-4 w-40 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-slate-200">
                  <div className="skeleton h-36 w-full rounded-none" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Idle state hint */}
        {status === 'idle' && !prefill && (
          <div className="mt-20 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full
                            bg-slate-100 mb-4">
              <svg className="w-7 h-7 text-slate-400" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1.5"
                   strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              {language === 'French'
                ? 'Posez une question sur le patrimoine culturel'
                : 'Ask a question about cultural heritage'}
            </p>
            <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
              {language === 'French'
                ? 'Ex: Qu\'est-ce que la route de la soie ? Qu\'est-ce que l\'art islamique ?'
                : 'e.g. What is the Silk Road? What is Byzantine art?'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
