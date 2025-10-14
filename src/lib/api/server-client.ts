import axios from 'axios'
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { getAccessToken, refreshAccessToken } from '@/lib/auth/session'

/**
 * Server-side API client with token attachment
 * This should only be used in server components and server actions
 */
const serverApiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - attach token from server-side cookies
serverApiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get access token from server-side cookies
    const token = await getAccessToken()

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors, refresh token
serverApiClient.interceptors.response.use(
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
        const newToken = await refreshAccessToken()
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return serverApiClient(originalRequest)
        } else {
          // Refresh token failed or expired - redirect to login
          console.error('Token refresh failed - no new token received')
          const { redirect } = await import('next/navigation')
          redirect('/login')
          return Promise.reject(new Error('Authentication failed'))
        }
      } catch (refreshError) {
        // Refresh failed - redirect to login
        console.error('Token refresh failed:', refreshError)
        return Promise.reject(refreshError)
      }
    }

    // Handle 403 - forbidden
    if (error.response?.status === 403) {
      console.error('You do not have permission to perform this action')
    }

    // Throw error to be handled by React Query or component
    return Promise.reject(error)
  }
)

export default serverApiClient
