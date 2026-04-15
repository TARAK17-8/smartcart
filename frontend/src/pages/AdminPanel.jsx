import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  getShops, getShop, createShop, updateShop, deleteShop,
  getProducts, createProduct, updateProduct, deleteProduct,
  upsertShopProduct, updateShopProduct, deleteShopProduct,
  getOrders, updateOrderStatus,
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

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('shops')
  const [shops, setShops] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)
  const [shopDetail, setShopDetail] = useState(null)
  const [showAddShop, setShowAddShop] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const { username } = useAuth()

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const loadShops = useCallback(async () => { try { setShops(await getShops()) } catch (e) { showToast(e.message, 'error') } finally { setLoading(false) } }, [])
  const loadProducts = useCallback(async () => { try { setProducts(await getProducts()) } catch (e) {} }, [])
  const loadOrders = useCallback(async () => { try { setOrders(await getOrders()) } catch (e) {} }, [])

  useEffect(() => { loadShops(); loadProducts(); loadOrders() }, [loadShops, loadProducts, loadOrders])

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

  const tabs = [
    { id: 'shops', label: '🏪 Shops', count: shops.length },
    { id: 'products', label: '📦 Products', count: products.length },
    { id: 'orders', label: '📋 Orders', count: orders.length },
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
          <h1 className="text-2xl font-bold text-white">🏪 Admin Panel</h1>
          <p className="mt-1 text-sm text-surface-400">Logged in as <span className="font-semibold text-accent-400">{username}</span> — Manage shops, products, stock & orders</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface-800/40 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === tab.id ? 'bg-primary-500/15 text-primary-300 shadow-sm' : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            {tab.label} <span className="ml-1 text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* SHOPS TAB */}
      {activeTab === 'shops' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => setShowAddShop(true)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-warm-500 to-warm-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-warm-500/20 transition-all hover:brightness-110 active:scale-[0.97]">
              + Add Shop
            </button>
          </div>

          {showAddShop && <AddShopForm onClose={() => setShowAddShop(false)} onCreated={() => { loadShops(); setShowAddShop(false); showToast('Shop created!') }} />}

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="glass-card overflow-hidden">
                <div className="border-b border-surface-700/50 p-4"><h2 className="text-sm font-semibold text-surface-300">All Shops <span className="ml-1 text-surface-500">({shops.length})</span></h2></div>
                <div className="max-h-[600px] overflow-y-auto">
                  {loading ? (
                    <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <div key={i} className="shimmer h-14 rounded-lg" />)}</div>
                  ) : shops.map((shop) => (
                    <button key={shop.id} onClick={() => handleSelectShop(shop.id)}
                      className={`flex w-full items-center gap-3 border-b border-surface-800/40 px-4 py-3 text-left transition-all hover:bg-primary-500/5 ${selectedShop === shop.id ? 'bg-primary-500/8 border-l-2 border-l-primary-500' : ''}`}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warm-500/10 text-xs">🏪</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-surface-200">{shop.name}</p>
                        <p className="text-[11px] text-surface-500">{shop.latitude.toFixed(4)}, {shop.longitude.toFixed(4)}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteShop(shop.id) }} className="rounded-md p-1.5 text-xs text-surface-600 transition-colors hover:bg-red-500/10 hover:text-red-400" title="Delete shop">🗑️</button>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              {!shopDetail ? (
                <div className="glass-card flex h-80 items-center justify-center"><div className="text-center"><p className="text-4xl">🏪</p><p className="mt-3 text-sm text-surface-500">Select a shop to manage its products & stock</p></div></div>
              ) : (
                <ShopDetail shop={shopDetail} products={products} onUpdate={() => handleSelectShop(shopDetail.id)} onShopUpdate={loadShops} showToast={showToast} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => setShowAddProduct(!showAddProduct)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.97]">
              {showAddProduct ? '✕ Cancel' : '+ Add Product'}
            </button>
          </div>

          {showAddProduct && <AddProductForm onClose={() => setShowAddProduct(false)} onCreated={() => { loadProducts(); setShowAddProduct(false); showToast('Product created!') }} />}

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead><tr><th>Product</th><th>Category</th><th>Unit</th><th>Default Price</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium text-surface-200">{p.name}</td>
                      <td><span className="tag-badge bg-surface-700/50 text-surface-400">{p.category}</span></td>
                      <td className="text-surface-300">{p.unit_type}</td>
                      <td className="text-accent-400 font-semibold">₹{p.default_price}</td>
                      <td className="text-right">
                        <button onClick={() => handleDeleteProduct(p.id)} className="rounded px-2 py-1 text-xs text-surface-500 hover:bg-red-500/10 hover:text-red-400">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="glass-card flex h-48 items-center justify-center"><p className="text-sm text-surface-500">No orders yet</p></div>
          ) : orders.map((order) => (
            <div key={order.id} className="glass-card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-700/50 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">Order #{order.id}</span>
                  <span className={`tag-badge border ${STATUS_COLORS[order.order_status] || ''}`}>{order.order_status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={order.order_status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="rounded-lg border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-white outline-none"
                  >
                    {['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="px-5 py-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 text-xs">
                  <p className="text-surface-400">Customer</p>
                  <p className="font-medium text-white">{order.customer_name}</p>
                  <p className="text-surface-400">📞 {order.phone}</p>
                  <p className="text-surface-400">📍 {order.address}, {order.pincode}</p>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="text-surface-400">Shop: <span className="text-surface-200">{order.shop_name}</span></p>
                  <div className="space-y-0.5">
                    {(order.items || []).map((item, i) => (
                      <p key={i} className="text-surface-300">{item.product_name} × {item.quantity} {item.unit_type} — ₹{Math.round(item.price * item.quantity * 100) / 100}</p>
                    ))}
                  </div>
                  <p className="text-sm font-bold text-accent-400 pt-1">Total: ₹{order.total_price}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
function ShopDetail({ shop, products, onUpdate, onShopUpdate, showToast }) {
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

  return (
    <div className="glass-card overflow-hidden animate-fade-in-up">
      <div className="border-b border-surface-700/50 p-5">
        {editing ? (
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
            <div><h2 className="text-lg font-bold text-white">{shop.name}</h2><p className="mt-1 text-xs text-surface-400">📍 {shop.latitude.toFixed(4)}, {shop.longitude.toFixed(4)}</p></div>
            <button onClick={() => setEditing(true)} className="rounded-lg border border-surface-700 px-3 py-1.5 text-xs font-medium text-surface-400 transition-colors hover:bg-surface-800 hover:text-white">✏️ Edit</button>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-surface-300">Products & Stock <span className="text-surface-500">({shop.products?.length || 0})</span></h3>
          <button onClick={() => setAddingProduct(!addingProduct)} className="inline-flex items-center gap-1 rounded-lg bg-primary-500/10 px-3 py-1.5 text-xs font-semibold text-primary-300 transition-colors hover:bg-primary-500/20">
            {addingProduct ? '✕ Cancel' : '+ Add Product'}
          </button>
        </div>

        {addingProduct && (
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
              <thead><tr><th>Product</th><th>Price ₹</th><th>Stock</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {shop.products.map((sp) => (
                  <ProductRow key={sp.id} sp={sp} onUpdate={handleUpdateProduct} onDelete={handleDeleteProduct} />
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
function ProductRow({ sp, onUpdate, onDelete }) {
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
        {editing ? (
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
        {editing ? (
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
    </tr>
  )
}
