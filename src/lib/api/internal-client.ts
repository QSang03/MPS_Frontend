import axios from 'axios'
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

/**
 * Client-side axios instance để gọi Next.js API Routes (không gọi trực tiếp backend)
 * Tránh CORS issues và cho phép Next.js API Routes xử lý HttpOnly cookies
 *
 * Flow: Client → /api/* (Next.js) → Backend API
 */
const internalApiClient: AxiosInstance = axios.create({
  baseURL: '/', // Gọi vào chính Next.js app
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Quan trọng: gửi cookies trong same-origin requests
})

// Singleton promise để tránh refresh đồng thời
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

// Request interceptor: if a refresh is in progress, pause new outgoing requests
// until the refresh completes. This prevents a burst of requests from all
// failing with 401 while a refresh is underway — they will wait and then
// continue with the new session state.
internalApiClient.interceptors.request.use(
  async (config) => {
    try {
      if (isRefreshing && refreshPromise) {
        // Wait for the refresh to finish (may throw if refresh failed)
        await refreshPromise
      }
      return config
    } catch (err) {
      // If refresh failed, reject the request so callers can handle it.
      return Promise.reject(err)
    }
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle 401 và refresh token
internalApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // Handle 401 - try refresh token once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Nếu đang refresh, chờ promise hiện tại
        if (isRefreshing && refreshPromise) {
          await refreshPromise
          return internalApiClient(originalRequest)
        }

        // Bắt đầu refresh mới
        isRefreshing = true
        refreshPromise = (async () => {
          try {
            console.log('[Internal Client] Access token hết hạn, gọi /api/auth/refresh...')

            const refreshResponse = await fetch('/api/auth/refresh', {
              method: 'POST',
              credentials: 'include', // Gửi cookies
            })

            if (!refreshResponse.ok) {
              throw new Error('Refresh token thất bại')
            }

            const { accessToken } = await refreshResponse.json()
            console.log('[Internal Client] Refresh token thành công')

            // Wait a bit for cookies to be set by the server
            await new Promise((resolve) => setTimeout(resolve, 100))

            return accessToken
          } catch (err) {
            console.error('[Internal Client] Refresh token thất bại, chuyển về trang login')
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
            throw err
          } finally {
            isRefreshing = false
            refreshPromise = null
          }
        })()

        await refreshPromise
        // Retry original request
        return internalApiClient(originalRequest)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }

    // Handle 403 - forbidden
    if (error.response?.status === 403) {
      console.error('[Internal Client] Forbidden: Không có quyền truy cập')
    }

    return Promise.reject(error)
  }
)

export default internalApiClient
