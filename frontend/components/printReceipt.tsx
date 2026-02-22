'use client'

import { appConfig } from '@/lib/config'

export interface PrintReceiptOrderItem {
  id: number
  name: string
  price: number
  quantity: number
  unit?: string
  unitValue?: number
  variantId?: number
  variantName?: string
  variantWeightGrams?: number
}

export interface PrintReceiptOrder {
  id: number
  customer_name: string
  customer_phone: string
  delivery_address: string
  items: PrintReceiptOrderItem[]
  total_amount: number
  itemTotal?: number
  deliveryCharge?: number
  totalWeightGrams?: number
  payment_status?: string
  order_status?: string
  payment_mode?: string
  created_at?: string
  updated_at?: string
}

interface PrintReceiptProps {
  order: PrintReceiptOrder
  className?: string
}

export default function PrintReceipt({ order, className = '' }: PrintReceiptProps) {
  // Format date to dd/mm/yyyy
  const formatDate = (dateString?: string): string => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch {
      return ''
    }
  }

  return (
    <div className={`print-receipt-container ${className}`}>
      <div className="max-w-lg mx-auto p-6">
        {/* 1. Store Header - Top Center */}
        <div className="text-center mb-6 border-b-2 border-gray-900 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{appConfig.shopName}</h1>
          <p className="text-base text-gray-900">Phone: +91 8667377257</p>
        </div>

        {/* 2. Customer Delivery Address Section */}
        <div className="mb-6 border-b-2 border-gray-900 pb-4">
          <p className="text-base font-bold text-gray-900 mb-3">Delivery Address:</p>
          <div className="text-sm text-gray-900 space-y-1">
            <p className="font-semibold">{order.customer_name}</p>
            <div className="whitespace-pre-line">{order.delivery_address}</div>
            <p className="mt-2">Phone: {order.customer_phone}</p>
          </div>
        </div>

        {/* 2.5. Order Number and Date Section */}
        <div className="mb-6 border-b-2 border-gray-900 pb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-900">Order Number: {order.id}</span>
            <span className="text-sm font-semibold text-gray-900">{formatDate(order.created_at)}</span>
          </div>
        </div>

        {/* 3. Item Details Section - Tabular Format */}
        <div className="mb-6">
          {/* Header Row */}
          <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-gray-900">
            <span className="text-base font-bold text-gray-900">Item Name</span>
            <span className="text-base font-bold text-gray-900">Price</span>
          </div>
          
          {/* Items */}
          {Array.isArray(order.items) && order.items.length > 0 ? (
            <div className="space-y-4">
              {order.items.map((item: PrintReceiptOrderItem, index: number) => {
                const hasVariant = item.variantId !== undefined && item.variantId !== null
                const itemTotal = (item.price != null ? Number(item.price) : 0) * (item.quantity != null ? Number(item.quantity) : 0)
                const variantQty = hasVariant && item.variantName 
                  ? `${item.variantName} × ${item.quantity}` 
                  : `Qty: ${item.quantity}`
                
                return (
                  <div key={index} className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-700 mt-1">{variantQty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">₹{itemTotal.toFixed(2)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No items found</p>
          )}
        </div>

        {/* 4. Total Section - Conditional Display */}
        <div className="border-t-2 border-gray-900 pt-4">
          {/* Show breakdown only if delivery charge exists and > 0 */}
          {order.deliveryCharge !== undefined && order.deliveryCharge > 0 && order.itemTotal !== undefined ? (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-900">Item Total:</span>
                <span className="text-sm font-semibold text-gray-900">₹{order.itemTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-300">
                <span className="text-sm font-semibold text-gray-900">Delivery Charge:</span>
                <span className="text-sm font-semibold text-gray-900">₹{order.deliveryCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-bold text-gray-900">Order Total:</span>
                <span className="text-base font-bold text-gray-900">₹{(order.total_amount != null ? Number(order.total_amount) : 0).toFixed(2)}</span>
              </div>
            </>
          ) : (
            /* No delivery charge - show only Order Total */
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-gray-900">Order Total:</span>
              <span className="text-base font-bold text-gray-900">₹{(order.total_amount != null ? Number(order.total_amount) : 0).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* 5. Note Section */}
        <div className="mt-6 pt-4 border-t-2 border-gray-900">
          <p className="text-xs text-gray-700 italic">
            Note: Packed items to be consumed within 15 days from the packed date
          </p>
        </div>
      </div>
    </div>
  )
}

