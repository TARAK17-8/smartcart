import { useCart } from '../hooks/useCart'
import { useState } from 'react'
import CheckoutModal from './CheckoutModal'

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, clearCart, totalPrice, totalItems } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)

  if (!isOpen && !showCheckout) return null

  // Group items by shop
  const groupedByShop = items.reduce((acc, item) => {
    const key = item.shop_id
    if (!acc[key]) acc[key] = { shop_name: item.shop_name, shop_id: item.shop_id, items: [] }
    acc[key].items.push(item)
    return acc
  }, {})

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        </div>
      )}

      {/* Drawer */}
      {isOpen && (
        <div className="fixed top-0 right-0 z-[70] flex h-full w-full max-w-md flex-col border-l border-surface-700 bg-surface-900 shadow-2xl animate-slide-in-right">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-700/50 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">🛒</span>
              <div>
                <h2 className="text-base font-bold text-white">Your Cart</h2>
                <p className="text-[11px] text-surface-400">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-red-400 hover:bg-red-500/10"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-800 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="text-4xl mb-3">🛒</span>
                <p className="text-sm font-medium text-surface-400">Your cart is empty</p>
                <p className="text-xs text-surface-500 mt-1">Search for products and add them from local shops</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.values(groupedByShop).map((group) => (
                  <div key={group.shop_id} className="glass-card overflow-hidden">
                    <div className="border-b border-surface-700/40 bg-surface-800/30 px-4 py-2.5">
                      <p className="text-xs font-semibold text-surface-300">🏪 {group.shop_name}</p>
                    </div>
                    <div className="divide-y divide-surface-800/40">
                      {group.items.map((item) => (
                        <div key={`${item.product_id}-${item.shop_id}`} className="flex items-center gap-3 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate">{item.product_name}</p>
                            <p className="text-xs text-surface-400">
                              ₹{item.price}/{item.unit_type} × {item.quantity}
                            </p>
                          </div>

                          {/* Quantity controls */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.product_id, item.shop_id, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-800 text-xs font-bold text-surface-300 hover:bg-surface-700"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product_id, item.shop_id, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-800 text-xs font-bold text-surface-300 hover:bg-surface-700"
                            >
                              +
                            </button>
                          </div>

                          {/* Price */}
                          <p className="w-16 text-right text-sm font-bold text-accent-400">
                            ₹{Math.round(item.price * item.quantity * 100) / 100}
                          </p>

                          {/* Remove */}
                          <button
                            onClick={() => removeItem(item.product_id, item.shop_id)}
                            className="text-xs text-surface-600 hover:text-red-400"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-surface-700/50 px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-surface-400">Total</span>
                <span className="text-xl font-extrabold gradient-text-green">₹{totalPrice}</span>
              </div>
              <button
                onClick={() => { setIsOpen(false); setShowCheckout(true) }}
                className="w-full rounded-xl bg-gradient-to-r from-accent-600 to-accent-500 py-3 text-sm font-bold text-white shadow-lg shadow-accent-500/20 transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Proceed to Checkout →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal onClose={() => setShowCheckout(false)} />
      )}
    </>
  )
}
