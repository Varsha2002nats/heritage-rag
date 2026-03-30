import { useNavigate } from 'react-router-dom'
import KnowledgeGraph from '../components/Graph/KnowledgeGraph'
import Navbar from '../components/Layout/Navbar'
import { useGraph } from '../hooks/useGraph'


export default function LandingPage({ language, onLanguageChange }) {
  const navigate = useNavigate()
  const { nodes, edges, stats, loading, error } = useGraph()

  function handleNodeClick(node) {
    // Navigate to search pre-filled with the node's title
    navigate(`/search?q=${encodeURIComponent(node.label)}`)
  }

  function handleExplore() {
    navigate('/search')
  }

  const subtitle =
    language === 'French'
      ? 'Explorez des siècles de patrimoine culturel mondial grâce à l\'IA'
      : 'Explore centuries of world cultural heritage through AI'

  const exploreLabel =
    language === 'French' ? 'Explorer les Archives' : 'Explore the Archive'

  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col"
      style={{ background: '#0f172a' }}
    >
      {/* Navbar */}
      <div className="relative z-20 flex-shrink-0">
        <Navbar language={language} onLanguageChange={onLanguageChange} />
      </div>

      {/* Subtitle */}
      <div className="relative z-20 text-center px-4 pb-2 flex-shrink-0">
        <p className="text-slate-400 text-sm tracking-wide">{subtitle}</p>
        {!loading && stats.total > 0 && (
          <p className="text-slate-600 text-xs mt-1">
            {stats.total} artifacts indexed
          </p>
        )}
      </div>

      {/* Graph — fills remaining space */}
      <div className="relative flex-1 z-10">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-slate-500 text-sm mb-1">Could not load graph.</p>
            <p className="text-slate-600 text-xs">{error}</p>
          </div>
        ) : (
          <KnowledgeGraph
            nodes={nodes}
            edges={edges}
            stats={stats}
            loading={loading}
            onNodeClick={handleNodeClick}
          />
        )}
      </div>

      {/* Bottom CTA */}
      <div className="relative z-20 flex justify-center pb-8 flex-shrink-0">
        <button
          onClick={handleExplore}
          className="flex items-center gap-2 px-7 py-3 rounded-full
                     bg-sky-600 hover:bg-sky-500 text-white font-semibold
                     text-sm shadow-lg shadow-sky-900/40
                     transition-all duration-200 active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.2"
               strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          {exploreLabel}
        </button>
      </div>

      {/* Subtle radial gradient overlay for depth */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(14,165,233,0.06) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}
