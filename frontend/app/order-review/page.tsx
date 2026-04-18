'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import axiosInstance from '@/lib/axiosConfig'
import { useCart } from '@/context/cartContext'
import { appConfig } from '@/lib/config'
import { getAppTheme } from '@/lib/theme'
import ReceiptDeliveryAddressBlock from '@/components/ReceiptDeliveryAddressBlock'

type ReviewCartItem = {
  id: number
  variantId?: number
  variantName?: string
  variantWeightGrams?: number
  name: string
  description?: string
  price: number
  unit?: 'pc' | 'gms'
  unitValue?: number
  quantity: number
  image?: string
}

type ReviewDeliveryDetails = {
  customerName: string
  customerPhone: string
  email?: string
  deliveryAddress: string
  city: string
  pincode: string
  stateCode: string | null
  stateName: string | null
}

type ReviewPayload = {
  cartItems: ReviewCartItem[]
  deliveryDetails: ReviewDeliveryDetails
  paymentMode: 'razorpay' | 'cod'
}

const STORAGE_KEY = 'orderReviewData'

export default function OrderReviewPage() {
  const router = useRouter()
  const { clearCart } = useCart()
  const appTheme = getAppTheme()
  const ctaVars = {
    '--cta-bg': appTheme.primary,
    '--cta-bg-hover': appTheme.primaryHover,
    '--cta-grad-from': appTheme.gradientFrom,
    '--cta-grad-to': appTheme.gradientTo,
    '--page-soft-bg': appTheme.softBackground,
  } as CSSProperties

  const [reviewData, setReviewData] = useState<ReviewPayload | null>(null)
  const [loadingReviewData, setLoadingReviewData] = useState(true)
  const [deliveryCharge, setDeliveryCharge] = useState(0)
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      router.replace('/cart')
      return
    }
    try {
      const parsed = JSON.parse(raw) as ReviewPayload
      if (!parsed?.deliveryDetails || !Array.isArray(parsed?.cartItems) || parsed.cartItems.length === 0) {
        router.replace('/cart')
        return
      }
      setReviewData(parsed)
    } catch {
      router.replace('/cart')
      return
    } finally {
      setLoadingReviewData(false)
    }
  }, [router])

  useEffect(() => {
    const loadDeliveryCharge = async () => {
      if (!reviewData) return
      try {
        setDeliveryLoading(true)
        const cartItemsForBackend = reviewData.cartItems.map((item) => ({
          id: item.id,
          productId: item.id,
          variantId: item.variantId || null,
          variantWeightGrams: item.variantWeightGrams ?? null,
          unit: item.unit ?? null,
          unitValue: item.unitValue ?? null,
          quantity: item.quantity,
          price: item.price,
        }))
        const response = await axiosInstance.post('/api/orders/calculate-delivery', {
          cartItems: cartItemsForBackend,
          stateCode: reviewData.deliveryDetails.stateCode,
        })
        if (response.data?.success) {
          setDeliveryCharge(Number(response.data.deliveryCharge) || 0)
        } else {
          setDeliveryCharge(0)
        }
      } catch {
        setDeliveryCharge(0)
      } finally {
        setDeliveryLoading(false)
      }
    }
    loadDeliveryCharge()
  }, [reviewData])

  const subtotal = useMemo(() => {
    if (!reviewData) return 0
    return reviewData.cartItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0)
  }, [reviewData])
  const total = subtotal + deliveryCharge

  const handleRazorpayPayment = async (orderData: any) => {
    try {
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
          amount: orderData.razorpayOrderId ? (orderData.amount || total) * 100 : 0,
          currency: 'INR',
          name: appConfig.shopName,
          description: 'Order Payment',
          order_id: orderData.razorpayOrderId,
          handler: async function (response: any) {
            try {
              const verifyResponse = await axiosInstance.post('/api/orders/verify-payment', {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })
              if (verifyResponse.data.success) {
                clearCart()
                if (typeof window !== 'undefined') sessionStorage.removeItem(STORAGE_KEY)
                const orderId = verifyResponse.data.order.id || orderData.id
                router.push(`/order-confirmation?orderId=${orderId}&status=paid`)
              } else {
                alert('Payment verification failed. Please contact support.')
              }
            } catch {
              alert('Payment verification failed. Please contact support with your payment ID.')
            }
          },
          prefill: {
            name: reviewData?.deliveryDetails.customerName,
            contact: reviewData?.deliveryDetails.customerPhone,
            ...(reviewData?.deliveryDetails.email ? { email: reviewData.deliveryDetails.email } : {}),
          },
          theme: {
            color: appTheme.primary,
          },
        }
        const razorpay = new Razorpay(options)
        razorpay.open()
      }
      script.onerror = () => {
        alert('Failed to load Razorpay. Please check your internet connection.')
      }
      document.body.appendChild(script)
    } catch {
      alert('Failed to initialize payment. Please try again.')
    }
  }

  const handleConfirmOrder = async () => {
    if (!reviewData) return
    try {
      setConfirming(true)
      const cartItemsForBackend = reviewData.cartItems.map((item) => ({
        id: item.id,
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit || null,
        unitValue: item.unitValue || null,
        variantId: item.variantId || null,
        variantName: item.variantName || null,
        variantWeightGrams: item.variantWeightGrams ?? null,
        price: item.price,
        totalPrice: item.price * item.quantity,
      }))
      const response = await axiosInstance.post('/api/orders', {
        customerName: reviewData.deliveryDetails.customerName,
        customerPhone: reviewData.deliveryDetails.customerPhone,
        deliveryAddress: reviewData.deliveryDetails.deliveryAddress,
        cartItems: cartItemsForBackend,
        amount: subtotal,
        paymentMode: reviewData.paymentMode,
        stateCode: reviewData.deliveryDetails.stateCode,
        stateName: reviewData.deliveryDetails.stateName,
      })

      if (!response.data?.success) {
        alert('Failed to create order. Please try again.')
        return
      }

      const orderData = response.data.order
      if (reviewData.paymentMode === 'razorpay' && orderData.razorpayOrderId) {
        await handleRazorpayPayment(orderData)
      } else {
        clearCart()
        if (typeof window !== 'undefined') sessionStorage.removeItem(STORAGE_KEY)
        router.push(`/order-confirmation?orderId=${orderData.id}&status=cod`)
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Failed to create order. Please try again.'
      alert(msg)
    } finally {
      setConfirming(false)
    }
  }

  if (loadingReviewData || !reviewData) {
    return (
      <div className="min-h-screen bg-[var(--page-soft-bg)] flex items-center justify-center" style={ctaVars}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          <p className="mt-3 text-sm text-gray-600">Loading review...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--page-soft-bg)]" style={ctaVars}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          <div className="order-2 md:order-1 md:pr-6 md:border-r md:border-gray-300">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Delivery Details</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <ReceiptDeliveryAddressBlock
                customerName={reviewData.deliveryDetails.customerName}
                customerPhone={reviewData.deliveryDetails.customerPhone}
                rawDeliveryAddress={reviewData.deliveryDetails.deliveryAddress || ''}
                stateDisplay={
                  reviewData.deliveryDetails.stateName ||
                  reviewData.deliveryDetails.stateCode ||
                  'N/A'
                }
              />
            </div>
            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={confirming || deliveryLoading}
              style={ctaVars}
              className={`w-full md:w-auto md:max-w-xs mt-4 px-4 py-3 lg:py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold text-sm sm:text-base ${
                confirming || deliveryLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[var(--cta-bg)] text-white hover:bg-[var(--cta-bg-hover)] shadow-md hover:shadow-lg active:scale-[0.98]'
              }`}
            >
              {confirming ? 'Placing Order...' : 'Confirm Order'}
            </button>
          </div>

          <div className="order-1 md:order-2 md:pl-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Order Summary</h2>
            <div className="space-y-1.5 mb-2">
              {reviewData.cartItems.map((item, index) => {
                const price = Number(item?.price) || 0
                const quantity = Number(item?.quantity) || 0
                const lineTotal = price * quantity
                const unitValue = item?.unitValue || 1
                const unitLabel = item.unit === 'pc' ? `${unitValue} ${unitValue === 1 ? 'pc' : 'pcs'}` : `${unitValue}g`
                const displayLabel = item.variantName || unitLabel
                const isLastItem = index === reviewData.cartItems.length - 1
                return (
                  <div key={`${item.id}_${item.variantId ?? 'legacy'}_${index}`} className={`flex justify-between items-start pb-1.5 ${isLastItem ? 'border-b-2 border-gray-300' : 'border-b border-gray-200/50'}`}>
                    <div>
                      <p className="font-semibold text-gray-800 mb-0.5 text-sm sm:text-base">
                        {item.name}
                        {displayLabel ? ` (${displayLabel})` : ''}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">Quantity: {quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">₹ {lineTotal.toFixed(2)}</p>
                  </div>
                )
              })}
            </div>
            <div className="pt-2 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-base sm:text-lg text-gray-700">Subtotal:</span>
                <span className="text-base sm:text-lg text-gray-800 font-semibold">₹ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base sm:text-lg text-gray-700">Delivery Charge:</span>
                <span className="text-base sm:text-lg text-gray-800 font-semibold">
                  {deliveryLoading ? 'Calculating...' : `₹ ${deliveryCharge.toFixed(2)}`}
                </span>
              </div>
              <div className="border-t-2 border-gray-300 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg sm:text-xl font-bold text-gray-800">Total:</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-800">₹ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
