'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import axiosInstance from '@/lib/axiosConfig'

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

interface StockAvailabilityMessage {
  productId: number
  variantId?: number
  message: string
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
    variantWeightGrams?: number
  }) => Promise<boolean>
  removeFromCart: (productId: number, variantId?: number) => void
  updateQuantity: (productId: number, quantity: number, variantId?: number) => Promise<boolean>
  clearCart: () => void
  getTotalAmount: () => number
  showCartModal: boolean
  setShowCartModal: (show: boolean) => void
  stockAvailabilityMessage: StockAvailabilityMessage | null
  clearStockMessage: (productId: number, variantId?: number) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Helper function to convert grams to readable format
const formatGramsToReadable = (grams: number): string => {
  if (grams >= 1000) {
    const kg = grams / 1000
    // If it's a whole number, show without decimals
    if (kg % 1 === 0) {
      return `${kg} kg`
    }
    // Otherwise show up to 2 decimal places, but remove trailing zeros
    const formatted = kg.toFixed(2)
    return `${formatted.replace(/\.?0+$/, '')} kg`
  }
  return `${grams} g`
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showCartModal, setShowCartModal] = useState(false)
  const [stockAvailabilityMessage, setStockAvailabilityMessage] = useState<StockAvailabilityMessage | null>(null)

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

  const addToCart = async (product: { 
    id: number
    variantId?: number
    variantName?: string
    name: string
    description?: string
    price: number
    unit?: 'pc' | 'gms'
    unitValue?: number
    image?: string
    variantWeightGrams?: number
  }): Promise<boolean> => {
    try {
      // Check if item already exists in cart to determine new quantity
      // Cart item uniqueness: product_id + variant_id (not just product_id)
      const existingItem = cartItems.find(item => {
        if (product.variantId) {
          // For variant-based products: must match BOTH product_id AND variant_id
          return item.id === product.id && item.variantId === product.variantId
        }
        // For legacy products without variants: match product_id and no variant_id
        return item.id === product.id && !item.variantId
      })
      
      const newQuantity = existingItem ? existingItem.quantity + 1 : 1

      // Validate inventory before adding to cart
      // Send current cart items to calculate total requested grams across ALL variants
      try {
        // Prepare current cart items for validation (only items for the same product)
        const currentCartItemsForProduct = cartItems
          .filter(item => item.id === product.id)
          .map(item => ({
            productId: item.id,
            variantId: item.variantId || null,
            quantity: item.quantity,
          }))

        const response = await axiosInstance.post('/api/cart/validate-inventory', {
          productId: product.id,
          variantId: product.variantId || null,
          quantity: newQuantity,
          currentCartItems: currentCartItemsForProduct, // Send current cart items for same product
        })

        if (!response.data.success || !response.data.available) {
          // Show user-friendly inline message instead of alert
          if (response.data.productName && response.data.availableQuantityGrams !== null) {
            const availableQuantity = formatGramsToReadable(response.data.availableQuantityGrams)
            const message = `${response.data.productName} is currently available only up to ${availableQuantity}.`
            setStockAvailabilityMessage({
              productId: product.id,
              variantId: product.variantId,
              message,
            })
          } else {
            // Fallback message if product name or quantity not available
            setStockAvailabilityMessage({
              productId: product.id,
              variantId: product.variantId,
              message: response.data.message || 'Requested quantity not available in stock',
            })
          }
          return false
        } else {
          // Clear message if validation succeeds
          clearStockMessage(product.id, product.variantId)
        }
      } catch (error: any) {
        // If validation fails, show error and don't add to cart
        const errorMessage = error.response?.data?.error || 'Failed to validate inventory'
        setStockAvailabilityMessage({
          productId: product.id,
          variantId: product.variantId,
          message: errorMessage,
        })
        return false
      }

      // Inventory validated, add to cart
      setCartItems(prevItems => {
        if (existingItem) {
          // Update quantity if item already exists - increment by 1 unit
          // Cart item uniqueness: product_id + variant_id (not just product_id)
          return prevItems.map(item => {
            const matches = product.variantId
              ? item.id === product.id && item.variantId === product.variantId
              : item.id === product.id && !item.variantId
            
            return matches
              ? { ...item, quantity: item.quantity + 1 }
              : item
          })
        } else {
          // Add new item with initial quantity of 1 unit
          // Different variant of same product is treated as separate cart item
          return [...prevItems, { ...product, quantity: 1 }]
        }
      })
      
      // Clear stock message after successful add to cart
      clearStockMessage(product.id, product.variantId)
      
      return true
    } catch (error) {
      console.error('Error adding to cart:', error)
      return false
    }
  }

  const removeFromCart = (productId: number, variantId?: number) => {
    setCartItems(prevItems => {
      // Cart item uniqueness: product_id + variant_id (not just product_id or variant_id)
      if (variantId) {
        // For variant-based products: must match BOTH product_id AND variant_id
        return prevItems.filter(item => !(item.id === productId && item.variantId === variantId))
      }
      // For legacy products without variants: match product_id and no variant_id
      return prevItems.filter(item => !(item.id === productId && !item.variantId))
    })
  }

  const updateQuantity = async (productId: number, quantity: number, variantId?: number): Promise<boolean> => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId)
      return true
    }

    // Find the item to get variantWeightGrams if needed
    // Cart item uniqueness: product_id + variant_id (not just product_id or variant_id)
    const item = cartItems.find(item => {
      if (variantId) {
        // For variant-based products: must match BOTH product_id AND variant_id
        return item.id === productId && item.variantId === variantId
      }
      // For legacy products without variants: match product_id and no variant_id
      return item.id === productId && !item.variantId
    })

    if (!item) {
      return false
    }

      // Validate inventory before updating quantity
      // Send current cart items to calculate total requested grams across ALL variants
      try {
        // Prepare current cart items for validation (only items for the same product)
        const currentCartItemsForProduct = cartItems
          .filter(item => item.id === productId)
          .map(item => ({
            productId: item.id,
            variantId: item.variantId || null,
            quantity: item.id === productId && item.variantId === variantId ? quantity : item.quantity, // Use new quantity for this item, existing for others
          }))

        const response = await axiosInstance.post('/api/cart/validate-inventory', {
          productId,
          variantId: variantId || null,
          quantity,
          currentCartItems: currentCartItemsForProduct, // Send current cart items for same product
        })

        if (!response.data.success || !response.data.available) {
          // Show user-friendly inline message instead of alert
          if (response.data.productName && response.data.availableQuantityGrams !== null) {
            const availableQuantity = formatGramsToReadable(response.data.availableQuantityGrams)
            const message = `${response.data.productName} is currently available only up to ${availableQuantity}.`
            setStockAvailabilityMessage({
              productId,
              variantId,
              message,
            })
          } else {
            // Fallback message if product name or quantity not available
            setStockAvailabilityMessage({
              productId,
              variantId,
              message: response.data.message || 'Requested quantity not available in stock',
            })
          }
          return false
        } else {
          // Clear message if validation succeeds
          clearStockMessage(productId, variantId)
        }
      } catch (error: any) {
        // If validation fails, show error and don't update quantity
        const errorMessage = error.response?.data?.error || 'Failed to validate inventory'
        setStockAvailabilityMessage({
          productId,
          variantId,
          message: errorMessage,
        })
        return false
      }

    // Inventory validated, update quantity
    // Cart item uniqueness: product_id + variant_id (not just product_id or variant_id)
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (variantId) {
          // For variant-based products: must match BOTH product_id AND variant_id
          return item.id === productId && item.variantId === variantId ? { ...item, quantity } : item
        }
        // For legacy products without variants: match product_id and no variant_id
        return item.id === productId && !item.variantId ? { ...item, quantity } : item
      })
    )
    
    // Clear stock message after successful quantity update
    clearStockMessage(productId, variantId)
    
    return true
  }

  const clearCart = () => {
    setCartItems([])
    setStockAvailabilityMessage(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart')
    }
  }

  const clearStockMessage = (productId: number, variantId?: number) => {
    setStockAvailabilityMessage(prev => {
      if (!prev) return null
      // Clear message if it matches the product/variant
      if (prev.productId === productId && prev.variantId === variantId) {
        return null
      }
      return prev
    })
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
        stockAvailabilityMessage,
        clearStockMessage,
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


