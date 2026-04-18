import type { CSSProperties } from 'react'
import AdminNavigation from '@/components/adminNavigation'
import { getAppTheme } from '@/lib/theme'

/**
 * Admin Layout
 *
 * Desktop (lg and above): Shows horizontal navigation tabs
 * Tablet & Mobile (below lg): Navigation handled by hamburger menu in header
 *
 * Theme tokens (default vs sweetshop) mirror the shop app via `getAppTheme()`.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const theme = getAppTheme()
  const adminShellStyle = {
    '--admin-primary': theme.primary,
    '--admin-primary-hover': theme.primaryHover,
    '--admin-primary-light': theme.primaryLight,
    '--admin-soft-bg': theme.softBackground,
    '--admin-grad-from': theme.gradientFrom,
    '--admin-grad-to': theme.gradientTo,
  } as CSSProperties

  return (
    <div style={adminShellStyle}>
      <div className="hidden lg:block">
        <AdminNavigation />
      </div>
      {children}
    </div>
  )
}
