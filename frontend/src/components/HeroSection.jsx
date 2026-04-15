export default function HeroSection() {
  return (
    <div className="relative animate-fade-in-up overflow-hidden rounded-2xl bg-gradient-to-br from-primary-950 via-surface-900 to-surface-950 p-8 sm:p-10">
      {/* Decorative orbs */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent-500/8 blur-3xl" />

      <div className="relative z-10 max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/8 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" />
          <span className="text-xs font-semibold text-primary-300 tracking-wide">SMART RECOMMENDATIONS</span>
        </div>

        <h1 className="mb-3 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          Find the <span className="gradient-text">True Cost</span> of
          <br />Every Purchase
        </h1>

        <p className="mb-6 max-w-lg text-sm leading-relaxed text-surface-400 sm:text-base">
          Compare prices across <span className="font-medium text-surface-300">40+ local shops</span> and
          online platforms. We factor in travel costs, delivery fees, and distance to find
          your <span className="font-medium text-accent-400">best deal</span>.
        </p>

        <div className="flex flex-wrap gap-4 text-xs text-surface-500">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-800 text-xs">📍</span>
            <span>Haversine Distance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-800 text-xs">💰</span>
            <span>True Cost = Price + Travel/Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-800 text-xs">⚡</span>
            <span>Instant Comparison</span>
          </div>
        </div>
      </div>
    </div>
  )
}
