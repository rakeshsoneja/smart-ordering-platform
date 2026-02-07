'use client'

import { useCart } from '@/context/cartContext'

interface CartProps {
  onClose: () => void
  onCheckout: () => void
}

export default function Cart({ onClose, onCheckout }: CartProps) {
  const { cartItems, removeFromCart, updateQuantity, getTotalAmount } = useCart()
  const totalAmount = getTotalAmount()

  return (
    <div className="fixed inset-0 bg-gray-50/80 backdrop-blur-sm z-30 flex items-start justify-center pt-16 sm:pt-20 p-4 sm:p-6 animate-fade-in overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mb-8 overflow-hidden flex flex-col animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-white px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Your Cart</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 sm:py-5 bg-white">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="text-6xl sm:text-7xl mb-4 animate-bounce">🛒</div>
              <p className="text-gray-500 text-lg sm:text-xl font-medium mb-6">Your cart is empty</p>
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-rose-500 to-orange-500 text-white px-8 py-3 rounded-xl hover:from-rose-600 hover:to-orange-600 active:scale-95 transition-all duration-300 touch-manipulation text-base sm:text-lg font-bold shadow-lg hover:shadow-xl"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3 sm:space-y-4 mb-6">
                {cartItems.map((item) => {
                  const price = Number(item?.price) || 0
                  const quantity = Number(item?.quantity) || 0
                  const itemTotal = price * quantity
                  const unitValue = item?.unitValue || 1
                  const unitLabel = item.unit === 'pc' 
                    ? `${unitValue} ${unitValue === 1 ? 'pc' : 'pcs'}`
                    : `${unitValue}g`
                  
                  // Display variant name if available, otherwise use legacy unit label
                  const displayLabel = item.variantName || unitLabel
                  
                  return (
                    <div
                      key={item.variantId ? `variant_${item.variantId}` : `product_${item.id}`}
                      className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4 border-b border-gray-200 last:border-b-0"
                    >
                      {/* Item Name with Unit/Variant - Left side, takes available space */}
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="font-semibold text-gray-800 text-base sm:text-lg leading-tight">
                          {item.name || 'Unknown Item'}
                          {displayLabel && ` (${displayLabel})`}
                        </h3>
                        {item.variantName && (
                          <p className="text-xs text-gray-600 mt-0.5">
                            ₹{price.toFixed(2)} per {item.variantName}
                          </p>
                        )}
                      </div>
                      
                      {/* Quantity Controls - Center */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, quantity - 1), item.variantId)}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 hover:bg-gray-300 active:bg-gray-400 flex items-center justify-center text-lg sm:text-xl font-bold touch-manipulation transition-all shadow-sm"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 sm:w-10 text-center font-semibold text-gray-800 text-base sm:text-lg">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, quantity + 1, item.variantId)}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 hover:bg-gray-300 active:bg-gray-400 flex items-center justify-center text-lg sm:text-xl font-bold touch-manipulation transition-all shadow-sm"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      
                      {/* Price - Right side */}
                      <div className="w-20 sm:w-24 text-right flex-shrink-0">
                        <p className="font-semibold text-gray-800 text-base sm:text-lg">
                          ₹ {itemTotal.toFixed(2)}
                        </p>
                      </div>
                      
                      {/* Delete Button - Far right */}
                      <button
                        onClick={() => removeFromCart(item.id, item.variantId)}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-100 hover:bg-red-200 active:bg-red-300 flex items-center justify-center text-red-600 touch-manipulation transition-all flex-shrink-0 ml-1"
                        aria-label="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Total Section */}
              <div className="border-t-2 border-gray-300 pt-4 sm:pt-5 mb-5 sm:mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl sm:text-2xl font-bold text-gray-800">Total:</span>
                  <span className="text-xl sm:text-2xl font-bold text-gray-800">
                    ₹ {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={onCheckout}
                className="w-full bg-gradient-to-r from-rose-400 to-pink-500 text-white py-4 sm:py-5 rounded-xl font-bold hover:from-rose-500 hover:to-pink-600 active:scale-95 transition-all duration-300 touch-manipulation text-base sm:text-lg shadow-lg hover:shadow-xl"
              >
                Proceed to Checkout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

