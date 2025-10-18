'use server'

import { redirect } from 'next/navigation'
import { createSessionWithTokens, destroySession, getRefreshToken } from '@/lib/auth/session'
import { loginSchema } from '@/lib/validations/auth.schema'
import serverApiClient from '@/lib/api/server-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { UserRole } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import type { AuthResponse } from '@/types/auth'

/**
 * Login action state
 */
export type LoginActionState = {
  error?: {
    email?: string[]
    password?: string[]
    message?: string
  }
  success?: {
    message?: string
  }
} | null

/**
 * Login server action
 * Uses Next.js 15 Server Actions with async request handling
 */
export async function login(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  // Validate input
  const email = formData.get('email')?.toString()?.trim()
  const password = formData.get('password')?.toString()?.trim()

  // Additional validation - check for empty values
  if (!email || !password) {
    return {
      error: {
        email: !email ? ['Email is required'] : undefined,
        password: !password ? ['Password is required'] : undefined,
      },
    }
  }

  const parsed = loginSchema.safeParse({
    email,
    password,
  })

  if (!parsed.success) {
    return {
      error: {
        ...parsed.error.flatten().fieldErrors,
      },
    }
  }

  try {
    // Call backend auth API
    const response = await serverApiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, parsed.data)

    // Extract data from response (API returns { success, data: { user, accessToken, refreshToken } })
    const { data } = response.data

    // Create session with tokens and set httpOnly cookies
    await createSessionWithTokens({
      session: {
        userId: data?.user?.id || 'unknown',
        customerId: data?.user?.customerId || 'default',
        role: UserRole.CUSTOMER_ADMIN, // Set as customer admin for now
        username: data?.user?.email || 'User', // Use email as username with fallback
        email: data?.user?.email || 'user@example.com',
      },
      accessToken: data?.accessToken || '',
      refreshToken: data?.refreshToken || '',
    })

    // Return success state - redirect will be handled by the form
    return {
      success: {
        message: 'Đăng nhập thành công!',
      },
    }
  } catch (error: unknown) {
    console.error('Login error:', error)

    // Try to extract error message from API response
    let errorMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.'

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: { data?: { message?: string; error?: string }; status: number }
      }
      const responseData = axiosError.response?.data

      if (responseData?.message) {
        // Translate common error messages to Vietnamese
        const message = responseData.message
        if (message === 'Invalid credentials') {
          errorMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.'
        } else if (message === 'User not found') {
          errorMessage = 'Không tìm thấy người dùng với email này'
        } else if (message === 'Account is disabled') {
          errorMessage = 'Tài khoản đã bị vô hiệu hóa'
        } else if (message === 'Too many login attempts') {
          errorMessage = 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau'
        } else {
          errorMessage = message
        }
      } else if (responseData?.error) {
        const error = responseData.error
        if (error === 'Unauthorized') {
          errorMessage = 'Không có quyền truy cập'
        } else {
          errorMessage = error
        }
      } else if (axiosError.response && axiosError.response.status === 401) {
        errorMessage = 'Email hoặc mật khẩu không đúng'
      } else if (axiosError.response && axiosError.response.status === 500) {
        errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau'
      } else if (axiosError.response && axiosError.response.status >= 400) {
        errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại'
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return {
      error: {
        message: errorMessage,
      },
    }
  }
}

/**
 * Logout server action
 */
export async function logout(): Promise<void> {
  try {
    // Get refresh token from cookies
    const refreshToken = await getRefreshToken()

    // Call backend logout API with refresh token
    if (refreshToken) {
      await serverApiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
        refreshToken: refreshToken,
      })
    }
  } catch (error) {
    console.error('Logout API error:', error)
    // Continue with logout even if API call fails
  }

  // Destroy session and cookies
  await destroySession()

  // Redirect to login
  redirect(ROUTES.LOGIN)
}
