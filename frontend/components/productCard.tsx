'use client'

import { Plus, Minus } from 'lucide-react'
import { useCart } from '@/context/cartContext'

interface Product {
  id: number
  name: string
  description: string
  price: number
  unit: 'pc' | 'gms'
  unitValue: number
  image?: string
  category: string
}

interface ProductCardProps {
  product: Product
  onAddToCart: () => void
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart()
  
  const cartItem = cartItems.find(item => item.id === product.id)
  const quantity = cartItem?.quantity || 0
  const inCart = quantity > 0
  
  const unitLabel = product.unit === 'pc' 
    ? `per ${product.unitValue === 1 ? 'piece' : `${product.unitValue} pieces`}`
    : `per ${product.unitValue}g`
  
  const quantityLabel = product.unit === 'pc' 
    ? `for ${product.unitValue === 1 ? '1 piece' : `${product.unitValue} pieces`}`
    : `for ${product.unitValue}g`
  
  const handleAddToCart = () => {
    if (quantity === 0) {
      addToCart({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        unit: product.unit,
        unitValue: product.unitValue,
        image: product.image
      })
      onAddToCart()
    } else {
      updateQuantity(product.id, quantity + 1)
    }
  }
  
  const handleRemoveFromCart = () => {
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1)
    } else {
      removeFromCart(product.id)
    }
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
        
        {/* Description */}
        <p className="text-xs lg:text-sm text-gray-600 mb-2 lg:mb-3 line-clamp-2 leading-snug">
          {product.description}
        </p>

        {/* Quantity/Weight Label */}
        <div className="mb-2 lg:mb-3">
          <span className="text-xs lg:text-sm text-gray-500">
            {quantityLabel}
          </span>
        </div>

        {/* Price - Highlighted */}
        <div className="mb-3 lg:mb-4">
          <span className="text-base lg:text-xl font-bold text-gray-900">
            ₹{product.price}
          </span>
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
