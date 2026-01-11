'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingCart, Search, Menu } from 'lucide-react'
import { appConfig } from '@/lib/config'
import { useCart } from '@/context/cartContext'
import AdminHamburgerMenu from './adminHamburgerMenu'

export default function Header() {
  const pathname = usePathname()
  const { cartItems } = useCart()
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false)

  // Check if we're on an admin route
  const isAdminRoute = pathname?.startsWith('/admin') || false

  // Handler to close the hamburger menu
  const handleCloseMenu = () => {
    setIsHamburgerOpen(false)
  }

  const isShopActive = pathname === '/'
  const isCartActive = pathname === '/cart'
  const isSearchActive = pathname === '/search'

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-md lg:max-w-7xl mx-auto px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-1 sm:gap-3 flex-nowrap">
            {/* Left: Logo + Brand Title */}
            <div className="flex items-center gap-1 sm:gap-3">
              <Link 
                href={isAdminRoute ? "/admin" : "/"}
                className="touch-manipulation flex-shrink-0"
              >
                <div className="relative w-10 h-10">
                  {/* Outer solid white border */}
                  <div className="absolute inset-0 rounded-full border-2 border-white"></div>
                  {/* Inner dotted white border */}
                  <div className="absolute inset-0.5 rounded-full border border-dotted border-white"></div>
                  {/* Red/Coral circle background */}
                  <div className="absolute inset-1 rounded-full bg-[#FF6B6B] flex items-center justify-center">
                    <span className="text-white text-xl font-bold" style={{ fontFamily: 'cursive' }}>S</span>
                  </div>
                </div>
              </Link>

              {/* Brand Title */}
              <h1 className="text-xl lg:text-2xl font-bold text-[#C41E3A] leading-tight whitespace-nowrap">
                {appConfig.shopName || 'Siva Ganapathy Sweets'}
              </h1>
            </div>

            {/* Right: Navigation Items */}
            <div className="flex items-center gap-0 sm:gap-1 lg:gap-6 flex-shrink-0">
              {/* Search Icon - Hidden on mobile, visible on tablet/desktop (hidden on admin routes for tablet/mobile) */}
              {!isAdminRoute && (
                <Link
                  href="/search"
                  className={`hidden sm:flex items-center justify-center w-9 h-9 lg:w-auto lg:h-auto lg:px-4 lg:py-2 rounded-lg transition-colors flex-shrink-0 ${
                    isSearchActive
                      ? 'text-gray-900 font-semibold bg-gray-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  aria-label="Search Orders"
                >
                  <Search className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={isSearchActive ? 2.5 : 2} />
                  <span className="hidden lg:inline ml-2 font-medium">Search</span>
                </Link>
              )}

              {/* Desktop Navigation Items - Always show on desktop (lg breakpoint and above) */}
              <div className="hidden lg:flex items-center gap-6">
                <Link
                  href="/"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isShopActive
                      ? 'text-gray-900 font-semibold bg-gray-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Home className="w-5 h-5" strokeWidth={isShopActive ? 2.5 : 2} />
                  <span className="font-medium">Shop</span>
                </Link>

                <Link
                  href="/cart"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors relative ${
                    isCartActive
                      ? 'text-gray-900 font-semibold bg-gray-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5" strokeWidth={isCartActive ? 2.5 : 2} />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#FF6B6B] text-white rounded-full flex items-center justify-center text-xs font-semibold">
                        {cartItemCount}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">Cart</span>
                </Link>
              </div>

              {/* Mobile/Tablet: Hamburger Menu (Admin routes only) OR Cart Icon (Non-admin routes) */}
              {isAdminRoute ? (
                // Hamburger Menu for Admin routes (tablet & mobile only)
                <button
                  onClick={() => setIsHamburgerOpen(true)}
                  className="lg:hidden flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex-shrink-0 touch-manipulation"
                  aria-label="Open admin menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              ) : (
                // Cart Icon for Non-admin routes (tablet & mobile)
                <Link
                  href="/cart"
                  className="lg:hidden flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-colors relative text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex-shrink-0"
                  aria-label="Cart"
                >
                  <ShoppingCart className="w-4 h-4" strokeWidth={isCartActive ? 2.5 : 2} />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FF6B6B] text-white rounded-full flex items-center justify-center text-[10px] font-semibold">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Admin Hamburger Menu Drawer (Tablet & Mobile only) */}
      {isAdminRoute && (
        <AdminHamburgerMenu 
          isOpen={isHamburgerOpen} 
          onClose={handleCloseMenu}
        />
      )}
    </>
  )
}

