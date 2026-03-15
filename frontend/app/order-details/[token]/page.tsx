'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import PrintReceipt from '@/components/printReceipt'
import type { PrintReceiptOrder } from '@/components/printReceipt'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

function OrderDetailsContent() {
  const params = useParams()
  const token = typeof params?.token === 'string' ? params.token : ''
  const [order, setOrder] = useState<PrintReceiptOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Invalid link')
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await axios.get(`${API_URL}/api/public/order/${encodeURIComponent(token)}`, {
          timeout: 15000,
          headers: { 'Content-Type': 'application/json' },
        })

        if (response.data?.success && response.data?.order) {
          const o = response.data.order
          const cartItems = Array.isArray(o.cartItems) ? o.cartItems : []
          const mapped: PrintReceiptOrder = {
            id: o.id,
            customer_name: o.customerName ?? o.customer_name ?? '',
            customer_phone: o.customerPhone ?? o.customer_phone ?? '',
            delivery_address: o.deliveryAddress ?? o.delivery_address ?? '',
            items: cartItems,
            total_amount: o.amount != null ? Number(o.amount) : (o.total_amount != null ? Number(o.total_amount) : 0),
            itemTotal: o.itemTotal != null ? Number(o.itemTotal) : undefined,
            deliveryCharge: o.deliveryCharge != null ? Number(o.deliveryCharge) : undefined,
            totalWeightGrams: o.totalWeightGrams,
            payment_status: o.paymentMode ?? o.payment_mode ?? '',
            order_status: o.status ?? o.order_status ?? 'pending',
            payment_mode: o.paymentMode ?? o.payment_mode ?? '',
            created_at: o.createdAt ?? o.created_at,
            updated_at: o.updatedAt ?? o.updated_at,
          }
          setOrder(mapped)
        } else {
          setError('Order not found')
        }
      } catch (err: any) {
        const status = err.response?.status
        const msg = err.response?.data?.error ?? err.message ?? 'Something went wrong'
        if (status === 401) {
          setError('This link is invalid or has expired.')
        } else if (status === 404) {
          setError('Order not found.')
        } else {
          setError(msg)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF7F3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A3D] mx-auto" />
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="container mx-auto px-4 py-8 text-center max-w-md">
          <div className="bg-gray-50 rounded-2xl shadow-lg p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Unable to load order</h1>
            <p className="text-gray-600">{error ?? 'Invalid or expired link.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-6 px-4">
      <PrintReceipt order={order} className="print-receipt-visible" />
    </div>
  )
}

export default function OrderDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFF7F3] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A3D] mx-auto" />
        </div>
      }
    >
      <OrderDetailsContent />
    </Suspense>
  )
}
