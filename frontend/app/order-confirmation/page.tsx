'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import axiosInstance from '@/lib/axiosConfig'

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')
  const status = searchParams.get('status')
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false)
        return
      }

      try {
        const response = await axiosInstance.get(`/api/orders/${orderId}`)
        if (response.data.success) {
          setOrder(response.data.order)
        }
      } catch (error) {
        console.error('Error fetching order:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading order details...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Order Not Found</h1>
        <button
          onClick={() => router.push('/')}
          className="bg-gradient-to-r from-[#FF6A3D] to-[#FF3D68] text-white px-6 py-2 rounded-full hover:shadow-lg hover:shadow-[#FF6A3D]/30 transition-all"
        >
          Back to Home
        </button>
      </div>
    )
  }

  const cartItems = typeof order.cartItems === 'string' 
    ? JSON.parse(order.cartItems) 
    : order.cartItems

  const isPaid = order.status === 'paid' || order.status === 'confirmed' || status === 'paid' || status === 'cod'
  const totalAmount = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
  const paymentModeText = order.paymentMode === 'razorpay' ? 'UPI / Card' : 'Cash on Delivery'
  const statusText = order.status === 'paid' ? 'Confirmed' : 
                     order.status === 'confirmed' ? 'Confirmed' :
                     order.status === 'payment_pending' ? 'Payment Pending' :
                     order.status === 'payment_failed' ? 'Payment Failed' :
                     'Pending'

  return (
    <div className="min-h-screen bg-[#FFF7F3]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
          {/* Line 1: Order Number */}
          <div className="mb-3 sm:mb-4">
            <p className="text-base sm:text-lg text-gray-800">
              <span className="font-semibold">Order Number:</span> <span className="font-bold">#{order.id}</span>
            </p>
          </div>

          {/* Line 2: Status and Payment */}
          <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:gap-6 gap-2">
            <p className="text-base sm:text-lg text-gray-800">
              <span className="font-semibold">Status:</span> <span className="font-bold text-green-600">{statusText}</span>
            </p>
            <p className="text-base sm:text-lg text-gray-800">
              <span className="font-semibold">Payment:</span> <span className="font-bold">{paymentModeText}</span>
            </p>
          </div>

          {/* Line 3: Total */}
          <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-300">
            <p className="text-lg sm:text-xl text-gray-800">
              <span className="font-semibold">Total:</span> <span className="font-bold text-[#FF6A3D]">₹{totalAmount.toFixed(2)}</span>
            </p>
          </div>

          {/* Delivery Details */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Delivery Details</h2>
            <div className="space-y-2 text-sm sm:text-base text-gray-700">
              <p><span className="font-medium">Name:</span> {order.customerName}</p>
              <p><span className="font-medium">Phone:</span> {order.customerPhone}</p>
              <p><span className="font-medium">Address:</span></p>
              <p className="pl-2 sm:pl-4 break-words">{order.deliveryAddress}</p>
            </div>
          </div>

          {/* SMS Notification */}
          {isPaid && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-800">
                📱 An SMS confirmation has been sent to {order.customerPhone}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex-1 bg-gradient-to-r from-[#FF6A3D] to-[#FF3D68] text-white py-3 sm:py-3.5 rounded-full font-semibold hover:shadow-xl hover:shadow-[#FF6A3D]/30 active:scale-95 transition-all touch-manipulation text-base sm:text-lg shadow-lg"
            >
              Continue Shopping
            </button>
            {!isPaid && order.paymentMode === 'razorpay' && (
              <button
                onClick={() => router.push('/checkout')}
                className="flex-1 bg-gray-600 text-white py-3 sm:py-3.5 rounded-lg font-semibold hover:bg-gray-700 active:bg-gray-800 transition-all touch-manipulation text-base sm:text-lg"
              >
                Retry Payment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading order details...</p>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  )
}
