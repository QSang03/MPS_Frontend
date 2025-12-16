'use server'

import { redirect } from 'next/navigation'
import { createSessionWithTokens, destroySession, getRefreshToken } from '@/lib/auth/session'
import { loginSchema } from '@/lib/validations/auth.schema'
import serverApiClient from '@/lib/api/server-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { UserRole } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import type { AuthResponse } from '@/types/auth'

/**
 * Safely resolve a human-readable customer name from the API response.
 * The API may return the name in different shapes (nested under user.customer,
 * a top-level customerName, or user.attributes.customerName). This helper
 * accepts an unknown payload and performs type-checked checks without using
 * `any`.
 */
function resolveCustomerName(payload: unknown): string {
  try {
    if (!payload || typeof payload !== 'object') return ''
    const d = payload as Record<string, unknown>

    // Check nested user.customer.name
    const user = d.user as Record<string, unknown> | undefined
    if (user && typeof user === 'object') {
      const customer = user.customer as Record<string, unknown> | undefined
      if (customer && typeof customer === 'object') {
        const name = customer.name
        if (typeof name === 'string' && name.trim().length > 0) return name
      }
    }

    // Check top-level customerName
    const topName = d.customerName
    if (typeof topName === 'string' && topName.trim().length > 0) return topName

    // Check user.attributes.customerName
    if (user && typeof user.attributes === 'object') {
      const attrs = user.attributes as Record<string, unknown>
      const attrName = attrs.customerName
      if (typeof attrName === 'string' && attrName.trim().length > 0) return attrName
    }
  } catch {
    // ignore
  }

  return ''
}

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
    isDefaultPassword?: boolean
    isDefaultCustomer?: boolean
    customerName?: string
    roleName?: string
    roleId?: string
    userId?: string
    customerId?: string
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

    // Extract data from response (API returns { success, data: { user, accessToken, refreshToken, isDefaultPassword } })
    const { data } = response.data

    // Get role from backend (data.user.role.name)
    const roleName = data?.user?.role?.name || 'User'
    const roleId = data?.user?.roleId || data?.user?.role?.id || null
    const role: UserRole = roleName // UserRole is now string type
    const isDefaultCustomer = data?.isDefaultCustomer || false

    // Debug: Log roleId to see what we're getting from backend
    console.log('[Auth] Extracted roleId from response:', {
      roleId,
      fromRoleId: data?.user?.roleId,
      fromRoleIdField: data?.user?.role?.id,
      userObject: data?.user,
    })

    // Save to localStorage for persistence across page refreshes
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mps_user_role', roleName)
        localStorage.setItem('mps_is_default_customer', String(isDefaultCustomer))
        localStorage.setItem('mps_user_id', data?.user?.id || '')
        localStorage.setItem('mps_customer_id', data?.user?.customerId || '')
        // Always set mps_role_id if roleId exists (even if it's an empty string, we'll handle it)
        if (roleId) {
          localStorage.setItem('mps_role_id', String(roleId))
          console.log('[Auth] Set mps_role_id to localStorage:', roleId)
        } else {
          // Remove mps_role_id if roleId is null/undefined
          localStorage.removeItem('mps_role_id')
          console.log('[Auth] Removed mps_role_id from localStorage (roleId is null/undefined)')
        }

        // Resolve customer name from the API payload without using `any`.
        const customerName = resolveCustomerName(data)
        localStorage.setItem('mps_customer_name', customerName)
      } catch (error) {
        console.error('Failed to save to localStorage:', error)
      }
    }

    // Create session with tokens and set httpOnly cookies
    await createSessionWithTokens({
      session: {
        userId: data?.user?.id || 'unknown',
        customerId: data?.user?.customerId || 'default',
        role,
        username: data?.user?.email || 'User', // Use email as username with fallback
        email: data?.user?.email || 'user@example.com',
        isDefaultPassword: data?.isDefaultPassword || false,
        isDefaultCustomer,
      },
      accessToken: data?.accessToken || '',
      refreshToken: data?.refreshToken || '',
    })

    // Return success state with flags for UI redirect
    return {
      success: {
        message: 'Login successful!',
        isDefaultPassword: data?.isDefaultPassword || false,
        isDefaultCustomer: data?.isDefaultCustomer || false,
        // include customer name so client can persist it when server action
        // runs on the server and cannot access window.localStorage.
        customerName: resolveCustomerName(data),
        // Include role name for client-side UI persistence
        roleName: String(roleName).toLowerCase(),
        roleId: roleId || undefined,
        // Include userId and customerId for client-side localStorage
        userId: data?.user?.id || undefined,
        customerId: data?.user?.customerId || undefined,
      },
    }
  } catch (error: unknown) {
    console.error('Login error:', error)

    // Try to extract error message from API response
    let errorMessage = 'Login failed. Please check your credentials.'

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: { data?: { message?: string; error?: string }; status: number }
      }
      const responseData = axiosError.response?.data

      if (responseData?.message) {
        // Translate common error messages to Vietnamese
        const message = responseData.message
        if (message === 'Invalid credentials') {
          errorMessage = 'Login failed. Please check your credentials.'
        } else if (message === 'User not found') {
          errorMessage = 'User with this email not found'
        } else if (message === 'Account is disabled') {
          errorMessage = 'Account is disabled'
        } else if (message === 'Too many login attempts') {
          errorMessage = 'Too many failed login attempts. Please try again later.'
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

  // Clear localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('mps_navigation')
      localStorage.removeItem('mps_user_role')
      localStorage.removeItem('mps_is_default_customer')
      localStorage.removeItem('mps_user_id')
      localStorage.removeItem('mps_customer_id')
      localStorage.removeItem('mps_customer_name')
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }

  // Destroy session and cookies
  await destroySession()

  // Redirect to login
  redirect(ROUTES.LOGIN)
}

