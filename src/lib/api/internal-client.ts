import axios from 'axios'
import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosRequestConfig,
} from 'axios'
import { getLanguage } from '@/lib/utils/language'

/**
 * Client-side axios instance để gọi Next.js API Routes (không gọi trực tiếp backend)
 * Tránh CORS issues và cho phép Next.js API Routes xử lý HttpOnly cookies
 *
 * Flow: Client → /api/* (Next.js) → Backend API
 */
// Determine a sensible baseURL. On the browser we can use relative paths ('/').
// On the Node server, axios needs a full absolute URL — prefer NEXT_PUBLIC_BASE_URL
// if provided, otherwise fall back to localhost with the current port.
const defaultBase =
  typeof window !== 'undefined'
    ? '/'
    : process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT ?? 3000}`

const internalApiClient: AxiosInstance = axios.create({
  baseURL: defaultBase, // Gọi vào chính Next.js app
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Quan trọng: gửi cookies trong same-origin requests
})

// Simple in-memory dedupe map for GET requests. Keyed by URL + sorted params JSON.
// Store Promise<AxiosResponse<unknown>> so callers can access response.data with proper typing
const getDedupeMap = new Map<string, Promise<AxiosResponse<unknown>>>()

function makeGetKey(url: string, params?: Record<string, unknown>) {
  try {
    // Sort keys for stable keying
    if (!params) return url
    const ordered: Record<string, unknown> = {}
    Object.keys(params)
      .sort()
      .forEach((k) => {
        ordered[k] = params[k]
      })
    return `${url}|${JSON.stringify(ordered)}`
  } catch {
    return `${url}|${String(params)}`
  }
}

export async function getWithDedupe<T = unknown>(
  url: string,
  config?: { params?: Record<string, unknown> } & Record<string, unknown>
): Promise<AxiosResponse<T>> {
  const key = makeGetKey(url, config?.params)
  const existing = getDedupeMap.get(key) as Promise<AxiosResponse<T>> | undefined
  if (existing) return existing

  // Cast config to AxiosRequestConfig to avoid using `any`
  const cfg = config as unknown as AxiosRequestConfig | undefined

  const p = internalApiClient.get<T>(url, cfg).finally(() => {
    getDedupeMap.delete(key)
  }) as Promise<AxiosResponse<T>>
  getDedupeMap.set(key, p as Promise<AxiosResponse<unknown>>)
  return p
}

// Singleton promise để tránh refresh đồng thời
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

// Request interceptor: if a refresh is in progress, pause new outgoing requests
// until the refresh completes. This prevents a burst of requests from all
// failing with 401 while a refresh is underway — they will wait and then
// continue with the new session state.
// Also adds language preference as query parameter
internalApiClient.interceptors.request.use(
  async (config) => {
    try {
      if (isRefreshing && refreshPromise) {
        // Wait for the refresh to finish (may throw if refresh failed)
        await refreshPromise
      }

      // Add language preference as query parameter
      const language = getLanguage()
      if (config.params) {
        config.params.lang = language
      } else {
        config.params = { lang: language }
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

            // `fetch` in a Node/server context requires an absolute URL.
            // defaultBase is '/' in the browser and an absolute URL on the server
            // (NEXT_PUBLIC_BASE_URL or localhost:PORT). Build a refresh URL from
            // defaultBase so refresh works both in server and client renders.
            const refreshUrl = `${defaultBase.replace(/\/$/, '')}/api/auth/refresh`

            const refreshResponse = await fetch(refreshUrl, {
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

    // Handle 404 (No data) - treat as a non-exception so callers can render a
    // friendly empty state instead of failing with a network error. If the
    // response body already contains a JSON message, keep it; otherwise, map
    // to a standard message object.
    if (error.response?.status === 404) {
      const resp = error.response as AxiosResponse
      // If the backend gave something other than JSON (HTML 404 page), attach
      // a well-formed object so callers can read `data.message`
      if (!resp.data || typeof resp.data !== 'object') {
        // Mark as unknown instead of `any` to satisfy linter while keeping
        // the runtime behavior: callers can read `resp.data.message`.
        resp.data = { success: false, message: 'No data found' } as unknown
      }
      return Promise.resolve(resp)
    }

    // Attach response data/message to the thrown error so callers can show
    // a more descriptive message to the user instead of the generic
    // "Request failed with status code X".
    try {
      const respData = error.response?.data
      if (respData) {
        const e = error as unknown as Record<string, unknown>
        e.responseData = respData

        // Prefer a human message from the API when available
        const maybeMessage = (respData as Record<string, unknown>)?.['message']
        if (typeof maybeMessage === 'string' && maybeMessage.length > 0) {
          error.message = maybeMessage
        } else {
          // fallback: stringify the error body for debugging
          try {
            error.message = JSON.stringify(respData)
          } catch {
            // ignore stringify failures
          }
        }
      }
    } catch {
      // ignore
    }

    return Promise.reject(error)
  }
)

export default internalApiClient
