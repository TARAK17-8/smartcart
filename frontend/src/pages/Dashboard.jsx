import { useState, useEffect, useCallback, useRef } from 'react'
import { getProducts, getStats, compareProduct } from '../api'
import SearchBar from '../components/SearchBar'
import StatsBar from '../components/StatsBar'
import BestOptionBanner from '../components/BestOptionBanner'
import SortControls from '../components/SortControls'
import ResultCard from '../components/ResultCard'
import HeroSection from '../components/HeroSection'
import ProductGrid from '../components/ProductGrid'
import ShopMap from '../components/ShopMap'
import AnalyticsBar from '../components/AnalyticsBar'
import useSSE from '../hooks/useSSE'

const DEFAULT_LAT = 17.6868
const DEFAULT_LNG = 83.2185

export default function Dashboard({ geo }) {
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [activeResultTab, setActiveResultTab] = useState('local')
  const [comparison, setComparison] = useState(null)
  const [sortBy, setSortBy] = useState('cost')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [mapSelectedShop, setMapSelectedShop] = useState(null)
  const [sseToast, setSseToast] = useState(null)
  const [showAllPlatforms, setShowAllPlatforms] = useState(false)
  const sseToastTimer = useRef(null)

  const userLat = geo?.isLive ? geo.lat : DEFAULT_LAT
  const userLng = geo?.isLive ? geo.lng : DEFAULT_LNG
  const { lastEvent } = useSSE()

  useEffect(() => {
    getStats().then(setStats).catch(() => {})
    getProducts().then(setProducts).catch(() => {})
  }, [])

  useEffect(() => {
    if (!lastEvent || lastEvent.type !== 'price-update' || !selectedProduct) return
    const productName = lastEvent.product_name
    if (productName && productName.toLowerCase() === selectedProduct.toLowerCase()) {
      compareProduct(selectedProduct, userLat, userLng, sortBy).then(setComparison).catch(() => {})
      setSseToast(`Price updated for ${productName}!`)
      if (sseToastTimer.current) clearTimeout(sseToastTimer.current)
      sseToastTimer.current = setTimeout(() => setSseToast(null), 3500)
    }
  }, [lastEvent, selectedProduct, userLat, userLng, sortBy])

  const handleSearch = useCallback(async (productName) => {
    if (!productName.trim()) return
    setSelectedProduct(productName)
    setLoading(true)
    setError(null)
    setShowAllPlatforms(false)
    setActiveResultTab('local')
    try {
      const data = await compareProduct(productName, userLat, userLng, sortBy)
      setComparison(data)
    } catch (err) {
      setError(err.message)
      setComparison(null)
    } finally {
      setLoading(false)
    }
  }, [sortBy, userLat, userLng])

  const handleSortChange = useCallback(async (newSort) => {
    setSortBy(newSort)
    if (selectedProduct) {
      setLoading(true)
      try {
        const data = await compareProduct(selectedProduct, userLat, userLng, newSort)
        setComparison(data)
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
  }, [selectedProduct, userLat, userLng])

  const handleProductClick = (productName) => {
    setSearchQuery(productName)
    handleSearch(productName)
  }

  // Annotate options with recommendation flags
  const annotate = (options, recs) => {
    if (!recs) return options
    return options.map((opt) => {
      const name = opt.type === 'offline' ? opt.shop_name : opt.platform
      return {
        ...opt,
        is_cheapest: recs.cheapest_option?.name === name && recs.cheapest_option?.type === opt.type,
        is_cheapest_online: recs.cheapest_online?.name === name,
        is_fastest: recs.fastest_option?.name === name && recs.fastest_option?.type === opt.type,
        is_best_value: recs.best_value?.name === name && recs.best_value?.type === opt.type,
      }
    })
  }

  const annotatedOffline = comparison ? annotate(comparison.offline_options, comparison.recommendations) : []
  const annotatedOnline = comparison ? annotate(comparison.online_options, comparison.recommendations) : []

  // Top 3 cheapest across ALL options
  const allSorted = comparison
    ? [...annotatedOffline, ...annotatedOnline].sort((a, b) => a.total_cost - b.total_cost)
    : []
  const top3 = allSorted.slice(0, 3)

  // Online to show: either top 3 or all
  const displayedOnline = showAllPlatforms ? annotatedOnline : annotatedOnline.slice(0, 3)

  return (
    <div className="space-y-6">
      {sseToast && (
        <div className="sse-toast">
          <span className="h-2 w-2 rounded-full bg-accent-400 animate-pulse" />
          {sseToast}
        </div>
      )}

      {!comparison && !loading && <HeroSection />}
      {stats && <StatsBar stats={stats} />}
      <AnalyticsBar key={comparison ? 'c' : 'n'} />

      <div className="glass-card p-5">
        <SearchBar value={searchQuery} onChange={setSearchQuery} onSearch={handleSearch} products={products} />
      </div>

      {!comparison && !loading && <ProductGrid products={products} onSelect={handleProductClick} />}

      {error && (
        <div className="animate-fade-in-up rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
          <span className="mr-2 font-medium">⚠️ Error:</span> {error}
        </div>
      )}

      {loading && <LoadingSkeleton />}

      {comparison && !loading && (
        <div className="animate-fade-in-up space-y-5">
          {comparison.best_option && (
            <BestOptionBanner best={comparison.best_option} product={comparison.product} recommendations={comparison.recommendations} />
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <SortControls sortBy={sortBy} onChange={handleSortChange} />
            {comparison.offline_options.length > 0 && (
              <button
                onClick={() => { setMapSelectedShop(null); setShowMap(true) }}
                className="inline-flex items-center gap-2 rounded-xl border border-primary-500/30 bg-primary-500/8 px-4 py-2 text-xs font-semibold text-primary-300 transition-all hover:bg-primary-500/15 hover:border-primary-500/50 active:scale-[0.97]"
              >
                🗺️ View All on Map
              </button>
            )}
          </div>

          {/* TOP 3 CHEAPEST */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-surface-300 uppercase tracking-wider">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-accent-500/15 text-[10px]">🏆</span>
              Top 3 Cheapest Options
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {top3.map((opt, i) => (
                <ResultCard
                  key={`top-${opt.type}-${opt.shop_id || opt.platform}-${i}`}
                  option={opt}
                  isBest={i === 0}
                  isCheapest={opt.is_cheapest}
                  isCheapestOnline={opt.is_cheapest_online}
                  isFastest={opt.is_fastest}
                  isBestValue={opt.is_best_value}
                  animationDelay={i * 60}
                  product={comparison.product}
                  onViewMap={opt.type === 'offline' ? (id) => { setMapSelectedShop(id); setShowMap(true) } : undefined}
                />
              ))}
            </div>
          </div>

          {/* Result summary */}
          <div className="flex items-center gap-3 text-sm text-surface-400">
            <span className="font-semibold text-white">{comparison.product}</span>
            <span>•</span>
            <span>{comparison.total_offline} local shops</span>
            <span>•</span>
            <span>{comparison.total_online} online options</span>
          </div>

          {/* Tab Toggle: Local / Online */}
          {(annotatedOffline.length > 0 || annotatedOnline.length > 0) && (
            <div>
              <div className="flex gap-1 rounded-xl bg-surface-800/40 p-1 mb-4">
                <button
                  onClick={() => setActiveResultTab('local')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                    activeResultTab === 'local'
                      ? 'bg-primary-500/15 text-primary-300 shadow-sm'
                      : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/60'
                  }`}
                >
                  <span className="text-xs">🏪</span>
                  Local Shops
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    activeResultTab === 'local' ? 'bg-primary-500/20 text-primary-300' : 'bg-surface-700/50 text-surface-500'
                  }`}>{annotatedOffline.length}</span>
                </button>
                <button
                  onClick={() => setActiveResultTab('online')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                    activeResultTab === 'online'
                      ? 'bg-blue-500/15 text-blue-300 shadow-sm'
                      : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/60'
                  }`}
                >
                  <span className="text-xs">🌐</span>
                  Online Stores
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    activeResultTab === 'online' ? 'bg-blue-500/20 text-blue-300' : 'bg-surface-700/50 text-surface-500'
                  }`}>{annotatedOnline.length}</span>
                </button>
              </div>

              {/* Local Shops Tab Content */}
              {activeResultTab === 'local' && annotatedOffline.length > 0 && (
                <div className="animate-fade-in-up">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {annotatedOffline.map((opt, i) => (
                      <ResultCard
                        key={`off-${opt.shop_id}-${i}`}
                        option={opt}
                        isBest={comparison.best_option && opt.total_cost === comparison.best_option.total_cost && opt.type === 'offline'}
                        isCheapest={opt.is_cheapest}
                        isFastest={opt.is_fastest}
                        isBestValue={opt.is_best_value}
                        animationDelay={i * 60}
                        product={comparison.product}
                        onViewMap={(id) => { setMapSelectedShop(id); setShowMap(true) }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {activeResultTab === 'local' && annotatedOffline.length === 0 && (
                <div className="rounded-xl border border-surface-700/40 bg-surface-800/20 py-10 text-center">
                  <p className="text-sm text-surface-500">No local shops found for this product</p>
                </div>
              )}

              {/* Online Stores Tab Content */}
              {activeResultTab === 'online' && annotatedOnline.length > 0 && (
                <div className="animate-fade-in-up">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {displayedOnline.map((opt, i) => (
                      <ResultCard
                        key={`on-${opt.platform}-${i}`}
                        option={opt}
                        isBest={comparison.best_option && opt.total_cost === comparison.best_option.total_cost && opt.type === 'online'}
                        isCheapest={opt.is_cheapest}
                        isCheapestOnline={opt.is_cheapest_online}
                        isFastest={opt.is_fastest}
                        isBestValue={opt.is_best_value}
                        animationDelay={i * 60}
                        product={comparison.product}
                      />
                    ))}
                  </div>

                  {!showAllPlatforms && annotatedOnline.length > 3 && (
                    <button
                      onClick={() => setShowAllPlatforms(true)}
                      className="mt-3 w-full rounded-xl border border-surface-700/40 bg-surface-800/30 py-3 text-sm font-semibold text-primary-300 transition-all hover:bg-surface-800/50 hover:border-primary-500/30"
                    >
                      View All {annotatedOnline.length} Platforms ↓
                    </button>
                  )}
                  {showAllPlatforms && annotatedOnline.length > 3 && (
                    <button
                      onClick={() => setShowAllPlatforms(false)}
                      className="mt-3 w-full rounded-xl border border-surface-700/40 bg-surface-800/30 py-2.5 text-xs font-medium text-surface-500 transition-all hover:bg-surface-800/50"
                    >
                      Show Less ↑
                    </button>
                  )}
                </div>
              )}
              {activeResultTab === 'online' && annotatedOnline.length === 0 && (
                <div className="rounded-xl border border-surface-700/40 bg-surface-800/20 py-10 text-center">
                  <p className="text-sm text-surface-500">No online options found for this product</p>
                </div>
              )}
            </div>
          )}

          {comparison.disclaimer && (
            <div className="rounded-lg border border-surface-700/40 bg-surface-800/30 px-4 py-2.5 text-center">
              <p className="text-[11px] text-surface-500 italic">ⓘ {comparison.disclaimer}</p>
            </div>
          )}
        </div>
      )}

      {showMap && comparison && (
        <ShopMap
          shops={comparison.offline_options}
          selectedShopId={mapSelectedShop}
          userLat={userLat}
          userLng={userLng}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="shimmer h-24 w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => <div key={i} className="shimmer h-44 rounded-xl" />)}
      </div>
    </div>
  )
}
