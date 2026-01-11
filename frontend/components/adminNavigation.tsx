'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, ShoppingBag } from 'lucide-react'

export default function AdminNavigation() {
  const pathname = usePathname()

  const isProductMaintenance = pathname === '/admin/product-maintenance'
  const isOrderMaintenance = pathname === '/admin/order-maintenance'

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-14 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex gap-1 sm:gap-2 overflow-x-auto">
          <Link
            href="/admin/product-maintenance"
            className={`flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-medium transition-colors whitespace-nowrap border-b-2 ${
              isProductMaintenance
                ? 'border-[#FF6A3D] text-[#FF6A3D]'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Product Maintenance</span>
          </Link>
          <Link
            href="/admin/order-maintenance"
            className={`flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-medium transition-colors whitespace-nowrap border-b-2 ${
              isOrderMaintenance
                ? 'border-[#FF6A3D] text-[#FF6A3D]'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Order Maintenance</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

