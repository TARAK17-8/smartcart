import { useState, useEffect, useRef, useCallback } from 'react'
import { trackOrders } from '../api'

const ORDER_STATUS_STEPS = ['placed', 'accepted', 'out_for_delivery', 'delivered']
const ORDER_STATUS_CONFIG = {
  placed:           { icon: '🟡', label: 'Order Placed',      color: 'text-yellow-400',  bg: 'bg-yellow-500/15 border-yellow-500/30' },
  accepted:         { icon: '🔵', label: 'Accepted',          color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/30' },
  out_for_delivery: { icon: '🟠', label: 'Out for Delivery',  color: 'text-orange-400',  bg: 'bg-orange-500/15 border-orange-500/30' },
  delivered:        { icon: '🟢', label: 'Delivered',          color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
}

export default function OrderTracking() {
  const [phone, setPhone] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const handleTrack = async (e) => {
    e?.preventDefault()
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const data = await trackOrders(phone.trim())
      setOrders(data)
      if (data.length === 1) setSelectedOrder(data[0])
    } catch (err) {
      setOrders([])
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const orderDate = (ts) => {
    if (!ts) return 'N/A'
    return new Date(ts).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-3xl shadow-lg shadow-primary-500/20">
          📦
        </div>
        <h1 className="text-2xl font-bold text-white">Track My Orders</h1>
        <p className="mt-1 text-sm text-surface-400">Enter your phone number to track your delivery</p>
      </div>

      {/* Search */}
      <form onSubmit={handleTrack} className="mx-auto max-w-lg">
        <div className="flex gap-3">
          <input
            id="track-phone-input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter 10-digit phone number"
            maxLength={10}
            className="flex-1 rounded-xl border border-surface-700 bg-surface-800/50 px-5 py-3.5 text-sm text-white placeholder-surface-600 outline-none focus:border-primary-500/50 transition-colors"
          />
          <button
            id="track-submit-btn"
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
          >
            {loading ? '...' : '🔍 Track'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mx-auto max-w-lg rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-3 text-center text-sm text-red-300">
          ❌ {error}
        </div>
      )}

      {/* Results */}
      {searched && !loading && orders.length === 0 && !error && (
        <div className="glass-card mx-auto max-w-lg flex h-48 items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-sm text-surface-400">No orders found for this phone number</p>
          </div>
        </div>
      )}

      {orders.length > 0 && !selectedOrder && (
        <div className="mx-auto max-w-2xl space-y-3">
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
            Found {orders.length} order{orders.length > 1 ? 's' : ''}
          </p>
          {orders.map((order) => {
            const cfg = ORDER_STATUS_CONFIG[order.order_status] || ORDER_STATUS_CONFIG.placed
            return (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="w-full glass-card p-4 text-left transition-all hover:shadow-lg hover:border-primary-500/20 active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Order #{order.id}</p>
                    <p className="text-xs text-surface-400">🏪 {order.shop_name} • {orderDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <span className="text-sm font-bold text-accent-400">₹{order.total_price}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selectedOrder && (
        <OrderTrackingDetail
          order={selectedOrder}
          onBack={() => setSelectedOrder(orders.length > 1 ? null : selectedOrder)}
          showBack={orders.length > 1}
        />
      )}
    </div>
  )
}

/* ==================== Order Tracking Detail ==================== */
function OrderTrackingDetail({ order, onBack, showBack }) {
  const currentStepIndex = ORDER_STATUS_STEPS.indexOf(order.order_status)
  const cfg = ORDER_STATUS_CONFIG[order.order_status] || ORDER_STATUS_CONFIG.placed

  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : 'N/A'

  return (
    <div className="mx-auto max-w-3xl space-y-5 animate-fade-in-up">
      {showBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-surface-400 hover:bg-surface-800 hover:text-white transition-colors"
        >
          ← Back to all orders
        </button>
      )}

      {/* Order Header */}
      <div className="glass-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Order #{order.id}</h2>
            <p className="text-xs text-surface-400">🏪 {order.shop_name} • {orderDate}</p>
          </div>
          <span className={`rounded-xl px-3.5 py-1.5 text-sm font-bold border ${cfg.bg} ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </span>
        </div>

        {/* Progress Tracker */}
        <div className="mt-6 mb-2">
          <div className="flex items-center justify-between relative">
            {/* Progress line background */}
            <div className="absolute top-4 left-6 right-6 h-1 rounded-full bg-surface-800/80" />
            {/* Progress line fill */}
            <div
              className="absolute top-4 left-6 h-1 rounded-full bg-gradient-to-r from-emerald-500 to-primary-500 transition-all duration-700"
              style={{ width: `${Math.max(0, (currentStepIndex / (ORDER_STATUS_STEPS.length - 1)) * (100 - 10))}%` }}
            />

            {ORDER_STATUS_STEPS.map((step, i) => {
              const stepCfg = ORDER_STATUS_CONFIG[step]
              const isPast = i < currentStepIndex
              const isCurrent = i === currentStepIndex
              const isFuture = i > currentStepIndex
              return (
                <div key={step} className="relative z-10 flex flex-col items-center gap-2" style={{ width: '25%' }}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 ${
                    isPast ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                    isCurrent ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/40 ring-4 ring-primary-500/20 animate-pulse' :
                    'bg-surface-800 text-surface-600 border border-surface-700'
                  }`}>
                    {isPast ? '✓' : stepCfg.icon}
                  </div>
                  <span className={`text-[10px] font-semibold text-center leading-tight ${
                    isPast ? 'text-emerald-400' : isCurrent ? 'text-primary-300' : 'text-surface-600'
                  }`}>
                    {stepCfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ETA */}
        {order.order_status !== 'delivered' && order.estimated_delivery_time && (
          <div className="mt-5 rounded-xl border border-primary-500/20 bg-primary-500/5 p-4 text-center">
            <p className="text-[10px] font-semibold text-primary-400 uppercase tracking-wider mb-1">⏱ Estimated Delivery Time</p>
            <p className="text-2xl font-extrabold text-white">
              {order.estimated_delivery_time} <span className="text-sm font-medium text-surface-400">minutes</span>
            </p>
          </div>
        )}

        {order.order_status === 'delivered' && (
          <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
            <p className="text-lg font-bold text-emerald-400">✅ Order Delivered Successfully!</p>
          </div>
        )}
      </div>

      {/* Two Column: Delivery Info + Items */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Delivery Details */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider">📍 Delivery Details</h3>

          <div className="rounded-xl bg-surface-800/40 border border-surface-700/30 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/10 text-sm">👤</span>
              <div>
                <p className="text-sm font-semibold text-white">{order.customer_name}</p>
                <p className="text-xs text-surface-400">📞 {order.phone}</p>
              </div>
            </div>
            <p className="text-xs text-surface-300 pl-10">📍 {order.address}, {order.pincode}</p>
          </div>

          {/* Delivery Agent */}
          {order.delivery_agent_name && (
            <div className="rounded-xl bg-surface-800/40 border border-surface-700/30 p-4">
              <p className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider mb-2">🚴 Delivery Partner</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-lg shadow-lg">
                  🏍️
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{order.delivery_agent_name}</p>
                  <p className="text-xs text-surface-400">📞 {order.delivery_agent_phone}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="glass-card p-5">
          <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">🛒 Ordered Items</h3>
          <div className="space-y-2">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-surface-800/40 last:border-0">
                <span className="text-xs text-surface-300">
                  {item.product_name}
                  <span className="text-surface-500 ml-1">× {item.quantity} {item.unit_type}</span>
                </span>
                <span className="text-xs font-semibold text-surface-200">₹{Math.round(item.price * item.quantity * 100) / 100}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-surface-700/40 flex justify-between">
            <span className="text-xs font-semibold text-surface-400">Total</span>
            <span className="text-lg font-extrabold text-accent-400">₹{order.total_price}</span>
          </div>
        </div>
      </div>

      {/* Live Map Tracking */}
      {order.shop_lat && order.shop_lng && order.order_status !== 'delivered' && (
        <DeliveryMap order={order} />
      )}
    </div>
  )
}

/* ==================== Delivery Map (Simulated) ==================== */
function DeliveryMap({ order }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const deliveryMarkerRef = useRef(null)
  const animFrameRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [progress, setProgress] = useState(0)

  const shopLat = order.shop_lat
  const shopLng = order.shop_lng
  const userLat = order.user_lat || shopLat + 0.015
  const userLng = order.user_lng || shopLng + 0.012

  // Determine simulation speed based on status
  const getTargetProgress = useCallback(() => {
    switch (order.order_status) {
      case 'placed': return 0
      case 'accepted': return 0.15
      case 'out_for_delivery': return 0.5
      case 'delivered': return 1
      default: return 0
    }
  }, [order.order_status])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Load Leaflet JS
    const loadLeaflet = () => {
      if (window.L) {
        initMap()
        return
      }
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = initMap
      document.head.appendChild(script)
    }

    const initMap = () => {
      const L = window.L
      if (!L || !mapRef.current) return

      const centerLat = (shopLat + userLat) / 2
      const centerLng = (shopLng + userLng) / 2

      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([centerLat, centerLng], 14)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(map)

      // Shop marker
      const shopIcon = L.divIcon({
        html: '<div style="font-size:24px;text-align:center;line-height:1">🏪</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: '',
      })
      L.marker([shopLat, shopLng], { icon: shopIcon })
        .addTo(map)
        .bindPopup(`<b>🏪 ${order.shop_name}</b><br>Shop Location`)

      // User marker
      const userIcon = L.divIcon({
        html: '<div style="font-size:24px;text-align:center;line-height:1">🏠</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: '',
      })
      L.marker([userLat, userLng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`<b>🏠 ${order.customer_name}</b><br>Delivery Location`)

      // Route line
      L.polyline([[shopLat, shopLng], [userLat, userLng]], {
        color: '#6366f1',
        weight: 3,
        opacity: 0.6,
        dashArray: '8, 8',
      }).addTo(map)

      // Delivery agent marker
      const agentIcon = L.divIcon({
        html: '<div style="font-size:28px;text-align:center;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">🏍️</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        className: '',
      })
      const deliveryMarker = L.marker([shopLat, shopLng], { icon: agentIcon })
        .addTo(map)
        .bindPopup(`<b>🏍️ ${order.delivery_agent_name || 'Delivery Agent'}</b><br>📞 ${order.delivery_agent_phone || 'N/A'}`)

      deliveryMarkerRef.current = deliveryMarker
      mapInstanceRef.current = map
      setMapLoaded(true)

      // Fit bounds
      map.fitBounds([[shopLat, shopLng], [userLat, userLng]], { padding: [50, 50] })
    }

    loadLeaflet()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      if (animFrameRef.current) {
        clearInterval(animFrameRef.current)
      }
    }
  }, [])

  // Animate delivery agent
  useEffect(() => {
    if (!mapLoaded || !deliveryMarkerRef.current) return

    const targetProgress = getTargetProgress()
    let currentProgress = progress

    if (animFrameRef.current) clearInterval(animFrameRef.current)

    animFrameRef.current = setInterval(() => {
      if (currentProgress < targetProgress) {
        currentProgress = Math.min(currentProgress + 0.005, targetProgress)
      } else if (order.order_status === 'out_for_delivery' && currentProgress < 0.95) {
        // Slowly move toward user when out for delivery
        currentProgress = Math.min(currentProgress + 0.002, 0.95)
      }

      const lat = shopLat + (userLat - shopLat) * currentProgress
      const lng = shopLng + (userLng - shopLng) * currentProgress
      deliveryMarkerRef.current.setLatLng([lat, lng])
      setProgress(currentProgress)
    }, 200)

    return () => {
      if (animFrameRef.current) clearInterval(animFrameRef.current)
    }
  }, [mapLoaded, order.order_status, getTargetProgress])

  return (
    <div className="glass-card overflow-hidden">
      <div className="border-b border-surface-700/50 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">📍</span>
          <h3 className="text-sm font-semibold text-white">Live Delivery Tracking</h3>
        </div>
        {order.order_status === 'out_for_delivery' && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-400">
            <span className="h-2 w-2 rounded-full bg-orange-400 animate-ping" />
            Agent en route
          </span>
        )}
      </div>
      <div ref={mapRef} style={{ height: '350px', width: '100%', background: '#1a1a2e' }}>
        {!mapLoaded && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="shimmer h-8 w-32 rounded-lg mx-auto mb-2" />
              <p className="text-xs text-surface-500">Loading map...</p>
            </div>
          </div>
        )}
      </div>
      <div className="px-5 py-3 flex items-center justify-between bg-surface-800/20">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-surface-400">🏪 Shop</span>
          <span className="text-surface-600">→</span>
          <span className="text-orange-400 font-semibold">🏍️ {Math.round(progress * 100)}%</span>
          <span className="text-surface-600">→</span>
          <span className="text-surface-400">🏠 You</span>
        </div>
        {order.estimated_delivery_time && (
          <span className="text-xs font-semibold text-primary-300">⏱ ETA: {order.estimated_delivery_time} min</span>
        )}
      </div>
    </div>
  )
}
