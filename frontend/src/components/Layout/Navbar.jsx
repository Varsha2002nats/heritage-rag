import { useNavigate, useLocation } from 'react-router-dom'
import LanguageToggle from './LanguageToggle'

export default function Navbar({ language, onLanguageChange }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isSearch = location.pathname === '/search'

  return (
    <header className="flex items-center justify-between px-6 py-4 w-full">
      {/* Left: back arrow on search page, title on landing */}
      <div className="flex items-center gap-3">
        {isSearch && (
          <button
            onClick={() => navigate('/')}
            aria-label="Back to archive"
            className="flex items-center justify-center w-9 h-9 rounded-full
                       bg-slate-100 hover:bg-slate-200 text-slate-600
                       transition-colors active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.2"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <button
          onClick={() => navigate('/')}
          className={`font-semibold tracking-tight transition-colors
            ${isSearch
              ? 'text-slate-800 text-lg hover:text-sky-600'
              : 'text-white text-xl hover:text-slate-300'
            }`}
        >
          Heritage Archive Explorer
        </button>
      </div>

      {/* Right: language toggle */}
      <LanguageToggle
        language={language}
        onChange={onLanguageChange}
        dark={!isSearch}
      />
    </header>
  )
}
