'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingCart, Search } from 'lucide-react'
import { useCart } from '@/context/cartContext'

export default function BottomNavigation() {
  const pathname = usePathname()
  const { cartItems } = useCart()
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const isShopActive = pathname === '/'
  const isCartActive = pathname === '/cart'
  const isSearchActive = pathname === '/search'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg lg:hidden">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around h-16">
          {/* Shop Tab */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
              isShopActive
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Home 
              className={`w-5 h-5 ${isShopActive ? 'text-gray-900' : 'text-gray-500'}`} 
              strokeWidth={isShopActive ? 2.5 : 2}
            />
            <span className={`text-xs font-medium ${isShopActive ? 'text-gray-900' : 'text-gray-500'}`}>
              Shop
            </span>
          </Link>

          {/* Search Tab */}
          <Link
            href="/search"
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
              isSearchActive
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Search 
              className={`w-5 h-5 ${isSearchActive ? 'text-gray-900' : 'text-gray-500'}`} 
              strokeWidth={isSearchActive ? 2.5 : 2}
            />
            <span className={`text-xs font-medium ${isSearchActive ? 'text-gray-900' : 'text-gray-500'}`}>
              Search
            </span>
          </Link>

          {/* Cart Tab */}
          <Link
            href="/cart"
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative ${
              isCartActive
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="relative">
              <ShoppingCart 
                className={`w-5 h-5 ${isCartActive ? 'text-gray-900' : 'text-gray-500'}`} 
                strokeWidth={isCartActive ? 2.5 : 2}
              />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#FF6B6B] text-white rounded-full flex items-center justify-center text-[10px] font-semibold">
                  {cartItemCount}
                </span>
              )}
            </div>
            <span className={`text-xs font-medium ${isCartActive ? 'text-gray-900' : 'text-gray-500'}`}>
              Cart
            </span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

