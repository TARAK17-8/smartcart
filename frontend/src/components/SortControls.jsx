const sorts = [
  { value: 'cost', label: 'Lowest Cost', icon: '💰' },
  { value: 'distance', label: 'Nearest First', icon: '📍' },
  { value: 'platform', label: 'Online First', icon: '⚡' },
]

export default function SortControls({ sortBy, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-medium text-surface-500">Sort by:</span>
      {sorts.map((s) => (
        <button
          key={s.value}
          onClick={() => onChange(s.value)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            sortBy === s.value
              ? 'bg-primary-500/15 text-primary-300 ring-1 ring-primary-500/30'
              : 'bg-surface-800/50 text-surface-400 hover:bg-surface-800 hover:text-surface-300'
          }`}
        >
          <span className="text-xs">{s.icon}</span>
          {s.label}
        </button>
      ))}
    </div>
  )
}
