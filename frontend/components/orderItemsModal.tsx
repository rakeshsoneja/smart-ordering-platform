'use client'

import type { CSSProperties } from 'react'
import { X, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { formatDeliveryAddressForDisplay, parseStoredDeliveryAddress } from '@/lib/deliveryAddressFormat'
import { getAppTheme, type AppTheme } from '@/lib/theme'

interface OrderItemsModalProps {
  order: any
  onClose: () => void
}

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'payment_pending', label: 'Payment Pending' },
  { value: 'payment_failed', label: 'Payment Failed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]

/** Read-only status chip: colors from AppTheme only (no hardcoded palette). */
function getReadOnlyStatusStyle(status: string, theme: AppTheme): CSSProperties {
  const base: CSSProperties = {
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 9999,
    padding: '0.5rem 0.75rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: 1.25,
  }
  const line = (bg: string, fg: string, border: string) => ({
    ...base,
    backgroundColor: bg,
    color: fg,
    borderColor: border,
  })
  if (status === 'paid' || status === 'confirmed' || status === 'completed') {
    return line(theme.primaryLight, theme.primary, theme.primaryMuted)
  }
  if (status === 'pending' || status === 'payment_pending') {
    return line(theme.softBackground, theme.textPrimary, theme.primaryMuted)
  }
  if (status === 'cancelled' || status === 'payment_failed') {
    return line(theme.primaryMuted, theme.textPrimary, theme.primary)
  }
  return line(theme.softBackground, theme.textSecondary, theme.primaryMuted)
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'pending':
    case 'payment_pending':
      return <Clock className="w-4 h-4" />
    case 'payment_failed':
      return <XCircle className="w-4 h-4" />
    case 'confirmed':
    case 'paid':
      return <CheckCircle2 className="w-4 h-4" />
    case 'cancelled':
      return <XCircle className="w-4 h-4" />
    case 'completed':
      return <CheckCircle2 className="w-4 h-4" />
    default:
      return null
  }
}

function formatOrderDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OrderItemsModal({ order, onClose }: OrderItemsModalProps) {
  const appTheme = getAppTheme()
  const cartItems = typeof order.cartItems === 'string' ? JSON.parse(order.cartItems) : order.cartItems

  const totalAmount = cartItems.reduce((sum: number, item: any) => {
    const price = Number(item.price) || 0
    const quantity = Number(item.quantity) || 0
    return sum + price * quantity
  }, 0)

  const deliveryCharge = order.deliveryCharge != null ? Number(order.deliveryCharge) : 0
  const itemTotalFromOrder = order.itemTotal != null ? Number(order.itemTotal) : undefined
  const orderAmount = order.amount != null ? Number(order.amount) : null
  const status = order.status ?? ''
  const deliveryDisplay = formatDeliveryAddressForDisplay(
    parseStoredDeliveryAddress(typeof order.deliveryAddress === 'string' ? order.deliveryAddress : '')
  )

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">Order #{order.id}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Customer Information — matches Admin Order Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-base font-medium text-gray-900">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-base font-medium text-gray-900">{order.customerPhone}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500">Delivery Address</p>
                <p className="text-base font-medium text-gray-900 whitespace-pre-line break-words">{deliveryDisplay}</p>
              </div>
            </div>
          </div>

          {/* Order Items — matches Admin Order Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="divide-y divide-gray-200">
                {Array.isArray(cartItems) && cartItems.length > 0 ? (
                  cartItems.map((item: any, index: number) => {
                    const hasVariant = item.variantId !== undefined && item.variantId !== null
                    const itemDisplayName =
                      hasVariant && item.variantName ? `${item.name} (${item.variantName})` : item.name
                    return (
                      <div key={index} className="p-4 flex justify-between items-center">
                        <div className="flex-1">
                          <p className="text-base font-medium text-gray-900">{itemDisplayName}</p>
                          {!hasVariant && item.unit && (
                            <p className="text-sm text-gray-500">
                              {item.unitValue || 1} {item.unit === 'pc' ? 'piece' : 'g'} per unit
                            </p>
                          )}
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                        <p className="text-base font-semibold text-gray-900">
                          ₹{((Number(item.price) || 0) * (Number(item.quantity) || 0)).toFixed(2)}
                        </p>
                      </div>
                    )
                  })
                ) : (
                  <div className="p-4 text-center text-gray-500">No items found</div>
                )}
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-2">
                {deliveryCharge > 0 && itemTotalFromOrder !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-base text-gray-700">Item Total</span>
                    <span className="text-base font-semibold text-gray-900">₹{itemTotalFromOrder.toFixed(2)}</span>
                  </div>
                )}
                {deliveryCharge > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-base text-gray-700">Delivery Charge</span>
                    <span className="text-base font-semibold text-gray-900">₹{deliveryCharge.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    ₹
                    {(orderAmount != null && !Number.isNaN(orderAmount) ? orderAmount : totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status & Payment Information — read-only (no select); Search screen only */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Current Status</p>
                  <span
                    role="status"
                    aria-live="polite"
                    aria-label={`Order status: ${ORDER_STATUSES.find((s) => s.value === status)?.label || status || 'Unknown'}`}
                    className="pointer-events-none select-none max-w-full"
                    style={getReadOnlyStatusStyle(status, appTheme)}
                  >
                    {getStatusIcon(status)}
                    {ORDER_STATUSES.find((s) => s.value === status)?.label || status || '—'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Payment Mode</p>
                  <p className="text-base font-medium text-gray-900 capitalize">{order.paymentMode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-base font-medium text-gray-900">
                    ₹{(orderAmount != null && !Number.isNaN(orderAmount) ? orderAmount : totalAmount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="text-base font-medium text-gray-900">{formatOrderDate(order.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 sm:px-6 py-4 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
