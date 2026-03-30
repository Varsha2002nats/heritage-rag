const TYPE_META = [
  { type: 'manuscript', color: '#f6c864', label: 'Manuscript' },
  { type: 'map',        color: '#6ecfb8', label: 'Map' },
  { type: 'photograph', color: '#7eb8f7', label: 'Photograph' },
  { type: 'photo',      color: '#7eb8f7', label: 'Photograph' },
  { type: 'image',      color: '#b39ddb', label: 'Image' },
  { type: 'i',          color: '#b39ddb', label: 'Image' },
  { type: 'text',       color: '#90a4ae', label: 'Text' },
  { type: 't',          color: '#90a4ae', label: 'Text' },
  { type: 'sound',      color: '#a5d6a7', label: 'Sound' },
  { type: 's',          color: '#a5d6a7', label: 'Sound' },
  { type: 'video',      color: '#f48fb1', label: 'Video' },
  { type: 'v',          color: '#f48fb1', label: 'Video' },
]

export default function GraphLegend({ stats = {} }) {
  const byType = stats.by_type ?? {}

  // Only show types that actually exist in the data
  const activeTypes = TYPE_META.filter(
    ({ type }) => byType[type] !== undefined && byType[type] > 0
  )

  // Collect any types present in data but not in TYPE_META
  const knownTypes = new Set(TYPE_META.map(t => t.type))
  const otherTypes = Object.entries(byType)
    .filter(([type, count]) => !knownTypes.has(type) && count > 0)
    .map(([type, count]) => ({ type, color: '#94a3b8', label: type, count }))

  const displayTypes = [
    ...activeTypes.map(t => ({ ...t, count: byType[t.type] })),
    ...otherTypes,
  ]

  if (displayTypes.length === 0) return null

  return (
    <div
      className="absolute bottom-6 left-6 z-10 rounded-xl px-4 py-3"
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        backdropFilter: 'blur(8px)',
        minWidth: 160,
      }}
    >
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Archive Types
      </p>

      <ul className="space-y-1.5">
        {displayTypes.map(({ type, color, label, count }) => (
          <li key={type} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-slate-300 capitalize">{label}</span>
            </div>
            <span className="text-xs text-slate-500 tabular-nums">{count}</span>
          </li>
        ))}
      </ul>

      {stats.total > 0 && (
        <div className="mt-3 pt-2 border-t border-white/10 flex justify-between">
          <span className="text-xs text-slate-500">Total</span>
          <span className="text-xs font-semibold text-slate-300 tabular-nums">
            {stats.total}
          </span>
        </div>
      )}
    </div>
  )
}
