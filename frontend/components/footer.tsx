import { appConfig } from '@/lib/config'

interface FooterProps {
  className?: string
}

export default function Footer({ className = '' }: FooterProps) {
  return (
    <footer className={`bg-gray-800 text-white mt-auto ${className}`}>
      <div className="max-w-md lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">🍬 {appConfig.shopName}</h3>
            <p className="text-xs sm:text-sm lg:text-base text-gray-400 break-words">
              {appConfig.shopDescription}
            </p>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Quick Links</h3>
            <ul className="space-y-1.5 text-xs sm:text-sm text-gray-400">
              <li><a href="/" className="hover:text-white transition-colors touch-manipulation">Home</a></li>
              <li><a href="/cart" className="hover:text-white transition-colors touch-manipulation">Cart</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Contact</h3>
            <div className="text-xs sm:text-sm lg:text-base text-gray-400 space-y-1">
              <p>
                Phone: <a href={`tel:${appConfig.shopPhoneNumber.replace(/\s+/g, '')}`} className="hover:text-white transition-colors">{appConfig.shopPhoneNumber}</a>
              </p>
              <p>
                Email: <a href="mailto:info@sweetshop.com" className="hover:text-white transition-colors">info@sweetshop.com</a>
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-4 sm:mt-6 pt-4 sm:pt-6 text-center text-xs sm:text-sm text-gray-400">
          <p>&copy; 2024 {appConfig.shopName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

