import axios from 'axios'

/**
 * Axios Configuration
 * Centralized axios instance with default configuration
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add any auth tokens or headers here if needed
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          console.error('Unauthorized - Please check your credentials')
          break
        case 403:
          console.error('Forbidden - You do not have permission')
          break
        case 404:
          console.error('Not Found - The requested resource was not found')
          break
        case 500:
          console.error('Server Error - Please try again later')
          break
        default:
          console.error('Request failed:', data?.error || error.message)
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error - Please check your internet connection')
    } else {
      // Something else happened
      console.error('Error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

export default axiosInstance








