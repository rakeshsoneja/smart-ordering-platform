'use client'

import { useState } from 'react'
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
}

interface ProductCardProps {
  product: Product
  onAddToCart: () => void
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart()
  
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

  // Get selected variant
  const selectedVariant = hasVariants && selectedVariantId
    ? availableVariants.find(v => v.variantId === selectedVariantId)
    : null

  // Get current price (from selected variant or legacy price)
  const currentPrice = selectedVariant
    ? selectedVariant.variantPrice
    : (product.price || 0)

  // Find cart item (check by variantId if using variants, else by product id)
  const cartItem = hasVariants && selectedVariantId
    ? cartItems.find(item => item.variantId === selectedVariantId)
    : cartItems.find(item => item.id === product.id && !item.variantId)
  
  const quantity = cartItem?.quantity || 0
  const inCart = quantity > 0
  
  // Legacy unit label (for backward compatibility)
  const unitLabel = !hasVariants && product.unit
    ? product.unit === 'pc' 
      ? `per ${product.unitValue === 1 ? 'piece' : `${product.unitValue} pieces`}`
      : `per ${product.unitValue}g`
    : ''

  const handleAddToCart = () => {
    if (hasVariants && selectedVariantId && selectedVariant) {
      // Variant-based product
      if (quantity === 0) {
        addToCart({
          id: product.id,
          variantId: selectedVariantId,
          variantName: selectedVariant.variantName,
          name: product.name,
          description: product.description,
          price: selectedVariant.variantPrice,
          image: product.image
        })
        onAddToCart()
      } else {
        updateQuantity(product.id, quantity + 1, selectedVariantId)
      }
    } else {
      // Legacy product (no variants)
      if (quantity === 0) {
        addToCart({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price || 0,
          unit: product.unit,
          unitValue: product.unitValue,
          image: product.image
        })
        onAddToCart()
      } else {
        updateQuantity(product.id, quantity + 1)
      }
    }
  }
  
  const handleRemoveFromCart = () => {
    if (quantity > 1) {
      if (hasVariants && selectedVariantId) {
        updateQuantity(product.id, quantity - 1, selectedVariantId)
      } else {
        updateQuantity(product.id, quantity - 1)
      }
    } else {
      if (hasVariants && selectedVariantId) {
        removeFromCart(product.id, selectedVariantId)
      } else {
        removeFromCart(product.id)
      }
    }
  }

  // Handle variant selection change
  const handleVariantChange = (variantId: number) => {
    // If there's an item in cart with different variant, remove it first
    if (cartItem && cartItem.variantId !== variantId) {
      removeFromCart(product.id, cartItem.variantId)
    }
    setSelectedVariantId(variantId)
  }

  return (
    <div
      className="bg-white rounded-lg lg:rounded-xl shadow-sm hover:shadow-md lg:hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col border border-gray-100"
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
                  value={selectedVariantId || ''}
                  onChange={(e) => handleVariantChange(Number(e.target.value))}
                  className="text-xs lg:text-sm text-gray-700 border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent cursor-pointer w-auto"
                >
                  {availableVariants.map((variant) => (
                    <option key={variant.variantId} value={variant.variantId}>
                      {variant.variantName}
                    </option>
                  ))}
                </select>
              ) : hasVariants && availableVariants.length === 1 && selectedVariant ? (
                <span className="text-xs lg:text-sm text-gray-500">
                  {selectedVariant.variantName}
                </span>
              ) : unitLabel ? (
                <span className="text-xs lg:text-sm text-gray-500">
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
          {hasVariants && quantity > 0 && selectedVariant && (
            <div className="text-xs text-gray-600 mt-1">
              {quantity} × {selectedVariant.variantName} = ₹{(currentPrice * quantity).toFixed(2)}
            </div>
          )}
        </div>

        {/* Add to Cart / Quantity Stepper - Full Width, Aligned at Bottom */}
        <div className="mt-auto">
          {!inCart ? (
            <button
              onClick={handleAddToCart}
              className="w-full px-3 py-2.5 lg:py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 lg:gap-2 font-medium text-xs lg:text-sm shadow-sm hover:shadow"
            >
              <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              <span>Add to Cart</span>
            </button>
          ) : (
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
                className="w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center text-gray-700 hover:bg-white rounded transition-colors flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
