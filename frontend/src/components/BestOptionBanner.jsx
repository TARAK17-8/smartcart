export default function BestOptionBanner({ best, product, recommendations }) {
  return (
    <div className="animate-fade-in-up best-card rounded-xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-500/15 text-2xl glow-badge">
            🏆
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-400">Best Option for {product}</p>
            <p className="mt-1 text-lg font-bold text-white">{best.recommendation}</p>

            {/* Recommendation explanation */}
            {recommendations?.explanation && (
              <p className="mt-1.5 text-xs leading-relaxed text-surface-300 italic">
                💡 {recommendations.explanation}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-surface-400">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
                Total: <span className="font-bold text-accent-300">₹{best.total_cost}</span>
              </span>
              {best.type === 'offline' && (
                <>
                  <span>•</span>
                  <span>Distance: {best.distance_km} km</span>
                  <span>•</span>
                  <span>Travel Cost: ₹{best.travel_cost}</span>
                </>
              )}
              {best.type === 'online' && (
                <>
                  <span>•</span>
                  <span>Delivery: ₹{best.delivery_fee || best.delivery_cost}</span>
                  {best.delivery_time && (
                    <>
                      <span>•</span>
                      <span>🕐 {best.delivery_time}</span>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Recommendation chips */}
            {recommendations && (
              <div className="mt-3 flex flex-wrap gap-2">
                {recommendations.cheapest_option && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 px-3 py-1 text-[10px] font-bold text-accent-400">
                    🟢 Cheapest: {recommendations.cheapest_option.name} — ₹{recommendations.cheapest_option.total_cost}
                  </span>
                )}
                {recommendations.fastest_option && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 text-[10px] font-bold text-yellow-400">
                    ⚡ Fastest: {recommendations.fastest_option.name} — {recommendations.fastest_option.delivery_time}
                  </span>
                )}
                {recommendations.best_value && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-[10px] font-bold text-purple-400">
                    💰 Best Value: {recommendations.best_value.name} — ₹{recommendations.best_value.total_cost}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {best.savings > 0 && (
          <div className="shrink-0 rounded-xl border border-accent-500/25 bg-accent-500/8 px-4 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-500">You Save</p>
            <p className="text-xl font-extrabold gradient-text-green">₹{best.savings}</p>
          </div>
        )}
      </div>
    </div>
  )
}
