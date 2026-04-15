import { useState, useCallback, createContext, useContext } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  const addItem = useCallback((item) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.product_id === item.product_id && i.shop_id === item.shop_id
      )
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.product_id && i.shop_id === item.shop_id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }]
    })
    setIsOpen(true)
  }, [])

  const updateQuantity = useCallback((product_id, shop_id, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => !(i.product_id === product_id && i.shop_id === shop_id)))
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.product_id === product_id && i.shop_id === shop_id ? { ...i, quantity } : i
        )
      )
    }
  }, [])

  const removeItem = useCallback((product_id, shop_id) => {
    setItems((prev) => prev.filter((i) => !(i.product_id === product_id && i.shop_id === shop_id)))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setIsOpen(false)
  }, [])

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items, isOpen, setIsOpen,
        addItem, updateQuantity, removeItem, clearCart,
        totalPrice: Math.round(totalPrice * 100) / 100,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
