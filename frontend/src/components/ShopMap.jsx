import { useEffect, useRef } from 'react'

const L = window.L

// Custom colored circle markers
function createMarkerIcon(color, size = 12) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: 2.5px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  })
}

// Larger pulsing marker for selected shop
function createSelectedIcon() {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 20px; height: 20px;
      background: #6366f1;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(99,102,241,0.6), 0 2px 8px rgba(0,0,0,0.3);
      animation: pulse-ring 1.5s ease-out infinite;
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -14],
  })
}

// Special cheapest shop icon — green with glow
function createCheapestIcon() {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 18px; height: 18px;
      background: #10b981;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 16px rgba(16,185,129,0.6), 0 2px 8px rgba(0,0,0,0.3);
      animation: pulse-ring 2s ease-out infinite;
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -13],
  })
}

function createUserIcon() {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 16px; height: 16px;
      background: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 16px rgba(59,130,246,0.5), 0 2px 8px rgba(0,0,0,0.3);
    "></div>
    <div style="
      position: absolute;
      top: -4px; left: -4px;
      width: 24px; height: 24px;
      border: 2px solid rgba(59,130,246,0.3);
      border-radius: 50%;
      animation: pulse-ring 2s ease-out infinite;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12],
  })
}

export default function ShopMap({ shops, selectedShopId, userLat, userLng, onClose }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current || !L) return

    // Destroy previous map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
    }

    const selectedShop = shops.find((s) => s.shop_id === selectedShopId)
    const centerLat = selectedShop ? selectedShop.latitude : userLat
    const centerLng = selectedShop ? selectedShop.longitude : userLng

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([centerLat, centerLng], 14)

    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map)

    // User location marker
    L.marker([userLat, userLng], { icon: createUserIcon() })
      .addTo(map)
      .bindPopup('<strong>📍 Your Location</strong>')

    // Find cheapest for color coding
    const prices = shops.map((s) => s.total_cost).filter(Boolean)
    const cheapest = Math.min(...prices)
    const expensive = Math.max(...prices)

    // Add shop markers with enhanced popups
    shops.forEach((shop) => {
      if (!shop.latitude || !shop.longitude) return

      let icon
      let isCheapestShop = false
      if (shop.shop_id === selectedShopId) {
        icon = createSelectedIcon()
      } else if (shop.total_cost === cheapest) {
        icon = createCheapestIcon()
        isCheapestShop = true
      } else if (shop.total_cost === expensive && prices.length > 2) {
        icon = createMarkerIcon('#ef4444', 12) // red — expensive
      } else {
        icon = createMarkerIcon('#94a3b8', 10) // gray — default
      }

      const discount = shop.discount_percent
        ? `<br><span style="color:#10b981;font-weight:600;">${shop.discount_percent}% OFF</span>`
        : ''

      const cheapestLabel = isCheapestShop
        ? '<div style="margin-top:4px;padding:3px 8px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:6px;color:#34d399;font-size:10px;font-weight:700;text-align:center;">🟢 CHEAPEST NEARBY</div>'
        : ''

      // Enhanced popup with full cost breakdown
      L.marker([shop.latitude, shop.longitude], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Inter,sans-serif;font-size:13px;min-width:180px;">
            <strong>${shop.shop_name}</strong>${discount}
            <div style="margin-top:6px;border-top:1px solid rgba(255,255,255,0.1);padding-top:6px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                <span style="color:#94a3b8;">Price:</span>
                <strong>₹${shop.price}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                <span style="color:#94a3b8;">Distance:</span>
                <span>${shop.distance_km} km</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                <span style="color:#94a3b8;">Travel Cost:</span>
                <span style="color:#fb923c;">+₹${shop.travel_cost}</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
                <strong style="color:#94a3b8;">True Cost:</strong>
                <strong style="color:#6366f1;font-size:14px;">₹${shop.total_cost}</strong>
              </div>
            </div>
            ${cheapestLabel}
          </div>`
        )
    })

    // Fit bounds to show all markers
    const allPoints = [[userLat, userLng], ...shops.filter(s => s.latitude).map((s) => [s.latitude, s.longitude])]
    if (allPoints.length > 1) {
      map.fitBounds(allPoints, { padding: [40, 40], maxZoom: 15 })
    }

    // Small delay then invalidate size to fix render issues inside modals
    setTimeout(() => map.invalidateSize(), 200)

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [shops, selectedShopId, userLat, userLng])

  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="map-header">
          <div className="flex items-center gap-3">
            <span className="text-lg">🗺️</span>
            <div>
              <h2 className="text-base font-bold text-white">Shop Map</h2>
              <p className="text-[11px] text-surface-400">{shops.length} shops near you</p>
            </div>
          </div>
          <button onClick={onClose} className="map-close-btn" title="Close map">✕</button>
        </div>

        {/* Legend */}
        <div className="map-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#3b82f6' }} />You
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#6366f1' }} />Selected
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />Cheapest
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#ef4444' }} />Expensive
          </span>
        </div>

        {/* Map container */}
        <div ref={mapRef} className="map-container" />
      </div>
    </div>
  )
}
