'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axiosInstance from '@/lib/axiosConfig'
import OrderItemsModal from '@/components/orderItemsModal'

export default function TrackOrderPage() {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setSearchError('Please enter an order number or mobile number')
      return
    }

    // Validate phone number (10 digits)
    const trimmedValue = searchValue.trim()
    const isPhoneNumber = /^\d{10}$/.test(trimmedValue)
    const orderId = parseInt(trimmedValue)

    setSearchLoading(true)
    setSearchError('')
    setSearchResults([])

    try {
      if (isPhoneNumber) {
        // Search by phone number (10 digits)
        const response = await axiosInstance.get(`/api/orders/search?phone=${encodeURIComponent(trimmedValue)}`)
        if (response.data.success && response.data.orders.length > 0) {
          setSearchResults(response.data.orders)
        } else {
          setSearchError(`No orders found for ${trimmedValue}`)
        }
      } else if (!isNaN(orderId)) {
        // Search by order ID
        const response = await axiosInstance.get(`/api/orders/${orderId}`)
        if (response.data.success) {
          setSearchResults([response.data.order])
        } else {
          setSearchError(`No orders found for ${trimmedValue}`)
        }
      } else {
        setSearchError('Please enter a valid 10-digit mobile number or order number')
      }
    } catch (error: any) {
      const trimmedValue = searchValue.trim()
      setSearchError(error.response?.data?.error || `No orders found for ${trimmedValue}`)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleViewOrderItems = (order: any) => {
    setSelectedOrder(order)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedOrder(null)
  }

  return (
    <div className="min-h-screen bg-[#FFF7F3]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-4xl">
        {/* Search Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex gap-2 sm:gap-3">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => {
                const value = e.target.value
                // Allow only digits, max 10 for phone or longer for order number
                if (/^\d*$/.test(value)) {
                  setSearchValue(value)
                }
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Order number / Mobile number"
              maxLength={10}
              className="flex-1 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A3D] focus:border-transparent text-sm sm:text-base h-10"
            />
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="w-10 h-10 bg-gradient-to-r from-[#FF6A3D] to-[#FF3D68] text-white rounded-lg hover:shadow-xl hover:shadow-[#FF6A3D]/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
              aria-label="Search"
            >
              {searchLoading ? (
                <span className="animate-spin text-lg">⏳</span>
              ) : (
                <span className="text-lg">🔍</span>
              )}
            </button>
          </div>

          {/* Error Message - Only show validation errors, not "no orders found" */}
          {searchError && !searchError.includes('No orders found') && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{searchError}</p>
            </div>
          )}
        </div>

        {/* Search Results - No card layout, directly on background */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((order: any) => {
              const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
              const statusText = order.status === 'paid' ? 'Paid' : 
                                 order.status === 'confirmed' ? 'Confirmed' :
                                 order.status === 'payment_pending' ? 'Payment Pending' :
                                 order.status === 'payment_failed' ? 'Payment Failed' :
                                 'Pending'
              const statusColor = order.status === 'paid' || order.status === 'confirmed' 
                ? 'text-green-600' 
                : 'text-yellow-600'

              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 border-b border-gray-200/50 hover:bg-gray-50/50 transition-all cursor-pointer"
                  onClick={() => handleViewOrderItems(order)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <p className="font-semibold text-gray-800 text-base">
                      Order #{order.id}
                    </p>
                    <p className="text-sm text-gray-600">
                      {orderDate}
                    </p>
                    <p className={`font-semibold text-sm ${statusColor}`}>
                      {statusText}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className="text-xl text-gray-400 hover:text-[#FF6A3D] transition-colors">
                      &gt;
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State - Show when no results and search was performed */}
        {searchResults.length === 0 && !searchLoading && searchValue && (
          <div className="py-8 text-center">
            <p className="text-gray-600">No orders found for {searchValue}</p>
          </div>
        )}
      </div>

      {/* Order Items Modal */}
      {showModal && selectedOrder && (
        <OrderItemsModal order={selectedOrder} onClose={handleCloseModal} />
      )}
    </div>
  )
}

