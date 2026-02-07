'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface CartItem {
  id: number // product_id (for backward compatibility)
  variantId?: number // NEW: variant ID if using variants
  variantName?: string // NEW: variant name (e.g., "250g", "500g")
  name: string
  description?: string
  price: number // Price for selected variant or legacy price
  unit?: 'pc' | 'gms' // Legacy field (for backward compatibility)
  unitValue?: number // Legacy field (for backward compatibility)
  quantity: number // Number of units
  image?: string
}

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (product: { 
    id: number
    variantId?: number
    variantName?: string
    name: string
    description?: string
    price: number
    unit?: 'pc' | 'gms'
    unitValue?: number
    image?: string
  }) => void
  removeFromCart: (productId: number, variantId?: number) => void
  updateQuantity: (productId: number, quantity: number, variantId?: number) => void
  clearCart: () => void
  getTotalAmount: () => number
  showCartModal: boolean
  setShowCartModal: (show: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showCartModal, setShowCartModal] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart))
        } catch (error) {
          console.error('Error loading cart from localStorage:', error)
        }
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(cartItems))
    }
  }, [cartItems])

  const addToCart = (product: { 
    id: number
    variantId?: number
    variantName?: string
    name: string
    description?: string
    price: number
    unit?: 'pc' | 'gms'
    unitValue?: number
    image?: string
  }) => {
    setCartItems(prevItems => {
      // For variant-based products, use variantId as unique key
      // For legacy products, use product id
      const existingItem = prevItems.find(item => {
        if (product.variantId) {
          return item.variantId === product.variantId
        }
        return item.id === product.id && !item.variantId
      })
      
      if (existingItem) {
        // Update quantity if item already exists - increment by 1 unit
        return prevItems.map(item => {
          const matches = product.variantId
            ? item.variantId === product.variantId
            : item.id === product.id && !item.variantId
          
          return matches
            ? { ...item, quantity: item.quantity + 1 }
            : item
        })
      } else {
        // Add new item with initial quantity of 1 unit
        return [...prevItems, { ...product, quantity: 1 }]
      }
    })
  }

  const removeFromCart = (productId: number, variantId?: number) => {
    setCartItems(prevItems => {
      if (variantId) {
        return prevItems.filter(item => item.variantId !== variantId)
      }
      return prevItems.filter(item => item.id !== productId && !item.variantId)
    })
  }

  const updateQuantity = (productId: number, quantity: number, variantId?: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId)
      return
    }

    setCartItems(prevItems =>
      prevItems.map(item => {
        if (variantId) {
          return item.variantId === variantId ? { ...item, quantity } : item
        }
        return item.id === productId && !item.variantId ? { ...item, quantity } : item
      })
    )
  }

  const clearCart = () => {
    setCartItems([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart')
    }
  }

  const getTotalAmount = () => {
    // Total = price × quantity (quantity is number of units)
    const total = cartItems.reduce((sum, item) => {
      return sum + item.price * item.quantity
    }, 0)
    return Math.round(total)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalAmount,
        showCartModal,
        setShowCartModal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}


