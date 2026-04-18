'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/cartContext'
import { buildStoredDeliveryAddress } from '@/lib/deliveryAddressFormat'
import { getAppTheme } from '@/lib/theme'
import { indianStates, getStateByCode } from '@/constants/states'
import { SearchableSelect } from '@/components/SearchableSelect'

export default function CheckoutPage() {
  const router = useRouter()
  const { cartItems, getTotalAmount } = useCart()
  const [paymentMode, setPaymentMode] = useState<'razorpay' | 'cod'>('cod')
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    customerPhone: '',
    email: '',
    deliveryAddress: '',
    city: '',
    pincode: '',
    state: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const appTheme = getAppTheme()
  const ctaVars = {
    '--cta-bg': appTheme.primary,
    '--cta-bg-hover': appTheme.primaryHover,
    '--cta-grad-from': appTheme.gradientFrom,
    '--cta-grad-to': appTheme.gradientTo,
    '--page-soft-bg': appTheme.softBackground,
  } as CSSProperties

  const itemTotal = getTotalAmount()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'WhatsApp number is required'
    } else if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(formData.customerPhone)) {
      newErrors.customerPhone = 'Invalid WhatsApp number format'
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required'
    } else if (formData.deliveryAddress.trim().length < 10) {
      newErrors.deliveryAddress = 'Address must be at least 10 characters'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    } else if (formData.city.trim().length < 2) {
      newErrors.city = 'City must be at least 2 characters'
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required'
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Enter a valid 6-digit Indian PIN code'
    }

    const selectedState = getStateByCode(formData.state)
    if (!selectedState) {
      newErrors.state = 'State is required'
    }

    if (
      !newErrors.deliveryAddress &&
      !newErrors.city &&
      !newErrors.pincode &&
      !newErrors.state &&
      formData.deliveryAddress.trim().length >= 10
    ) {
      const selectedStateForAddress = getStateByCode(formData.state)
      const deliveryAddressFull = buildStoredDeliveryAddress(
        formData.deliveryAddress.trim(),
        formData.city.trim(),
        formData.pincode.trim(),
        selectedStateForAddress?.name ?? ''
      )
      if (deliveryAddressFull.length > 500) {
        newErrors.deliveryAddress =
          'Address, city, pincode, and state together are too long (max 500 characters). Shorten the address text.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty')
      return
    }

    try {
      setLoading(true)
      const selectedState = getStateByCode(formData.state)
      const deliveryAddressFull = buildStoredDeliveryAddress(
        formData.deliveryAddress.trim(),
        formData.city.trim(),
        formData.pincode.trim(),
        selectedState?.name ?? ''
      )
      const reviewPayload = {
        cartItems,
        deliveryDetails: {
          customerName: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
          customerPhone: formData.customerPhone.trim(),
          email: formData.email.trim(),
          deliveryAddress: deliveryAddressFull,
          city: formData.city.trim(),
          pincode: formData.pincode.trim(),
          stateCode: selectedState?.code ?? null,
          stateName: selectedState?.name ?? null,
        },
        paymentMode: paymentMode,
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('orderReviewData', JSON.stringify(reviewPayload))
      }
      router.push('/order-review')
    } catch (error: any) {
      console.error('Failed to prepare review step:', error)
      alert('Unable to open order review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Redirect to home if cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some items to your cart to proceed with checkout</p>
          <button
            onClick={() => router.push('/')}
            style={ctaVars}
            className="bg-gradient-to-r from-[var(--cta-grad-from)] to-[var(--cta-grad-to)] text-white px-8 py-3 rounded-full hover:shadow-xl transition-all duration-300 font-bold shadow-lg"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--page-soft-bg)]" style={ctaVars}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Column 1: Delivery Details Form Section - Left on Desktop/Tablet, Second on Mobile */}
          <div className="order-2 md:order-1 md:pr-6 md:border-r md:border-gray-300">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
              Delivery Details
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Two Column Layout for Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="First name"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-0.5">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Last name"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-0.5">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Two Column Layout for Phone and Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1.5">
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    id="customerPhone"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.customerPhone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="WhatsApp number"
                  />
                  {errors.customerPhone && (
                    <p className="text-red-500 text-xs mt-0.5">{errors.customerPhone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-0.5">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Address Field - Full Width */}
              <div>
                <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Delivery Address *
                </label>
                <textarea
                  id="deliveryAddress"
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                    errors.deliveryAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter complete delivery address"
                />
                {errors.deliveryAddress && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.deliveryAddress}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    autoComplete="address-level2"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="City"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-0.5">{errors.city}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.pincode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="pincode"
                  />
                  {errors.pincode && (
                    <p className="text-red-500 text-xs mt-0.5">{errors.pincode}</p>
                  )}
                </div>
                <div>
                  <SearchableSelect
                    label="State *"
                    id="state"
                    name="state"
                    autoComplete="address-level1"
                    options={indianStates}
                    value={formData.state}
                    onChange={(code) => {
                      setFormData((prev) => ({ ...prev, state: code }))
                      if (errors.state) {
                        setErrors((prev) => ({ ...prev, state: '' }))
                      }
                    }}
                    placeholder="Select State"
                    getOptionValue={(s) => s.code}
                    getOptionLabel={(s) => s.name}
                    error={!!errors.state}
                  />
                  {errors.state && (
                    <p className="text-red-500 text-xs mt-0.5">{errors.state}</p>
                  )}
                </div>
              </div>

              {/* Review Order */}
              <button
                type="submit"
                disabled={loading}
                style={ctaVars}
                className={`w-full md:w-auto md:max-w-xs mt-2 touch-manipulation px-4 py-3 lg:py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold text-sm sm:text-base ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-[var(--cta-bg)] text-white hover:bg-[var(--cta-bg-hover)] shadow-md hover:shadow-lg active:scale-[0.98]'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Preparing review...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Review Order</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Column 2: Order Summary Section - Right on Desktop/Tablet, First on Mobile */}
          <div className="order-1 md:order-2 md:pl-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Order Summary</h2>
            <div className="space-y-1.5 mb-2">
              {cartItems.map((item, index) => {
                const price = Number(item?.price) || 0
                const quantity = Number(item?.quantity) || 0
                const itemTotal = price * quantity
                const unitValue = item?.unitValue || 1
                const unitLabel = item.unit === 'pc' 
                  ? `${unitValue} ${unitValue === 1 ? 'pc' : 'pcs'}`
                  : `${unitValue}g`
                const isLastItem = index === cartItems.length - 1
                
                // Display variant name if available, otherwise use legacy unit label
                const displayLabel = item.variantName || unitLabel
                
                return (
                  <div key={item.variantId ? `variant_${item.variantId}` : `product_${item.id}`} className={`flex justify-between items-start pb-1.5 ${isLastItem ? 'border-b-2 border-gray-300' : 'border-b border-gray-200/50'}`}>
                    <div>
                      <p className="font-semibold text-gray-800 mb-0.5 text-sm sm:text-base">
                        {item.name || 'Unknown Item'}
                        {displayLabel && ` (${displayLabel})`}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">Quantity: {quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">
                      ₹ {itemTotal.toFixed(2)}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="pt-2 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-base sm:text-lg text-gray-700">Subtotal:</span>
                <span className="text-base sm:text-lg text-gray-800 font-semibold">
                  ₹ {itemTotal.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-600 pt-2 border-t border-gray-200">
                Delivery charge and final total will be calculated in the next review step based on selected state.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

