'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/cartContext'
import axiosInstance from '@/lib/axiosConfig'
import { appConfig } from '@/lib/config'

export default function CheckoutPage() {
  const router = useRouter()
  const { cartItems, clearCart, getTotalAmount } = useCart()
  const [loading, setLoading] = useState(false)
  const [paymentMode, setPaymentMode] = useState<'razorpay' | 'cod'>('cod')
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    customerPhone: '',
    email: '',
    deliveryAddress: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalAmount = getTotalAmount()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      newErrors.customerPhone = 'Phone number is required'
    } else if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(formData.customerPhone)) {
      newErrors.customerPhone = 'Invalid phone number format'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required'
    } else if (formData.deliveryAddress.trim().length < 10) {
      newErrors.deliveryAddress = 'Address must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRazorpayPayment = async (orderData: any) => {
    try {
      // Load Razorpay script dynamically
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        const Razorpay = (window as any).Razorpay
        const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

        if (!razorpayKeyId) {
          alert('Razorpay key not configured. Please contact support.')
          return
        }

        const options = {
          key: razorpayKeyId,
          amount: orderData.razorpayOrderId ? totalAmount * 100 : 0, // Amount in paise
          currency: 'INR',
          name: appConfig.shopName,
          description: 'Order Payment',
          order_id: orderData.razorpayOrderId,
          handler: async function (response: any) {
            // Verify payment on backend
            try {
              const verifyResponse = await axiosInstance.post(
                '/api/orders/verify-payment',
                {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }
              )

              if (verifyResponse.data.success) {
                clearCart()
                router.push(`/order-confirmation?orderId=${orderData.orderId}&status=paid`)
              } else {
                alert('Payment verification failed. Please contact support.')
              }
            } catch (error: any) {
              console.error('Payment verification error:', error)
              alert('Payment verification failed. Please contact support with your payment ID.')
            }
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            contact: formData.customerPhone,
            email: formData.email,
          },
          theme: {
            color: '#ef4444',
          },
          modal: {
            ondismiss: function() {
              console.log('Payment cancelled by user')
            },
          },
        }

        const razorpay = new Razorpay(options)
        razorpay.open()
      }
      script.onerror = () => {
        alert('Failed to load Razorpay. Please check your internet connection.')
      }
      document.body.appendChild(script)
    } catch (error) {
      console.error('Razorpay initialization error:', error)
      alert('Failed to initialize payment. Please try again.')
    }
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

    setLoading(true)

    try {
      // Prepare cart items for backend
      const cartItemsForBackend = cartItems.map(item => ({
        id: item.id, // Product ID
        productId: item.id, // Product ID (for inventory deduction)
        name: item.name,
        quantity: item.quantity,
        unit: item.unit || null, // Legacy field
        unitValue: item.unitValue || null, // Legacy field
        variantId: item.variantId || null, // NEW: variant ID if using variants
        variantName: item.variantName || null, // NEW: variant name
        price: item.price,
        totalPrice: item.price * item.quantity,
      }))

      // Create order
      const response = await axiosInstance.post('/api/orders', {
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerPhone: formData.customerPhone,
        deliveryAddress: formData.deliveryAddress,
        cartItems: cartItemsForBackend,
        amount: totalAmount,
        paymentMode: paymentMode,
      })

      if (response.data.success) {
        const orderData = response.data.order

        if (paymentMode === 'razorpay' && orderData.razorpayOrderId) {
          // Handle Razorpay payment
          await handleRazorpayPayment(orderData)
        } else if (paymentMode === 'cod') {
          // COD order - redirect to confirmation
          clearCart()
          router.push(`/order-confirmation?orderId=${orderData.id}&status=cod`)
        }
      } else {
        alert('Failed to create order. Please try again.')
      }
    } catch (error: any) {
      console.error('Order creation error:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create order. Please try again.'
      
      if (error.response) {
        // Server responded with error
        const { status, data } = error.response
        
        if (status === 400 && data.errors) {
          // Validation errors
          const validationErrors = data.errors.map((err: any) => err.msg).join(', ')
          errorMessage = `Validation Error: ${validationErrors}`
        } else if (data.error) {
          errorMessage = data.error
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later or contact support.'
        } else if (status === 404) {
          errorMessage = 'API endpoint not found. Please check your connection.'
        }
      } else if (error.request) {
        // Request was made but no response received (network error)
        errorMessage = 'Network error. Please check your internet connection and ensure the backend server is running. If testing on mobile, make sure you\'re using the correct IP address (not localhost).'
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred. Please try again.'
      }
      
      alert(errorMessage)
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
            className="bg-gradient-to-r from-[#FF6A3D] to-[#FF3D68] text-white px-8 py-3 rounded-full hover:shadow-xl hover:shadow-[#FF6A3D]/30 transition-all duration-300 font-bold shadow-lg"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF7F3]">
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
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="customerPhone"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.customerPhone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+91XXXXXXXXXX"
                  />
                  {errors.customerPhone && (
                    <p className="text-red-500 text-xs mt-0.5">{errors.customerPhone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
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

              {/* Confirm Button - Modernized */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full md:w-auto md:max-w-xs bg-gradient-to-r from-[#FF6A3D] to-[#FF3D68] text-white py-3.5 px-8 rounded-full font-semibold hover:shadow-xl hover:shadow-[#FF6A3D]/30 active:scale-[0.98] transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:shadow-none touch-manipulation text-base sm:text-lg shadow-lg mt-2 overflow-hidden"
              >
                {/* Animated background shimmer effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                
                {loading ? (
                  <span className="relative flex items-center justify-center gap-2.5">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </span>
                ) : (
                  <span className="relative flex items-center justify-center gap-2">
                    <span>Confirm</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Column 2: Order Summary Section - Right on Desktop/Tablet, First on Mobile */}
          <div className="order-1 md:order-2 md:pl-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
              Order Summary
            </h2>
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
            <div className="pt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg sm:text-xl font-bold text-gray-800">Total:</span>
                <span className="text-lg sm:text-xl font-bold text-gray-800">
                  ₹ {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

