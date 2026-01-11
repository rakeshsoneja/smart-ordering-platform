'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Admin Landing Page
 * 
 * Desktop: Redirects to Product Maintenance by default
 * Tablet & Mobile: Shows "Welcome Admin" message
 */
export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    // Only redirect on desktop (lg breakpoint: 1024px and above)
    // Use a media query to detect desktop size
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    
    const handleMediaChange = (e: MediaQueryListEvent) => {
      // If desktop size, redirect to product maintenance
      if (e.matches) {
        router.replace('/admin/product-maintenance')
      }
    }

    // Check initial size - redirect if desktop
    if (mediaQuery.matches) {
      router.replace('/admin/product-maintenance')
    }

    // Listen for changes (though this is rare for window resizing)
    mediaQuery.addEventListener('change', handleMediaChange)

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#FFF7F3] flex items-center justify-center pt-14 pb-16 lg:pb-0">
      {/* Desktop: Show loading/redirecting (will redirect quickly) */}
      <div className="hidden lg:block text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>

      {/* Tablet & Mobile: Show Welcome Admin message */}
      <div className="lg:hidden text-center px-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Welcome Admin</h1>
        <p className="text-base sm:text-lg text-gray-600">Use the menu to navigate</p>
      </div>
    </div>
  )
}
