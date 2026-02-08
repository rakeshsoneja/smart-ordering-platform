'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Package } from 'lucide-react'
import axiosInstance from '@/lib/axiosConfig'

interface Variant {
  variantId?: number
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
  unit: 'pc' | 'gms'
  unitValue: number
  image?: string
  category: string
  status: 'active' | 'disabled'
  variants?: Variant[]
}

export default function ProductMaintenancePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'pc' as 'pc' | 'gms',
    unitValue: '1',
    image: '',
    category: 'sweet',
    status: 'active' as 'active' | 'disabled',
  })

  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [variants, setVariants] = useState<Variant[]>([])
  const [inventoryData, setInventoryData] = useState<{ availableQuantityGrams: number; inventoryId?: number } | null>(null)
  const [inventoryLoading, setInventoryLoading] = useState(false)

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/api/products')
      if (response.data.success) {
        setProducts(response.data.products)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setFormErrors(prev => ({ ...prev, image: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' }))
      return
    }

    // Validate file size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors(prev => ({ ...prev, image: 'File size too large. Maximum size is 5 MB.' }))
      return
    }

    // Clear previous errors
    setFormErrors(prev => ({ ...prev, image: '' }))

    // Set selected file
    setSelectedImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    // Reset file input
    const fileInput = document.getElementById('image') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  // Variant management functions
  const handleAddVariant = () => {
    setVariants(prev => [...prev, {
      variantName: '',
      variantWeightGrams: undefined,
      variantPrice: 0,
      isDefaultVariant: prev.length === 0, // First variant is default
      isActive: true,
    }])
  }

  const handleRemoveVariant = (index: number) => {
    setVariants(prev => {
      const updated = prev.filter((_, i) => i !== index)
      // If we removed the default variant, make the first one default
      if (updated.length > 0 && prev[index].isDefaultVariant) {
        updated[0].isDefaultVariant = true
      }
      return updated
    })
  }

  const handleVariantChange = (index: number, field: keyof Variant, value: string | number | boolean | null) => {
    setVariants(prev => {
      const updated = [...prev]
      if (field === 'isDefaultVariant' && value === true) {
        // Unset other defaults
        updated.forEach((v, i) => {
          v.isDefaultVariant = i === index
        })
      } else {
        updated[index] = { ...updated[index], [field]: value }
      }
      return updated
    })
  }

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Product name is required'
    }

    // If no variants, validate legacy price/unit fields
    if (variants.length === 0) {
      if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
        errors.price = 'Valid price is required'
      }

      if (!formData.unitValue || isNaN(parseInt(formData.unitValue)) || parseInt(formData.unitValue) <= 0) {
        errors.unitValue = 'Valid unit value is required'
      }
    }

    // Validate variants if they exist
    if (variants.length > 0) {
      const defaultCount = variants.filter(v => v.isDefaultVariant).length
      if (defaultCount !== 1) {
        errors.variants = 'Exactly one variant must be marked as default'
      }

      variants.forEach((variant, index) => {
        if (!variant.variantName.trim()) {
          errors[`variant_name_${index}`] = 'Variant name is required'
        }
        if (!variant.variantPrice || isNaN(variant.variantPrice) || variant.variantPrice <= 0) {
          errors[`variant_price_${index}`] = 'Valid price is required'
        }
      })
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setUploading(true)
    setFormErrors({})

    try {
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name.trim())
      formDataToSend.append('description', formData.description.trim())
      
      // If variants exist, use default variant price; otherwise use form price
      if (variants.length > 0) {
        const defaultVariant = variants.find(v => v.isDefaultVariant) || variants[0]
        formDataToSend.append('price', defaultVariant.variantPrice.toString())
        // For variants, we still need unit/unitValue for backward compatibility
        // Try to extract from variant name or use defaults
        const weightMatch = defaultVariant.variantName.match(/(\d+)g/i)
        if (weightMatch) {
          formDataToSend.append('unit', 'gms')
          formDataToSend.append('unitValue', weightMatch[1])
        } else {
          formDataToSend.append('unit', 'pc')
          formDataToSend.append('unitValue', '1')
        }
      } else {
        formDataToSend.append('price', formData.price)
        formDataToSend.append('unit', formData.unit)
        formDataToSend.append('unitValue', formData.unitValue)
      }
      
      formDataToSend.append('category', formData.category)
      formDataToSend.append('status', formData.status)

      // Append image file if selected
      if (selectedImage) {
        formDataToSend.append('image', selectedImage)
      }

      // Use admin endpoints for file upload
      let productId: number
      if (editingProduct) {
        // Update product using admin endpoint
        const updateResponse = await axiosInstance.put(`/api/admin/products/${editingProduct.id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        productId = editingProduct.id
      } else {
        // Create product using admin endpoint
        const createResponse = await axiosInstance.post('/api/admin/products', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        productId = createResponse.data.product.id
      }

      // Handle variants
      if (variants.length > 0) {
        if (editingProduct) {
          // For editing: Update existing variants or create new ones
          try {
            // Get existing variants from database
            const existingVariantsResponse = await axiosInstance.get(`/api/variants/product/${productId}`)
            const existingVariants = existingVariantsResponse.data.success 
              ? existingVariantsResponse.data.variants 
              : []
            
            // Get IDs of variants that still exist in the form
            const currentVariantIds = variants
              .filter(v => v.variantId)
              .map(v => v.variantId)
            
            // Delete variants that were removed from the form
            for (const existingVariant of existingVariants) {
              if (!currentVariantIds.includes(existingVariant.variantId)) {
                try {
                  await axiosInstance.delete(`/api/variants/${existingVariant.variantId}`)
                } catch (err) {
                  console.error(`Error deleting variant ${existingVariant.variantId}:`, err)
                }
              }
            }
            
            // Update or create variants
            for (const variant of variants) {
              if (variant.variantId) {
                // Update existing variant
                try {
                  const updateResponse = await axiosInstance.put(`/api/variants/${variant.variantId}`, {
                    variantName: variant.variantName.trim(),
                    variantWeightGrams: variant.variantWeightGrams || null,
                    variantPrice: variant.variantPrice,
                    isDefaultVariant: variant.isDefaultVariant,
                    isActive: variant.isActive,
                  })
                  console.log(`✅ Updated variant ${variant.variantId}:`, updateResponse.data)
                } catch (err: any) {
                  console.error(`❌ Error updating variant ${variant.variantId}:`, err)
                  // Log the full error to see what's wrong
                  if (err.response) {
                    console.error('Error response:', err.response.data)
                  }
                  throw err
                }
              } else {
                // Create new variant
                try {
                  const createResponse = await axiosInstance.post('/api/variants', {
                    productId,
                    variantName: variant.variantName.trim(),
                    variantWeightGrams: variant.variantWeightGrams || null,
                    variantPrice: variant.variantPrice,
                    isDefaultVariant: variant.isDefaultVariant,
                    isActive: variant.isActive,
                  })
                  console.log(`✅ Created variant:`, createResponse.data)
                } catch (err: any) {
                  // If variant name already exists, it might be a race condition
                  if (err.response?.data?.error?.includes('already exists')) {
                    console.warn(`⚠️ Variant ${variant.variantName} already exists, skipping creation`)
                  } else {
                    console.error(`❌ Error creating variant:`, err)
                    if (err.response) {
                      console.error('Error response:', err.response.data)
                    }
                    throw err
                  }
                }
              }
            }
          } catch (err) {
            console.error('Error handling variants:', err)
            throw err
          }
        } else {
          // For new products: Create all variants
          for (const variant of variants) {
            await axiosInstance.post('/api/variants', {
              productId,
              variantName: variant.variantName.trim(),
              variantWeightGrams: variant.variantWeightGrams || null,
              variantPrice: variant.variantPrice,
              isDefaultVariant: variant.isDefaultVariant,
              isActive: variant.isActive,
            })
          }
        }
      }

      await fetchProducts()
      handleCloseModal()
    } catch (err: any) {
      console.error('Error saving product:', err)
      console.error('Error response:', err.response)
      
      let errorMessage = 'Failed to save product'
      
      if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.error 
          || err.response.data?.message
          || `Server error: ${err.response.status} ${err.response.statusText}`
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'Network error: Could not connect to server. Please ensure the backend server is running.'
      } else {
        // Something else happened
        errorMessage = err.message || 'An unexpected error occurred'
      }
      
      setFormErrors({ submit: errorMessage })
      
      // Also show in main error state for visibility
      setError(errorMessage)
      setTimeout(() => setError(''), 8000)
    } finally {
      setUploading(false)
    }
  }

  // Open modal for add
  const handleAddProduct = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      unit: 'pc',
      unitValue: '1',
      image: '',
      category: 'sweet',
      status: 'active',
    })
    setVariants([])
    setSelectedImage(null)
    setImagePreview(null)
    setFormErrors({})
    setShowModal(true)
  }

  // Fetch inventory for a product (product-level only)
  const fetchInventory = async (productId: number) => {
    try {
      const response = await axiosInstance.get(`/api/inventory/product/${productId}`)
      if (response.data.success && response.data.inventory.length > 0) {
        // Get the first (and only) inventory record for the product
        const inv = response.data.inventory[0]
        setInventoryData({
          availableQuantityGrams: inv.availableQuantityGrams || 0,
          inventoryId: inv.inventoryId,
        })
      } else {
        setInventoryData(null)
      }
    } catch (err) {
      console.error('Error fetching inventory:', err)
      setInventoryData(null)
    }
  }

  // Open modal for edit
  const handleEditProduct = async (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      unit: product.unit,
      unitValue: product.unitValue.toString(),
      image: product.image || '',
      category: product.category,
      status: product.status,
    })
    
    // Fetch variants for this product
    try {
      const variantsResponse = await axiosInstance.get(`/api/variants/product/${product.id}`)
      if (variantsResponse.data.success) {
        const fetchedVariants = variantsResponse.data.variants.map((v: any) => ({
          variantId: v.variantId,
          variantName: v.variantName,
          variantWeightGrams: v.variantWeightGrams,
          variantPrice: v.variantPrice,
          isDefaultVariant: v.isDefaultVariant,
          isActive: v.isActive,
        }))
        setVariants(fetchedVariants)
      } else {
        setVariants([])
      }
    } catch (err) {
      console.error('Error fetching variants:', err)
      setVariants([])
    }
    
    // Fetch inventory for this product
    await fetchInventory(product.id)
    
    setSelectedImage(null)
    setImagePreview(product.image || null) // Show existing image as preview
    setFormErrors({})
    setShowModal(true)
  }

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setVariants([])
    setSelectedImage(null)
    setImagePreview(null)
    setFormErrors({})
    setUploading(false)
    setInventoryData(null)
    setInventoryLoading(false)
  }

  // Update inventory for a product (product-level only)
  const handleUpdateInventory = async (productId: number, quantityGrams: number) => {
    setInventoryLoading(true)
    
    try {
      await axiosInstance.post('/api/inventory', {
        productId,
        availableQuantityGrams: quantityGrams,
      })
      
      // Refresh inventory data
      await fetchInventory(productId)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update inventory')
    } finally {
      setInventoryLoading(false)
    }
  }

  // Add quantity to inventory (product-level only)
  const handleAddInventory = async (productId: number, quantityToAddGrams: number) => {
    setInventoryLoading(true)
    
    try {
      await axiosInstance.post('/api/inventory/add', {
        productId,
        quantityToAdd: quantityToAddGrams,
      })
      
      // Refresh inventory data
      await fetchInventory(productId)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add inventory')
    } finally {
      setInventoryLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async (productId: number) => {
    try {
      await axiosInstance.delete(`/api/products/${productId}`)
      await fetchProducts()
      setDeleteConfirm(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete product')
    }
  }

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800'
  }

  // Helper function to render product image
  const renderProductImage = (image: string | undefined, size: 'small' | 'large' = 'small') => {
    const isUrl = image && (image.startsWith('http://') || image.startsWith('https://'))
    const sizeClasses = size === 'small' ? 'w-12 h-12' : 'w-16 h-16 sm:w-20 sm:h-20'
    const emojiSize = size === 'small' ? 'text-2xl' : 'text-3xl sm:text-4xl'
    
    if (isUrl) {
      return (
        <div className={`${sizeClasses} relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center`}>
          <img
            src={image}
            alt="Product"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide image and show emoji fallback
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const fallback = target.nextElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'flex'
            }}
          />
          <span className={`${emojiSize} hidden fallback-emoji`}>🍬</span>
        </div>
      )
    }
    
    return (
      <div className={`${sizeClasses} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <span className={emojiSize}>
          {image || '🍬'}
        </span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF7F3] pt-14 pb-16 lg:pb-0">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Product Maintenance</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your product catalog</p>
          </div>
          <button
            onClick={handleAddProduct}
            className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-[#FF6A3D] to-[#FF3D68] text-white rounded-lg hover:shadow-xl hover:shadow-[#FF6A3D]/30 transition-all font-semibold text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          No products found. Click "Add Product" to get started.
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="mr-3 relative">
                                {renderProductImage(product.image, 'small')}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">₹{product.price}</div>
                            <div className="text-sm text-gray-500">
                              {product.unit === 'pc' ? `per ${product.unitValue} piece${product.unitValue > 1 ? 's' : ''}` : `per ${product.unitValue}g`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 capitalize">{product.category}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(product.status)}`}>
                              {product.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                                aria-label="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(product.id)}
                                className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                                aria-label="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tablet/Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {products.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <p className="text-gray-500">No products found. Click "Add Product" to get started.</p>
                </div>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="relative flex-shrink-0">
                          {renderProductImage(product.image, 'large')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Price</p>
                        <p className="text-sm font-semibold text-gray-900">₹{product.price}</p>
                        <p className="text-xs text-gray-500">
                          {product.unit === 'pc' ? `per ${product.unitValue} piece${product.unitValue > 1 ? 's' : ''}` : `per ${product.unitValue}g`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Category</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{product.category}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(product.status)}`}>
                          {product.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Product</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to disable this product? This action can be undone by editing the product.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={handleCloseModal}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </h2>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {formErrors.submit && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{formErrors.submit}</p>
                  </div>
                )}

                {/* Responsive Layout: Desktop has form on left, image on right; Mobile/Tablet stacks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Form Fields Section */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6A3D] focus:border-transparent ${
                          formErrors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Gulab Jamun"
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A3D] focus:border-transparent resize-none"
                        placeholder="Product description"
                      />
                    </div>

                    {/* Legacy Price/Unit fields - only shown if no variants */}
                    {variants.length === 0 && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                              Price (₹) *
                            </label>
                            <input
                              type="number"
                              id="price"
                              name="price"
                              value={formData.price}
                              onChange={handleInputChange}
                              step="0.01"
                              min="0"
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6A3D] focus:border-transparent ${
                                formErrors.price ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="250"
                            />
                            {formErrors.price && (
                              <p className="mt-1 text-xs text-red-600">{formErrors.price}</p>
                            )}
                          </div>

                          <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                              Unit *
                            </label>
                            <select
                              id="unit"
                              name="unit"
                              value={formData.unit}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A3D] focus:border-transparent"
                            >
                              <option value="pc">Piece</option>
                              <option value="gms">Grams</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="unitValue" className="block text-sm font-medium text-gray-700 mb-1">
                            Unit Value *
                          </label>
                          <input
                            type="number"
                            id="unitValue"
                            name="unitValue"
                            value={formData.unitValue}
                            onChange={handleInputChange}
                            min="1"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6A3D] focus:border-transparent ${
                              formErrors.unitValue ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="1"
                          />
                          {formErrors.unitValue && (
                            <p className="mt-1 text-xs text-red-600">{formErrors.unitValue}</p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Variants Section */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Product Variants {variants.length === 0 && '(Optional)'}
                        </label>
                        <button
                          type="button"
                          onClick={handleAddVariant}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Variant
                        </button>
                      </div>

                      {formErrors.variants && (
                        <p className="mb-2 text-xs text-red-600">{formErrors.variants}</p>
                      )}

                      {variants.length === 0 && (
                        <p className="text-xs text-gray-500 mb-4">
                          If no variants are added, the product will use the price and unit fields above.
                        </p>
                      )}

                      <div className="space-y-4">
                        {variants.map((variant, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Variant {index + 1} {variant.isDefaultVariant && <span className="text-xs font-normal text-blue-600">(Default)</span>}
                              </h4>
                              {variants.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariant(index)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  aria-label="Remove variant"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Variant Name (e.g., 250g, 500g) *
                                </label>
                                <input
                                  type="text"
                                  value={variant.variantName}
                                  onChange={(e) => handleVariantChange(index, 'variantName', e.target.value)}
                                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6A3D] focus:border-transparent ${
                                    formErrors[`variant_name_${index}`] ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                  placeholder="250g"
                                />
                                {formErrors[`variant_name_${index}`] && (
                                  <p className="mt-1 text-xs text-red-600">{formErrors[`variant_name_${index}`]}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Weight (grams) <span className="text-gray-400">(Optional)</span>
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={variant.variantWeightGrams || ''}
                                  onChange={(e) => handleVariantChange(index, 'variantWeightGrams', e.target.value ? parseInt(e.target.value) : null)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6A3D] focus:border-transparent"
                                  placeholder="250"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Price (₹) *
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={variant.variantPrice}
                                  onChange={(e) => handleVariantChange(index, 'variantPrice', parseFloat(e.target.value) || 0)}
                                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6A3D] focus:border-transparent ${
                                    formErrors[`variant_price_${index}`] ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                  placeholder="250.00"
                                />
                                {formErrors[`variant_price_${index}`] && (
                                  <p className="mt-1 text-xs text-red-600">{formErrors[`variant_price_${index}`]}</p>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-4">
                              <label className="flex items-center gap-2 text-xs text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={variant.isDefaultVariant}
                                  onChange={(e) => handleVariantChange(index, 'isDefaultVariant', e.target.checked)}
                                  className="rounded border-gray-300 text-[#FF6A3D] focus:ring-[#FF6A3D]"
                                />
                                <span>Default Variant</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={variant.isActive}
                                  onChange={(e) => handleVariantChange(index, 'isActive', e.target.checked)}
                                  className="rounded border-gray-300 text-[#FF6A3D] focus:ring-[#FF6A3D]"
                                />
                                <span>Active</span>
                              </label>
                            </div>

                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Inventory Management for Product (product-level, shared across all variants) */}
                    {editingProduct && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Inventory Management (Product Level)
                        </label>
                        <p className="text-xs text-gray-600 mb-3">
                          {variants.length > 0 
                            ? 'Inventory is shared across all variants. Orders deduct from this total based on variant weight × quantity.'
                            : 'Set the total available inventory for this product in grams.'}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <p className="text-xs text-gray-600 mb-1">Available Quantity (grams)</p>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={inventoryData?.availableQuantityGrams ?? ''}
                                onChange={(e) => {
                                  const newQuantity = e.target.value ? parseInt(e.target.value) : 0
                                  handleUpdateInventory(editingProduct.id, newQuantity)
                                }}
                                disabled={inventoryLoading}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6A3D] focus:border-transparent disabled:opacity-50"
                                placeholder="0"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  handleAddInventory(editingProduct.id, 1000)
                                }}
                                disabled={inventoryLoading}
                                className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                              >
                                +1kg
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {inventoryData?.availableQuantityGrams !== undefined
                                ? `${inventoryData.availableQuantityGrams}g available`
                                : 'No inventory record (treated as in stock)'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                          Category *
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A3D] focus:border-transparent"
                        >
                          <option value="sweet">Sweet</option>
                          <option value="savory">Savory</option>
                        </select>
                      </div>
                    </div>

                    {/* Image Upload Field */}
                    <div>
                      <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                        Product Image
                      </label>
                      <input
                        type="file"
                        id="image"
                        name="image"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A3D] focus:border-transparent text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#FF6A3D] file:text-white hover:file:bg-[#FF5A2D] file:cursor-pointer"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Accepted formats: JPEG, PNG, WebP. Max size: 5 MB
                      </p>
                      {formErrors.image && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.image}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A3D] focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                  </div>

                  {/* Image Preview Section - Responsive Layout */}
                  <div className="lg:sticky lg:top-6 lg:self-start">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image Preview
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[200px] flex items-center justify-center">
                      {imagePreview ? (
                        <div className="relative w-full">
                          <img
                            src={imagePreview}
                            alt="Product preview"
                            className="w-full h-auto max-h-[400px] object-contain rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                            aria-label="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400">
                          <p className="text-sm">No image selected</p>
                          <p className="text-xs mt-1">Upload an image to see preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={uploading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-[#FF6A3D] to-[#FF3D68] text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <span>{editingProduct ? 'Update Product' : 'Create Product'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

