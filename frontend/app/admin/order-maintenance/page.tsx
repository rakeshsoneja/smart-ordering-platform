'use client'

import { useState, useEffect } from 'react'
import { Eye, ChevronDown, X, AlertCircle, CheckCircle2, Clock, XCircle, ShoppingBag, Printer } from 'lucide-react'
import axiosInstance from '@/lib/axiosConfig'
import PrintReceipt from '@/components/printReceipt'

interface OrderItem {
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

interface Order {
  id: number
  customer_name: string
  customer_phone: string
  delivery_address: string
  items: OrderItem[]
  total_amount: number
  itemTotal?: number
  deliveryCharge?: number
  totalWeightGrams?: number
  payment_status: string
  order_status: string
  payment_mode: string
  created_at: string
  updated_at: string
}

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'payment_pending', label: 'Payment Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]

// Define valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  payment_pending: ['paid', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  paid: ['confirmed', 'completed', 'cancelled'],
  cancelled: [], // Cannot transition from cancelled
  completed: [], // Cannot transition from completed
}

export default function OrderMaintenancePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusUpdateConfirm, setStatusUpdateConfirm] = useState<{ orderId: number; newStatus: string } | null>(null)
  const [tempStatus, setTempStatus] = useState<string>('')
  const [showPrintReceipt, setShowPrintReceipt] = useState(false)

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await axiosInstance.get('/api/admin/orders')
      if (response.data.success) {
        // Map API response to match expected structure
        const mappedOrders = response.data.orders.map((order: any) => ({
          id: order.id,
          customer_name: order.customerName || order.customer_name || '',
          customer_phone: order.customerPhone || order.customer_phone || '',
          delivery_address: order.deliveryAddress || order.delivery_address || '',
          items: Array.isArray(order.cartItems) ? order.cartItems : (Array.isArray(order.items) ? order.items : []),
          total_amount: order.amount != null ? Number(order.amount) : (order.total_amount != null ? Number(order.total_amount) : 0),
          itemTotal: order.itemTotal != null ? Number(order.itemTotal) : undefined,
          deliveryCharge: order.deliveryCharge != null ? Number(order.deliveryCharge) : undefined,
          totalWeightGrams: order.totalWeightGrams,
          payment_status: order.paymentMode || order.payment_mode || '',
          order_status: order.status || order.order_status || 'pending',
          payment_mode: order.paymentMode || order.payment_mode || '',
          created_at: order.createdAt || order.created_at || new Date().toISOString(),
          updated_at: order.updatedAt || order.updated_at || new Date().toISOString(),
        }))
        setOrders(mappedOrders)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Check if order is NEW (created within last hour)
  const isNewOrder = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return diffHours < 1
  }

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      payment_pending: 'bg-orange-100 text-orange-800',
      confirmed: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'payment_pending':
        return <Clock className="w-4 h-4" />
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get available status transitions for an order
  const getAvailableStatuses = (currentStatus: string) => {
    return ORDER_STATUSES.filter(
      status => VALID_TRANSITIONS[currentStatus]?.includes(status.value)
    )
  }

  // Handle status update
  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    console.log('handleStatusUpdate called:', { orderId, newStatus })
    try {
      setUpdatingStatus(true)
      setError('') // Clear any previous errors
      
      console.log('Making API call to:', `/api/admin/orders/${orderId}/status`)
      console.log('Request body:', { status: newStatus })
      
      const response = await axiosInstance.put(`/api/admin/orders/${orderId}/status`, {
        status: newStatus,
      })
      
      console.log('API response received:', response)
      console.log('API response data:', response.data)
      
      if (!response.data) {
        throw new Error('No response data received')
      }
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'API returned unsuccessful response')
      }
      
      // Close confirmation modal immediately
      setStatusUpdateConfirm(null)
      
      // Close order detail modal after successful status update
      setShowDetailModal(false)
      setSelectedOrder(null)
      setTempStatus('')
      
      // Refresh orders list to update the table
      console.log('Refreshing orders list')
      await fetchOrders()
      console.log('Status update completed successfully')
    } catch (err: any) {
      console.error('Error updating order status:', err)
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
      })
      setError(err.response?.data?.error || err.message || 'Failed to update order status')
      setTimeout(() => setError(''), 5000)
      setStatusUpdateConfirm(null) // Close modal even on error
    } finally {
      setUpdatingStatus(false)
      console.log('Finally block executed - updatingStatus set to false')
    }
  }

  // Open order detail
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setTempStatus(order.order_status)
    setShowDetailModal(true)
  }

  // Close order detail
  const handleCloseDetail = () => {
    setShowDetailModal(false)
    setSelectedOrder(null)
    setTempStatus('')
    setStatusUpdateConfirm(null)
    setShowPrintReceipt(false)
  }

  // Handle print
  const handlePrint = () => {
    setShowPrintReceipt(true)
    // Give React time to render the receipt
    setTimeout(() => {
      window.print()
      // Reset after print dialog closes
      setTimeout(() => setShowPrintReceipt(false), 500)
    }, 300)
  }

  return (
    <>
      <div className="min-h-screen bg-[#FFF7F3] pt-14 pb-16 lg:pb-0 no-print">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Maintenance</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">View and manage orders</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No orders found</p>
            <p className="text-gray-400 text-sm mt-2">Orders will appear here when customers place them</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => {
                      const newOrder = isNewOrder(order.created_at)
                      return (
                        <tr
                          key={order.id}
                          className={`hover:bg-gray-50 ${newOrder ? 'bg-blue-50/50' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">#{order.id}</span>
                              {newOrder && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  NEW
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                            <div className="text-sm text-gray-500">{order.customer_phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {Array.isArray(order.items) ? order.items.length : 0} item(s)
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">₹{(order.total_amount != null ? Number(order.total_amount) : 0).toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 capitalize">{order.payment_mode}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.order_status)}`}>
                              {getStatusIcon(order.order_status)}
                              {ORDER_STATUSES.find(s => s.value === order.order_status)?.label || order.order_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(order.created_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                              aria-label="View Order"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tablet/Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {orders.map((order) => {
                const newOrder = isNewOrder(order.created_at)
                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 ${newOrder ? 'border-blue-300 bg-blue-50/30' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Order #{order.id}</h3>
                          {newOrder && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{order.customer_name}</p>
                        <p className="text-sm text-gray-500">{order.customer_phone}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.order_status)}`}>
                        {getStatusIcon(order.order_status)}
                        {ORDER_STATUSES.find(s => s.value === order.order_status)?.label || order.order_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Items</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {Array.isArray(order.items) ? order.items.length : 0} item(s)
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Amount</p>
                        <p className="text-sm font-semibold text-gray-900">₹{(order.total_amount != null ? Number(order.total_amount) : 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Payment</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{order.payment_mode}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(order.created_at)}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewOrder(order)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Order Detail Modal */}
        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Order #{selectedOrder.id}</h2>
                <button
                  onClick={handleCloseDetail}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* Customer Info */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-base font-medium text-gray-900">{selectedOrder.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-base font-medium text-gray-900">{selectedOrder.customer_phone}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-sm text-gray-500">Delivery Address</p>
                      <p className="text-base font-medium text-gray-900">{selectedOrder.delivery_address}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item: OrderItem, index: number) => {
                          // Only show variant info if variantId exists
                          const hasVariant = item.variantId !== undefined && item.variantId !== null
                          // Build item name with variant inline
                          const itemDisplayName = hasVariant && item.variantName
                            ? `${item.name} (${item.variantName})`
                            : item.name
                          
                          return (
                            <div key={index} className="p-4 flex justify-between items-center">
                              <div className="flex-1">
                                <p className="text-base font-medium text-gray-900">{itemDisplayName}</p>
                                {/* Show legacy unit info only if no variant */}
                                {!hasVariant && item.unit && (
                                  <p className="text-sm text-gray-500">
                                    {item.unitValue || 1} {item.unit === 'pc' ? 'piece' : 'g'} per unit
                                  </p>
                                )}
                                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                              </div>
                              <p className="text-base font-semibold text-gray-900">₹{((item.price != null ? Number(item.price) : 0) * (item.quantity != null ? Number(item.quantity) : 0)).toFixed(2)}</p>
                            </div>
                          )
                        })
                      ) : (
                        <div className="p-4 text-center text-gray-500">No items found</div>
                      )}
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-2">
                      {/* Only show item total if delivery charge exists (to show breakdown) */}
                      {selectedOrder.deliveryCharge !== undefined && selectedOrder.deliveryCharge > 0 && selectedOrder.itemTotal !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-base text-gray-700">Item Total</span>
                          <span className="text-base font-semibold text-gray-900">₹{selectedOrder.itemTotal.toFixed(2)}</span>
                        </div>
                      )}
                      {/* Only show delivery charge if it exists and > 0 */}
                      {selectedOrder.deliveryCharge !== undefined && selectedOrder.deliveryCharge > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-base text-gray-700">Delivery Charge</span>
                          <span className="text-base font-semibold text-gray-900">₹{selectedOrder.deliveryCharge.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                        <span className="text-lg font-semibold text-gray-900">Total</span>
                        <span className="text-lg font-bold text-gray-900">₹{(selectedOrder.total_amount != null ? Number(selectedOrder.total_amount) : 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Status & Payment Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Current Status</p>
                        <span className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-full ${getStatusBadge(selectedOrder.order_status)}`}>
                          {getStatusIcon(selectedOrder.order_status)}
                          {ORDER_STATUSES.find(s => s.value === selectedOrder.order_status)?.label || selectedOrder.order_status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Update Status</p>
                        <select
                          value={tempStatus}
                          onChange={(e) => {
                            const newStatus = e.target.value
                            setTempStatus(newStatus)
                            if (newStatus !== selectedOrder.order_status) {
                              setStatusUpdateConfirm({ orderId: selectedOrder.id, newStatus })
                            } else {
                              setStatusUpdateConfirm(null)
                            }
                          }}
                          disabled={updatingStatus || getAvailableStatuses(selectedOrder.order_status).length === 0}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A3D] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value={selectedOrder.order_status}>
                            {ORDER_STATUSES.find(s => s.value === selectedOrder.order_status)?.label || selectedOrder.order_status} (Current)
                          </option>
                          {getAvailableStatuses(selectedOrder.order_status).map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                        {getAvailableStatuses(selectedOrder.order_status).length === 0 && (
                          <p className="mt-1 text-xs text-gray-500">No status transitions available for this order</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Payment Mode</p>
                        <p className="text-base font-medium text-gray-900 capitalize">{selectedOrder.payment_mode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-base font-medium text-gray-900">₹{(selectedOrder.total_amount != null ? Number(selectedOrder.total_amount) : 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Order Date</p>
                        <p className="text-base font-medium text-gray-900">{formatDate(selectedOrder.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print Receipt - Always rendered, hidden on screen, visible when printing */}
        {selectedOrder && (
          <PrintReceipt 
            order={selectedOrder} 
            className={showPrintReceipt ? 'print-receipt-visible' : ''}
          />
        )}

        {/* Status Update Confirmation Modal */}
        {statusUpdateConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Status Update</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to update the order status to{' '}
                <span className="font-semibold">
                  {ORDER_STATUSES.find(s => s.value === statusUpdateConfirm.newStatus)?.label || statusUpdateConfirm.newStatus}
                </span>
                ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStatusUpdateConfirm(null)
                    if (selectedOrder) {
                      setTempStatus(selectedOrder.order_status)
                    }
                  }}
                  disabled={updatingStatus}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('Confirm button clicked')
                    handleStatusUpdate(statusUpdateConfirm.orderId, statusUpdateConfirm.newStatus)
                  }}
                  disabled={updatingStatus}
                  className="flex-1 px-4 py-2 bg-[#FF6A3D] text-white rounded-lg hover:bg-[#FF5A2D] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updatingStatus ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

