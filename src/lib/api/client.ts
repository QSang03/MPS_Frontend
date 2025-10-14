import axios from 'axios'
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { getClientAccessToken } from '@/lib/auth/client-auth'
import { refreshAccessTokenForClient } from '@/lib/auth/server-actions'

// Debug environment variable
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - attach token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get access token from server-side cookies via server action
    const token = await getClientAccessToken()

    // Debug logging
    console.log('Request interceptor - token:', token ? 'exists' : 'missing')
    console.log('Request URL:', config.url)
    console.log('Base URL:', config.baseURL)
    console.log('Full URL:', (config.baseURL || '') + (config.url || ''))

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('Authorization header set:', config.headers.Authorization)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors, refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // Handle 401 - try refresh token once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh access token
        const newToken = await refreshAccessTokenForClient()
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed - redirect to login
        console.error('Token refresh failed:', refreshError)
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    // Handle 403 - forbidden
    if (error.response?.status === 403) {
      // Show error toast
      console.error('You do not have permission to perform this action')
    }

    // Throw error to be handled by React Query or component
    return Promise.reject(error)
  }
)

export default apiClient

// Named export for easier imports
export const clientApiClient = apiClient
