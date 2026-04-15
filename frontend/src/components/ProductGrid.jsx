const PRODUCT_EMOJIS = {
  Rice: '🍚',
  Milk: '🥛',
  Eggs: '🥚',
  Bread: '🍞',
  Oil: '🫒',
  Sugar: '🍬',
  Onions: '🧅',
  Tomatoes: '🍅',
  Salt: '🧂',
  Dal: '🫘',
}

export default function ProductGrid({ products, onSelect }) {
  if (!products.length) return null

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-500">
        Quick Search — Click a Product
      </p>
      <div className="flex flex-wrap gap-2">
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.name)}
            className="group inline-flex items-center gap-2 rounded-xl border border-surface-700/50 bg-surface-800/40 px-4 py-2.5 text-sm font-medium text-surface-300 transition-all hover:border-primary-500/30 hover:bg-primary-500/8 hover:text-white active:scale-[0.97]"
          >
            <span className="text-base transition-transform group-hover:scale-110">
              {PRODUCT_EMOJIS[p.name] || '📦'}
            </span>
            {p.name}
          </button>
        ))}
      </div>
    </div>
  )
}
