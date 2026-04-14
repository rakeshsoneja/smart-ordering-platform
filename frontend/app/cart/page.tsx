'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/cartContext'
import { CartItem } from '@/components/cart-item'
import { type CSSProperties } from 'react'
import { getAppTheme } from '@/lib/theme'

export default function CartPage() {
  const router = useRouter()
  const { cartItems, removeFromCart, updateQuantity, getTotalAmount, stockAvailabilityMessage } = useCart()
  const totalAmount = getTotalAmount()
  const appTheme = getAppTheme()
  const ctaVars = {
    '--cta-bg': appTheme.primary,
    '--cta-bg-hover': appTheme.primaryHover,
    '--cta-grad-from': appTheme.gradientFrom,
    '--cta-grad-to': appTheme.gradientTo,
    '--page-soft-bg': appTheme.softBackground,
  } as CSSProperties

  const handleCheckout = () => {
    router.push('/checkout')
  }

  const handleQuantityChange = async (id: number, newQuantity: number, variantId?: number): Promise<boolean> => {
    return await updateQuantity(id, newQuantity, variantId)
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--page-soft-bg)]" style={ctaVars}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-3xl">
          <h1 className="mb-4 sm:mb-6 text-gray-800 text-xl sm:text-2xl md:text-3xl font-bold">Shopping Cart</h1>
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-gray-600 mb-6">Your cart is empty</p>
            <Link 
              href="/" 
              style={ctaVars}
              className="inline-block bg-gradient-to-r from-[var(--cta-grad-from)] to-[var(--cta-grad-to)] text-white px-8 py-3 rounded-full hover:shadow-xl transition-all duration-300 font-bold shadow-lg"
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
                style={ctaVars}
                className="w-full px-4 py-3 lg:py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold text-sm sm:text-base bg-[var(--cta-bg)] text-white hover:bg-[var(--cta-bg-hover)] shadow-md hover:shadow-lg active:scale-[0.98]"
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

