'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'

interface CartItemProps {
  id: number
  name: string
  description?: string
  image?: string
  quantity: number
  price: number
  onQuantityChange: (id: number, newQuantity: number) => void
  onRemove: (id: number) => void
}

export function CartItem({
  id,
  name,
  description,
  image,
  quantity,
  price,
  onQuantityChange,
  onRemove,
}: CartItemProps) {
  const itemTotal = price * quantity

  const handleDecrease = () => {
    if (quantity > 1) {
      onQuantityChange(id, quantity - 1)
    } else {
      onRemove(id)
    }
  }

  const handleIncrease = () => {
    onQuantityChange(id, quantity + 1)
  }

  return (
    <div>
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
              onClick={() => onRemove(id)}
              className="p-1 hover:bg-gray-50 rounded transition-colors flex-shrink-0"
              aria-label={`Remove ${name}`}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        {/* Second Row: Quantity Controls */}
        <div className="flex items-center justify-start">
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
        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#FFF8F0] to-[#FFE4C4] flex items-center justify-center flex-shrink-0">
          <span className="text-3xl">{image || '🍬'}</span>
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 font-bold text-base mb-1">
            {name}
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
          onClick={() => onRemove(id)}
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors flex-shrink-0"
          aria-label={`Remove ${name}`}
        >
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
      </div>
    </div>
  )
}

