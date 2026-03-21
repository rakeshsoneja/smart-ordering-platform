'use client'

import { useState, useEffect } from 'react'
import ProductCard from '@/components/productCard'
import { appConfig } from '@/lib/config'
import axiosInstance from '@/lib/axiosConfig'

interface Variant {
  variantId: number
  variantName: string
  variantWeightGrams?: number
  variantPrice: number
  isDefaultVariant: boolean
  isActive: boolean
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  unit?: 'pc' | 'gms' // Make optional since variants might not have this
  unitValue?: number // Make optional since variants might not have this
  image?: string
  category: string
  status: 'active' | 'disabled'
  variants?: Variant[] // ADD THIS - variants array
}

const PRODUCT_FETCH_ATTEMPTS = 3
const RETRY_DELAY_MS = 600

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'sweet' | 'savory' | 'gift'>('all')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  // Fetch products with retries (helps flaky mobile / cold API on first paint)
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setLoadError(null)

      for (let attempt = 1; attempt <= PRODUCT_FETCH_ATTEMPTS; attempt++) {
        try {
          const response = await axiosInstance.get('/api/products?status=active')
          if (cancelled) return

          const list = response.data?.products
          if (response.data?.success && Array.isArray(list)) {
            setProducts(list)
            setLoading(false)
            return
          }
          if (Array.isArray(list)) {
            setProducts(list)
            setLoading(false)
            return
          }
        } catch (error) {
          console.error('Failed to fetch products:', error)
        }

        if (cancelled) return
        if (attempt < PRODUCT_FETCH_ATTEMPTS) {
          await sleep(RETRY_DELAY_MS)
        }
      }

      if (!cancelled) {
        setProducts([])
        setLoadError('Could not load products. Check your connection and try again.')
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [fetchKey])

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : selectedCategory === 'gift'
    ? [] // No gift products yet
    : products.filter(p => p.category === selectedCategory)

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="max-w-md lg:max-w-7xl mx-auto px-4 py-4 lg:px-8 lg:py-8">
        {/* Products Section Header */}
        <section className="mb-4 lg:mb-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            Fresh Products
          </h2>
          <p className="text-sm lg:text-base text-gray-600">
            Quality products delivered fresh to your door
        </p>
        </section>

        {/* Category Selector */}
        <section className="mb-4 lg:mb-6">
          <div className="flex gap-2 overflow-x-auto lg:overflow-visible pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 lg:px-6 lg:py-2.5 rounded-full text-sm lg:text-base font-medium whitespace-nowrap transition-all ${
            selectedCategory === 'all'
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Items
        </button>
        <button
          onClick={() => setSelectedCategory('sweet')}
              className={`px-4 py-2 lg:px-6 lg:py-2.5 rounded-full text-sm lg:text-base font-medium whitespace-nowrap transition-all ${
            selectedCategory === 'sweet'
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
              Sweets
        </button>
        <button
          onClick={() => setSelectedCategory('savory')}
              className={`px-4 py-2 lg:px-6 lg:py-2.5 rounded-full text-sm lg:text-base font-medium whitespace-nowrap transition-all ${
            selectedCategory === 'savory'
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
              Savories
        </button>
        <button
              onClick={() => setSelectedCategory('gift')}
              className={`px-4 py-2 lg:px-6 lg:py-2.5 rounded-full text-sm lg:text-base font-medium whitespace-nowrap transition-all ${
                selectedCategory === 'gift'
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Gifts
        </button>
      </div>
        </section>

        {/* Product Grid - 2 columns on mobile, 4 columns on desktop */}
        {loading ? (
          <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse"></div>
            ))}
          </section>
        ) : loadError ? (
          <section className="text-center py-12 px-4">
            <p className="text-gray-700 mb-4">{loadError}</p>
            <button
              type="button"
              onClick={() => setFetchKey((k) => k + 1)}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </section>
        ) : filteredProducts.length === 0 ? (
          <section className="text-center py-12">
            <p className="text-gray-500">No products available in this category.</p>
          </section>
        ) : (
          <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
                onAddToCart={() => {}}
          />
        ))}
          </section>
      )}
      </main>
    </div>
  )
}

