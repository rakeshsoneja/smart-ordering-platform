'use client'

import { useState, useEffect } from 'react'
import ProductCard from '@/components/productCard'
import { appConfig } from '@/lib/config'
import axiosInstance from '@/lib/axiosConfig'

interface Product {
  id: number
  name: string
  description: string
  price: number
  unit: 'pc' | 'gms'
  unitValue: number
  image?: string
  category: string
  status: 'active' | 'disabled'
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'sweet' | 'savory' | 'gift'>('all')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosInstance.get('/api/products?status=active')
        if (response.data.success) {
          setProducts(response.data.products)
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
        // Fallback to empty array on error
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

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

