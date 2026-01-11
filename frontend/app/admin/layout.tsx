import AdminNavigation from '@/components/adminNavigation'

/**
 * Admin Layout
 * 
 * Desktop (lg and above): Shows horizontal navigation tabs
 * Tablet & Mobile (below lg): Navigation handled by hamburger menu in header
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Admin Navigation - Only show on desktop (lg breakpoint and above) */}
      {/* Tablet & Mobile use hamburger menu in header instead */}
      <div className="hidden lg:block">
        <AdminNavigation />
      </div>
      {children}
    </>
  )
}

