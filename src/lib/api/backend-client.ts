import axios, { AxiosInstance } from 'axios'

/**
 * Plain axios client cho API Routes
 * KHÔNG có interceptor, KHÔNG tự động thêm token
 * API Routes sẽ tự quản lý token từ cookies
 */
const backendApiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default backendApiClient
