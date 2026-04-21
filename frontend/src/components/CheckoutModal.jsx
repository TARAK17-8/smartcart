import { useState } from 'react'
import { useCart } from '../hooks/useCart'
import { placeOrder } from '../api'
import useGeolocation from '../hooks/useGeolocation'

export default function CheckoutModal({ onClose }) {
  const { items, totalPrice, clearCart } = useCart()
  const geo = useGeolocation()
  const [step, setStep] = useState(1) // 1=details, 2=summary, 3=success
  const [form, setForm] = useState({ name: '', phone: '', address: '', pincode: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderResult, setOrderResult] = useState(null)

  // Group by shop — each shop gets a separate order
  const groupedByShop = items.reduce((acc, item) => {
    const key = item.shop_id
    if (!acc[key]) acc[key] = { shop_name: item.shop_name, shop_id: item.shop_id, items: [] }
    acc[key].items.push(item)
    return acc
  }, {})
  const shopGroups = Object.values(groupedByShop)

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const isFormValid = form.name.trim() && form.phone.trim().length >= 10 && form.address.trim() && form.pincode.trim().length >= 5

  const handlePlaceOrder = async () => {
    setLoading(true)
    setError('')
    try {
      const results = []
      for (const group of shopGroups) {
        const shopTotal = group.items.reduce((s, i) => s + i.price * i.quantity, 0)
        const orderData = {
          customer_name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          pincode: form.pincode.trim(),
          shop_id: group.shop_id,
          items: group.items.map((i) => ({
            product_id: i.product_id,
            product_name: i.product_name,
            quantity: i.quantity,
            price: i.price,
            unit_type: i.unit_type,
          })),
          total_price: Math.round(shopTotal * 100) / 100,
          user_lat: geo.lat,
          user_lng: geo.lng,
        }
        const result = await placeOrder(orderData)
        results.push(result)
      }
      setOrderResult(results)
      setStep(3)
      clearCart()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="animate-fade-in-up w-full max-w-lg rounded-2xl border border-surface-700 bg-surface-900 shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-700/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">{step === 3 ? '✅' : '📋'}</span>
            <h2 className="text-lg font-bold text-white">
              {step === 1 ? 'Your Details' : step === 2 ? 'Order Summary' : 'Order Placed!'}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-800 hover:text-white">✕</button>
        </div>

        <div className="p-6">
          {/* Step 1: Customer Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-surface-400">Full Name</label>
                <input
                  id="checkout-name"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-3 text-sm text-white placeholder-surface-600 outline-none focus:border-primary-500/50"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-surface-400">Phone Number</label>
                <input
                  id="checkout-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="10-digit phone number"
                  className="w-full rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-3 text-sm text-white placeholder-surface-600 outline-none focus:border-primary-500/50"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-surface-400">Delivery Address</label>
                <textarea
                  id="checkout-address"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Full delivery address"
                  rows={3}
                  className="w-full rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-3 text-sm text-white placeholder-surface-600 outline-none focus:border-primary-500/50 resize-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-surface-400">Pincode</label>
                <input
                  id="checkout-pincode"
                  value={form.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  placeholder="530026"
                  maxLength={6}
                  className="w-full rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-3 text-sm text-white placeholder-surface-600 outline-none focus:border-primary-500/50"
                  required
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!isFormValid}
                className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 py-3 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
              >
                Review Order →
              </button>
            </div>
          )}

          {/* Step 2: Order Summary */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="rounded-xl border border-surface-700/40 bg-surface-800/30 p-4 space-y-1">
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Delivery To</p>
                <p className="text-sm font-medium text-white">{form.name}</p>
                <p className="text-xs text-surface-300">📞 {form.phone}</p>
                <p className="text-xs text-surface-300">📍 {form.address}, {form.pincode}</p>
              </div>

              {/* Items by shop */}
              {shopGroups.map((group) => {
                const shopTotal = group.items.reduce((s, i) => s + i.price * i.quantity, 0)
                return (
                  <div key={group.shop_id} className="rounded-xl border border-surface-700/40 bg-surface-800/20 overflow-hidden">
                    <div className="border-b border-surface-700/30 px-4 py-2.5 bg-surface-800/30">
                      <p className="text-xs font-semibold text-surface-300">🏪 {group.shop_name}</p>
                    </div>
                    <div className="px-4 py-2 space-y-2">
                      {group.items.map((item) => (
                        <div key={item.product_id} className="flex justify-between text-xs">
                          <span className="text-surface-300">{item.product_name} × {item.quantity} {item.unit_type}</span>
                          <span className="font-semibold text-white">₹{Math.round(item.price * item.quantity * 100) / 100}</span>
                        </div>
                      ))}
                      <div className="border-t border-surface-700/30 pt-2 flex justify-between">
                        <span className="text-xs font-semibold text-surface-400">Subtotal</span>
                        <span className="text-sm font-bold text-accent-400">₹{Math.round(shopTotal * 100) / 100}</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className="flex justify-between items-center border-t border-surface-700/40 pt-4">
                <span className="text-sm font-semibold text-surface-300">Grand Total</span>
                <span className="text-xl font-extrabold gradient-text-green">₹{totalPrice}</span>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-xs text-red-300">❌ {error}</div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-surface-700 py-3 text-sm font-medium text-surface-400 hover:bg-surface-800">
                  ← Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-accent-600 to-accent-500 py-3 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Placing Order...' : '✓ Place Order'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-500/15 text-4xl">
                🎉
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Order Placed Successfully!</h3>
                <p className="mt-1 text-sm text-surface-400">
                  {orderResult?.length > 1 ? `${orderResult.length} orders created` : 'Your order has been received'}
                </p>
              </div>
              {orderResult?.map((r, i) => (
                <div key={i} className="rounded-lg bg-surface-800/30 border border-surface-700/40 px-4 py-3 text-left">
                  <p className="text-xs text-surface-400">Order #{r.order?.id}</p>
                  <p className="text-sm font-semibold text-white">🏪 {r.order?.shop_name}</p>
                  <p className="text-xs text-accent-400 font-medium">₹{r.order?.total_price} • {r.order?.order_status}</p>
                </div>
              ))}
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 py-3 text-sm font-bold text-white transition-all hover:brightness-110"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
