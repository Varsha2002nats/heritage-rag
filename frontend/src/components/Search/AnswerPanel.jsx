export default function AnswerPanel({ answer, sources, status, error, language }) {
  if (status === 'idle') return null

  const isLoading = status === 'retrieving' || status === 'generating'

  const statusLabel = {
    retrieving: language === 'French' ? 'Recherche dans les archives...' : 'Searching the archive...',
    generating: language === 'French' ? 'Génération de la réponse...' : 'Generating answer...',
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      {/* Loading state */}
      {isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-5 h-5 rounded-full border-2 border-sky-500 border-t-transparent animate-spin flex-shrink-0" />
            <span className="text-sm text-slate-500 font-medium">
              {statusLabel[status]}
            </span>
          </div>
          {/* Skeleton lines */}
          <div className="space-y-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-4/6" />
          </div>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">
                {language === 'French' ? 'Une erreur est survenue' : 'Something went wrong'}
              </p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Answer */}
      {status === 'done' && answer && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
            <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-sky-600" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {language === 'French' ? 'Réponse' : 'Answer'}
            </span>
            <span className="ml-auto text-xs text-slate-400">
               {sources.length} {language === 'French' ? 'sources' : 'sources'}
            </span>
          </div>

          {/* Answer text — render paragraphs */}
          <div className="answer-prose">
            {answer.split('\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Citation chips */}
          {sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">
                {language === 'French' ? 'Sources citées' : 'Cited Sources'}
              </p>
              <div className="flex flex-wrap gap-2">
                {sources.map((src) => (
                  <a
                    key={src.id}
                    href={src.source_url?.startsWith('http') ? src.source_url : src.source_url ? `https://www.europeana.eu${src.source_url}` : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="citation-chip hover:bg-sky-100 transition-colors"
                    title={src.title}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2.5"
                         strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    {src.title?.slice(0, 32) ?? src.id}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
