'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus } from 'lucide-react'
import { useCart } from '@/context/cartContext'

interface Variant {
  variantId: number
  variantName: string
  variantWeightGrams?: number
  variantPrice: number
  isDefaultVariant: boolean
  isActive: boolean
}

interface Product {
  id: number
  name: string
  description: string
  price: number // Legacy: single price (for backward compatibility)
  unit?: 'pc' | 'gms' // Legacy
  unitValue?: number // Legacy
  variants?: Variant[] // NEW: variants array
  image?: string
  category: string
  availableQuantityGrams?: number | null // Product-level inventory (shared across variants)
  isOutOfStock?: boolean // Product-level out of stock status
}

interface ProductCardProps {
  product: Product
  onAddToCart: () => void
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { cartItems, addToCart, updateQuantity, removeFromCart, stockAvailabilityMessage, clearStockMessage } = useCart()
  
  // Determine if product uses variants
  const availableVariants = (product.variants || []).filter(v => v.isActive)
  const hasVariants = availableVariants.length > 0

  // Get default variant or first variant
  const defaultVariant = hasVariants
    ? availableVariants.find(v => v.isDefaultVariant) || availableVariants[0]
    : null

  // State for selected variant
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    defaultVariant?.variantId || null
  )

  // Check if product is out of stock (product-level inventory, shared across variants)
  const isOutOfStock = product.isOutOfStock === true
  const availableQuantityGrams = product.availableQuantityGrams ?? null

  // Get selected variant (from state)
  const selectedVariant = hasVariants && selectedVariantId
    ? availableVariants.find(v => v.variantId === selectedVariantId)
    : null

  // Check if a variant can be ordered (has enough inventory for at least 1 unit)
  const isVariantAvailable = (variant: Variant): boolean => {
    if (isOutOfStock || availableQuantityGrams === null) {
      // If product is out of stock or no inventory record, treat as available (backward compatibility)
      return !isOutOfStock
    }
    
    if (!variant.variantWeightGrams) {
      // Variant without weight - treat as available
      return true
    }
    
    // Check if variant weight (for 1 unit) is <= available inventory
    // Minimum order is 1 unit, so we check: variantWeightGrams × 1 <= availableQuantityGrams
    return variant.variantWeightGrams <= availableQuantityGrams
  }

  // Filter available variants (variants that can be ordered)
  const orderableVariants = availableVariants.filter(v => isVariantAvailable(v))

  // If selected variant is not available, switch to first available variant or null
  const getAvailableVariantId = (): number | null => {
    if (!hasVariants) return null
    
    // If current selection is available, keep it
    if (selectedVariantId && selectedVariant && isVariantAvailable(selectedVariant)) {
      return selectedVariantId
    }
    
    // Otherwise, find first available variant
    const firstAvailable = orderableVariants[0]
    return firstAvailable?.variantId || null
  }

  // Update selected variant if current one is not available
  const effectiveSelectedVariantId = hasVariants ? getAvailableVariantId() : null
  const effectiveSelectedVariant = hasVariants && effectiveSelectedVariantId
    ? availableVariants.find(v => v.variantId === effectiveSelectedVariantId)
    : null

  // Get current price (from selected variant or legacy price)
  const currentPrice = effectiveSelectedVariant
    ? effectiveSelectedVariant.variantPrice
    : (product.price || 0)

  // Find cart item (check by product_id + variant_id, not just variant_id)
  // Cart item uniqueness: product_id + variant_id (not just product_id or variant_id)
  const cartItem = hasVariants && effectiveSelectedVariantId
    ? cartItems.find(item => item.id === product.id && item.variantId === effectiveSelectedVariantId)
    : cartItems.find(item => item.id === product.id && !item.variantId)
  
  const quantity = cartItem?.quantity || 0
  const inCart = quantity > 0

  // Check if currently selected variant is available
  const isSelectedVariantAvailable = effectiveSelectedVariant 
    ? isVariantAvailable(effectiveSelectedVariant)
    : true

  // Sync selectedVariantId state when current selection becomes unavailable
  useEffect(() => {
    if (hasVariants && selectedVariantId) {
      const currentVariant = availableVariants.find(v => v.variantId === selectedVariantId)
      if (currentVariant && !isVariantAvailable(currentVariant)) {
        // Current selection is unavailable, switch to first available
        const firstAvailable = orderableVariants[0]
        if (firstAvailable) {
          setSelectedVariantId(firstAvailable.variantId)
        }
      }
    }
  }, [hasVariants, selectedVariantId, availableQuantityGrams, isOutOfStock])

  // Check if stock message applies to this product/variant
  const relevantStockMessage = stockAvailabilityMessage && 
    stockAvailabilityMessage.productId === product.id &&
    (hasVariants 
      ? stockAvailabilityMessage.variantId === effectiveSelectedVariantId
      : !stockAvailabilityMessage.variantId)
    ? stockAvailabilityMessage.message
    : null

  // Clear message when variant changes to an available one
  useEffect(() => {
    if (relevantStockMessage && isSelectedVariantAvailable && !isOutOfStock) {
      clearStockMessage(product.id, effectiveSelectedVariantId || undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSelectedVariantId, isSelectedVariantAvailable, isOutOfStock])
  
  // Legacy unit label (for backward compatibility)
  const unitLabel = !hasVariants && product.unit
    ? product.unit === 'pc' 
      ? `per ${product.unitValue === 1 ? 'piece' : `${product.unitValue} pieces`}`
      : `per ${product.unitValue}g`
    : ''

  const handleAddToCart = async () => {
    if (hasVariants && effectiveSelectedVariantId && effectiveSelectedVariant) {
      // Variant-based product
      if (quantity === 0) {
        const success = await addToCart({
          id: product.id,
          variantId: effectiveSelectedVariantId,
          variantName: effectiveSelectedVariant.variantName,
          name: product.name,
          description: product.description,
          price: effectiveSelectedVariant.variantPrice,
          image: product.image,
          variantWeightGrams: effectiveSelectedVariant.variantWeightGrams
        })
        if (success) {
          onAddToCart()
        }
      } else {
        await updateQuantity(product.id, quantity + 1, effectiveSelectedVariantId)
      }
    } else {
      // Legacy product (no variants)
      if (quantity === 0) {
        const success = await addToCart({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price || 0,
          unit: product.unit,
          unitValue: product.unitValue,
          image: product.image
        })
        if (success) {
          onAddToCart()
        }
      } else {
        await updateQuantity(product.id, quantity + 1)
      }
    }
  }
  
  const handleRemoveFromCart = () => {
    if (quantity > 1) {
      if (hasVariants && effectiveSelectedVariantId) {
        updateQuantity(product.id, quantity - 1, effectiveSelectedVariantId)
      } else {
        updateQuantity(product.id, quantity - 1)
      }
    } else {
      if (hasVariants && effectiveSelectedVariantId) {
        removeFromCart(product.id, effectiveSelectedVariantId)
      } else {
        removeFromCart(product.id)
      }
    }
  }

  // Handle variant selection change
  const handleVariantChange = (variantId: number) => {
    // Check if the selected variant is available
    const variant = availableVariants.find(v => v.variantId === variantId)
    if (!variant || !isVariantAvailable(variant)) {
      // Don't allow selection of unavailable variants
      return
    }
    
    // Just change the selected variant for adding to cart
    // Do NOT remove existing cart items - multiple variants can coexist in cart
    // The variant dropdown only controls which variant to add, not which variants are in cart
    setSelectedVariantId(variantId)
  }

  return (
    <div
      className={`bg-white rounded-lg lg:rounded-xl shadow-sm transition-all duration-200 overflow-hidden flex flex-col border border-gray-100 ${
        isOutOfStock ? 'opacity-70' : 'hover:shadow-md lg:hover:shadow-lg'
      }`}
    >
      {/* Product Image - Larger on Desktop */}
      <div className="w-full h-32 lg:h-64 bg-gradient-to-br from-[#FFF8F0] to-[#FFE4C4] flex items-center justify-center relative overflow-hidden">
        {product.image && (product.image.startsWith('http://') || product.image.startsWith('https://')) ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to emoji if image fails to load
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                const fallback = parent.querySelector('.fallback-emoji') as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }
            }}
          />
        ) : null}
        <span className={`text-5xl lg:text-7xl fallback-emoji ${product.image && (product.image.startsWith('http://') || product.image.startsWith('https://')) ? 'hidden' : 'flex'}`}>
          {product.image && !product.image.startsWith('http') ? product.image : '🍬'}
        </span>
        
        {/* Out of Stock Overlay - modern ecommerce style */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/55 backdrop-blur-sm pointer-events-none transition-all duration-200">
            <span className="px-4 py-2 rounded-full bg-black/60 text-white text-xs lg:text-sm font-semibold tracking-[0.18em] uppercase shadow-md">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="px-3 py-3 lg:px-4 lg:py-4 flex-1 flex flex-col">
        {/* Product Name */}
        <h3 className="mb-1 lg:mb-2 text-gray-900 text-sm lg:text-lg font-bold leading-tight">
          {product.name}
        </h3>
        
        {/* Description - Fixed height to ensure consistent alignment across cards */}
        <div className="mb-2 lg:mb-3 min-h-[2.5rem] lg:min-h-[2.75rem]">
          <p className="text-xs lg:text-sm text-gray-600 line-clamp-2 leading-snug">
            {product.description}
          </p>
        </div>

        {/* Variant/Unit Selection and Price */}
        <div className="mb-3 lg:mb-4">
          {/* Variant-price-container: Vertical flex layout */}
          <div className="flex flex-col items-start gap-1">
            {/* Variant-container: Variant Dropdown or Unit Label */}
            <div>
              {hasVariants && availableVariants.length > 1 ? (
                <select
                  value={effectiveSelectedVariantId || ''}
                  onChange={(e) => handleVariantChange(Number(e.target.value))}
                  disabled={isOutOfStock || orderableVariants.length === 0}
                  className={`text-xs lg:text-sm text-gray-700 border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent w-auto ${
                    isOutOfStock || orderableVariants.length === 0
                      ? 'cursor-not-allowed opacity-50 bg-gray-100' 
                      : 'cursor-pointer'
                  }`}
                >
                  {availableVariants.map((variant) => {
                    const isAvailable = isVariantAvailable(variant)
                    return (
                      <option 
                        key={variant.variantId} 
                        value={variant.variantId}
                        disabled={!isAvailable}
                        className={!isAvailable ? 'text-gray-400 bg-gray-100' : ''}
                      >
                        {variant.variantName}{!isAvailable ? ' (Out of Stock)' : ''}
                      </option>
                    )
                  })}
                </select>
              ) : hasVariants && availableVariants.length === 1 && effectiveSelectedVariant ? (
                <span className={`text-xs lg:text-sm ${isOutOfStock || !isSelectedVariantAvailable ? 'text-gray-400' : 'text-gray-500'}`}>
                  {effectiveSelectedVariant.variantName}
                  {!isSelectedVariantAvailable && ' (Out of Stock)'}
                </span>
              ) : unitLabel ? (
                <span className={`text-xs lg:text-sm ${isOutOfStock ? 'text-gray-400' : 'text-gray-500'}`}>
                  {unitLabel}
                </span>
              ) : null}
            </div>
            {/* Price-container: Price display */}
            <div>
              <span className="text-base lg:text-xl font-bold text-gray-900">
                ₹{currentPrice.toFixed(2)}
              </span>
            </div>
          </div>
          {hasVariants && quantity > 0 && effectiveSelectedVariant && (
            <div className="text-xs text-gray-600 mt-1">
              {quantity} × {effectiveSelectedVariant.variantName} = ₹{(currentPrice * quantity).toFixed(2)}
            </div>
          )}
        </div>

        {/* Add to Cart / Quantity Stepper - Full Width, Aligned at Bottom */}
        <div className="mt-auto space-y-2">
          {!inCart ? (
            <>
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || (hasVariants && !isSelectedVariantAvailable)}
                className={`w-full px-3 py-2.5 lg:py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 lg:gap-2 font-medium text-xs lg:text-sm shadow-sm ${
                  isOutOfStock || (hasVariants && !isSelectedVariantAvailable)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-900 hover:bg-gray-800 text-white hover:shadow'
                }`}
              >
                <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span>Add to Cart</span>
              </button>
              {/* Stock Availability Message */}
              {relevantStockMessage && (
                <div className="px-2 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs lg:text-sm text-orange-800 leading-tight">
                    {relevantStockMessage}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-lg px-2 py-2">
                <button
                  onClick={handleRemoveFromCart}
                  className="w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center text-gray-700 hover:bg-white rounded transition-colors flex-shrink-0"
                >
                  <Minus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </button>
                <span className="min-w-[20px] lg:min-w-[24px] text-center text-gray-900 text-sm lg:text-base font-semibold">
                  {quantity}
                </span>
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || (hasVariants && !isSelectedVariantAvailable)}
                  className={`w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center rounded transition-colors flex-shrink-0 ${
                    isOutOfStock || (hasVariants && !isSelectedVariantAvailable)
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </button>
              </div>
              {/* Stock Availability Message */}
              {relevantStockMessage && (
                <div className="px-2 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs lg:text-sm text-orange-800 leading-tight">
                    {relevantStockMessage}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
