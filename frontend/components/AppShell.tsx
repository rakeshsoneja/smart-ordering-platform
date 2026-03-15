'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import BottomNavWrapper from '@/components/bottomNavWrapper'

/**
 * AppShell - Conditionally renders app chrome (Header, Footer, Nav).
 * For /order-details/* (WhatsApp Order Details link), shows only the page content
 * (receipt view) without header, footer, or bottom nav - matching admin print receipt.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isReceiptOnlyPage = pathname?.startsWith('/order-details/')

  if (isReceiptOnlyPage) {
    return (
      <div className="min-h-screen bg-white">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col h-full">
      <Header />
      <main className="flex-grow pt-14 pb-16 lg:pb-0 overflow-y-auto">
        {children}
        <Footer />
      </main>
      <BottomNavWrapper />
    </div>
  )
}
