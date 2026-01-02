import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import Header from '@/components/header'
import Footer from '@/components/footer'
import BottomNavigation from '@/components/bottomNavigation'
import { Providers } from './providers'
import { appConfig } from '@/lib/config'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: `${appConfig.shopName} - Order Delicious Sweets Online`,
  description: 'Order your favorite sweets and savories online with easy payment options',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FF6A3D',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} font-poppins`}>
        <Providers>
          <div className="min-h-screen flex flex-col h-full">
            <Header />
            <main className="flex-grow pt-14 pb-16 lg:pb-0 overflow-y-auto">
              {children}
              <Footer />
            </main>
            <BottomNavigation />
          </div>
        </Providers>
      </body>
    </html>
  )
}

