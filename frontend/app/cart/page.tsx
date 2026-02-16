'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/cartContext'
import { CartItem } from '@/components/cart-item'

export default function CartPage() {
  const router = useRouter()
  const { cartItems, removeFromCart, updateQuantity, getTotalAmount, stockAvailabilityMessage } = useCart()
  const totalAmount = getTotalAmount()

  const handleCheckout = () => {
    router.push('/checkout')
  }

  const handleQuantityChange = async (id: number, newQuantity: number, variantId?: number) => {
    await updateQuantity(id, newQuantity, variantId)
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFF7F3]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-3xl">
          <h1 className="mb-4 sm:mb-6 text-gray-800 text-xl sm:text-2xl md:text-3xl font-bold">Shopping Cart</h1>
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-gray-600 mb-6">Your cart is empty</p>
            <Link 
              href="/" 
              className="inline-block bg-gradient-to-r from-[#FF6A3D] to-[#FF3D68] text-white px-8 py-3 rounded-full hover:shadow-xl hover:shadow-[#FF6A3D]/30 transition-all duration-300 font-bold shadow-lg"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl lg:max-w-7xl mx-auto">
        <h1 className="mb-4 sm:mb-6 lg:mb-8 text-gray-800 text-xl sm:text-2xl md:text-3xl font-bold">Shopping Cart</h1>

        {/* Desktop: Two-column layout, Mobile: Single column */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left Column: Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 lg:mb-0">
              {cartItems.map((item, index) => {
                // Check if stock message applies to this item
                const itemStockMessage = stockAvailabilityMessage && 
                  stockAvailabilityMessage.productId === item.id &&
                  stockAvailabilityMessage.variantId === item.variantId
                  ? stockAvailabilityMessage.message
                  : null

                return (
                  <div key={item.variantId ? `product_${item.id}_variant_${item.variantId}` : `product_${item.id}_no_variant`} className={index < cartItems.length - 1 ? 'border-b border-gray-200 pb-3 mb-3 lg:pb-4 lg:mb-4' : ''}>
                    <CartItem
                      id={item.id}
                      name={item.name}
                      description={item.description}
                      image={item.image}
                      quantity={item.quantity}
                      price={item.price}
                      variantId={item.variantId}
                      variantName={item.variantName}
                      unit={item.unit}
                      unitValue={item.unitValue}
                      stockMessage={itemStockMessage}
                      onQuantityChange={handleQuantityChange}
                      onRemove={removeFromCart}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Order Summary (Sticky on Desktop) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 md:p-6 lg:sticky lg:top-20">
              <div className="flex items-center justify-between mb-3 md:mb-4 text-sm sm:text-base">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-800 font-medium">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6 lg:mb-8">
                <span className="text-gray-800 text-lg sm:text-xl md:text-2xl font-bold">Total</span>
                <span className="text-gray-800 text-xl sm:text-2xl md:text-3xl font-bold">₹{totalAmount.toFixed(2)}</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 px-6 rounded-lg font-medium text-base sm:text-lg transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

