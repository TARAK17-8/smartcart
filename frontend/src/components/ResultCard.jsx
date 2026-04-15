import { useCart } from '../hooks/useCart'
import { useState } from 'react'

const PLATFORM_CONFIG = {
  Blinkit: { color: 'from-yellow-500 to-yellow-600', icon: '⚡', accent: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  'Swiggy Instamart': { color: 'from-orange-500 to-orange-600', icon: '🧡', accent: 'text-orange-400', bg: 'bg-orange-500/10' },
  BigBasket: { color: 'from-green-500 to-green-600', icon: '🛒', accent: 'text-green-400', bg: 'bg-green-500/10' },
  JioMart: { color: 'from-blue-400 to-blue-600', icon: '🛍️', accent: 'text-blue-400', bg: 'bg-blue-500/10' },
  Amazon: { color: 'from-amber-500 to-amber-600', icon: '📦', accent: 'text-amber-400', bg: 'bg-amber-500/10' },
  Flipkart: { color: 'from-indigo-500 to-blue-600', icon: '🏷️', accent: 'text-indigo-400', bg: 'bg-indigo-500/10' },
}

function getPlatformConfig(p) {
  return PLATFORM_CONFIG[p] || { color: 'from-surface-600 to-surface-700', icon: '🌐', accent: 'text-blue-300', bg: 'bg-blue-500/10' }
}

export default function ResultCard({ option, isBest, isCheapest, isCheapestOnline, isFastest, isBestValue, animationDelay, product, onViewMap }) {
  const isOffline = option.type === 'offline'
  const hasDiscount = option.original_price && option.discounted_price && option.discount_percent > 0
  const platformCfg = !isOffline ? getPlatformConfig(option.platform) : null
  const { addItem } = useCart()
  const [qty, setQty] = useState(1)
  const [addedToast, setAddedToast] = useState(false)

  const handleBuyNow = (e) => {
    e.stopPropagation()
    if (option.buy_link) window.open(option.buy_link, '_blank', 'noopener,noreferrer')
  }

  const handleAddToCart = () => {
    addItem({
      product_id: option.product_id,
      product_name: product,
      shop_id: option.shop_id,
      shop_name: option.shop_name,
      price: option.price,
      unit_type: option.unit_type || 'kg',
      quantity: qty,
    })
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 1500)
  }

  // Stock status badge
  const stockBadge = isOffline && option.stock_status === 'low_stock'
    ? <span className="tag-badge bg-yellow-500/12 text-yellow-400 text-[9px]">⚠️ Low Stock</span>
    : null

  return (
    <div
      className={`card-enter rounded-xl p-4 ${isBest ? 'best-card' : 'glass-card'}`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isOffline ? (
              <span className="tag-badge bg-primary-500/12 text-primary-300">🏪 Local</span>
            ) : (
              <span className={`tag-badge ${platformCfg.bg} ${platformCfg.accent}`}>
                {platformCfg.icon} {option.platform}
              </span>
            )}
            {isCheapest && <span className="tag-badge cheapest-badge">🟢 Cheapest</span>}
            {isCheapestOnline && !isCheapest && <span className="tag-badge cheapest-online-badge">🟡 Cheapest Online</span>}
            {isFastest && <span className="tag-badge fastest-badge">⚡ Fastest</span>}
            {isBestValue && !isCheapest && !isFastest && <span className="tag-badge best-value-badge">💰 Best Value</span>}
            {hasDiscount && <span className="discount-badge">{option.discount_percent}% OFF</span>}
            {stockBadge}
          </div>
          <h3 className="mt-2 truncate text-sm font-bold text-white">
            {isOffline ? option.shop_name : option.platform}
          </h3>
        </div>

        {isOffline && onViewMap && (
          <button
            onClick={() => onViewMap(option.shop_id)}
            className="shrink-0 ml-2 rounded-lg border border-surface-700/50 bg-surface-800/50 px-2.5 py-1.5 text-[11px] font-semibold text-surface-300 transition-all hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-primary-300"
            title="View on Map"
          >
            📍 Map
          </button>
        )}
      </div>

      {/* Price breakdown */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-surface-400">Price/{option.unit_type || 'kg'}</span>
          <span className="font-semibold text-surface-200">
            {hasDiscount ? (
              <span className="flex items-center gap-2">
                <span className="price-strikethrough text-surface-500">₹{option.original_price}</span>
                <span className="text-accent-400">₹{option.discounted_price}</span>
              </span>
            ) : (
              <>₹{option.price}</>
            )}
          </span>
        </div>

        {isOffline ? (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-surface-400">Distance</span>
              <span className="font-medium text-surface-300">{option.distance_km} km</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-surface-400">Travel Cost</span>
              <span className="font-medium text-warm-400">+₹{option.travel_cost}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-surface-400">Delivery Fee</span>
              <span className="font-medium text-warm-400">+₹{option.delivery_fee || option.delivery_cost}</span>
            </div>
            {option.delivery_time && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-surface-400">Delivery Time</span>
                <span className="font-medium text-surface-300">🕐 {option.delivery_time}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Divider */}
      <div className="mb-2 border-t border-surface-700/50" />

      {/* Total */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">True Cost</span>
        <span className={`text-lg font-extrabold ${isBest || isCheapest ? 'gradient-text-green' : 'text-white'}`}>
          ₹{option.total_cost}
        </span>
      </div>

      {/* Added toast */}
      {addedToast && (
        <div className="mb-2 rounded-lg bg-accent-500/15 border border-accent-500/30 px-3 py-1.5 text-center text-xs font-bold text-accent-400 animate-fade-in-up">
          ✅ Added to cart!
        </div>
      )}

      {/* Action buttons */}
      {isOffline ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-surface-700/50 bg-surface-800/50">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-2.5 py-1.5 text-xs font-bold text-surface-400 hover:text-white">−</button>
            <span className="px-2 text-xs font-bold text-white">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="px-2.5 py-1.5 text-xs font-bold text-surface-400 hover:text-white">+</button>
          </div>
          <span className="text-[10px] text-surface-500">{option.unit_type || 'kg'}</span>
          <button
            onClick={handleAddToCart}
            className="flex-1 rounded-lg bg-gradient-to-r from-accent-600 to-accent-500 px-3 py-2 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-[0.97]"
          >
            🛒 Add to Cart
          </button>
        </div>
      ) : (
        <button
          onClick={handleBuyNow}
          className={`buy-button w-full rounded-lg bg-gradient-to-r ${platformCfg.color} px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:brightness-110 hover:shadow-xl active:scale-[0.97]`}
        >
          Buy on {option.platform} →
        </button>
      )}
    </div>
  )
}
