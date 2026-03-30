const TYPE_BADGE = {
  manuscript: 'badge-manuscript',
  map:        'badge-map',
  photograph: 'badge-photograph',
  photo:      'badge-photo',
  text:       'badge-text',
  image:      'badge-image',
  sound:      'badge-sound',
  video:      'badge-video',
}

function getBadgeClass(type) {
  const key = (type || '').toLowerCase().trim()
  for (const [k, cls] of Object.entries(TYPE_BADGE)) {
    if (key.includes(k)) return cls
  }
  return 'badge-default'
}

function SimilarityDots({ score }) {
  const filled = Math.round((score ?? 0) * 5)
  return (
    <div className="flex items-center gap-0.5" title={`Relevance: ${Math.round((score ?? 0) * 100)}%`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < filled ? 'bg-sky-500' : 'bg-slate-200'}`}
        />
      ))}
    </div>
  )
}

export default function SourceCard({ source, language }) {
  const {
    title,
    description,
    image_url,
    source_url,
    type,
    date,
    similarity,
  } = source

  const viewLabel = language === 'French' ? 'Voir la source' : 'View Source'

  return (
    <div className="source-card flex flex-col">
      {/* Thumbnail */}
      <div className="relative bg-slate-100 h-36 flex-shrink-0 overflow-hidden">
        {image_url ? (
          <img
            src={image_url}
            alt={title}
            className="source-card-thumb"
            onError={e => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        {/* Fallback placeholder */}
        <div
          className="absolute inset-0 flex items-center justify-center text-slate-300"
          style={{ display: image_url ? 'none' : 'flex' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="1.5"
               strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>

        {/* Type badge overlay */}
        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getBadgeClass(type)}`}>
          {type || 'item'}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 mb-1">
          {title || 'Untitled'}
        </h3>

        {description && (
          <p className="text-xs text-slate-500 line-clamp-3 mb-3 leading-relaxed">
            {description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex flex-col gap-1">
            {date && (
              <span className="text-xs text-slate-400">{date}</span>
            )}
            <SimilarityDots score={similarity} />
          </div>

          {source_url && (
            <a
              href={source_url.startsWith('http') ? source_url : `https://www.europeana.eu${source_url}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
            >
              {viewLabel}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5"
                   strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
