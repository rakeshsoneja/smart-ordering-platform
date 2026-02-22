'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Truck } from 'lucide-react'
import axiosInstance from '@/lib/axiosConfig'

interface DeliveryConfig {
  configId: number
  weightUnitGrams: number
  chargeAmount: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export default function DeliveryConfigPage() {
  const [configs, setConfigs] = useState<DeliveryConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingConfig, setEditingConfig] = useState<DeliveryConfig | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    weightUnitGrams: '',
    chargeAmount: '',
    isActive: false,
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Fetch delivery configs
  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/api/admin/delivery-config')
      if (response.data.success) {
        setConfigs(response.data.configs)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch delivery configurations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.weightUnitGrams || parseFloat(formData.weightUnitGrams) <= 0) {
      newErrors.weightUnitGrams = 'Weight unit must be a positive number'
    }

    if (!formData.chargeAmount || parseFloat(formData.chargeAmount) < 0) {
      newErrors.chargeAmount = 'Charge amount must be a non-negative number'
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle add new config
  const handleAddConfig = () => {
    setEditingConfig(null)
    setFormData({
      weightUnitGrams: '',
      chargeAmount: '',
      isActive: false,
    })
    setFormErrors({})
    setShowModal(true)
  }

  // Handle edit config
  const handleEditConfig = (config: DeliveryConfig) => {
    setEditingConfig(config)
    setFormData({
      weightUnitGrams: config.weightUnitGrams.toString(),
      chargeAmount: config.chargeAmount.toString(),
      isActive: config.isActive,
    })
    setFormErrors({})
    setShowModal(true)
  }

  // Handle save config
  const handleSaveConfig = async () => {
    if (!validateForm()) {
      return
    }

    try {
      const configData = {
        weightUnitGrams: parseInt(formData.weightUnitGrams),
        chargeAmount: parseFloat(formData.chargeAmount),
        isActive: formData.isActive,
      }

      if (editingConfig) {
        // Update existing config
        await axiosInstance.put(`/api/admin/delivery-config/${editingConfig.configId}`, configData)
      } else {
        // Create new config
        await axiosInstance.post('/api/admin/delivery-config', configData)
      }

      setShowModal(false)
      fetchConfigs()
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to save delivery configuration'
      alert(errorMessage)
    }
  }

  // Handle delete config
  const handleDelete = async (configId: number) => {
    try {
      await axiosInstance.delete(`/api/admin/delivery-config/${configId}`)
      setDeleteConfirm(null)
      fetchConfigs()
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to delete delivery configuration'
      alert(errorMessage)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF7F3] flex items-center justify-center pt-14 pb-16 lg:pb-0">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF7F3] pt-14 pb-16 lg:pb-0">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Delivery Configuration
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage weight-based delivery charge settings
              </p>
            </div>
            <button
              onClick={handleAddConfig}
              className="flex items-center gap-2 bg-gradient-to-r from-[#FF6A3D] to-[#FF3D68] text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 shadow-md"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Add Configuration</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Configs List */}
        {configs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
            <Truck className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              No Delivery Configurations
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first delivery configuration to start charging based on weight
            </p>
            <button
              onClick={handleAddConfig}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FF6A3D] to-[#FF3D68] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              <span>Add Configuration</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Weight Unit (grams)
                    </th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Charge Amount (₹)
                    </th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {configs.map((config) => (
                    <tr key={config.configId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm sm:text-base text-gray-900">
                        {config.weightUnitGrams} g
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm sm:text-base text-gray-900">
                        ₹{config.chargeAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                        {config.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm sm:text-base">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditConfig(config)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(config.configId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-2">
            How Delivery Charge is Calculated
          </h3>
          <p className="text-xs sm:text-sm text-blue-800 mb-2">
            Delivery charge is calculated based on the total weight of items in the order:
          </p>
          <ul className="text-xs sm:text-sm text-blue-800 list-disc list-inside space-y-1">
            <li>Total weight = Sum of (variant weight × quantity) for all items</li>
            <li>Delivery charge = (total weight / weight unit) × charge amount</li>
            <li>Only one active configuration can exist at a time</li>
            <li>If no active configuration exists, delivery charge is ₹0</li>
          </ul>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {editingConfig ? 'Edit Configuration' : 'Add Configuration'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label htmlFor="weightUnitGrams" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Weight Unit (grams) *
                </label>
                <input
                  type="number"
                  id="weightUnitGrams"
                  name="weightUnitGrams"
                  value={formData.weightUnitGrams}
                  onChange={handleInputChange}
                  min="1"
                  step="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6A3D] focus:border-transparent ${
                    formErrors.weightUnitGrams ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 100"
                />
                {formErrors.weightUnitGrams && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.weightUnitGrams}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Example: 100 means every 100 grams (or part thereof) is charged
                </p>
              </div>

              <div>
                <label htmlFor="chargeAmount" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Charge Amount (₹) *
                </label>
                <input
                  type="number"
                  id="chargeAmount"
                  name="chargeAmount"
                  value={formData.chargeAmount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6A3D] focus:border-transparent ${
                    formErrors.chargeAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 20"
                />
                {formErrors.chargeAmount && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.chargeAmount}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Charge per weight unit (e.g., ₹20 per 100 grams)
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-[#FF6A3D] border-gray-300 rounded focus:ring-[#FF6A3D]"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Activate this configuration
                </label>
              </div>
              {formData.isActive && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ Activating this configuration will deactivate all other configurations
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#FF6A3D] to-[#FF3D68] text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
                >
                  {editingConfig ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Configuration</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this delivery configuration? This action cannot be undone.
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
    </div>
  )
}

