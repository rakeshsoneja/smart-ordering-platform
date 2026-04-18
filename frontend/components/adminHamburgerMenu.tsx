'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { X, Package, ShoppingBag, Truck } from 'lucide-react'
import { getAppTheme } from '@/lib/theme'

interface AdminHamburgerMenuProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Admin Hamburger Menu Drawer
 * Slide-in navigation menu for tablet and mobile devices on admin routes
 */
export default function AdminHamburgerMenu({ isOpen, onClose }: AdminHamburgerMenuProps) {
  const pathname = usePathname()
  const router = useRouter()
  const prevPathnameRef = useRef<string>(pathname)
  const theme = getAppTheme()

  const isProductMaintenance = pathname === '/admin/product-maintenance'
  const isOrderMaintenance = pathname === '/admin/order-maintenance'
  const isDeliveryConfig = pathname === '/admin/delivery-config'

  // Close menu when route changes (only if pathname actually changed)
  useEffect(() => {
    // Only close if pathname actually changed (not on initial mount or when menu opens)
    if (prevPathnameRef.current !== pathname && isOpen) {
      onClose()
      prevPathnameRef.current = pathname
    } else if (prevPathnameRef.current !== pathname) {
      // Update ref even if menu is closed
      prevPathnameRef.current = pathname
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]) // Only depend on pathname - isOpen and onClose handled separately

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleLinkClick = (href: string) => {
    onClose()
    router.push(href)
  }

  return (
    <>
      {/* Backdrop - only visible when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-in Drawer - always in DOM for animation, but positioned off-screen when closed */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-[70] lg:hidden transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Admin Menu</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2">
          <button
            onClick={() => handleLinkClick('/admin/product-maintenance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors touch-manipulation ${
              isProductMaintenance ? 'font-semibold' : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={
              isProductMaintenance
                ? { backgroundColor: theme.primaryLight, color: theme.primary }
                : undefined
            }
          >
            <Package className="w-5 h-5 flex-shrink-0" />
            <span>Product Maintenance</span>
          </button>

          <button
            onClick={() => handleLinkClick('/admin/order-maintenance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors touch-manipulation ${
              isOrderMaintenance ? 'font-semibold' : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={
              isOrderMaintenance
                ? { backgroundColor: theme.primaryLight, color: theme.primary }
                : undefined
            }
          >
            <ShoppingBag className="w-5 h-5 flex-shrink-0" />
            <span>Order Maintenance</span>
          </button>

          <button
            onClick={() => handleLinkClick('/admin/delivery-config')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors touch-manipulation ${
              isDeliveryConfig ? 'font-semibold' : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={
              isDeliveryConfig
                ? { backgroundColor: theme.primaryLight, color: theme.primary }
                : undefined
            }
          >
            <Truck className="w-5 h-5 flex-shrink-0" />
            <span>Delivery Config</span>
          </button>
        </nav>
      </div>
    </>
  )
}