/**
 * Forgot password server action
 * Sends a password reset request to backend for the given email
 */
export type AuthActionState = {
  error?: { message?: string }
  success?: { message?: string }
} | null

export async function forgotPassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get('email')?.toString()?.trim()

  if (!email) {
    return { error: { message: 'Email is required' } }
  }

  try {
    const response = await serverApiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email })

    // Backend usually returns { message: '...' } or { success: true, message: '...' }
    const data = response.data as { message?: string; success?: boolean }

    return { success: { message: data?.message || 'Yêu cầu đặt lại mật khẩu đã được gửi' } }
  } catch (error) {
    console.error('Forgot password error:', error)
    let errorMessage = 'Gửi yêu cầu đặt lại mật khẩu thất bại. Vui lòng thử lại.'

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string }; status?: number } }
      const responseData = axiosError.response?.data
      if (responseData?.message) errorMessage = responseData.message
      else if (axiosError.response?.status === 404) errorMessage = 'Không tìm thấy email này'
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return { error: { message: errorMessage } }
  }
}

/**
 * Reset password server action
 * Accepts token and newPassword from client and calls backend to reset password
 */
export async function resetPassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const token = formData.get('token')?.toString()?.trim()
  const newPassword = formData.get('newPassword')?.toString()?.trim()

  if (!token || !newPassword) {
    return { error: { message: 'Token và mật khẩu mới là bắt buộc' } }
  }

  try {
    const response = await serverApiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      newPassword,
    })

    const data = response.data as { message?: string; success?: boolean }
    return { success: { message: data?.message || 'Password reset successfully' } }
  } catch (error) {
    console.error('Reset password error:', error)
    let errorMessage = 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.'

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string }; status?: number } }
      const responseData = axiosError.response?.data
      if (responseData?.message) errorMessage = responseData.message
      else if (axiosError.response?.status === 400) errorMessage = 'Yêu cầu không hợp lệ'
      else if (axiosError.response?.status === 401)
        errorMessage = 'Token không hợp lệ hoặc đã hết hạn'
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return { error: { message: errorMessage } }
  }
}
