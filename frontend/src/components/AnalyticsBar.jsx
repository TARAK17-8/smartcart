import { useState, useEffect } from 'react'
import { getAnalytics } from '../api'

export default function AnalyticsBar() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics()
      .then(setAnalytics)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !analytics || analytics.total_comparisons === 0) return null

  const items = [
    {
      label: 'Comparisons',
      value: analytics.total_comparisons,
      icon: '📊',
      color: 'text-primary-400',
    },
    {
      label: 'Avg Savings',
      value: `₹${analytics.average_savings}`,
      icon: '💰',
      color: 'text-accent-400',
    },
    {
      label: 'Local Cheaper',
      value: `${analytics.local_cheaper_percent}%`,
      icon: '🏪',
      color: 'text-warm-400',
    },
    {
      label: 'Online Cheaper',
      value: `${analytics.online_cheaper_percent}%`,
      icon: '🌐',
      color: 'text-blue-400',
    },
  ]

  return (
    <div className="animate-fade-in-up">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">
        📊 Comparison Analytics
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="stat-card glass-card flex items-center gap-2.5 p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-800/80 text-sm">
              {item.icon}
            </span>
            <div className="min-w-0">
              <p className={`text-base font-bold ${item.color}`}>{item.value}</p>
              <p className="truncate text-[10px] font-medium text-surface-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
