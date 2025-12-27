import axios from 'axios'
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { getClientAccessToken } from '@/lib/auth/client-auth'
import { getLanguage } from '@/lib/utils/language'

const apiClient: AxiosInstance = axios.create({
  // BFF proxying: browser calls same-origin Next.js route handler,
  // which then calls the real backend server-to-server.
  baseURL: '/api/backend',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - attach token and language preference
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get access token from server-side cookies via server action
    const token = await getClientAccessToken()

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add language preference as query parameter
    const language = getLanguage()
    if (config.params) {
      config.params.lang = language
    } else {
      config.params = { lang: language }
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
        console.log('Client: Access token đã hết hạn. Thử làm mới thông qua API route...')

        // *** THAY ĐỔI: Gọi Route Handler thay vì Server Action ***
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
        })

        if (!refreshResponse.ok) {
          // Nếu chính route làm mới cũng thất bại (ví dụ: refresh token không hợp lệ), ném lỗi để đăng xuất.
          throw new Error('Làm mới token từ API route thất bại.')
        }

        const { accessToken: newAccessToken } = await refreshResponse.json()

        // Thử lại yêu cầu ban đầu với token mới
        if (newAccessToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return apiClient(originalRequest)
        } else {
          throw new Error('Làm mới thành công nhưng không nhận được token mới.')
        }
      } catch (refreshError) {
        // Nếu làm mới thất bại vì bất kỳ lý do gì, chuyển hướng về trang đăng nhập.
        console.error(
          '[Client] Làm mới token thất bại, chuyển hướng về trang đăng nhập:',
          refreshError
        )
        if (typeof window !== 'undefined') {
          // Xóa cookie cũ và chuyển hướng
          document.cookie = 'mps_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    // Handle 403 - forbidden
    if (error.response?.status === 403) {
      console.error('You do not have permission to perform this action')
    }

    // Ném ra các lỗi khác để React Query hoặc component xử lý
    return Promise.reject(error)
  }
)

export default apiClient

// Named export for easier imports
export const clientApiClient = apiClient
