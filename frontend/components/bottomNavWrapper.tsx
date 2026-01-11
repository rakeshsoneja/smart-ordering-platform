'use client'

import { usePathname } from 'next/navigation'
import BottomNavigation from './bottomNavigation'

/**
 * Bottom Navigation Wrapper
 * Conditionally renders BottomNavigation based on the current route
 * Hidden on admin routes
 */
export default function BottomNavWrapper() {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin') || false

  // Don't show bottom navigation on admin routes
  if (isAdminRoute) {
    return null
  }

  return <BottomNavigation />
}

