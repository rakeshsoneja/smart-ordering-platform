'use client'

import { useState, type CSSProperties } from 'react'
import { Search } from 'lucide-react'
import axiosInstance from '@/lib/axiosConfig'
import OrderItemsModal from '@/components/orderItemsModal'
import { appConfig } from '@/lib/config'
import { getAppTheme } from '@/lib/theme'

export default function SearchPage() {
  const [searchValue, setSearchValue] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const appTheme = getAppTheme()
  const isSweetshopTheme = appConfig.themeKey?.trim().toLowerCase() === 'sweetshop'
  const ctaVars = {
    '--cta-bg': appTheme.primary,
    '--cta-bg-hover': appTheme.primaryHover,
    '--cta-bg-disabled': appTheme.primaryMuted,
    '--cta-grad-from': appTheme.gradientFrom,
    '--cta-grad-to': appTheme.gradientTo,
    '--page-soft-bg': appTheme.softBackground,
  } as CSSProperties

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setSearchError('Please enter an order number or mobile number')
      return
    }

    // Validate phone number (10 digits) or order ID
    const trimmedValue = searchValue.trim()
    const isPhoneNumber = /^\d{10}$/.test(trimmedValue)
    const orderId = parseInt(trimmedValue)

    setSearchLoading(true)
    setSearchError('')
    setSearchResults([])
    setHasSearched(true)

    try {
      if (isPhoneNumber) {
        // Search by phone number (10 digits)
        const response = await axiosInstance.get(`/api/orders/search?phone=${encodeURIComponent(trimmedValue)}`)
        if (response.data.success && response.data.orders.length > 0) {
          setSearchResults(response.data.orders)
        } else {
          setSearchError('')
          setSearchResults([])
        }
      } else if (!isNaN(orderId) && orderId > 0) {
        // Search by order ID
        const response = await axiosInstance.get(`/api/orders/${orderId}`)
        if (response.data.success && response.data.order) {
          setSearchResults([response.data.order])
        } else {
          setSearchError('')
          setSearchResults([])
        }
      } else {
        setSearchError('Please enter a valid 10-digit mobile number or order number')
        setSearchResults([])
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSearchError('')
        setSearchResults([])
      } else {
        setSearchError(error.response?.data?.error || 'An error occurred while searching. Please try again.')
        setSearchResults([])
      }
    } finally {
      setSearchLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
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

  const formatOrderDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid'
      case 'confirmed':
        return 'Confirmed'
      case 'payment_pending':
        return 'Payment Pending'
      case 'payment_failed':
        return 'Payment Failed'
      default:
        return 'Pending'
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'paid' || status === 'confirmed') {
      return 'bg-green-100 text-green-800'
    } else if (status === 'payment_failed') {
      return 'bg-red-100 text-red-800'
    } else {
      return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="min-h-screen bg-[var(--page-soft-bg)] pt-14 pb-16 lg:pb-0" style={ctaVars}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-6xl">
        {/* Search Input Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => {
                const value = e.target.value
                // Allow only digits
                if (/^\d*$/.test(value)) {
                  setSearchValue(value)
                  setSearchError('')
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder="Search orders..."
              className={`w-full sm:flex-[3] sm:min-w-0 px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base ${
                searchError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searchLoading}
              style={ctaVars}
              className={`w-full sm:w-auto sm:flex-shrink-0 px-4 py-3 lg:py-3.5 rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 font-semibold text-sm ${
                searchLoading
                  ? isSweetshopTheme
                    ? 'bg-[var(--cta-bg-disabled)] text-white opacity-70 cursor-not-allowed shadow-none'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                  : isSweetshopTheme
                    ? 'bg-[var(--cta-bg)] text-white hover:bg-[var(--cta-bg-hover)] shadow-md hover:shadow-lg active:scale-[0.98]'
                    : 'bg-[#4CAF50] text-white hover:bg-[#2E7D32] shadow-md hover:shadow-lg active:scale-[0.98]'
              }`}
              aria-label="Search"
            >
              {searchLoading ? (
                <svg className="animate-spin h-5 w-5 shrink-0 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <Search className="h-5 w-5 shrink-0" aria-hidden />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {searchError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{searchError}</p>
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            {searchResults.map((order: any) => {
              const orderTotal = Number(order.amount) || 0

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleViewOrderItems(order)}
                >
                  <div className="p-4 sm:p-6">
                    {/* Mobile Layout: Two lines */}
                    <div className="sm:hidden space-y-3">
                      {/* Line 1: Order Number and Date */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Order Number</p>
                          <p className="font-semibold text-gray-900 text-base">
                            #{order.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Order Date</p>
                          <p className="font-medium text-gray-800 text-sm">
                            {formatOrderDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Line 2: Status and Total */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total</p>
                          <p className="font-bold text-gray-900 text-base">
                            ₹{orderTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tablet/Desktop Layout: Grid */}
                    <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                      {/* Order Number */}
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Order Number</p>
                        <p className="font-semibold text-gray-900 text-base sm:text-lg">
                          #{order.id}
                        </p>
                      </div>

                      {/* Order Date */}
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Order Date</p>
                        <p className="font-medium text-gray-800 text-sm sm:text-base">
                          {formatOrderDate(order.createdAt)}
                        </p>
                      </div>

                      {/* Order Status */}
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>

                      {/* Order Total */}
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Total</p>
                        <p className="font-bold text-gray-900 text-base sm:text-lg">
                          ₹{orderTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State - Show when no results and search was performed */}
        {hasSearched && searchResults.length === 0 && !searchLoading && !searchError && (
          <div className="py-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No orders found</p>
            <p className="text-sm sm:text-base text-gray-600">
              Try searching with a different order number or mobile number
            </p>
          </div>
        )}

        {/* Initial State - Show when no search has been performed */}
        {!hasSearched && !searchLoading && (
          <div className="py-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Search for Orders</p>
            <p className="text-sm sm:text-base text-gray-600">
              Enter an order number or mobile number to search for orders
            </p>
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

