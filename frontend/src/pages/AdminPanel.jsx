import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  getShops, getShop, createShop, updateShop, deleteShop,
  getProducts, createProduct, updateProduct, deleteProduct,
  upsertShopProduct, updateShopProduct, deleteShopProduct,
  getOrders, updateOrderStatus, updateShopStatus,
} from '../api'

const BASE_LAT = 17.6868
const BASE_LNG = 83.2185

const STATUS_COLORS = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  preparing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  out_for_delivery: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
}

// Order status config with badges
const ORDER_STATUS_CONFIG = {
  placed:           { icon: '🟡', label: 'Placed',           color: 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30', glow: 'shadow-yellow-500/10' },
  accepted:         { icon: '🔵', label: 'Accepted',         color: 'bg-blue-500/10 text-blue-300 border border-blue-500/30', glow: 'shadow-blue-500/10' },
  out_for_delivery: { icon: '🟠', label: 'Out for Delivery', color: 'bg-orange-500/10 text-orange-300 border border-orange-500/30', glow: 'shadow-orange-500/10' },
  delivered:        { icon: '🟢', label: 'Delivered',        color: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30', glow: 'shadow-emerald-500/10' },
  cancelled:        { icon: '🔴', label: 'Cancelled',        color: 'bg-red-500/10 text-red-300 border border-red-500/30', glow: 'shadow-red-500/10' },
}

function getOrderStatusConfig(status) {
  return ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.placed
}

// Shop status config
const SHOP_STATUS_CONFIG = {
  validating:       { icon: '🟡', label: 'Validating',       color: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30', borderColor: 'border-l-yellow-500' },
  approval_waiting: { icon: '🟠', label: 'Approval Waiting', color: 'bg-orange-500/10 text-orange-300 border-orange-500/30', borderColor: 'border-l-orange-500' },
  approved:         { icon: '🟢', label: 'Approved',         color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', borderColor: 'border-l-emerald-500' },
  rejected:         { icon: '🔴', label: 'Rejected',         color: 'bg-red-500/10 text-red-300 border-red-500/30', borderColor: 'border-l-red-500' },
}

function getShopStatus(status) {
  return SHOP_STATUS_CONFIG[status] || SHOP_STATUS_CONFIG.validating
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('shops')
  const [allShops, setAllShops] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [shopDetail, setShopDetail] = useState(null)
  const [showAddShop, setShowAddShop] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const { username, role } = useAuth()

  const isShopkeeper = role === 'shopkeeper'
  const isAdmin = role === 'admin'

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const loadShops = useCallback(async () => { try { setAllShops(await getShops()) } catch (e) { showToast(e.message, 'error') } finally { setLoading(false) } }, [])
  const loadProducts = useCallback(async () => { try { setProducts(await getProducts()) } catch (e) {} }, [])
  const loadOrders = useCallback(async () => { try { setOrders(await getOrders()) } catch (e) {} }, [])

  useEffect(() => { loadShops(); loadProducts(); loadOrders() }, [loadShops, loadProducts, loadOrders])

  // Filter shops for shopkeeper role
  const shops = isShopkeeper
    ? allShops.filter((s) => s.name.toLowerCase() === username.toLowerCase())
    : allShops

  // Auto-select shopkeeper's shop on load
  useEffect(() => {
    if (isShopkeeper && shops.length === 1 && !selectedShop) {
      handleSelectShop(shops[0].id)
    }
  }, [isShopkeeper, shops, selectedShop])

  // Auto-switch to orders tab for shopkeepers on first load
  useEffect(() => {
    if (isShopkeeper && activeTab === 'shops') {
      // Keep shops as default, shopkeeper can navigate
    }
  }, [isShopkeeper])

  const handleSelectShop = async (shopId) => {
    setSelectedShop(shopId)
    try { setShopDetail(await getShop(shopId)) } catch (e) { showToast(e.message, 'error') }
  }

  const handleDeleteShop = async (shopId) => {
    if (!confirm('Remove this shop and all its products?')) return
    try {
      await deleteShop(shopId)
      showToast('Shop deleted')
      if (selectedShop === shopId) { setSelectedShop(null); setShopDetail(null) }
      loadShops()
    } catch (e) { showToast(e.message, 'error') }
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Delete this product?')) return
    try { await deleteProduct(productId); showToast('Product deleted'); loadProducts() } catch (e) { showToast(e.message, 'error') }
  }

  const handleStatusChange = async (orderId, status) => {
    try { await updateOrderStatus(orderId, status); showToast(`Order #${orderId} → ${status}`); loadOrders() } catch (e) { showToast(e.message, 'error') }
  }

  const handleShopStatusChange = async (shopId, newStatus) => {
    try { await updateShopStatus(shopId, newStatus); showToast(`Shop status → ${newStatus}`); loadShops() } catch (e) { showToast(e.message, 'error') }
  }

  // Count shops by status
  const validatingShops = allShops.filter(s => s.status === 'validating')
  const waitingShops = allShops.filter(s => s.status === 'approval_waiting')
  const approvedShops = allShops.filter(s => s.status === 'approved')
  const rejectedShops = allShops.filter(s => s.status === 'rejected')

  // Filter orders for shopkeeper — ONLY their shop orders
  const filteredOrders = isShopkeeper
    ? orders.filter(o => o.shop_name && o.shop_name.toLowerCase() === username.toLowerCase())
    : orders

  // Order counts by status for shopkeeper
  const orderCounts = {
    all: filteredOrders.length,
    placed: filteredOrders.filter(o => o.order_status === 'placed').length,
    accepted: filteredOrders.filter(o => o.order_status === 'accepted').length,
    out_for_delivery: filteredOrders.filter(o => o.order_status === 'out_for_delivery').length,
    delivered: filteredOrders.filter(o => o.order_status === 'delivered').length,
  }

  const tabs = isShopkeeper
    ? [
        { id: 'shops', label: '🏪 My Shop', count: shops.length },
        { id: 'orders', label: '📥 Orders', count: filteredOrders.length, highlight: orderCounts.placed > 0 },
      ]
    : [
        { id: 'validating', label: '🟡 Validating', count: validatingShops.length },
        { id: 'waiting', label: '🟠 Waiting', count: waitingShops.length },
        { id: 'shops', label: '🟢 Approved', count: approvedShops.length },
        { id: 'orders', label: '📋 Orders', count: filteredOrders.length },
      ]

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-20 right-6 z-50 animate-fade-in-up rounded-xl px-5 py-3 text-sm font-medium shadow-2xl ${
          toast.type === 'error' ? 'border border-red-500/20 bg-red-500/10 text-red-300' : 'border border-accent-500/20 bg-accent-500/10 text-accent-300'
        }`}>{toast.type === 'error' ? '❌' : '✅'} {toast.msg}</div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{isShopkeeper ? '🏪 Shopkeeper Panel' : '⚙️ Admin Panel'}</h1>
          <p className="mt-1 text-sm text-surface-400">
            Logged in as <span className="font-semibold text-accent-400">{username}</span>
            {isShopkeeper ? ' — Manage your shop & orders' : ' — Approve shops & monitor system'}
          </p>
          {isAdmin && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 text-[11px] font-semibold text-yellow-400">🟡 {validatingShops.length} Validating</span>
              <span className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 text-[11px] font-semibold text-orange-400">🟠 {waitingShops.length} Waiting</span>
              <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">🟢 {approvedShops.length} Approved</span>
            </div>
          )}
          {isShopkeeper && orderCounts.placed > 0 && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 text-xs font-semibold text-yellow-300 animate-pulse">
                🔔 {orderCounts.placed} new order{orderCounts.placed > 1 ? 's' : ''} waiting!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface-800/40 p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-primary-500/15 text-primary-300 shadow-sm' : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            {tab.label} <span className="ml-1 text-xs opacity-60">({tab.count})</span>
            {tab.highlight && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* VALIDATING SHOPS TAB (Admin only) */}
      {activeTab === 'validating' && isAdmin && (
        <ShopApprovalList
          shops={validatingShops}
          emptyIcon="🔍"
          emptyText="No shops currently being validated"
          borderColor="border-l-yellow-500"
          onStatusChange={handleShopStatusChange}
          nextStatus="approval_waiting"
          nextStatusLabel="Move to Waiting"
          nextStatusIcon="🟠"
        />
      )}

      {/* WAITING FOR APPROVAL TAB (Admin only) */}
      {activeTab === 'waiting' && isAdmin && (
        <ShopApprovalList
          shops={waitingShops}
          emptyIcon="⏳"
          emptyText="No shops waiting for approval"
          borderColor="border-l-orange-500"
          onStatusChange={handleShopStatusChange}
          nextStatus="approved"
          nextStatusLabel="Approve"
          nextStatusIcon="✅"
          showApprove
        />
      )}

      {/* SHOPS TAB */}
      {activeTab === 'shops' && (
        <div>
          {isShopkeeper && (
            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <p className="text-xs text-emerald-400 font-semibold">🏪 You can manage your shop's inventory, update stock, and modify pricing below.</p>
            </div>
          )}

          {isAdmin && (
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <p className="text-xs text-amber-400 font-semibold">⚠️ Admin view-only: You can view shop details but cannot edit shop inventory (legal restriction).</p>
            </div>
          )}

          {showAddShop && <AddShopForm onClose={() => setShowAddShop(false)} onCreated={() => { loadShops(); setShowAddShop(false); showToast('Shop created!') }} />}

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="glass-card overflow-hidden">
                <div className="border-b border-surface-700/50 p-4">
                  <h2 className="text-sm font-semibold text-surface-300">
                    {isShopkeeper ? 'My Shop' : 'Approved Shops'} <span className="ml-1 text-surface-500">({isShopkeeper ? shops.length : approvedShops.length})</span>
                  </h2>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {loading ? (
                    <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <div key={i} className="shimmer h-14 rounded-lg" />)}</div>
                  ) : (isShopkeeper ? shops : approvedShops).map((shop) => {
                    const st = getShopStatus(shop.status)
                    return (
                      <button key={shop.id} onClick={() => handleSelectShop(shop.id)}
                        className={`flex w-full items-center gap-3 border-b border-l-4 border-surface-800/40 px-4 py-3 text-left transition-all hover:bg-primary-500/5 ${selectedShop === shop.id ? 'bg-primary-500/8 border-l-primary-500' : st.borderColor}`}>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warm-500/10 text-xs">🏪</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-surface-200">{shop.name}</p>
                          <p className="text-[11px] text-surface-500">{shop.latitude.toFixed(4)}, {shop.longitude.toFixed(4)}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-lg whitespace-nowrap ${st.color}`}>
                          {st.icon} {st.label}
                        </span>
                        {isAdmin && <button onClick={(e) => { e.stopPropagation(); handleDeleteShop(shop.id) }} className="rounded-md p-1.5 text-xs text-surface-600 transition-colors hover:bg-red-500/10 hover:text-red-400" title="Delete shop">🗑️</button>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              {!shopDetail ? (
                <div className="glass-card flex h-80 items-center justify-center"><div className="text-center"><p className="text-4xl">🏪</p><p className="mt-3 text-sm text-surface-500">Select a shop to view {isAdmin ? 'details' : 'and manage products & stock'}</p></div></div>
              ) : (
                <ShopDetail shop={shopDetail} products={products} onUpdate={() => handleSelectShop(shopDetail.id)} onShopUpdate={loadShops} showToast={showToast} isAdmin={isAdmin} />
              )}
            </div>
          </div>
        </div>
      )}


      {/* PRODUCTS TAB REMOVED — Admin cannot manage products (legal restriction) */}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <ShopkeeperOrderDashboard
          orders={filteredOrders}
          onStatusChange={handleStatusChange}
          isAdmin={isAdmin}
          isShopkeeper={isShopkeeper}
        />
      )}
    </div>
  )
}

