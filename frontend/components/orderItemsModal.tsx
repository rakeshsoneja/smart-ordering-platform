'use client'

interface OrderItemsModalProps {
  order: any
  onClose: () => void
}

export default function OrderItemsModal({ order, onClose }: OrderItemsModalProps) {
  const cartItems = typeof order.cartItems === 'string' 
    ? JSON.parse(order.cartItems) 
    : order.cartItems

  const totalAmount = cartItems.reduce((sum: number, item: any) => {
    const price = Number(item.price) || 0
    const quantity = Number(item.quantity) || 0
    return sum + (price * quantity)
  }, 0)

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-orange-500 px-5 sm:px-6 py-4 sm:py-5 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold">Order #{order.id}</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors text-2xl sm:text-3xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 sm:py-5 bg-gray-50">
          {/* Order Items - Similar to cart screen layout */}
          <div className="space-y-2 mb-4">
            {cartItems.map((item: any, index: number) => {
              const price = Number(item.price) || 0
              const quantity = Number(item.quantity) || 0
              const itemTotal = price * quantity
              const unitValue = item.unitValue || 1
              const unitLabel = item.unit === 'pc' 
                ? `${unitValue} ${unitValue === 1 ? 'pc' : 'pcs'}`
                : `${unitValue}g`
              
              return (
                <div 
                  key={index} 
                  className="flex justify-between items-start pb-2 border-b border-gray-200/50 last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 mb-0.5 text-sm sm:text-base">
                      {item.name || 'Unknown Item'} ({unitLabel})
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">Quantity: {quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm sm:text-base ml-4">
                    ₹ {itemTotal.toFixed(2)}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Total */}
          <div className="border-t-2 border-gray-300 pt-3 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg sm:text-xl font-bold text-gray-800">Total:</span>
              <span className="text-lg sm:text-xl font-bold text-gray-800">
                ₹ {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Order Details */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3 text-base sm:text-lg">Order Details</h3>
            <div className="space-y-2 text-sm sm:text-base text-gray-700">
              <p><span className="font-medium">Status:</span> {
                order.status === 'paid' ? 'Paid' : 
                order.status === 'confirmed' ? 'Confirmed' :
                order.status === 'payment_pending' ? 'Payment Pending' :
                order.status === 'payment_failed' ? 'Payment Failed' :
                'Pending'
              }</p>
              <p><span className="font-medium">Payment:</span> {
                order.paymentMode === 'razorpay' ? 'UPI / Card' : 'Cash on Delivery'
              }</p>
              <p><span className="font-medium">Date:</span> {
                new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }</p>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3 text-base sm:text-lg">Delivery Details</h3>
            <div className="space-y-2 text-sm sm:text-base text-gray-700">
              <p><span className="font-medium">Name:</span> {order.customerName}</p>
              <p><span className="font-medium">Phone:</span> {order.customerPhone}</p>
              <p><span className="font-medium">Address:</span></p>
              <p className="pl-2 sm:pl-4 break-words">{order.deliveryAddress}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-5 sm:px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-rose-600 hover:to-orange-600 active:scale-95 transition-all text-base sm:text-lg shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}







