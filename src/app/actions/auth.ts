'use server'

import { redirect } from 'next/navigation'
import { createSession, destroySession } from '@/lib/auth/session'
import { loginSchema } from '@/lib/validations/auth.schema'
import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { UserRole } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import type { AuthResponse } from '@/types/auth'

/**
 * Login action state
 */
export type LoginActionState = {
  error?: {
    username?: string[]
    password?: string[]
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
  const parsed = loginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
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
    const { data } = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, parsed.data)

    // Create session with httpOnly cookie
    await createSession({
      userId: data.user.id,
      customerId: data.user.customerId,
      role: data.user.role,
      username: data.user.username,
      email: data.user.email,
    })

    // Redirect based on role
    if (data.user.role === UserRole.SYSTEM_ADMIN) {
      redirect(ROUTES.SYSTEM_ADMIN_CUSTOMERS)
    } else if (data.user.role === UserRole.CUSTOMER_ADMIN) {
      redirect(ROUTES.CUSTOMER_ADMIN)
    } else {
      redirect(ROUTES.USER_MY_DEVICES)
    }
  } catch (error: unknown) {
    console.error('Login error:', error)
    return {
      error: {
        message:
          error instanceof Error ? error.message : 'Login failed. Please check your credentials.',
      },
    }
  }
}

/**
 * Logout server action
 */
export async function logout(): Promise<void> {
  try {
    // Optional: Call backend logout API
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
  } catch (error) {
    console.error('Logout API error:', error)
    // Continue with logout even if API call fails
  }

  // Destroy session
  await destroySession()

  // Redirect to login
  redirect(ROUTES.LOGIN)
}
