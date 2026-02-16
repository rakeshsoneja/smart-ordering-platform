'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'

interface CartItemProps {
  id: number
  name: string
  description?: string
  image?: string
  quantity: number
  price: number
  variantId?: number
  variantName?: string
  unit?: 'pc' | 'gms'
  unitValue?: number
  stockMessage?: string | null
  onQuantityChange: (id: number, newQuantity: number, variantId?: number) => Promise<boolean>
  onRemove: (id: number, variantId?: number) => void
}

export function CartItem({
  id,
  name,
  description,
  image,
  quantity,
  price,
  variantId,
  variantName,
  unit,
  unitValue,
  stockMessage,
  onQuantityChange,
  onRemove,
}: CartItemProps) {
  const itemTotal = price * quantity
  
  // Display variant name if available, otherwise use legacy unit label
  const unitLabel = unit === 'pc' 
    ? `${unitValue || 1} ${(unitValue || 1) === 1 ? 'pc' : 'pcs'}`
    : `${unitValue || 1}g`
  const displayLabel = variantName || (unit ? unitLabel : null)

  const handleDecrease = async () => {
    if (quantity > 1) {
      await onQuantityChange(id, quantity - 1, variantId)
    } else {
      onRemove(id, variantId)
    }
  }

  const handleIncrease = async () => {
    await onQuantityChange(id, quantity + 1, variantId)
  }

  return (
    <div>
      {/* Stock Availability Message - Show at top if exists */}
      {stockMessage && (
        <div className="px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg mb-2">
          <p className="text-xs sm:text-sm text-orange-800 leading-tight">
            {stockMessage}
          </p>
        </div>
      )}

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* First Row: Product Name, Qty Label, Price, Delete */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 mb-2">
          {/* Left Side: Product Name */}
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-800 font-semibold text-sm sm:text-base">
              {name}
            </h3>
          </div>

          {/* Right Side: Qty Label, Price, Delete */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Qty Label with quantity */}
            <span className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">
              Qty: {quantity}
            </span>

            {/* Price */}
            <div className="text-right min-w-[70px] sm:min-w-[80px]">
              <p className="text-gray-800 font-semibold text-sm sm:text-base whitespace-nowrap">
                ₹{itemTotal.toFixed(2)}
              </p>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => onRemove(id, variantId)}
              className="p-1 hover:bg-gray-50 rounded transition-colors flex-shrink-0"
              aria-label={`Remove ${name}`}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        {/* Second Row: Variant on left, Quantity selector on right */}
        <div className="flex justify-between items-center w-full">
          {/* Variant display - Left aligned */}
          {displayLabel ? (
            <div className="text-xs sm:text-sm text-gray-600">
              {displayLabel}
            </div>
          ) : (
            <div></div>
          )}
          
          {/* Quantity Controls - Right aligned */}
          <div className="flex items-center gap-1 bg-gray-50 rounded px-1.5 py-0.5">
            <button
              onClick={handleDecrease}
              className="w-6 h-6 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded transition-colors"
              aria-label={`Decrease quantity of ${name}`}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="min-w-[24px] text-center text-gray-800 text-xs sm:text-sm font-medium">
              {quantity}
            </span>
            <button
              onClick={handleIncrease}
              className="w-6 h-6 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded transition-colors"
              aria-label={`Increase quantity of ${name}`}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex items-center gap-4">
        {/* Product Thumbnail */}
        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#FFF8F0] to-[#FFE4C4] flex items-center justify-center flex-shrink-0 relative overflow-hidden">
          {image && (image.startsWith('http://') || image.startsWith('https://')) ? (
            <img
              src={image}
              alt={name}
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
          <span className={`text-3xl fallback-emoji ${image && (image.startsWith('http://') || image.startsWith('https://')) ? 'hidden' : 'flex'}`}>
            {image && !image.startsWith('http') ? image : '🍬'}
          </span>
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 font-bold text-base mb-1">
            {name}
            {displayLabel && (
              <span className="text-gray-500 font-normal"> ({displayLabel})</span>
            )}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-1">
              {description}
            </p>
          )}
          {/* Quantity Stepper */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-50 rounded px-2 py-1">
              <button
                onClick={handleDecrease}
                className="w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-white rounded transition-colors"
                aria-label={`Decrease quantity of ${name}`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="min-w-[28px] text-center text-gray-900 text-sm font-semibold">
                {quantity}
              </span>
              <button
                onClick={handleIncrease}
                className="w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-white rounded transition-colors"
                aria-label={`Increase quantity of ${name}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="text-right min-w-[100px]">
          <p className="text-gray-900 font-bold text-lg whitespace-nowrap">
            ₹{itemTotal.toFixed(2)}
          </p>
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onRemove(id, variantId)}
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors flex-shrink-0"
          aria-label={`Remove ${name}`}
        >
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
      </div>
    </div>
  )
}

