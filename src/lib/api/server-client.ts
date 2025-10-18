import axios from 'axios'
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { getAccessToken } from '@/lib/auth/session'

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

// Response interceptor - handle errors
serverApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // Handle 401 - KHÔNG thử làm mới token ở đây nữa.
    // Ném ra một lỗi cụ thể để Server Component có thể bắt và xử lý.
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.error('❌ Authentication failed on server-side request during page render.')
      // Sử dụng một thông báo lỗi nhất quán là rất quan trọng.
      return Promise.reject(new Error('Authentication failed - please login again'))
    }

    // Handle 403 - forbidden
    if (error.response?.status === 403) {
      console.error('You do not have permission to perform this action')
    }

    // Ném ra các lỗi khác để được xử lý.
    return Promise.reject(error)
  }
)

export default serverApiClient
