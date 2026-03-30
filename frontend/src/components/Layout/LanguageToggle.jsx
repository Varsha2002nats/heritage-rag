export default function LanguageToggle({ language, onChange, dark = false }) {
  const options = [
    { label: 'EN', value: 'English' },
    { label: 'FR', value: 'French' },
  ]

  const trackBase = dark
    ? 'bg-white/10 border border-white/20'
    : 'bg-slate-100 border border-slate-200'

  const activeClass = dark
    ? 'bg-white text-slate-900 shadow-sm'
    : 'bg-white text-slate-900 shadow-sm border border-slate-200'

  const inactiveClass = dark
    ? 'text-white/70 hover:text-white'
    : 'text-slate-500 hover:text-slate-800'

  return (
    <div className={`flex items-center rounded-full p-0.5 gap-0.5 ${trackBase}`}>
      {options.map(({ label, value }) => {
        const isActive = language === value
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-150
              ${isActive ? activeClass : inactiveClass}`}
            aria-pressed={isActive}
            aria-label={`Switch to ${value}`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