/* ==================== Shopkeeper Order Dashboard ==================== */
function ShopkeeperOrderDashboard({ orders, onStatusChange, isAdmin, isShopkeeper }) {
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.order_status === filterStatus)

  const statusFilters = [
    { id: 'all',              label: 'All Orders',  count: orders.length },
    { id: 'placed',           label: '🟡 Placed',   count: orders.filter(o => o.order_status === 'placed').length },
    { id: 'accepted',         label: '🔵 Accepted', count: orders.filter(o => o.order_status === 'accepted').length },
    { id: 'out_for_delivery', label: '🟠 Out for Delivery', count: orders.filter(o => o.order_status === 'out_for_delivery').length },
    { id: 'delivered',        label: '🟢 Delivered', count: orders.filter(o => o.order_status === 'delivered').length },
  ]

  return (
    <div className="space-y-5">
      {/* Admin notice */}
      {isAdmin && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-xs text-amber-400 font-semibold">⚠️ Admin view-only: You can view orders but cannot modify order status. Only shopkeepers can manage fulfillment.</p>
        </div>
      )}

      {/* Status filter bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              filterStatus === f.id
                ? 'bg-primary-500/15 text-primary-300 shadow-sm'
                : 'bg-surface-800/40 text-surface-400 hover:bg-surface-800/60 hover:text-surface-200'
            }`}
          >
            {f.label}
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              filterStatus === f.id ? 'bg-primary-500/20 text-primary-200' : 'bg-surface-700/50 text-surface-500'
            }`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filteredOrders.length === 0 ? (
        <div className="glass-card flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-5xl mb-3">📦</p>
            <p className="text-sm font-medium text-surface-400">
              {filterStatus === 'all' ? 'No orders yet' : `No ${filterStatus.replace('_', ' ')} orders`}
            </p>
            {isShopkeeper && filterStatus === 'all' && (
              <p className="mt-1 text-xs text-surface-500">Orders from customers will appear here</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={onStatusChange}
              isAdmin={isAdmin}
              isShopkeeper={isShopkeeper}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ==================== Order Card ==================== */
function OrderCard({ order, onStatusChange, isAdmin, isShopkeeper }) {
  const [updating, setUpdating] = useState(false)
  const statusConfig = getOrderStatusConfig(order.order_status)

  const handleAction = async (newStatus) => {
    setUpdating(true)
    try {
      await onStatusChange(order.id, newStatus)
    } finally {
      setUpdating(false)
    }
  }

  // Format date
  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : 'N/A'

  return (
    <div className={`glass-card overflow-hidden animate-fade-in-up transition-all hover:shadow-lg ${statusConfig.glow}`}>
      {/* Order Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-700/50 px-5 py-3.5 bg-surface-800/20">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white">Order #{order.id}</span>
          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${statusConfig.color}`}>
            {statusConfig.icon} {statusConfig.label}
          </span>
        </div>
        <span className="text-[11px] text-surface-500">🕐 {orderDate}</span>
      </div>

      <div className="grid gap-0 sm:grid-cols-2">
        {/* Left: Customer & Delivery Info */}
        <div className="border-r border-surface-700/30 px-5 py-4">
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider mb-2">📍 Deliver To</p>
            <div className="rounded-lg bg-surface-800/40 border border-surface-700/30 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500/10 text-xs">👤</span>
                <p className="text-sm font-semibold text-white">{order.customer_name}</p>
              </div>
              <p className="text-xs text-surface-300 flex items-center gap-1.5">
                <span className="text-surface-500">📞</span> {order.phone}
              </p>
              <p className="text-xs text-surface-300 flex items-start gap-1.5">
                <span className="text-surface-500 mt-0.5">📍</span>
                <span>{order.address}, {order.pincode}</span>
              </p>
            </div>
          </div>

          {/* Shop info (for admin) */}
          {isAdmin && (
            <div className="mt-3 rounded-lg bg-surface-800/30 px-3 py-2">
              <p className="text-[10px] text-surface-500 uppercase tracking-wider mb-1">Shop</p>
              <p className="text-xs font-semibold text-surface-200">🏪 {order.shop_name}</p>
            </div>
          )}
        </div>

        {/* Right: Items & Total */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider mb-2">🛒 Ordered Items</p>
          <div className="space-y-1.5 mb-3">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-surface-800/40 last:border-0">
                <span className="text-surface-300">
                  {item.product_name}
                  <span className="text-surface-500 ml-1">× {item.quantity} {item.unit_type}</span>
                </span>
                <span className="font-semibold text-surface-200">₹{Math.round(item.price * item.quantity * 100) / 100}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-surface-700/40 pt-2.5">
            <span className="text-xs font-semibold text-surface-400">Total</span>
            <span className="text-lg font-extrabold text-accent-400">₹{order.total_price}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons (Shopkeeper only) */}
      {isShopkeeper && order.order_status !== 'delivered' && order.order_status !== 'cancelled' && (
        <div className="border-t border-surface-700/50 px-5 py-3.5 bg-surface-800/10">
          <div className="flex items-center gap-3">
            {/* Status Progress Indicator */}
            <div className="hidden sm:flex items-center gap-1 flex-1">
              {['placed', 'accepted', 'out_for_delivery', 'delivered'].map((s, i) => {
                const isCurrent = s === order.order_status
                const isPast = ['placed', 'accepted', 'out_for_delivery', 'delivered'].indexOf(order.order_status) > i
                const cfg = getOrderStatusConfig(s)
                return (
                  <div key={s} className="flex items-center gap-1 flex-1">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] transition-all ${
                      isPast ? 'bg-emerald-500/20 text-emerald-400' :
                      isCurrent ? 'bg-primary-500/20 text-primary-300 ring-2 ring-primary-500/30' :
                      'bg-surface-800/60 text-surface-600'
                    }`}>
                      {isPast ? '✓' : cfg.icon}
                    </div>
                    {i < 3 && (
                      <div className={`h-0.5 flex-1 rounded-full transition-all ${isPast ? 'bg-emerald-500/40' : 'bg-surface-800/60'}`} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Action Button */}
            {order.order_status === 'placed' && (
              <button
                onClick={() => handleAction('accepted')}
                disabled={updating}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
              >
                {updating ? '...' : '✓ Accept Order'}
              </button>
            )}
            {order.order_status === 'accepted' && (
              <button
                onClick={() => handleAction('out_for_delivery')}
                disabled={updating}
                className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
              >
                {updating ? '...' : '🚚 Mark Out for Delivery'}
              </button>
            )}
            {order.order_status === 'out_for_delivery' && (
              <button
                onClick={() => handleAction('delivered')}
                disabled={updating}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
              >
                {updating ? '...' : '✅ Mark Delivered'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delivered success banner */}
      {order.order_status === 'delivered' && (
        <div className="border-t border-emerald-500/20 bg-emerald-500/5 px-5 py-2.5 text-center">
          <p className="text-xs font-semibold text-emerald-400">✅ Order delivered successfully</p>
        </div>
      )}
    </div>
  )
}

/* ==================== Shop Approval List (Admin) ==================== */
function ShopApprovalList({ shops, emptyIcon, emptyText, borderColor, onStatusChange, nextStatus, nextStatusLabel, nextStatusIcon, showApprove }) {
  if (shops.length === 0) {
    return (
      <div className="glass-card flex h-80 items-center justify-center">
        <div className="text-center">
          <p className="text-4xl">{emptyIcon}</p>
          <p className="mt-3 text-sm text-surface-500">{emptyText}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {shops.map((shop) => {
        const st = getShopStatus(shop.status)
        return (
          <div key={shop.id} className={`glass-card overflow-hidden animate-fade-in-up border-l-4 ${borderColor}`}>
            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-surface-500 mb-1">Shop Name</p>
                <p className="text-base font-bold text-white">{shop.name}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 mb-1">Owner</p>
                <p className="text-sm text-surface-300">{shop.owner_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 mb-1">Type</p>
                <span className="inline-block rounded-lg bg-primary-500/10 px-2.5 py-1 text-xs font-semibold text-primary-300">{shop.shop_type || 'General Store'}</span>
              </div>
              <div>
                <p className="text-xs text-surface-500 mb-1">Phone</p>
                <p className="text-sm text-surface-300">📞 {shop.phone || 'N/A'}</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="border-t border-surface-700/50 px-6 py-3">
              <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${st.color}`}>
                {st.icon} {st.label}
              </span>
            </div>

            {/* Documents */}
            {(shop.shop_photo || shop.pan_image || shop.aadhaar_image) && (
              <div className="border-t border-surface-700/50 px-6 py-4">
                <p className="text-xs font-semibold text-surface-400 mb-3">📋 Submitted Documents</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {shop.shop_photo && (
                    <div className="rounded-lg bg-surface-800/50 p-3 text-center">
                      <img src={shop.shop_photo} alt="Shop" className="mx-auto h-24 w-24 rounded object-cover mb-2" />
                      <p className="text-[11px] text-surface-400">Shop Photo ✓</p>
                    </div>
                  )}
                  {shop.pan_image && (
                    <div className="rounded-lg bg-surface-800/50 p-3 text-center">
                      <img src={shop.pan_image} alt="PAN" className="mx-auto h-24 w-24 rounded object-cover mb-2" />
                      <p className="text-[11px] text-surface-400">PAN Card ✓</p>
                    </div>
                  )}
                  {shop.aadhaar_image && (
                    <div className="rounded-lg bg-surface-800/50 p-3 text-center">
                      <img src={shop.aadhaar_image} alt="Aadhaar" className="mx-auto h-24 w-24 rounded object-cover mb-2" />
                      <p className="text-[11px] text-surface-400">Aadhaar ✓</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-surface-700/50 flex gap-3 px-6 py-4">
              <button
                onClick={() => onStatusChange(shop.id, nextStatus)}
                className="flex-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97]"
              >
                {nextStatusIcon} {nextStatusLabel}
              </button>
              <button
                onClick={() => onStatusChange(shop.id, 'rejected')}
                className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-pink-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97]"
              >
                ❌ Reject
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ==================== Add Shop Form ==================== */
function AddShopForm({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [lat, setLat] = useState(BASE_LAT + (Math.random() - 0.5) * 0.06)
  const [lng, setLng] = useState(BASE_LNG + (Math.random() - 0.5) * 0.06)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try { await createShop({ name: name.trim(), latitude: parseFloat(lat), longitude: parseFloat(lng) }); onCreated() } catch (e) { alert(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="animate-fade-in-up w-full max-w-md rounded-2xl border border-surface-700 bg-surface-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-bold text-white">Add New Shop</h3><button onClick={onClose} className="rounded-lg p-1 text-surface-500 hover:bg-surface-800 hover:text-white">✕</button></div>
        <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
          <p className="text-[11px] text-yellow-400">🟡 New shops start with <strong>"Validating"</strong> status and require admin approval before the shopkeeper can login.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="mb-1.5 block text-xs font-semibold text-surface-400">Shop Name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sri Lakshmi Kirana Store" className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-white placeholder-surface-600 outline-none focus:border-primary-500/50" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1.5 block text-xs font-semibold text-surface-400">Latitude</label><input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-white outline-none" required /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-surface-400">Longitude</label><input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-white outline-none" required /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-surface-400 hover:bg-surface-800">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-gradient-to-r from-warm-500 to-warm-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-50">{saving ? 'Creating...' : 'Create Shop'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ==================== Add Product Form ==================== */
function AddProductForm({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Grocery')
  const [unitType, setUnitType] = useState('kg')
  const [price, setPrice] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try { await createProduct({ name: name.trim(), category, unit_type: unitType, default_price: parseFloat(price) || 0 }); onCreated() } catch (e) { alert(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="mb-4 glass-card p-5 animate-fade-in-up">
      <h3 className="mb-3 text-sm font-bold text-white">New Product</h3>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[140px]"><label className="mb-1 block text-[11px] font-semibold text-surface-500">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white outline-none" required /></div>
        <div className="w-28"><label className="mb-1 block text-[11px] font-semibold text-surface-500">Category</label><input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white outline-none" /></div>
        <div className="w-24"><label className="mb-1 block text-[11px] font-semibold text-surface-500">Unit</label>
          <select value={unitType} onChange={(e) => setUnitType(e.target.value)} className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white outline-none">
            <option>kg</option><option>litre</option><option>unit</option>
          </select>
        </div>
        <div className="w-24"><label className="mb-1 block text-[11px] font-semibold text-surface-500">Price ₹</label><input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white outline-none" /></div>
        <button type="submit" disabled={saving} className="rounded-lg bg-accent-600 px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50">{saving ? '...' : 'Add'}</button>
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-xs text-surface-500 hover:bg-surface-800">Cancel</button>
      </form>
    </div>
  )
}

/* ==================== Shop Detail Panel ==================== */
function ShopDetail({ shop, products, onUpdate, onShopUpdate, showToast, isAdmin }) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(shop.name)
  const [editLat, setEditLat] = useState(shop.latitude)
  const [editLng, setEditLng] = useState(shop.longitude)
  const [addingProduct, setAddingProduct] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newStock, setNewStock] = useState('100')

  useEffect(() => { setEditName(shop.name); setEditLat(shop.latitude); setEditLng(shop.longitude); setEditing(false) }, [shop])

  const handleSaveShop = async () => {
    try { await updateShop(shop.id, { name: editName, latitude: parseFloat(editLat), longitude: parseFloat(editLng) }); showToast('Shop updated!'); setEditing(false); onUpdate(); onShopUpdate() } catch (e) { showToast(e.message, 'error') }
  }

  const handleAddProduct = async () => {
    if (!selectedProductId || !newPrice) return
    try { await upsertShopProduct({ shop_id: shop.id, product_id: parseInt(selectedProductId), price: parseFloat(newPrice), stock_quantity: parseFloat(newStock) || 100 }); showToast('Product added!'); setAddingProduct(false); setSelectedProductId(''); setNewPrice(''); setNewStock('100'); onUpdate() } catch (e) { showToast(e.message, 'error') }
  }

  const handleUpdateProduct = async (spId, updates) => {
    try { await updateShopProduct(spId, updates); showToast('Updated!'); onUpdate() } catch (e) { showToast(e.message, 'error') }
  }

  const handleDeleteProduct = async (spId) => {
    try { await deleteShopProduct(spId); showToast('Product removed!'); onUpdate() } catch (e) { showToast(e.message, 'error') }
  }

  // Status indicator
  const st = getShopStatus(shop.status)

  return (
    <div className="glass-card overflow-hidden animate-fade-in-up">
      <div className="border-b border-surface-700/50 p-5">
        {editing && !isAdmin ? (
          <div className="space-y-3">
            <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" step="any" value={editLat} onChange={(e) => setEditLat(e.target.value)} className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white outline-none" />
              <input type="number" step="any" value={editLng} onChange={(e) => setEditLng(e.target.value)} className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveShop} className="rounded-lg bg-accent-600 px-4 py-1.5 text-xs font-semibold text-white hover:brightness-110">Save</button>
              <button onClick={() => setEditing(false)} className="rounded-lg px-4 py-1.5 text-xs font-medium text-surface-400 hover:bg-surface-800">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-white">{shop.name}</h2>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${st.color}`}>{st.icon} {st.label}</span>
              </div>
              <p className="mt-1 text-xs text-surface-400">📍 {shop.latitude.toFixed(4)}, {shop.longitude.toFixed(4)}</p>
              <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-surface-600">Type</p>
                  <p className="font-semibold text-surface-300">{shop.shop_type}</p>
                </div>
                <div>
                  <p className="text-surface-600">Owner</p>
                  <p className="font-semibold text-surface-300">{shop.owner_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-surface-600">Phone</p>
                  <p className="font-semibold text-surface-300">📞 {shop.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
            {/* Only shopkeeper can edit — admin cannot */}
            {!isAdmin && (
              <button onClick={() => setEditing(true)} className="rounded-lg border border-surface-700 px-3 py-1.5 text-xs font-medium text-surface-400 transition-colors hover:bg-surface-800 hover:text-white">✏️ Edit</button>
            )}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-surface-300">Products & Stock <span className="text-surface-500">({shop.products?.length || 0})</span></h3>
          {/* Only shopkeeper can add products — admin cannot */}
          {!isAdmin && (
            <button onClick={() => setAddingProduct(!addingProduct)} className="inline-flex items-center gap-1 rounded-lg bg-primary-500/10 px-3 py-1.5 text-xs font-semibold text-primary-300 transition-colors hover:bg-primary-500/20">
              {addingProduct ? '✕ Cancel' : '+ Add Product'}
            </button>
          )}
        </div>

        {addingProduct && !isAdmin && (
          <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-surface-700/50 bg-surface-800/30 p-3">
            <div className="flex-1 min-w-[140px]"><label className="mb-1 block text-[11px] font-semibold text-surface-500">Product</label>
              <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white outline-none">
                <option value="">Choose...</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.unit_type})</option>)}
              </select>
            </div>
            <div className="w-24"><label className="mb-1 block text-[11px] font-semibold text-surface-500">Price ₹</label><input type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white outline-none" /></div>
            <div className="w-24"><label className="mb-1 block text-[11px] font-semibold text-surface-500">Stock</label><input type="number" value={newStock} onChange={(e) => setNewStock(e.target.value)} className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white outline-none" /></div>
            <button onClick={handleAddProduct} disabled={!selectedProductId || !newPrice} className="rounded-lg bg-accent-600 px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-40">Add</button>
          </div>
        )}

        {shop.products?.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-surface-800/60">
            <table className="admin-table">
              <thead><tr><th>Product</th><th>Price ₹</th><th>Stock</th><th>Status</th>{!isAdmin && <th className="text-right">Actions</th>}</tr></thead>
              <tbody>
                {shop.products.map((sp) => (
                  <ProductRow key={sp.id} sp={sp} onUpdate={handleUpdateProduct} onDelete={handleDeleteProduct} isAdmin={isAdmin} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-surface-500">No products added yet</p>
        )}
      </div>
    </div>
  )
}

/* ==================== Product Row ==================== */
function ProductRow({ sp, onUpdate, onDelete, isAdmin }) {
  const [editing, setEditing] = useState(false)
  const [price, setPrice] = useState(sp.original_price || sp.price)
  const [discountedPrice, setDiscountedPrice] = useState(sp.discounted_price || '')
  const [stock, setStock] = useState(sp.stock_quantity || 0)
  const [threshold, setThreshold] = useState(sp.min_threshold || 10)

  const stockStatus = stock <= 0 ? 'out' : stock <= threshold ? 'low' : 'ok'

  const handleSave = () => {
    const origP = parseFloat(price)
    const discP = discountedPrice ? parseFloat(discountedPrice) : null
    onUpdate(sp.id, {
      price: discP || origP,
      original_price: discP ? origP : null,
      discounted_price: discP,
      stock_quantity: parseFloat(stock),
      min_threshold: parseFloat(threshold),
    })
    setEditing(false)
  }

  return (
    <tr>
      <td className="font-medium text-surface-200">
        {sp.product_name}
        <span className="ml-1 text-[10px] text-surface-500">({sp.unit_type || 'kg'})</span>
      </td>
      <td>
        {editing && !isAdmin ? (
          <div className="space-y-1">
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-20 rounded border border-surface-600 bg-surface-800 px-2 py-1 text-sm text-white outline-none" placeholder="Price" />
            <input type="number" step="0.01" value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)} className="w-20 rounded border border-surface-600 bg-surface-800 px-2 py-1 text-sm text-white outline-none" placeholder="Sale ₹" />
          </div>
        ) : (
          <span className="font-semibold text-accent-400">
            {sp.discounted_price ? (
              <span className="flex items-center gap-1"><span className="price-strikethrough text-surface-500 text-xs">₹{sp.original_price}</span><span>₹{sp.discounted_price}</span></span>
            ) : <>₹{sp.price}</>}
          </span>
        )}
      </td>
      <td>
        {editing && !isAdmin ? (
          <div className="space-y-1">
            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-16 rounded border border-surface-600 bg-surface-800 px-2 py-1 text-sm text-white outline-none" placeholder="Qty" />
            <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-16 rounded border border-surface-600 bg-surface-800 px-2 py-1 text-sm text-white outline-none" placeholder="Min" />
          </div>
        ) : (
          <span className="text-sm">{sp.stock_quantity}</span>
        )}
      </td>
      <td>
        <span className={`tag-badge ${stockStatus === 'out' ? 'bg-red-500/10 text-red-400' : stockStatus === 'low' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-accent-500/10 text-accent-400'}`}>
          {stockStatus === 'out' ? 'Out of Stock' : stockStatus === 'low' ? 'Low Stock' : 'In Stock'}
        </span>
      </td>
      {/* Only shopkeeper can edit/delete products — admin cannot */}
      {!isAdmin && (
        <td className="text-right">
          <div className="flex items-center justify-end gap-1">
            {editing ? (
              <><button onClick={handleSave} className="rounded px-2 py-1 text-xs font-medium text-accent-400 hover:bg-accent-500/10">Save</button>
              <button onClick={() => setEditing(false)} className="rounded px-2 py-1 text-xs text-surface-500 hover:bg-surface-800">Cancel</button></>
            ) : (
              <><button onClick={() => setEditing(true)} className="rounded px-2 py-1 text-xs text-surface-400 hover:bg-surface-800 hover:text-white">✏️</button>
              <button onClick={() => onDelete(sp.id)} className="rounded px-2 py-1 text-xs text-surface-500 hover:bg-red-500/10 hover:text-red-400">🗑️</button></>
            )}
          </div>
        </td>
      )}
    </tr>
  )
}
