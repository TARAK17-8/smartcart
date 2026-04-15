export default function StatsBar({ stats }) {
  const items = [
    { label: 'Local Shops', value: stats.shops, icon: '🏪', color: 'text-primary-400' },
    { label: 'Products', value: stats.products, icon: '📦', color: 'text-warm-400' },
    { label: 'Price Listings', value: stats.shop_products, icon: '🏷️', color: 'text-accent-400' },
    { label: 'Online Options', value: stats.online_products, icon: '🌐', color: 'text-blue-400' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="stat-card glass-card flex items-center gap-3 p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-800/80 text-sm">
            {item.icon}
          </span>
          <div className="min-w-0">
            <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
            <p className="truncate text-[11px] font-medium text-surface-500">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
