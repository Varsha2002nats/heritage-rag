export default function NodeTooltip({ node, x, y }) {
  if (!node) return null

  // Keep tooltip inside viewport with a small margin
  const MARGIN = 12
  const TIP_W = 220
  const TIP_H = node.image_url ? 190 : 90

  const left = x + TIP_W + MARGIN > window.innerWidth
    ? x - TIP_W - MARGIN
    : x + MARGIN

  const top = y + TIP_H + MARGIN > window.innerHeight
    ? y - TIP_H - MARGIN
    : y + MARGIN

  return (
    <div
      className="graph-tooltip"
      style={{ left, top, pointerEvents: 'none' }}
      role="tooltip"
    >
      {node.image_url && (
        <img
          src={node.image_url}
          alt={node.label}
          className="w-full h-24 object-cover rounded-md mb-2"
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
      )}

      <p className="graph-tooltip-title">{node.label}</p>

      <div className="flex items-center gap-2 mt-1">
        <span
          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: node.color || '#94a3b8' }}
        />
        <span className="graph-tooltip-type">{node.type}</span>
      </div>

      {node.date && (
        <p className="graph-tooltip-date">{node.date}</p>
      )}

      <p className="text-xs text-slate-500 mt-2">Click to search</p>
    </div>
  )
}
